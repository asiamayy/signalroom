import type Anthropic from '@anthropic-ai/sdk'

// This codebase never uses Anthropic tool-use / structured outputs — every
// JSON-producing prompt (see generateReport, suggestPersonaTraits,
// generatePersonaJourney in persona-engine.ts) asks Claude in plain text to
// "return ONLY the JSON" and parses the raw text response defensively. This
// is that same parsing strategy, extracted so new code doesn't re-copy it a
// fifth time.
export function parseJsonResponse<T = unknown>(raw: string, fallback?: () => T): T {
  const attempts: Array<() => T> = [
    // 1. Strip markdown fences and parse directly
    () => {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned)
    },
    // 2. Extract the outermost JSON object or array and parse that
    () => {
      const objStart = raw.indexOf('{')
      const arrStart = raw.indexOf('[')
      const candidates = [objStart, arrStart].filter(i => i !== -1)
      if (candidates.length === 0) throw new Error('No JSON found in response')
      const start = Math.min(...candidates)
      const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'))
      if (end === -1 || end < start) throw new Error('No JSON found in response')
      return JSON.parse(raw.slice(start, end + 1))
    },
  ]

  if (fallback) {
    attempts.push(fallback)
  }

  for (const attempt of attempts) {
    try {
      return attempt()
    } catch {
      continue
    }
  }

  throw new Error('Failed to parse JSON from AI response')
}

// Pulls the plain-text block out of a non-streaming Claude response — every
// non-streaming call site in persona-engine.ts repeats this same ternary.
export function extractText(response: Anthropic.Messages.Message): string {
  const block = response.content[0]
  return block && block.type === 'text' ? block.text : ''
}
