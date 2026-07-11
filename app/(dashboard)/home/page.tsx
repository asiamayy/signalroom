import Link from 'next/link'
import {
  Sparkles, Briefcase, Users, MessageSquare, Activity, FileText, Gauge,
  Plus, UserPlus, PlayCircle, FileBarChart, Upload, Sparkle, TrendingUp, TrendingDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { generateExecutiveBriefing, BRIEFING_STALE_AFTER_MS, type SignalTrendInput } from '@/lib/anthropic/briefing-engine'
import { buildTimelineEvents } from '@/lib/utils/timeline'
import { getTrendDirection, getMentionTrendPercent } from '@/lib/utils/signals'
import { formatRelativeTime } from '@/lib/utils'
import type { ExecutiveBriefing, Signal } from '@/types'

// Home is read-only — every element here is a link or a display, nothing
// needs client-side state — so unlike Personas/Projects this doesn't need a
// server/client split.
export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: profile },
    { data: projects },
    { data: personas },
    { data: interviews },
    { data: signals },
    { data: reports },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('projects').select('*').eq('user_id', user.id).eq('archived', false).order('updated_at', { ascending: false }),
    supabase.from('personas').select('*').eq('user_id', user.id),
    supabase.from('interviews').select('*').eq('user_id', user.id),
    supabase.from('signals').select('*').eq('user_id', user.id).order('confidence_score', { ascending: false }),
    supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const allProjects = projects ?? []
  const allPersonas = personas ?? []
  const allInterviews = interviews ?? []
  const allSignals: Signal[] = signals ?? []
  const allReports = reports ?? []

  // Real, computed movement — not an AI estimate. Same numbers feed both the
  // briefing prompt (grounding its claims) and the Trending Signals ranking.
  const signalTrends: (SignalTrendInput & { signal: Signal })[] = allSignals.map(s => ({
    signal: s,
    title: s.title,
    direction: getTrendDirection(s),
    mentionTrendPercent: getMentionTrendPercent(s),
  }))

  // ── AI briefing — cached, regenerated only when stale ──────────────────────
  let briefing: ExecutiveBriefing | null = profile?.briefing ?? null
  const generatedAt = profile?.briefing_generated_at ? new Date(profile.briefing_generated_at).getTime() : 0
  const isStale = Date.now() - generatedAt > BRIEFING_STALE_AFTER_MS

  if (!briefing || isStale) {
    try {
      briefing = await generateExecutiveBriefing(
        allSignals.slice(0, 12),
        allReports.slice(0, 8),
        signalTrends.slice(0, 12)
      )
      await supabase.from('profiles').update({
        briefing,
        briefing_generated_at: new Date().toISOString(),
      }).eq('id', user.id)
    } catch (e: any) {
      console.error('Briefing generation error:', e?.message ?? e)
      // Fall back to whatever was cached, even if stale, rather than blank
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const interviewsThisMonth = allInterviews.filter(iv => new Date(iv.created_at) >= monthStart).length

  const avgConfidence = allSignals.length > 0
    ? Math.round(allSignals.reduce((sum, s) => sum + s.confidence_score, 0) / allSignals.length)
    : 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // ── Recent activity (cross-project) ─────────────────────────────────────
  const timelineEvents = buildTimelineEvents({
    personas: allPersonas,
    interviews: allInterviews,
    reports: allReports,
    signals: allSignals,
    files: [],
  }).slice(0, 8)

  // ── Active projects with rollups ────────────────────────────────────────
  const activeProjects = allProjects.slice(0, 6).map(project => {
    const projectInterviews = allInterviews.filter(iv => iv.project_id === project.id)
    const projectSignals = allSignals.filter(s => s.project_id === project.id)
    const projectConfidence = projectSignals.length > 0
      ? Math.round(projectSignals.reduce((sum, s) => sum + s.confidence_score, 0) / projectSignals.length)
      : null
    return { project, interviewCount: projectInterviews.length, signalCount: projectSignals.length, confidence: projectConfidence }
  })

  // Ranked by real mention growth where we have history; falls back to
  // confidence for signals that have only been seen once so far.
  const trendingSignals = [...signalTrends]
    .filter(t => t.signal.confidence_score >= 70)
    .sort((a, b) => {
      const aScore = a.mentionTrendPercent ?? -Infinity
      const bScore = b.mentionTrendPercent ?? -Infinity
      if (aScore !== bScore) return bScore - aScore
      return b.signal.confidence_score - a.signal.confidence_score
    })
    .slice(0, 5)

  return (
    <div style={{ background: '#F9F9F9', minHeight: '100%' }} className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="heading-editorial text-2xl text-neutral-900">{greeting}, {firstName}</h1>
        <p className="text-sm mt-1" style={{ color: '#5F6368' }}>
          {interviewsThisMonth > 0
            ? `You've generated ${interviewsThisMonth} customer interview${interviewsThisMonth === 1 ? '' : 's'} this month.`
            : "You haven't run any interviews this month yet."}
        </p>
      </div>

      {/* Quick actions — a compact utility strip, not competing with the
          intelligence hierarchy below (Briefing > Trending > Activity >
          Stats > Projects) */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <QuickAction href="/projects" icon={Plus} label="New Project" />
        <QuickAction href="/personas/new" icon={UserPlus} label="Create Persona" />
        <QuickAction href="/interviews/new" icon={PlayCircle} label="Run Interview" />
        <QuickAction href="/interviews" icon={FileBarChart} label="Generate Report" />
        <QuickAction href="/projects" icon={Upload} label="Upload Research" />
        <QuickAction href="/projects" icon={Sparkle} label="Ingest New Context" />
      </div>

      {/* 1. AI Briefing — highest priority, an interpretation, not a metric */}
      {briefing && (
        <div className="rounded-2xl p-5 sm:p-6 mb-8" style={{ background: '#1C3D2E' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} style={{ color: '#CFE3D8' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#CFE3D8' }}>Executive briefing</span>
          </div>
          <p className="text-sm sm:text-base text-white leading-relaxed mb-3">{briefing.summary}</p>
          {briefing.observations.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {briefing.observations.map((obs, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#E3EEE8' }}>
                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#8FB5A0' }} />
                  {obs}
                </li>
              ))}
            </ul>
          )}
          {briefing.recommended_next_step && (
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8FB5A0' }}>Recommended next step</p>
              <p className="text-sm text-white">{briefing.recommended_next_step}</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Trending signals */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">Trending signals</h2>
        {trendingSignals.length === 0 ? (
          <EmptyCard text="Signals will appear here once you generate reports from interviews inside a project." />
        ) : (
          <div className="space-y-2">
            {trendingSignals.map(({ signal, direction, mentionTrendPercent }) => {
              const TrendIcon = mentionTrendPercent !== null && mentionTrendPercent < 0 ? TrendingDown : TrendingUp
              return (
                <Link key={signal.id} href={`/projects/${signal.project_id}`} className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3 block transition-colors hover:border-neutral-300" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-800 truncate">{signal.title}</p>
                    {mentionTrendPercent !== null && mentionTrendPercent !== 0 && (
                      <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: mentionTrendPercent > 0 ? '#1C3D2E' : '#B45309' }}>
                        <TrendIcon size={11} />
                        Mentions {mentionTrendPercent > 0 ? 'up' : 'down'} {Math.abs(mentionTrendPercent)}% over 30 days
                      </p>
                    )}
                    {mentionTrendPercent === null && (
                      <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{direction === 'new' ? 'Newly discovered' : 'Stable'}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#1C3D2E' }}>{signal.confidence_score}%</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Recent activity */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">Recent activity</h2>
        {timelineEvents.length === 0 ? (
          <EmptyCard text="Nothing yet — create a persona or run an interview to get started." />
        ) : (
          <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
            <ul className="space-y-3">
              {timelineEvents.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-neutral-700">{e.title}{e.detail ? ` — ${e.detail}` : ''}</span>
                  <span className="text-neutral-400 flex-shrink-0">{formatRelativeTime(e.timestamp)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 4. Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatTile icon={Briefcase} label="Projects" value={allProjects.length} />
        <StatTile icon={Users} label="Personas" value={allPersonas.length} />
        <StatTile icon={MessageSquare} label="Interviews" value={allInterviews.length} />
        <StatTile icon={Activity} label="Signals" value={allSignals.length} />
        <StatTile icon={FileText} label="Reports" value={allReports.length} />
        <StatTile icon={Gauge} label="Avg Confidence" value={`${avgConfidence}%`} />
      </div>

      {/* 5. Active projects */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">Active projects</h2>
        {activeProjects.length === 0 ? (
          <EmptyCard text="No projects yet — create one to start organizing your research." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeProjects.map(({ project, interviewCount, signalCount, confidence }) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="rounded-2xl p-4 block transition-all hover:border-neutral-300 hover:shadow-sm" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
                <p className="text-sm font-semibold text-neutral-900 mb-2">{project.name}</p>
                <div className="flex items-center gap-3 text-xs" style={{ color: '#5F6368' }}>
                  <span>{interviewCount} interview{interviewCount === 1 ? '' : 's'}</span>
                  <span>{signalCount} signal{signalCount === 1 ? '' : 's'}</span>
                  {confidence !== null && <span style={{ color: '#1C3D2E', fontWeight: 600 }}>{confidence}% confidence</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
      <Icon size={14} style={{ color: '#9CA3AF' }} className="mb-2" />
      <p className="text-xl font-semibold text-neutral-900" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: '#5F6368' }}>{label}</p>
    </div>
  )
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof Users; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:bg-white" style={{ color: '#374151', border: '1px solid #E0E2E4' }}>
      <Icon size={12} style={{ color: '#1C3D2E' }} />
      {label}
    </Link>
  )
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl p-6 text-center" style={{ background: 'white', border: '1px dashed #E0E2E4' }}>
      <p className="text-xs" style={{ color: '#5F6368' }}>{text}</p>
    </div>
  )
}
