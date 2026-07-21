import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanForUser } from '@/lib/utils/entitlements'
import { logError } from '@/lib/logger'
import { generateReport } from '@/lib/anthropic/persona-engine'
import { generateSignalsFromInterview, titleSimilarity, statusForInterviewCount, SIGNAL_TITLE_MATCH_THRESHOLD } from '@/lib/anthropic/signal-engine'
import { appendHistoryEntry } from '@/lib/utils/signals'
import type { Persona, Interview, Signal } from '@/types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// For each candidate signal: merge into an existing signal in the project
// with the same type and a similar title (bumping confidence/status and
// appending evidence), or insert a fresh one. Keeps repeated interviews from
// spamming near-duplicate signals — see judgment call #4 in the build plan.
async function syncSignalsForInterview(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  interview: Pick<Interview, 'type' | 'context' | 'messages'>,
  interviewId: string,
  personaId: string,
  persona: Pick<Persona, 'name' | 'traits'>,
  reportData: { executive_summary: string; key_themes: any[]; recommendations: any[] }
) {
  const candidates = await generateSignalsFromInterview(interview, persona, reportData)

  if (candidates.length === 0) return

  const { data: existing } = await supabase
    .from('signals')
    .select('*')
    .eq('project_id', projectId)

  const existingSignals = (existing ?? []) as Signal[]

  for (const candidate of candidates) {
    const match = existingSignals.find(
      s => s.type === candidate.type && titleSimilarity(s.title, candidate.title) >= SIGNAL_TITLE_MATCH_THRESHOLD
    )

    const quotes = candidate.supporting_quotes.map(q => ({ ...q, persona_id: personaId, interview_id: interviewId }))

    if (match) {
      const relatedInterviewIds = Array.from(new Set([...match.related_interview_ids, interviewId]))
      const relatedPersonaIds = Array.from(new Set([...match.related_persona_ids, personaId]))
      const newConfidence = Math.max(match.confidence_score, candidate.confidence_score)
      await supabase
        .from('signals')
        .update({
          confidence_score: newConfidence,
          supporting_quotes: [...match.supporting_quotes, ...quotes].slice(-10),
          related_interview_ids: relatedInterviewIds,
          related_persona_ids: relatedPersonaIds,
          status: statusForInterviewCount(relatedInterviewIds.length),
          strategic_recommendation: match.strategic_recommendation || candidate.strategic_recommendation,
          impact: candidate.impact ?? match.impact,
          history: appendHistoryEntry(match.history ?? [], relatedInterviewIds.length, newConfidence),
        })
        .eq('id', match.id)
    } else {
      const { data: inserted } = await supabase
        .from('signals')
        .insert({
          user_id: userId,
          project_id: projectId,
          title: candidate.title,
          type: candidate.type,
          summary: candidate.summary,
          confidence_score: candidate.confidence_score,
          supporting_quotes: quotes,
          related_persona_ids: [personaId],
          related_interview_ids: [interviewId],
          status: 'emerging',
          strategic_recommendation: candidate.strategic_recommendation,
          impact: candidate.impact,
          history: appendHistoryEntry([], 1, candidate.confidence_score),
        })
        .select()
        .single()
      if (inserted) existingSignals.push(inserted as Signal)
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Reports are a paid deliverable — pro and agency only (PLAN_LIMITS.reports)
  const { limits } = await getPlanForUser(supabase, user.id)
  if (!limits.reports) {
    return NextResponse.json({
      error: 'Insight reports are available on the Signal plan and above. Upgrade to generate reports.',
      limit_reached: true,
    }, { status: 403 })
  }

  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*, persona:personas(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
  }

  if (!interview.messages || interview.messages.length < 2) {
    return NextResponse.json(
      { error: 'Need at least one exchange before generating a report' },
      { status: 400 }
    )
  }

  try {
    const reportData = await generateReport(
      interview.persona,
      interview.type,
      interview.context,
      interview.messages
    )

    // Delete any existing report for this interview first — but carry its
    // share token over to the fresh row, so a link the user already sent out
    // keeps working after a regenerate instead of silently 404ing.
    let carriedShareToken: string | null = null
    if (interview.report_id) {
      const { data: oldReport } = await supabase
        .from('reports')
        .select('share_token')
        .eq('id', interview.report_id)
        .single()
      carriedShareToken = oldReport?.share_token ?? null

      await supabase
        .from('reports')
        .delete()
        .eq('id', interview.report_id)
    }

    // Always create a fresh report
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        interview_id: id,
        executive_summary: reportData.executive_summary,
        key_themes: reportData.key_themes,
        recommendations: reportData.recommendations,
        confidence_score: reportData.confidence_score,
        ai_verdict: reportData.ai_verdict,
        share_token: carriedShareToken,
      })
      .select()
      .single()

    if (insertError) {
      logError('reports.insert', insertError, { userId: user.id, interviewId: id })
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Link new report to interview
    await supabase
      .from('interviews')
      .update({ status: 'completed', report_id: report.id })
      .eq('id', id)

    // Signals require a project (see supabase-migration-projects-signals.sql
    // — project_id is not-null on the signals table), so interviews that
    // aren't assigned to a project simply don't generate signals yet. This
    // is a secondary effect of report generation — an extra Claude call the
    // user shouldn't have to wait on — so it's scheduled via after(), which
    // keeps the serverless instance alive past the response instead of a bare
    // fire-and-forget promise the platform may freeze mid-flight.
    if (interview.project_id) {
      after(async () => {
        try {
          await syncSignalsForInterview(supabase, user.id, interview.project_id, interview, id, interview.persona_id, interview.persona, reportData)
        } catch (e: any) {
          logError('signals.sync', e, { userId: user.id, interviewId: id, projectId: interview.project_id })
        }
      })
    }

    return NextResponse.json({ data: report }, { status: 201 })
  } catch (e: any) {
    logError('reports.generate', e, { userId: user.id, interviewId: id })
    return NextResponse.json({ error: e?.message ?? 'Failed to generate report' }, { status: 500 })
  }
}
