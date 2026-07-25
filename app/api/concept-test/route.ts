import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildConceptTestSystemPrompt,
  parseConceptTestResponses,
} from '@/lib/anthropic/persona-engine'
import { getPlanForUser } from '@/lib/utils/entitlements'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

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
    // Concept test is a multi-persona panel surface — pro and agency only.
    const { limits } = await getPlanForUser(supabase, user.id)
    if (!limits.audience_panel) {
      return NextResponse.json({
        error: 'Concept testing is available on the Signal plan and above.',
        limit_reached: true,
      }, { status: 403 })
    }

    const body = await request.json()
    const { persona_ids, interview_type, context } = body
    const rawConcepts = Array.isArray(body.concepts) ? body.concepts : []

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

    // Load personas
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .in('id', persona_ids)
      .eq('user_id', user.id)

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

    const generation = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: Math.min(8000, 800 + personas.length * concepts.length * 90),
      temperature: 1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const rawMatrix = generation.content[0].type === 'text' ? generation.content[0].text : ''
    const matrix = parseConceptTestResponses(rawMatrix, personas, concepts)

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

    return NextResponse.json({
      data: {
        concepts: conceptResults,
        winner_id: winnerId,
        overall_recommendation: summary.overall_recommendation ?? '',
        total_personas: personas.length,
        completed_in_seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      },
    })
  } catch (e: any) {
    console.error('[concept-test] request failed:', e)
    return NextResponse.json({ error: 'The concept test failed to complete. Please try again.' }, { status: 500 })
  }
}
