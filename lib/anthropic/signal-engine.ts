import { anthropic, CLAUDE_MODEL } from './client'
import { parseJsonResponse, extractText } from './parse-json'
import type { Persona, Interview, ReportTheme, ReportRecommendation, SignalType, SignalQuote, SignalImpact } from '@/types'

export interface CandidateSignal {
  title: string
  type: SignalType
  summary: string
  confidence_score: number
  supporting_quotes: SignalQuote[]
  strategic_recommendation: string
  impact: SignalImpact
}

const SIGNAL_IMPACTS: SignalImpact[] = ['low', 'medium', 'high']

const SIGNAL_TYPES: SignalType[] = [
  'pain_point', 'objection', 'desired_outcome', 'feature_request',
  'buying_trigger', 'trend', 'opportunity', 'risk',
]

// Synthesizes 0-5 candidate signals from a single completed interview. Reuses
// the report's already-extracted themes/quotes rather than re-reading the
// full transcript from scratch — the report generation call
// (persona-engine.ts generateReport) already did the expensive extraction.
export async function generateSignalsFromInterview(
  interview: Pick<Interview, 'type' | 'context'>,
  persona: Pick<Persona, 'name' | 'traits'>,
  report: {
    executive_summary: string
    key_themes: ReportTheme[]
    recommendations: ReportRecommendation[]
  }
): Promise<CandidateSignal[]> {
  const themesBlock = report.key_themes
    .map(t => `- ${t.title} (${t.sentiment}): ${t.summary}\n  Quotes: ${t.quotes.map(q => `"${q}"`).join(', ') || 'none'}`)
    .join('\n')

  const recommendationsBlock = report.recommendations
    .map(r => `- [${r.priority}] ${r.title}: ${r.detail}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a market research analyst synthesizing recurring customer intelligence ("signals") from a single interview.

Interview type: ${interview.type.replace('_', ' ')}
What was being tested: ${interview.context}
Participant: ${persona.name}, ${persona.traits.job_title} in ${persona.traits.industry}

Report executive summary:
${report.executive_summary}

Key themes:
${themesBlock || 'none'}

Recommendations:
${recommendationsBlock || 'none'}

Identify 1-5 discrete "signals" — recurring customer behaviors, beliefs, or reactions worth tracking across future research, not just a restatement of the themes above. Each signal must be classified into exactly one of these types: ${SIGNAL_TYPES.join(', ')}.

Return ONLY a JSON array with this exact shape, no preamble, no markdown fences:
[
  {
    "title": "Short, specific title (e.g. 'Customers fear migration complexity')",
    "type": "pain_point" | "objection" | "desired_outcome" | "feature_request" | "buying_trigger" | "trend" | "opportunity" | "risk",
    "summary": "1-2 sentence explanation of what this signal means and why it matters",
    "confidence_score": a number 0-100 reflecting how strongly this single interview supports the signal (lone/vague evidence = 40-60, specific/repeated/strongly-stated = 70-90),
    "supporting_quotes": ["verbatim quote from the participant that supports this signal"],
    "strategic_recommendation": "One concrete action a product/marketing team should take in response",
    "impact": "low" | "medium" | "high" — how much this would matter to revenue, retention, or positioning if true across the broader customer base, not just how confident you are it's true
  }
]

If nothing meaningfully recurring or actionable emerged, return an empty array [].`,
      },
    ],
  })

  const raw = extractText(response)

  const parsed = parseJsonResponse<any[]>(raw, () => [])
  if (!Array.isArray(parsed)) return []

  return parsed
    .filter(s => s && typeof s.title === 'string' && SIGNAL_TYPES.includes(s.type))
    .map(s => ({
      title: String(s.title).slice(0, 200),
      type: s.type as SignalType,
      summary: String(s.summary ?? ''),
      confidence_score: Math.max(0, Math.min(100, Math.round(Number(s.confidence_score) || 50))),
      supporting_quotes: Array.isArray(s.supporting_quotes)
        ? s.supporting_quotes.filter((q: unknown) => typeof q === 'string').map((text: string) => ({ text, persona_id: null, interview_id: null }))
        : [],
      strategic_recommendation: String(s.strategic_recommendation ?? ''),
      impact: SIGNAL_IMPACTS.includes(s.impact) ? s.impact as SignalImpact : 'medium',
    }))
}

// Word-overlap similarity (Jaccard on normalized word sets) — cheap enough to
// run in-process without a second AI call, good enough to catch "customers
// fear migration complexity" vs "fear of migration complexity" as the same
// underlying signal without merging genuinely unrelated ones.
export function titleSimilarity(a: string, b: string): number {
  const normalize = (s: string) => new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
  )
  const setA = normalize(a)
  const setB = normalize(b)
  if (setA.size === 0 || setB.size === 0) return 0

  let intersection = 0
  for (const word of setA) {
    if (setB.has(word)) intersection++
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

export const SIGNAL_TITLE_MATCH_THRESHOLD = 0.5

// emerging (1 supporting interview) -> growing (2-3) -> validated (4+)
export function statusForInterviewCount(count: number): 'emerging' | 'growing' | 'validated' {
  if (count >= 4) return 'validated'
  if (count >= 2) return 'growing'
  return 'emerging'
}
