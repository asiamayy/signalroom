'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Check, Loader2 } from 'lucide-react'
import type { ExecutiveBriefing } from '@/types'

interface BriefingCardProps {
  initialBriefing: ExecutiveBriefing | null
  isStale: boolean
  signalsDiscovered: number
  avgConfidence: number
  researchStatus: string
}

export function BriefingCard({ initialBriefing, isStale, signalsDiscovered, avgConfidence, researchStatus }: BriefingCardProps) {
  const [briefing, setBriefing] = useState(initialBriefing)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isStale) return
    let cancelled = false
    setRefreshing(true)
    fetch('/api/briefing', { method: 'POST' })
      .then(res => res.json())
      .then(json => {
        if (!cancelled && json.data) setBriefing(json.data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRefreshing(false) })
    return () => { cancelled = true }
    // Only ever needs to run once per page load — not on every prop change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShare = async () => {
    if (!briefing) return
    const text = [
      briefing.summary,
      ...briefing.observations.map(o => `• ${o}`),
      briefing.recommended_next_step ? `Recommended next step: ${briefing.recommended_next_step}` : '',
    ].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (!briefing) {
    return (
      <div className="rounded-2xl p-6 sm:p-8 mb-8" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" style={{ color: '#1C3D2E' }} />
          <span className="text-sm" style={{ color: '#5F6368' }}>Synthesizing your research…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6 sm:p-8 mb-8" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: '#1C3D2E' }} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#1C3D2E' }}>Executive Intelligence Briefing</span>
          {refreshing && <Loader2 size={11} className="animate-spin" style={{ color: '#9CA3AF' }} />}
        </div>
        <div className="flex items-center gap-5 flex-shrink-0">
          <StatReadout label="Signals Discovered" value={String(signalsDiscovered)} />
          <StatReadout label="Avg Confidence" value={`${avgConfidence}%`} />
          <StatReadout label="Research Status" value={researchStatus} />
        </div>
      </div>

      <h2 className="text-2xl sm:text-[28px] leading-snug text-neutral-900 mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {briefing.summary}
      </h2>

      {briefing.observations.length > 0 && (
        <ul className="space-y-2 mb-5 max-w-2xl">
          {briefing.observations.map((obs, i) => (
            <li key={i} className="text-sm text-neutral-600 leading-relaxed flex items-start gap-2.5">
              <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#1C3D2E', opacity: 0.4 }} />
              {obs}
            </li>
          ))}
        </ul>
      )}

      {briefing.recommended_next_step && (
        <div className="rounded-xl px-4 py-3 mb-6 max-w-2xl" style={{ background: '#F4F6F8' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#1C3D2E' }}>Recommended next step</p>
          <p className="text-sm text-neutral-800">{briefing.recommended_next_step}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/signals" className="text-xs font-semibold px-4 py-2.5 rounded-lg text-white transition-colors hover:bg-[#243329]" style={{ background: '#1C3D2E' }}>
          Deep dive into signals
        </Link>
        <button onClick={handleShare} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors hover:bg-neutral-50" style={{ background: 'white', border: '1px solid #E0E2E4', color: '#374151' }}>
          {copied ? <Check size={12} /> : null}
          {copied ? 'Copied' : 'Share briefing'}
        </button>
      </div>
    </div>
  )
}

function StatReadout({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-sm font-semibold text-neutral-900">{value}</p>
      <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: '#9CA3AF' }}>{label}</p>
    </div>
  )
}
