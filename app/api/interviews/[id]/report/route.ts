import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
  interview: Pick<Interview, 'type' | 'context'>,
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

    // Delete any existing report for this interview first
    if (interview.report_id) {
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
      })
      .select()
      .single()

    if (insertError) {
      console.error('Report insert error:', insertError.message)
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
    // is a secondary effect of report generation — failures here shouldn't
    // fail the report response, which has already succeeded.
    if (interview.project_id) {
      try {
        await syncSignalsForInterview(supabase, user.id, interview.project_id, interview, id, interview.persona_id, interview.persona, reportData)
      } catch (e: any) {
        console.error('Signal generation error:', e?.message ?? e)
      }
    }

    return NextResponse.json({ data: report }, { status: 201 })
  } catch (e: any) {
    console.error('Report generation error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Failed to generate report' }, { status: 500 })
  }
}
