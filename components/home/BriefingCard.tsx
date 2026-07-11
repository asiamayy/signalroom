'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Check, Loader2 } from 'lucide-react'
import { HOME_COLORS, HOME_FONT_DISPLAY } from '@/lib/home-theme'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import type { ExecutiveBriefing, Persona } from '@/types'

interface BriefingCardProps {
  initialBriefing: ExecutiveBriefing | null
  isStale: boolean
  avgConfidence: number
  validatedRatio: number
  involvedPersonas: Persona[]
  additionalPersonaCount: number
}

export function BriefingCard({ initialBriefing, isStale, avgConfidence, validatedRatio, involvedPersonas, additionalPersonaCount }: BriefingCardProps) {
  const [briefing, setBriefing] = useState(initialBriefing)
  const [refreshing, setRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

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

  const paragraph = briefing ? briefing.observations.join(' ') : ''

  return (
    <section className="relative p-6 sm:p-10 overflow-hidden" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left — headline */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles size={16} style={{ color: HOME_COLORS.primaryFixedDim }} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primaryFixed }}>Executive Intelligence Briefing</span>
            {refreshing && <Loader2 size={12} className="animate-spin" style={{ color: HOME_COLORS.primaryFixedDim }} />}
          </div>

          {!briefing ? (
            <div className="flex items-center gap-2 mb-8">
              <Loader2 size={14} className="animate-spin" style={{ color: HOME_COLORS.primaryFixedDim }} />
              <span className="text-sm opacity-80">Synthesizing your research…</span>
            </div>
          ) : (
            <>
              <h1 className="mb-6 leading-tight max-w-2xl text-2xl sm:text-3xl lg:text-[34px] line-clamp-3" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                {briefing.summary}
              </h1>
              {paragraph && (
                <div className="mb-8 max-w-xl">
                  <p className={`text-sm sm:text-base leading-relaxed ${expanded ? '' : 'line-clamp-4'}`} style={{ color: '#859585' }}>
                    {paragraph}
                  </p>
                  <button
                    onClick={() => setExpanded(e => !e)}
                    className="mt-2 text-xs font-semibold uppercase tracking-wide underline underline-offset-2 bg-transparent"
                    style={{ color: HOME_COLORS.primaryFixedDim, border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {expanded ? 'Read less' : 'Read more'}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-4">
            <Link href="/signals" className="px-8 py-3 rounded-full text-sm font-semibold transition-colors" style={{ background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed }}>
              Deep dive into signals
            </Link>
            <button onClick={handleShare} className="flex items-center gap-1.5 px-8 py-3 rounded-full text-sm font-semibold bg-transparent transition-colors hover:bg-white/10" style={{ border: `1px solid ${HOME_COLORS.outlineVariant}55`, color: HOME_COLORS.onPrimary }}>
              {copied ? <Check size={13} /> : null}
              {copied ? 'Copied' : 'Share briefing'}
            </button>
          </div>
        </div>

        {/* Right — live metrics panel */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl p-6 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-semibold">Research Pulse</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimaryContainer }}>Live data</span>
            </div>
            <div className="space-y-4">
              <MetricBar label="Avg Confidence" value={avgConfidence} />
              <MetricBar label="Validated Signals" value={validatedRatio} />
            </div>

            {involvedPersonas.length > 0 && (
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex -space-x-3">
                  {involvedPersonas.map(p => (
                    <PersonaAvatar key={p.id} avatarUrl={p.avatar_url} avatarInitials={p.avatar_initials} avatarColor={p.avatar_color} name={p.name} size="sm" className="ring-2 ring-[#18281c]" />
                  ))}
                  {additionalPersonaCount > 0 && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-[#18281c]" style={{ background: HOME_COLORS.secondary, color: HOME_COLORS.onSecondary }}>
                      +{additionalPersonaCount}
                    </div>
                  )}
                </div>
                <p className="text-[11px] mt-3 opacity-60 uppercase tracking-widest font-bold">Involved personas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm opacity-80">{label}</span>
        <span className="text-sm font-semibold" style={{ color: HOME_COLORS.primaryFixedDim }}>{value}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: HOME_COLORS.primaryFixedDim }} />
      </div>
    </div>
  )
}
