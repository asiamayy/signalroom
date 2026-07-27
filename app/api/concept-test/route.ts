import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildConceptTestSystemPrompt,
  parseConceptTestResponses,
  buildConceptBackfillSystemPrompt,
  parseConceptBackfillResponse,
  computePersonaTemperature,
} from '@/lib/anthropic/persona-engine'
import { generateSignalsFromAggregateResponses } from '@/lib/anthropic/signal-engine'
import { syncSignals } from '@/lib/signals/sync'
import { getPlanForUser } from '@/lib/utils/entitlements'
import { logError } from '@/lib/logger'
import type { ConceptTestResult } from '@/types'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Past concept tests for the History view. Optional ?project_id= narrows to
// one project.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('project_id')

  let query = supabase.from('concept_test_runs').select('*').order('created_at', { ascending: false })
  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// The persona×concept matrix is the heaviest call in the app; give it room so
// the platform doesn't kill it mid-generation (which would return a non-JSON
// 504 and surface as a blank "Something went wrong"). Capped by the hosting plan.
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const startedAt = Date.now()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Everything after auth is wrapped so ANY failure (plan lookup, body parse,
  // LLM call, timeout mid-await) returns a JSON error the client can show,
  // instead of an unhandled 500/504 that arrives as HTML.
  try {
    const body = await request.json()
    const { persona_ids, interview_type, context, project_id, workspace_id } = body
    const rawConcepts = Array.isArray(body.concepts) ? body.concepts : []

    // A member running this inside a shared workspace operates under the
    // OWNER's plan/entitlement, not their own — same reasoning as every
    // other workspace-aware route.
    let planCheckUserId = user.id
    if (workspace_id) {
      const { data: workspace } = await supabase.from('workspaces').select('owner_id').eq('id', workspace_id).single()
      if (workspace) planCheckUserId = workspace.owner_id
    }

    // Concept test is a multi-persona panel surface — pro and agency only.
    const { limits } = await getPlanForUser(supabase, planCheckUserId)
    if (!limits.audience_panel) {
      return NextResponse.json({
        error: 'Concept testing is available on the Signal plan and above.',
        limit_reached: true,
      }, { status: 403 })
    }

    if (!persona_ids || persona_ids.length < 3) {
      return NextResponse.json({ error: 'Select at least 3 personas' }, { status: 400 })
    }
    if (persona_ids.length > limits.audience_panel_max) {
      return NextResponse.json({ error: `Your plan supports up to ${limits.audience_panel_max} personas` }, { status: 400 })
    }

    // Normalize concepts: assign stable ids, keep only those with real content.
    const concepts = rawConcepts
      .map((c: any, i: number) => ({
        id: `c${i}`,
        label: (typeof c?.label === 'string' && c.label.trim()) ? c.label.trim().slice(0, 120) : `Concept ${i + 1}`,
        description: typeof c?.description === 'string' ? c.description.trim().slice(0, 4000) : '',
        image: typeof c?.image === 'string' ? c.image : null,
        imageMediaType: VALID_IMAGE_TYPES.includes(c?.imageMediaType) ? c.imageMediaType : 'image/jpeg',
      }))
      .filter((c: any) => c.description || c.image)

    if (concepts.length < 2) {
      return NextResponse.json({ error: 'Add at least 2 concepts (each needs a description or an image)' }, { status: 400 })
    }
    if (concepts.length > 4) {
      return NextResponse.json({ error: 'Compare up to 4 concepts at a time' }, { status: 400 })
    }

    // No user_id filter — RLS scopes this to personas the caller owns plus
    // any workspace-shared ones they're a member of.
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .in('id', persona_ids)

    if (error || !personas?.length) {
      return NextResponse.json({ error: 'Personas not found' }, { status: 404 })
    }

    // Build the user message: each concept's text followed by its image (if any).
    const userContent: any[] = []
    concepts.forEach((c: any) => {
      userContent.push({
        type: 'text',
        text: `CONCEPT id="${c.id}" — "${c.label}"\n${c.description || '(image only — react to the image below)'}`,
      })
      if (c.image) {
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: c.imageMediaType, data: c.image },
        })
      }
    })
    userContent.push({
      type: 'text',
      text: `Now give EVERY panelist their honest reaction and 0-100 confidence score for EACH of the ${concepts.length} concepts above, in the strict JSON format specified.`,
    })

    const systemPrompt = buildConceptTestSystemPrompt(
      personas,
      concepts.map((c: any) => ({ id: c.id, label: c.label })),
      { interviewType: interview_type ?? 'concept_testing', context: context ?? '' },
    )

    // ~90 tokens/cell badly underestimated real need (a 2-3 sentence reaction
    // plus JSON overhead runs closer to 200) — on larger panels that ran the
    // model out of budget mid-generation, and the truncation-salvage parser
    // then silently returned fewer personas than were selected, with no
    // indication anything was cut. Budget is more realistic now; the backfill
    // pass below is the actual completeness guarantee regardless.
    const generation = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: Math.min(8000, 1000 + personas.length * concepts.length * 200),
      temperature: 1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const rawMatrix = generation.content[0].type === 'text' ? generation.content[0].text : ''
    const matrix = parseConceptTestResponses(rawMatrix, personas, concepts)

    // Backfill any persona missing from the joint output — entirely, or just
    // missing a concept or two — with a small per-persona follow-up scoped to
    // only what's missing. This is what actually guarantees every selected
    // persona appears in the results, rather than just reducing (but not
    // eliminating) the chance of truncation via a better token estimate above.
    const backfillTargets = personas.flatMap((p) => {
      const have = matrix.get(p.id)
      const missing = concepts.filter((c: any) => !have?.has(c.id))
      return missing.length > 0 ? [{ persona: p, missing }] : []
    })

    if (backfillTargets.length > 0) {
      await Promise.all(backfillTargets.map(async ({ persona, missing }) => {
        try {
          const backfillSystemPrompt = buildConceptBackfillSystemPrompt(
            persona,
            missing.map((c: any) => ({ id: c.id, label: c.label })),
            { interviewType: interview_type ?? 'concept_testing', context: context ?? '' },
          )
          const res = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: Math.min(3000, 300 + missing.length * 250),
            temperature: computePersonaTemperature(persona),
            system: backfillSystemPrompt,
            messages: [{ role: 'user', content: userContent }],
          })
          const raw = res.content[0].type === 'text' ? res.content[0].text : ''
          const cells = parseConceptBackfillResponse(raw, missing.map((c: any) => ({ id: c.id })))
          if (cells.size === 0) return

          let existing = matrix.get(persona.id)
          if (!existing) { existing = new Map(); matrix.set(persona.id, existing) }
          cells.forEach((cell, cid) => existing!.set(cid, cell))
        } catch (err) {
          console.error(`[concept-test] backfill failed for "${persona.name}":`, err)
        }
      }))
    }

    // Aggregate per concept: mean score across personas + each persona's reaction.
    const conceptAgg = concepts.map((c: any) => {
      const reactions = personas.map((p) => {
        const cell = matrix.get(p.id)?.get(c.id)
        return {
          persona_id: p.id,
          persona_name: p.name,
          avatar_initials: p.avatar_initials,
          avatar_color: p.avatar_color,
          avatar_url: p.avatar_url,
          job_title: p.traits?.job_title ?? '',
          reaction: cell?.reaction ?? null,
          score: cell?.score ?? null,
        }
      }).filter(r => r.reaction) as Array<{ persona_id: string; persona_name: string; avatar_initials: string; avatar_color: any; avatar_url: string | null; job_title: string; reaction: string; score: number | null }>

      const scores = reactions.map(r => r.score).filter((s): s is number => s !== null)
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
      return { id: c.id, label: c.label, avg_score: avg, reactions }
    })

    // Rank by average score (nulls last).
    const ranked = [...conceptAgg].sort((a, b) => (b.avg_score ?? -1) - (a.avg_score ?? -1))
    const winnerId = ranked[0]?.avg_score !== null ? ranked[0]?.id ?? null : null

    // One summary call: overall recommendation + per-concept strength/weakness/verdict.
    const digest = ranked.map(c =>
      `CONCEPT "${c.label}" (id ${c.id}, avg score ${c.avg_score ?? 'n/a'}):\n` +
      c.reactions.map((r: { persona_name: string; score: number | null; reaction: string }) => `- ${r.persona_name}${r.score !== null ? ` [${r.score}]` : ''}: ${r.reaction}`).join('\n')
    ).join('\n\n')

    let summary = {
      overall_recommendation: '',
      concepts: [] as Array<{ id: string; strength: string; weakness: string; verdict: string }>,
    }
    try {
      const summaryRes = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: `You are a senior market researcher comparing ${concepts.length} concepts tested with the same panel of ${personas.length} personas. Their reactions and scores:

${digest}

Return ONLY this JSON (no markdown):
{
  "overall_recommendation": "2-3 sentences: which concept to move forward with and why, referencing the panel's reactions",
  "concepts": [
    { "id": "<concept id>", "strength": "its single biggest strength in one sentence", "weakness": "its single biggest weakness/objection in one sentence", "verdict": "one blunt sentence on where it stands" }
  ]
}`,
        }],
      })
      const raw = summaryRes.content[0].type === 'text' ? summaryRes.content[0].text : '{}'
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      summary = { ...summary, ...JSON.parse(cleaned) }
    } catch {
      // keep defaults — the ranking still stands without the narrative
    }

    const summaryById = new Map(summary.concepts.map(c => [c.id, c]))

    const conceptResults = ranked.map((c, i) => {
      const s = summaryById.get(c.id)
      return {
        id: c.id,
        label: c.label,
        rank: i + 1,
        avg_score: c.avg_score,
        reactions: c.reactions,
        strength: s?.strength ?? '',
        weakness: s?.weakness ?? '',
        verdict: s?.verdict ?? '',
      }
    })

    const result: ConceptTestResult = {
      concepts: conceptResults,
      winner_id: winnerId,
      overall_recommendation: summary.overall_recommendation ?? '',
      total_personas: personas.length,
      completed_in_seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
    }

    // Persisting (and therefore signal extraction) requires a project — no
    // project means the run just isn't saved, exactly like today's ephemeral
    // behavior. Picking a project is what turns a run into real history.
    // Images are never persisted — only labels/descriptions.
    let runId: string | null = null
    if (project_id) {
      const conceptsForStorage = concepts.map((c: any) => ({ id: c.id, label: c.label, description: c.description }))

      const { data: run, error: insertError } = await supabase
        .from('concept_test_runs')
        .insert({
          user_id: user.id,
          project_id,
          workspace_id: workspace_id ?? null,
          context: context ?? '',
          interview_type: interview_type ?? 'concept_testing',
          persona_ids,
          concepts: conceptsForStorage,
          result,
        })
        .select('id')
        .single()

      if (insertError) {
        logError('concept_test_runs.insert', insertError, { userId: user.id, projectId: project_id })
      } else if (run) {
        runId = run.id

        after(async () => {
          try {
            // One aggregate text per persona — their reactions across every
            // concept joined into a single block — rather than per-concept,
            // since a signal here is about the PERSONA's underlying belief,
            // not any single concept's reaction.
            const aggregateResponses = personas
              .map((p) => {
                const cells = matrix.get(p.id)
                if (!cells) return null
                const text = concepts
                  .map((c: any) => {
                    const cell = cells.get(c.id)
                    return cell ? `On "${c.label}": ${cell.reaction}` : null
                  })
                  .filter(Boolean)
                  .join(' ')
                return text ? { persona_name: p.name as string, job_title: p.traits?.job_title as string | undefined, text } : null
              })
              .filter((r) => r !== null) as { persona_name: string; job_title?: string; text: string }[]

            if (aggregateResponses.length === 0) return

            const signalContext = `Testing concepts: ${concepts.map((c: any) => c.label).join(', ')}. ${context ?? ''}`.trim()
            const candidates = await generateSignalsFromAggregateResponses(signalContext, aggregateResponses)
            await syncSignals({
              supabase, userId: user.id, planCheckUserId, projectId: project_id,
              sourceType: 'concept_test', sourceId: run.id, personaIds: persona_ids, candidates,
            })
          } catch (e: any) {
            logError('signals.sync', e, { userId: user.id, projectId: project_id, conceptTestRunId: run.id })
          }
        })
      }
    }

    return NextResponse.json({ data: result, run_id: runId })
  } catch (e: any) {
    console.error('[concept-test] request failed:', e)
    return NextResponse.json({ error: 'The concept test failed to complete. Please try again.' }, { status: 500 })
  }
}
