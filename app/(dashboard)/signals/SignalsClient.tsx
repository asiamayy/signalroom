'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity, Filter, ArrowUp, ArrowDown, Gauge, Share2, Lightbulb, TrendingUp, TrendingDown,
} from 'lucide-react'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY } from '@/lib/home-theme'
import { CARD_SHADOW, formatRelativeTime } from '@/lib/utils'
import { SignalFeedCard } from '@/components/signals/SignalFeedCard'
import { SIGNAL_TYPE_LABELS } from '@/types'
import type { Signal, SignalType } from '@/types'

interface SignalsClientProps {
  initialSignals: Signal[]
  projects: { id: string; name: string }[]
  personas: { id: string; name: string }[]
  interviews: { id: string; title: string }[]
}

const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

const selectStyle = {
  background: HOME_COLORS.surfaceContainerLowest,
  border: `1px solid ${HOME_COLORS.outlineVariant}66`,
  color: HOME_COLORS.onSurface,
}

export function SignalsClient({ initialSignals, projects, personas, interviews }: SignalsClientProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [projectId, setProjectId] = useState('')
  const [personaId, setPersonaId] = useState('')
  const [interviewId, setInterviewId] = useState('')
  const [type, setType] = useState<SignalType | ''>('')
  const [minConfidence, setMinConfidence] = useState(0)
  const [dateRange, setDateRange] = useState('all')

  const filtered = useMemo(() => {
    const since = dateRange === 'all' ? null : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000
    return initialSignals
      .filter(s => {
        if (projectId && s.project_id !== projectId) return false
        if (personaId && !s.related_persona_ids.includes(personaId)) return false
        if (interviewId && !s.related_interview_ids.includes(interviewId)) return false
        if (type && s.type !== type) return false
        if (s.confidence_score < minConfidence) return false
        if (since && new Date(s.created_at).getTime() < since) return false
        return true
      })
      .sort((a, b) => {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return sortDir === 'desc' ? -diff : diff
      })
  }, [initialSignals, projectId, personaId, interviewId, type, minConfidence, dateRange, sortDir])

  // Sidebar widgets read from the full unfiltered set — they describe the
  // system's overall state, not whatever the user happens to be filtering.
  const velocity = useMemo(() => {
    const now = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      return { date: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), count: 0 }
    })
    for (const s of initialSignals) {
      const dateStr = new Date(s.created_at).toISOString().slice(0, 10)
      const bucket = days.find(d => d.date === dateStr)
      if (bucket) bucket.count++
    }
    const weekTotal = days.reduce((sum, d) => sum + d.count, 0)
    const prevStart = new Date(now); prevStart.setDate(prevStart.getDate() - 13)
    const prevEnd = new Date(now); prevEnd.setDate(prevEnd.getDate() - 7)
    const prevCount = initialSignals.filter(s => {
      const t = new Date(s.created_at).getTime()
      return t >= prevStart.getTime() && t < prevEnd.getTime()
    }).length
    const wowPercent = prevCount > 0 ? Math.round(((weekTotal - prevCount) / prevCount) * 100) : (weekTotal > 0 ? 100 : 0)
    const maxDay = Math.max(...days.map(d => d.count), 1)
    return { days, weekTotal, wowPercent, maxDay }
  }, [initialSignals])

  const typeDistribution = useMemo(() => {
    const counts = new Map<SignalType, number>()
    for (const s of initialSignals) counts.set(s.type, (counts.get(s.type) ?? 0) + 1)
    const max = Math.max(...counts.values(), 1)
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, count]) => ({ type: t, count, pct: Math.round((count / max) * 100) }))
  }, [initialSignals])

  const recentlyDiscovered = useMemo(() =>
    [...initialSignals].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [initialSignals]
  )

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full">
      {/* Hero */}
      <section className="relative px-4 sm:px-10 pt-10 sm:pt-16 pb-10 sm:pb-16 overflow-hidden">
        <div className="absolute -top-10 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-40" style={{ background: HOME_COLORS.primaryFixedDim }} />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Intelligence Stream</span>
          </div>
          <h1 className="text-[32px] sm:text-[40px] mb-6 leading-tight" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.02em', color: HOME_COLORS.onSurface }}>
            Market <span className="italic" style={{ fontWeight: 400 }}>Signals</span>
          </h1>
          <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            {initialSignals.length > 0
              ? `${initialSignals.length} signal${initialSignals.length === 1 ? '' : 's'} synthesized from your interviews and reports across ${projects.length} project${projects.length === 1 ? '' : 's'} — ranked by confidence, evidence, and how they're trending over time.`
              : 'Signals are synthesized automatically from interview reports within a project. Run interviews and generate reports to start building intelligence here.'}
          </p>
        </div>
      </section>

      {/* Content grid */}
      <div className="px-4 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 pb-20">
        {/* Left column — priority signals feed */}
        <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: `1px solid ${HOME_COLORS.outlineVariant}66` }}>
            <h2 className="text-base font-semibold" style={{ color: HOME_COLORS.onSurface }}>Priority Signals</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(o => !o)}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-colors"
                style={{ color: showFilters ? HOME_COLORS.primary : HOME_COLORS.onSurfaceVariant }}
              >
                <Filter size={16} />
                Filter
              </button>
              <button
                onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:opacity-70"
                style={{ color: HOME_COLORS.onSurfaceVariant }}
              >
                {sortDir === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 -mt-2">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
                <option value="">All projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={personaId} onChange={e => setPersonaId(e.target.value)} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
                <option value="">All personas</option>
                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={interviewId} onChange={e => setInterviewId(e.target.value)} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
                <option value="">All interviews</option>
                {interviews.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
              <select value={type} onChange={e => setType(e.target.value as SignalType | '')} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
                <option value="">All types</option>
                {Object.entries(SIGNAL_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
                {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <label className="flex items-center gap-2 text-xs ml-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                Min confidence
                <input
                  type="range" min={0} max={100} step={10}
                  value={minConfidence}
                  onChange={e => setMinConfidence(Number(e.target.value))}
                  className="w-24"
                  style={{ accentColor: HOME_COLORS.primary }}
                />
                <span className="w-8 font-medium" style={{ color: HOME_COLORS.onSurface }}>{minConfidence}%</span>
              </label>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl py-20 flex items-center justify-center" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px dashed ${HOME_COLORS.outlineVariant}` }}>
              <div className="text-center max-w-sm px-6">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: HOME_COLORS.secondaryContainer }}>
                  <Activity size={22} style={{ color: HOME_COLORS.primary }} />
                </div>
                <h3 className="text-lg mb-2" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>No signals match</h3>
                <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  {initialSignals.length === 0 ? 'Run interviews inside a project and generate a report to start building intelligence here.' : 'Try widening your filters.'}
                </p>
              </div>
            </div>
          ) : (
            filtered.map((signal, i) => (
              <SignalFeedCard key={signal.id} signal={signal} variant={(i + 1) % 3 === 0 ? 'wide' : 'standard'} />
            ))
          )}
        </div>

        {/* Right column — sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">
          {/* Signal velocity */}
          <section className="p-6 sm:p-8 rounded-xl" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-sm font-semibold mb-1">Signal Velocity</h4>
                <p className="text-xs opacity-70">Discovered over the last 7 days</p>
              </div>
              <Gauge size={20} style={{ color: HOME_COLORS.onPrimaryContainer }} />
            </div>
            <div className="flex items-end gap-2 mb-6 h-20">
              {velocity.days.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full rounded-t-sm" style={{ height: `${Math.max((d.count / velocity.maxDay) * 100, d.count > 0 ? 15 : 4)}%`, background: d.count > 0 ? HOME_COLORS.primaryFixedDim : 'rgba(255,255,255,0.1)' }} />
                  <span className="text-[9px] opacity-50">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>{velocity.weekTotal}</span>
              <div className="text-right">
                <span className="flex items-center justify-end gap-1 text-sm font-semibold">
                  {velocity.wowPercent >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {velocity.wowPercent > 0 ? '+' : ''}{velocity.wowPercent}%
                </span>
                <span className="block text-[10px] opacity-60 uppercase">vs prior week</span>
              </div>
            </div>
          </section>

          {/* Signal distribution */}
          <section className="p-6 sm:p-8 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLow, boxShadow: CARD_SHADOW }}>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Signal Distribution</h4>
              <Share2 size={18} style={{ color: HOME_COLORS.onSurfaceVariant }} />
            </div>
            {typeDistribution.length === 0 ? (
              <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>No signals yet.</p>
            ) : (
              <div className="space-y-3">
                {typeDistribution.map(({ type: t, count, pct }) => (
                  <div key={t}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: HOME_COLORS.onSurface }}>{SIGNAL_TYPE_LABELS[t]}</span>
                      <span className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: HOME_COLORS.surfaceContainer }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: HOME_COLORS.primary }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recently discovered */}
          <section>
            <h4 className="text-sm font-semibold mb-4 px-2" style={{ color: HOME_COLORS.onSurface }}>Recently Discovered</h4>
            {recentlyDiscovered.length === 0 ? (
              <p className="text-xs px-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Nothing yet.</p>
            ) : (
              <div className="space-y-1">
                {recentlyDiscovered.map(signal => (
                  <Link key={signal.id} href={`/projects/${signal.project_id}?tab=Signals`} className="flex gap-3 p-3 rounded-lg transition-all hover:bg-black/[0.03]">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${HOME_COLORS.primary}0d` }}>
                      <Lightbulb size={16} style={{ color: HOME_COLORS.primary }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1 truncate" style={{ color: HOME_COLORS.onSurface }}>{signal.title}</p>
                      <span className="text-[10px] uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(signal.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
