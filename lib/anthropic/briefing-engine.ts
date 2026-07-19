import { anthropic, CLAUDE_MODEL } from './client'
import { parseJsonResponse, extractText } from './parse-json'
import type { ExecutiveBriefing, Signal, Report } from '@/types'

export interface SignalTrendInput {
  title: string
  direction: 'strengthening' | 'weakening' | 'stable' | 'new'
  mentionTrendPercent: number | null
}

// Synthesizes an executive-consultant-style briefing across everything the
// user has learned recently — not a chatbot response, a summary a strategist
// would hand you before a meeting. Callers are responsible for caching (see
// judgment call #5 in the build plan — this is expensive to call on every
// dashboard load, so it shouldn't be invoked without a staleness check).
export async function generateExecutiveBriefing(
  recentSignals: Pick<Signal, 'title' | 'type' | 'summary' | 'confidence_score' | 'status'>[],
  recentReports: Pick<Report, 'executive_summary'>[],
  signalTrends: SignalTrendInput[] = []
): Promise<ExecutiveBriefing> {
  if (recentSignals.length === 0 && recentReports.length === 0) {
    return {
      summary: "You haven't run any research yet.",
      observations: [],
      recommended_next_step: 'Create a persona and run your first interview to start building customer intelligence.',
    }
  }

  const signalsBlock = recentSignals
    .map(s => `- [${s.type}, ${s.confidence_score}% confidence, ${s.status}] ${s.title}: ${s.summary}`)
    .join('\n')

  const reportsBlock = recentReports
    .map(r => `- ${r.executive_summary}`)
    .join('\n')

  // Pre-computed, not AI-estimated — see lib/utils/signals.ts. These are the
  // only numbers the model is allowed to cite for movement over time.
  const trendsBlock = signalTrends
    .filter(t => t.mentionTrendPercent !== null)
    .map(t => `- "${t.title}" is ${t.direction}, mentions ${t.mentionTrendPercent! > 0 ? 'up' : 'down'} ${Math.abs(t.mentionTrendPercent!)}% over the last 30 days`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `You are a senior research strategist briefing a founder before their morning standup. Synthesize the customer intelligence below into a short executive briefing — confident, specific, and grounded only in what's actually there. Never invent numbers or claims that aren't supported by the input.

Recent signals:
${signalsBlock || 'none'}

Recent report summaries:
${reportsBlock || 'none'}

Pre-computed trend data — the ONLY numbers you may cite for change-over-time claims (do not invent or estimate any other percentages):
${trendsBlock || 'none available yet'}

Return ONLY a JSON object with this exact shape, no preamble, no markdown fences:
{
  "summary": "One short headline-style sentence (under 18 words) framing what's been learned recently (e.g. 'Across your recent research, N consistent customer behaviors have emerged.') — this renders as a large display headline, so keep it tight",
  "observations": ["2-4 short, specific bullet observations grounded in the signals/reports above — prefer citing a trend percentage from the trend data when one exists for that observation, but never fabricate one"],
  "recommended_next_step": "One concrete, specific next action — a type of research to run or a decision to make"
}`,
      },
    ],
  })

  const raw = extractText(response)

  return parseJsonResponse<ExecutiveBriefing>(raw, () => ({
    summary: 'Recent research is still being synthesized.',
    observations: [],
    recommended_next_step: 'Check back after your next completed interview.',
  }))
}

// Regenerate only when there's actually new data to synthesize — a new
// report, or a signal that was created or reinforced by another interview —
// rather than on a calendar-day timer. A pure time-based trigger burns a
// Claude call (and shows a refresh) on the first visit of the day even when
// nothing has changed since the last briefing; this only fires when
// something real happened.
export function isBriefingStale(
  generatedAt: string | number | null | undefined,
  latestDataAt: string | number | null | undefined
): boolean {
  if (!generatedAt) return true
  if (!latestDataAt) return false
  return new Date(latestDataAt) > new Date(generatedAt)
}
