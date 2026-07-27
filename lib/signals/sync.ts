import { createClient } from '@/lib/supabase/server'
import { titleSimilarity, statusForSourceCount, SIGNAL_TITLE_MATCH_THRESHOLD, type CandidateSignal } from '@/lib/anthropic/signal-engine'
import { appendHistoryEntry } from '@/lib/utils/signals'
import { pushSignalCreated } from '@/lib/integrations/push'
import { logError } from '@/lib/logger'
import type { Signal, SignalSourceType } from '@/types'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface SyncSignalsParams {
  supabase: SupabaseClient
  userId: string
  planCheckUserId: string
  projectId: string
  sourceType: SignalSourceType
  sourceId: string
  personaIds: string[]
  // Candidates with supporting_quotes already in their final form — this
  // function only merges/inserts, it doesn't know how a quote should be
  // attributed to a persona/interview (that's source-specific and handled
  // by the caller before invoking this).
  candidates: CandidateSignal[]
}

// For each candidate signal: merge into an existing signal in the project
// with the same type and a similar title (bumping confidence/status and
// appending evidence), or insert a fresh one. Shared across all 4 signal
// sources (interview, compare, audience_panel, concept_test) — previously
// lived only inside the interview report route as interview-specific logic.
export async function syncSignals({
  supabase, userId, planCheckUserId, projectId, sourceType, sourceId, personaIds, candidates,
}: SyncSignalsParams): Promise<void> {
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

    if (match) {
      const relatedPersonaIds = Array.from(new Set([...match.related_persona_ids, ...personaIds]))
      const relatedInterviewIds = sourceType === 'interview'
        ? Array.from(new Set([...match.related_interview_ids, sourceId]))
        : match.related_interview_ids
      const relatedRunIds = sourceType !== 'interview'
        ? Array.from(new Set([...(match.related_run_ids ?? []), sourceId]))
        : (match.related_run_ids ?? [])
      const sourceCount = relatedInterviewIds.length + relatedRunIds.length
      const newConfidence = Math.max(match.confidence_score, candidate.confidence_score)

      await supabase
        .from('signals')
        .update({
          confidence_score: newConfidence,
          supporting_quotes: [...match.supporting_quotes, ...candidate.supporting_quotes].slice(-10),
          related_persona_ids: relatedPersonaIds,
          related_interview_ids: relatedInterviewIds,
          related_run_ids: relatedRunIds,
          status: statusForSourceCount(sourceCount),
          strategic_recommendation: match.strategic_recommendation || candidate.strategic_recommendation,
          impact: candidate.impact ?? match.impact,
          history: appendHistoryEntry(match.history ?? [], sourceCount, newConfidence),
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
          supporting_quotes: candidate.supporting_quotes,
          related_persona_ids: personaIds,
          related_interview_ids: sourceType === 'interview' ? [sourceId] : [],
          related_run_ids: sourceType !== 'interview' ? [sourceId] : [],
          source_type: sourceType,
          status: 'emerging',
          strategic_recommendation: candidate.strategic_recommendation,
          impact: candidate.impact,
          history: appendHistoryEntry([], 1, candidate.confidence_score),
        })
        .select()
        .single()

      if (inserted) {
        existingSignals.push(inserted as Signal)
        // Only the brand-new-signal path pushes — merges never do, so
        // reinforcing an existing signal never spams the connected Slack channel.
        try {
          await pushSignalCreated(planCheckUserId, inserted as Signal)
        } catch (e: any) {
          logError('integrations.push_signal', e, { userId, signalId: inserted.id })
        }
      }
    }
  }
}
