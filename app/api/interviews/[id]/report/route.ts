import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanForUser } from '@/lib/utils/entitlements'
import { logError } from '@/lib/logger'
import { generateReport } from '@/lib/anthropic/persona-engine'
import { generateSignalsFromInterview } from '@/lib/anthropic/signal-engine'
import { syncSignals } from '@/lib/signals/sync'
import { pushReportCreated } from '@/lib/integrations/push'
import type { Persona, Interview } from '@/types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// Thin wrapper: build interview-specific candidates (verbatim-quote-checked
// against this interview's transcript), stamp each quote with this
// persona/interview, then hand off to the shared merge-or-insert logic in
// lib/signals/sync.ts (also used by Compare/Audience Panel/Concept Test).
async function syncSignalsForInterview(
  supabase: SupabaseClient,
  userId: string,
  planCheckUserId: string,
  projectId: string,
  interview: Pick<Interview, 'type' | 'context' | 'messages'>,
  interviewId: string,
  personaId: string,
  persona: Pick<Persona, 'name' | 'traits'>,
  reportData: { executive_summary: string; key_themes: any[]; recommendations: any[] }
) {
  const candidates = await generateSignalsFromInterview(interview, persona, reportData)
  if (candidates.length === 0) return

  const stamped = candidates.map(c => ({
    ...c,
    supporting_quotes: c.supporting_quotes.map(q => ({ ...q, persona_id: personaId, interview_id: interviewId })),
  }))

  await syncSignals({
    supabase, userId, planCheckUserId, projectId,
    sourceType: 'interview',
    sourceId: interviewId,
    personaIds: [personaId],
    candidates: stamped,
  })
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

  // No user_id filter — RLS is the real gate (personal owner, or any
  // co-member of the interview's workspace, can generate its report).
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*, persona:personas(*)')
    .eq('id', id)
    .single()

  if (error || !interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
  }

  // Reports are a paid deliverable — pro and agency only (PLAN_LIMITS.reports).
  // For a workspace interview, gate on the WORKSPACE OWNER's plan, not the
  // caller's own — a member operates under the owner's Broadcast entitlement
  // while inside a shared workspace, same reasoning as the persona/interview
  // creation limits being skipped for workspace content.
  let planCheckUserId = user.id
  if (interview.workspace_id) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', interview.workspace_id)
      .single()
    if (workspace) planCheckUserId = workspace.owner_id
  }

  const { limits } = await getPlanForUser(supabase, planCheckUserId)
  if (!limits.reports) {
    return NextResponse.json({
      error: 'Insight reports are available on the Signal plan and above. Upgrade to generate reports.',
      limit_reached: true,
    }, { status: 403 })
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

    // Always create a fresh report. workspace_id is inherited from the
    // interview — must not be left off, or a workspace member's report would
    // be invisible to the owner and everyone else on the team (the RLS
    // workspace-member branch only applies to non-null workspace_id rows).
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        interview_id: id,
        workspace_id: interview.workspace_id ?? null,
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

    // Push to Slack/Notion if planCheckUserId has either connected
    // (Signal/Broadcast only — gated inside pushReportCreated itself).
    // Unlike the signal sync below, this doesn't require a project — every
    // report qualifies. Fire-and-forget via after(), never allowed to
    // affect the response.
    after(async () => {
      try {
        await pushReportCreated(planCheckUserId, report, interview)
      } catch (e: any) {
        logError('integrations.push_report', e, { userId: user.id, interviewId: id })
      }
    })

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
          await syncSignalsForInterview(supabase, user.id, planCheckUserId, interview.project_id, interview, id, interview.persona_id, interview.persona, reportData)
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
