import Anthropic from '@anthropic-ai/sdk'

// Shared client for new AI features (signal-engine, briefing-engine).
// Existing call sites (persona-engine.ts, compare/route.ts,
// audience-panel/route.ts) each instantiate their own client and are left
// as-is — this is only wired up for new code going forward.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-6'
