'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { HOME_COLORS } from '@/lib/home-theme'

// Regenerates the AI briefing (same POST /api/briefing BriefingCard's own
// auto-refresh uses, which has its own 60s staleness floor server-side) then
// re-fetches this Server Component page so every number in the footer —
// report count, confidence, "Last synced" — reflects the latest data, not
// just the briefing text.
export function RefreshButton() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await fetch('/api/briefing', { method: 'POST' })
    } catch {
      // Ignore — router.refresh() below still shows whatever's in the DB.
    } finally {
      router.refresh()
      setRefreshing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={refreshing}
      aria-label="Refresh research data"
      title="Refresh research data"
      className="p-2 rounded-full transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
      style={{ background: HOME_COLORS.surfaceContainerHigh, border: 'none', cursor: refreshing ? 'default' : 'pointer' }}
    >
      <RefreshCw size={16} style={{ color: HOME_COLORS.onSurface }} className={refreshing ? 'animate-spin' : ''} />
    </button>
  )
}
