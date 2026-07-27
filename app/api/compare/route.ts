import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildUserMessageContent,
  questionRequestsScore,
  buildPanelSystemPrompt,
  parsePanelResponses,
} from '@/lib/anthropic/persona-engine'
import { generateSignalsFromAggregateResponses } from '@/lib/anthropic/signal-engine'
import { syncSignals } from '@/lib/signals/sync'
import { getPlanForUser } from '@/lib/utils/entitlements'
import { logError } from '@/lib/logger'
import type { CompareResult } from '@/types'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Past comparisons for the History view — RLS alone scopes this to the
// caller's own runs plus any workspace-shared ones, same as every other
// list route in the app. Optional ?project_id= narrows to one project
// (used by the Project detail page's Comparisons tab).
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('project_id')

  let query = supabase.from('compare_runs').select('*').order('created_at', { ascending: false })
  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { persona_ids, question, context, interview_type, image, imageMediaType, project_id, workspace_id } = await request.json()

  if (!persona_ids || persona_ids.length < 2) {
    return NextResponse.json({ error: 'Select at least 2 personas' }, { status: 400 })
  }

  // A member running this inside a shared workspace operates under the
  // OWNER's plan/entitlement, not their own — same reasoning as every other
  // workspace-aware route (reports, persona/interview creation limits).
  let planCheckUserId = user.id
  if (workspace_id) {
    const { data: workspace } = await supabase.from('workspaces').select('owner_id').eq('id', workspace_id).single()
    if (workspace) planCheckUserId = workspace.owner_id
  }

  // Compare is a multi-persona surface — pro and agency only
  const { limits } = await getPlanForUser(supabase, planCheckUserId)
  if (!limits.multi_persona) {
    return NextResponse.json({
      error: 'Comparing multiple personas is available on the Signal plan and above.',
      limit_reached: true,
    }, { status: 403 })
  }

  if (!question?.trim() && !image) {
    return NextResponse.json({ error: 'Enter a question to ask' }, { status: 400 })
  }

  // Everything past here does real LLM work — wrap it so any failure returns a
  // JSON error the client can show, instead of an unhandled 500 as HTML.
  try {
    const questionContent = buildUserMessageContent(question ?? '', image ?? null, imageMediaType)

    const wantsScore = questionRequestsScore(question ?? '')

    // No user_id filter — RLS scopes this to personas the caller owns plus
    // any workspace-shared ones they're a member of.
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .in('id', persona_ids)

    if (error || !personas?.length) {
      return NextResponse.json({ error: 'Personas not found' }, { status: 404 })
    }

    // ONE joint call generates the whole comparison. Seeing all personas at once
    // lets the model make them genuinely distinct (different opening angles,
    // scattered scores) — which independent per-persona calls, each blind to the
    // others, cannot do — and it's cheaper (one call instead of one per persona).
    const panelSystem = buildPanelSystemPrompt(personas, {
      wantsScore,
      wantsSentiment: false,
      interviewType: interview_type ?? 'concept_testing',
      context: context ?? '',
    })

    const generation = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: Math.min(8000, 700 + personas.length * 360),
      temperature: 1,
      system: panelSystem,
      messages: [{ role: 'user', content: questionContent }],
    })

    const rawPanel = generation.content[0].type === 'text' ? generation.content[0].text : ''
    const parsed = parsePanelResponses(rawPanel, personas, { wantsScore, wantsSentiment: false })

    const results: CompareResult[] = personas.map((persona) => {
      const base = {
        persona_id: persona.id,
        persona_name: persona.name,
        avatar_initials: persona.avatar_initials,
        avatar_color: persona.avatar_color,
        avatar_url: persona.avatar_url,
        job_title: persona.traits?.job_title,
        location: persona.traits?.location,
      }
      const r = parsed.get(persona.id)
      if (!r) {
        return { ...base, response: null, score: null, error: 'No response generated' }
      }
      return { ...base, response: r.reply, score: r.score, error: null }
    })

    // Persisting (and therefore signal extraction) requires a project — same
    // reasoning as interviews: no project means nothing to attach signals or
    // history to, so the run just isn't saved, exactly like today's ephemeral
    // behavior. Picking a project is what turns a run into real history.
    let runId: string | null = null
    if (project_id) {
      const { data: run, error: insertError } = await supabase
        .from('compare_runs')
        .insert({
          user_id: user.id,
          project_id,
          workspace_id: workspace_id ?? null,
          question: question ?? '',
          context: context ?? '',
          interview_type: interview_type ?? 'concept_testing',
          persona_ids,
          result: results,
        })
        .select('id')
        .single()

      if (insertError) {
        logError('compare_runs.insert', insertError, { userId: user.id, projectId: project_id })
      } else if (run) {
        runId = run.id

        after(async () => {
          try {
            const responses = results
              .filter(r => r.response)
              .map(r => ({ persona_name: r.persona_name, job_title: r.job_title, text: r.response! }))
            if (responses.length === 0) return

            const candidates = await generateSignalsFromAggregateResponses(context ?? question ?? '', responses)
            await syncSignals({
              supabase, userId: user.id, planCheckUserId, projectId: project_id,
              sourceType: 'compare', sourceId: run.id, personaIds: persona_ids, candidates,
            })
          } catch (e: any) {
            logError('signals.sync', e, { userId: user.id, projectId: project_id, compareRunId: run.id })
          }
        })
      }
    }

    return NextResponse.json({ data: results, run_id: runId })
  } catch (e: any) {
    console.error('[compare] request failed:', e)
    return NextResponse.json({ error: 'The comparison failed to complete. Please try again.' }, { status: 500 })
  }
}
