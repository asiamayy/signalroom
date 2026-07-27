'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Brain, FileText, Filter, Loader2, Trash2 } from 'lucide-react'
import { formatDate, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_BODY, HOME_FONT_DISPLAY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { createClient } from '@/lib/supabase/client'

type ReportRecord = {
  id: string
  confidence_score: number
  created_at: string
  key_themes?: { title: string }[]
  interview?: {
    title?: string
    type?: string
    persona?: {
      name?: string
      avatar_initials?: string
      avatar_color?: { bg: string; text: string } | string | null
      avatar_url?: string | null
    }
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [activeType, setActiveType] = useState('all')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('reports')
        .select(`
          *,
          interview:interviews(
            id, title, type,
            persona:personas(name, avatar_initials, avatar_color, avatar_url)
          )
        `)
        .order('created_at', { ascending: false })
      setReports((data ?? []) as ReportRecord[])
      setLoading(false)
    }
    load()
  }, [])

  const visibleReports = useMemo(
    () => activeType === 'all' ? reports : reports.filter(report => report.interview?.type === activeType),
    [activeType, reports]
  )

  const researchTypes = useMemo(() => Array.from(new Set(
    reports.map(report => report.interview?.type).filter((type): type is string => Boolean(type))
  )), [reports])

  const averageConfidence = useMemo(() => reports.length
    ? Math.round(reports.reduce((total, report) => total + (report.confidence_score ?? 0), 0) / reports.length)
    : 0, [reports])

  const themes = useMemo(() => {
    const counts = new Map<string, number>()
    reports.forEach(report => report.key_themes?.forEach(theme => {
      counts.set(theme.title, (counts.get(theme.title) ?? 0) + 1)
    }))
    const highestCount = Math.max(...counts.values(), 1)
    return [...counts.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([title, count]) => ({ title, count, percentage: Math.round((count / highestCount) * 100) }))
  }, [reports])

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault()
    event.stopPropagation()
    if (!confirm('Delete this report? This cannot be undone.')) return
    setDeleting(id)
    try {
      const response = await fetch('/api/reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) setReports(current => current.filter(report => report.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-full px-4 py-10 sm:px-10 sm:py-16" style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }}>
      <div className="mx-auto w-full max-w-[1440px]">
        <header className="mb-10 max-w-4xl sm:mb-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-12" style={{ background: `${HOME_COLORS.primary}33` }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Intelligence Stream</span>
          </div>
          <h1 className="mb-4" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.primary }}>
            Research <span className="italic" style={{ fontWeight: 400 }}>Insights</span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Structured summaries, themes, and recommendations synthesized from every interview you&apos;ve run. High-fidelity extraction powered by Signalroom Intelligence.
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">{[1, 2, 3].map(item => <div key={item} className="h-32 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLowest }} />)}</div>
            <div className="space-y-6 lg:col-span-4">{[1, 2].map(item => <div key={item} className="h-48 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainer }} />)}</div>
          </div>
        ) : reports.length === 0 ? (
          <EmptyInsights />
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
            <section className="lg:col-span-8">
              <div className="mb-4 flex items-center justify-between border-b pb-4" style={{ borderColor: `${HOME_COLORS.outlineVariant}80` }}>
                <h2 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>All Research</h2>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  <Filter size={16} />
                  <span className="hidden sm:inline">Filter research</span>
                  <select value={activeType} onChange={event => setActiveType(event.target.value)} aria-label="Filter research type" className="rounded-lg px-2.5 py-2 text-xs font-medium outline-none" style={{ background: HOME_COLORS.surfaceContainer, border: `1px solid ${HOME_COLORS.outlineVariant}`, color: HOME_COLORS.onSurface, fontFamily: 'inherit' }}>
                    <option value="all">All research</option>
                    {researchTypes.map(type => <option key={type} value={type}>{INTERVIEW_TYPE_LABELS[type] ?? type}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex flex-col gap-4">
                {visibleReports.map(report => <InsightCard key={report.id} report={report} deleting={deleting === report.id} onDelete={handleDelete} />)}
                {visibleReports.length === 0 && (
                  <div className="rounded-xl px-8 py-16 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest }}>
                    <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>No insights match this research type.</p>
                  </div>
                )}
              </div>
            </section>

            <aside className="flex flex-col gap-6 lg:col-span-4">
              <ConfidenceSummary confidence={averageConfidence} reportCount={reports.length} />
              <EmergentThemes themes={themes} />
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function InsightCard({ report, deleting, onDelete }: { report: ReportRecord; deleting: boolean; onDelete: (event: React.MouseEvent<HTMLButtonElement>, id: string) => void }) {
  const score = report.confidence_score ?? 0
  const themeCount = report.key_themes?.length ?? 0
  const persona = report.interview?.persona

  return (
    <article className="group relative overflow-hidden rounded-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-xl" style={{ background: HOME_COLORS.surfaceContainerLowest }}>
      <span className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 transition-transform duration-500 group-hover:scale-y-100" style={{ background: HOME_COLORS.primary }} />
      <Link href={`/reports/${report.id}`} className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <PersonaAvatar
          avatarUrl={persona?.avatar_url}
          avatarInitials={persona?.avatar_initials}
          avatarColor={persona?.avatar_color}
          name={persona?.name}
          size="xl"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: `${HOME_COLORS.onSurfaceVariant}99` }}>
            <span>{INTERVIEW_TYPE_LABELS[report.interview?.type ?? ''] ?? 'Interview'}</span>
            <span className="h-1 w-1 rounded-full" style={{ background: HOME_COLORS.outlineVariant }} />
            <span>{formatDate(report.created_at)}</span>
          </div>
          <h2 className="truncate text-xl leading-tight sm:text-[22px]" style={{ color: HOME_COLORS.primary, fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>
            {report.interview?.title ?? 'Untitled interview'}
          </h2>
          <p className="mt-1 truncate text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>{persona?.name ?? 'Research participant'}</p>
        </div>

        <div className="flex items-center justify-between gap-5 border-t pt-4 sm:justify-start sm:gap-8 sm:border-l sm:border-t-0 sm:px-7 sm:pt-0" style={{ borderColor: `${HOME_COLORS.outlineVariant}80` }}>
          <ConfidenceRing score={score} />
          <div className="flex min-w-10 flex-col items-center">
            <span className="text-2xl leading-none" style={{ color: HOME_COLORS.primary, fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>{String(themeCount).padStart(2, '0')}</span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-tight" style={{ color: `${HOME_COLORS.onSurfaceVariant}99` }}>Themes</span>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 group-hover:bg-[#18281c] group-hover:text-white" style={{ background: HOME_COLORS.surfaceContainer, color: HOME_COLORS.onSurfaceVariant }}>
            <ArrowRight size={19} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
      <button onClick={event => onDelete(event, report.id)} disabled={deleting} title="Delete report" aria-label="Delete report" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" style={{ background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.onSurfaceVariant }}>
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </article>
  )
}

function ConfidenceRing({ score }: { score: number }) {
  const circumference = 100.53
  const dashOffset = circumference * (1 - Math.max(0, Math.min(score, 100)) / 100)
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="16" fill="none" stroke={HOME_COLORS.surfaceContainer} strokeWidth="2" />
          <circle cx="18" cy="18" r="16" fill="none" stroke={HOME_COLORS.primary} strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" strokeWidth="2" />
        </svg>
        <span className="absolute text-[10px] font-semibold" style={{ color: HOME_COLORS.primary }}>{score}%</span>
      </div>
      <span className="mt-1 text-[9px] font-semibold uppercase tracking-tight" style={{ color: `${HOME_COLORS.onSurfaceVariant}99` }}>Confidence</span>
    </div>
  )
}

function ConfidenceSummary({ confidence, reportCount }: { confidence: number; reportCount: number }) {
  return (
    <section className="relative overflow-hidden rounded-xl p-8" style={{ background: HOME_COLORS.tertiary, color: HOME_COLORS.onTertiary }}>
      <div className="relative z-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primaryFixed, opacity: 0.6 }}>Global Confidence</p>
        <div className="mt-4 flex items-baseline gap-2"><span className="text-[64px] leading-none" style={{ color: HOME_COLORS.primaryFixed, fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>{confidence}</span><span className="text-2xl" style={{ color: HOME_COLORS.primaryFixed, opacity: 0.4 }}>%</span></div>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: HOME_COLORS.onPrimaryContainer }}>
          Average synthesis confidence across all active research. Your evidence quality is currently <strong style={{ color: HOME_COLORS.primaryFixed }}>optimal</strong>.
        </p>
        <div className="mt-8 space-y-4 border-t pt-6 text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex justify-between"><span style={{ opacity: 0.6 }}>Research reports</span><span className="font-semibold">{reportCount}</span></div>
          <div className="flex justify-between"><span style={{ opacity: 0.6 }}>Data points</span><span className="font-semibold">{reportCount} synthesis{reportCount === 1 ? '' : 'es'}</span></div>
        </div>
      </div>
      <span className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full blur-3xl" style={{ background: `${HOME_COLORS.primaryFixed}0d` }} />
    </section>
  )
}

function EmergentThemes({ themes }: { themes: { title: string; count: number; percentage: number }[] }) {
  return (
    <section className="rounded-xl p-8" style={{ background: HOME_COLORS.surfaceContainer }}>
      <h2 className="mb-6 flex items-center gap-2 text-base" style={{ color: HOME_COLORS.primary, fontWeight: 600 }}><Brain size={20} />Emergent Themes</h2>
      {themes.length ? <div className="space-y-4">{themes.map(theme => (
        <div key={theme.title}>
          <div className="mb-1 flex justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: `${HOME_COLORS.onSurfaceVariant}99` }}><span className="truncate">{theme.title}</span><span className="shrink-0">{theme.count} report{theme.count === 1 ? '' : 's'}</span></div>
          <div className="h-1 overflow-hidden rounded-full" style={{ background: `${HOME_COLORS.outlineVariant}33` }}><div className="h-full rounded-full" style={{ width: `${theme.percentage}%`, background: HOME_COLORS.primary }} /></div>
        </div>
      ))}</div> : <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Themes will appear as research reports are generated.</p>}
      <Link href="/signals" className="mt-8 block w-full rounded-full border py-3 text-center text-xs font-semibold transition-colors hover:bg-[#eae7e7]" style={{ borderColor: HOME_COLORS.outline, color: HOME_COLORS.onSurface }}>Explore Theme Map</Link>
    </section>
  )
}

function EmptyInsights() {
  return <div className="rounded-xl border border-dashed px-6 py-16 text-center sm:px-12" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant }}><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: HOME_COLORS.secondaryContainer }}><FileText size={22} style={{ color: HOME_COLORS.primary }} /></div><h2 className="mb-2 text-lg" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>No insights yet</h2><p className="mx-auto mb-5 max-w-sm text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Run an interview and create a report to start building your intelligence stream.</p><Link href="/interviews/new" className="inline-flex rounded-full px-5 py-2.5 text-sm font-semibold" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>Start an interview</Link></div>
}
