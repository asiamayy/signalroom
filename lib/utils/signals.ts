import type { Signal, SignalHistoryEntry } from '@/types'

export type TrendDirection = 'strengthening' | 'weakening' | 'stable' | 'new'

// Compares the earliest and latest history snapshots. A signal only has one
// entry the first time it's discovered — that's "new", not "stable", since
// there's nothing to compare against yet.
export function getTrendDirection(signal: Pick<Signal, 'history'>): TrendDirection {
  const history = signal.history ?? []
  if (history.length < 2) return 'new'

  const first = history[0]
  const last = history[history.length - 1]

  if (last.confidenceScore > first.confidenceScore + 5) return 'strengthening'
  if (last.confidenceScore < first.confidenceScore - 5) return 'weakening'
  return 'stable'
}

// % change in mention count over the lookback window — grounds claims like
// "mentions up 42% over the last 30 days" in an actual computed number
// instead of letting the AI invent one.
export function getMentionTrendPercent(signal: Pick<Signal, 'history'>, days = 30): number | null {
  const history = signal.history ?? []
  if (history.length < 2) return null

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const baseline = findBaseline(history, cutoff)
  const latest = history[history.length - 1]

  if (baseline.mentionCount === 0) return null
  return Math.round(((latest.mentionCount - baseline.mentionCount) / baseline.mentionCount) * 100)
}

function findBaseline(history: SignalHistoryEntry[], cutoff: number): SignalHistoryEntry {
  // Most recent entry at or before the cutoff, or the earliest entry if the
  // whole history is more recent than the window.
  for (let i = history.length - 1; i >= 0; i--) {
    if (new Date(history[i].date).getTime() <= cutoff) return history[i]
  }
  return history[0]
}

export function appendHistoryEntry(history: SignalHistoryEntry[], mentionCount: number, confidenceScore: number): SignalHistoryEntry[] {
  return [...history, { date: new Date().toISOString(), mentionCount, confidenceScore }].slice(-50)
}
