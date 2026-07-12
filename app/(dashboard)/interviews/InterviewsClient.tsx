'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus, Search, Trash2, Loader2, Quote, TrendingUp, Mic, Lightbulb, ArrowRight,
} from 'lucide-react'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW, formatRelativeTime, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import { buildTimelineEvents, type TimelineEventType } from '@/lib/utils/timeline'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { Dropdown } from '@/components/ui/Dropdown'
import type { Interview, Persona, InterviewStatus, Signal, Report } from '@/types'

interface ProjectLite { id: string; name: string }

interface InterviewsClientProps {
  initialInterviews: (Interview & { persona: Persona })[]
  allPersonas: Persona[]
  allSignals: Signal[]
  allReports: Report[]
  allProjects: ProjectLite[]
}

const STATUS_META: Record<InterviewStatus, { label: string; bg: string; color: string; pulse: boolean }> = {
  active: { label: 'Active session', bg: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimaryContainer, pulse: true },
  completed: { label: 'Completed', bg: HOME_COLORS.surfaceContainerHigh, color: HOME_COLORS.onSurfaceVariant, pulse: false },
  draft: { label: 'Draft', bg: HOME_COLORS.secondaryContainer, color: HOME_COLORS.onSecondaryContainer, pulse: false },
}

const ACTIVITY_ICONS: Record<TimelineEventType, typeof Mic> = {
  persona_created: Mic,
  interview_completed: Mic,
  interview_started: Mic,
  report_generated: TrendingUp,
  signal_discovered: Lightbulb,
  file_uploaded: Mic,
}

export function InterviewsClient({ initialInterviews, allPersonas, allSignals, allReports, allProjects }: InterviewsClientProps) {
  const [interviews, setInterviews] = useState(initialInterviews)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return interviews.filter(iv => {
      if (statusFilter && iv.status !== statusFilter) return false
      if (projectFilter === 'unassigned' && iv.project_id) return false
      if (projectFilter && projectFilter !== 'unassigned' && iv.project_id !== projectFilter) return false
      if (q && !iv.title.toLowerCase().includes(q) && !(iv.persona?.name ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [interviews, search, statusFilter, projectFilter])

  const activeCount = interviews.filter(iv => iv.status === 'active').length
  const completedCount = interviews.filter(iv => iv.status === 'completed').length
  const avgConfidence = allReports.length > 0
    ? Math.round(allReports.reduce((sum, r) => sum + r.confidence_score, 0) / allReports.length)
    : null

  const timelineEvents = useMemo(() =>
    buildTimelineEvents({ interviews, reports: allReports, signals: allSignals, personas: [], files: [] }).slice(0, 4),
    [interviews, allReports, allSignals]
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this interview? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/interviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) setInterviews(prev => prev.filter(iv => iv.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  // A real, honest quote source for the sidebar "Key Quote" module — first
  // persona with a saved key_quote among personas actually interviewed.
  const interviewedPersonaIds = new Set(interviews.map(iv => iv.persona_id))
  const keyQuotePersona = allPersonas.find(p => interviewedPersonaIds.has(p.id) && p.traits?.key_quote)
    ?? allPersonas.find(p => p.traits?.key_quote)

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full">
      {/* Hero */}
      <section className="px-4 sm:px-10 pt-10 sm:pt-16 pb-10 sm:pb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Intelligence Stream</span>
          </div>
          <h1 className="mb-4 leading-tight" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onSurface }}>
            Strategic <span className="italic" style={{ fontWeight: 400 }}>Dialogues</span>
          </h1>
          <p className="text-sm sm:text-base leading-relaxed max-w-xl" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Select a persona to start a new AI-driven dialogue, or manage your ongoing research sessions below. Every completed conversation feeds your projects&apos; signals.
          </p>
        </div>
        <Link
          href="/interviews/new"
          className="group relative flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 ease-out hover:pr-10 hover:shadow-xl active:scale-95 flex-shrink-0"
          style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}
        >
          <Plus size={20} />
          <span className="text-sm font-semibold">Schedule Interview</span>
          <ArrowRight size={18} className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out" />
        </Link>
      </section>

      {/* Filter & search bar */}
      <section className="px-4 sm:px-10 mb-10 sm:mb-12">
        <div className="rounded-full p-2 flex flex-col md:flex-row items-center gap-2" style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}4d`, boxShadow: CARD_SHADOW }}>
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: HOME_COLORS.onSurfaceVariant }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by interviewee, title, or keyword..."
              className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-sm outline-none"
              style={{ color: HOME_COLORS.onSurface }}
            />
          </div>
          <div className="h-8 w-px hidden md:block" style={{ background: HOME_COLORS.outlineVariant }} />
          <div className="flex items-center gap-2 px-2 w-full md:w-auto">
            <Dropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All statuses"
              options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'draft', label: 'Draft' }]}
            />
            <Dropdown
              value={projectFilter}
              onChange={setProjectFilter}
              placeholder="All projects"
              options={[{ value: '', label: 'All projects' }, { value: 'unassigned', label: 'Unassigned' }, ...allProjects.map(p => ({ value: p.id, label: p.name }))]}
            />
          </div>
        </div>
      </section>

      {/* Content grid */}
      <div className="px-4 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 pb-20">
        {/* Left column — sessions */}
        <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: `1px solid ${HOME_COLORS.outlineVariant}66` }}>
            <h2 className="text-base font-semibold" style={{ color: HOME_COLORS.onSurface }}>Recent Sessions</h2>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>
              {activeCount} session{activeCount === 1 ? '' : 's'} active
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl py-20 flex items-center justify-center" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px dashed ${HOME_COLORS.outlineVariant}` }}>
              <div className="text-center max-w-sm px-6">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: HOME_COLORS.secondaryContainer }}>
                  <Mic size={22} style={{ color: HOME_COLORS.primary }} />
                </div>
                <h3 className="text-lg mb-2" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>
                  {interviews.length === 0 ? 'No sessions yet' : 'No sessions match'}
                </h3>
                <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  {interviews.length === 0 ? 'Create a persona, then start your first dialogue.' : 'Try a different search or filter.'}
                </p>
              </div>
            </div>
          ) : (
            filtered.map((interview, i) => {
              const status = STATUS_META[interview.status]
              const report = allReports.find(r => r.id === interview.report_id)
              const insightCount = allSignals.filter(s => s.related_interview_ids.includes(interview.id)).length
              const excerpt = interview.messages?.find(m => m.role === 'persona' && m.content?.length > 30)?.content
                ?? interview.persona?.traits?.key_quote
                ?? null

              return (
                <motion.article
                  key={interview.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: Math.min(i, 4) * 0.05 }}
                  className="group relative rounded-xl p-6 sm:p-8 transition-all hover:shadow-xl"
                  style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}
                >
                  <Link href={`/interviews/${interview.id}`} className="block">
                    <div className="flex justify-between items-start mb-6 pr-8">
                      <div className="flex items-center gap-3 min-w-0">
                        <PersonaAvatar avatarUrl={interview.persona?.avatar_url} avatarInitials={interview.persona?.avatar_initials} avatarColor={interview.persona?.avatar_color} name={interview.persona?.name} size="md" />
                        <div className="min-w-0">
                          <span className="block text-lg leading-tight truncate" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>{interview.persona?.name ?? 'Unknown persona'}</span>
                          <span className="text-[11px] uppercase tracking-wide" style={{ color: HOME_COLORS.onSurfaceVariant }}>{interview.persona?.traits?.job_title ?? INTERVIEW_TYPE_LABELS[interview.type]}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ background: status.bg, color: status.color }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.pulse ? 'animate-pulse' : ''}`} style={{ background: status.color }} />
                        {status.label}
                      </span>
                    </div>

                    {excerpt && (
                      <p className="text-sm leading-relaxed italic mb-8 pl-4" style={{ color: HOME_COLORS.onSurfaceVariant, borderLeft: `2px solid ${HOME_COLORS.primaryFixedDim}` }}>
                        &ldquo;{excerpt.length > 220 ? excerpt.slice(0, 220) + '…' : excerpt}&rdquo;
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}4d` }}>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Confidence</span>
                        {report ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: HOME_COLORS.primary }}>{report.confidence_score}%</span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: HOME_COLORS.surfaceContainer }}>
                              <div className="h-full rounded-full" style={{ width: `${report.confidence_score}%`, background: HOME_COLORS.primary }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Pending</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Date</span>
                        <span className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{formatRelativeTime(interview.created_at)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Insights Generated</span>
                        <span className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{insightCount} signal{insightCount === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleDelete(interview.id)}
                    disabled={deleting === interview.id}
                    className="absolute top-6 right-6 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.onSurfaceVariant }}
                    title="Delete interview"
                  >
                    {deleting === interview.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </motion.article>
              )
            })
          )}
        </div>

        {/* Right column — sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">
          {/* Target personas */}
          <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLow, boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Target Personas</h4>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.primary }}>{allPersonas.length} available</span>
            </div>
            {allPersonas.length === 0 ? (
              <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>No personas yet.</p>
            ) : (
              <div className="space-y-2.5">
                {allPersonas.slice(0, 4).map(persona => (
                  <Link key={persona.id} href={`/interviews/new?persona_id=${persona.id}`} className="flex items-center justify-between p-2.5 rounded-lg transition-all group" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}33` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: HOME_COLORS.onSurface }}>{persona.name}</p>
                        <p className="text-[10px] uppercase truncate" style={{ color: HOME_COLORS.onSurfaceVariant }}>{persona.traits?.job_title ?? 'Persona'}</p>
                      </div>
                    </div>
                    <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: HOME_COLORS.primary }} />
                  </Link>
                ))}
              </div>
            )}
            <Link href="/personas" className="block w-full mt-5 py-2 text-center text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-colors" style={{ border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurfaceVariant }}>
              View all personas
            </Link>
          </section>

          {/* Research momentum */}
          <section className="p-6 sm:p-8 rounded-xl relative overflow-hidden" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none" style={{ border: `10px solid rgba(255,255,255,0.05)` }} />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <TrendingUp size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>Research Momentum</span>
              </div>
              <h3 className="text-xl mb-3" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>Session Velocity</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {activeCount} active session{activeCount === 1 ? '' : 's'} and {completedCount} completed
                {avgConfidence !== null ? `, averaging ${avgConfidence}% report confidence.` : '.'}
              </p>
              <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm font-semibold pb-1 group" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                View all reports
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </section>

          {/* Key quote */}
          {keyQuotePersona?.traits?.key_quote && (
            <section className="p-6 sm:p-8 rounded-xl flex flex-col" style={{ background: HOME_COLORS.surfaceContainerHigh, boxShadow: CARD_SHADOW }}>
              <div className="flex justify-between items-center mb-8">
                <Quote size={26} style={{ color: HOME_COLORS.primary }} />
              </div>
              <p className="text-lg leading-snug italic mb-6" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>
                &ldquo;{keyQuotePersona.traits.key_quote}&rdquo;
              </p>
              <div className="mt-auto pt-5 flex items-center gap-3" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}66` }}>
                <PersonaAvatar avatarUrl={keyQuotePersona.avatar_url} avatarInitials={keyQuotePersona.avatar_initials} avatarColor={keyQuotePersona.avatar_color} name={keyQuotePersona.name} size="sm" />
                <div>
                  <span className="block text-sm font-semibold leading-none" style={{ color: HOME_COLORS.onSurface }}>{keyQuotePersona.name}</span>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>{keyQuotePersona.traits?.job_title}</span>
                </div>
              </div>
            </section>
          )}

          {/* Key highlights */}
          <section>
            <h4 className="text-sm font-semibold mb-4 px-2" style={{ color: HOME_COLORS.onSurface }}>Key Highlights</h4>
            {timelineEvents.length === 0 ? (
              <p className="text-xs px-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Nothing yet.</p>
            ) : (
              <div className="space-y-1">
                {timelineEvents.map((e, i) => {
                  const Icon = ACTIVITY_ICONS[e.type]
                  return (
                    <div key={i} className="flex gap-4 p-3 rounded-lg">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${HOME_COLORS.primary}0d` }}>
                        <Icon size={16} style={{ color: HOME_COLORS.primary }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight mb-1 truncate" style={{ color: HOME_COLORS.onSurface }}>{e.title}{e.detail ? `: ${e.detail}` : ''}</p>
                        <span className="text-[10px] uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(e.timestamp)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
