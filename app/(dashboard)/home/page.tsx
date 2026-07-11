import Link from 'next/link'
import {
  Briefcase, Users, MessageSquare, Activity, FileText, Gauge,
  Plus, UserPlus, PlayCircle, FileBarChart, Upload,
  TrendingUp, TrendingDown, UserPlus2, FileCheck, Sparkles as SignalIcon, Upload as UploadIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BRIEFING_STALE_AFTER_MS } from '@/lib/anthropic/briefing-engine'
import { buildTimelineEvents, type TimelineEventType } from '@/lib/utils/timeline'
import { getTrendDirection, getMentionTrendPercent } from '@/lib/utils/signals'
import { formatRelativeTime } from '@/lib/utils'
import { Greeting } from '@/components/home/Greeting'
import { BriefingCard } from '@/components/home/BriefingCard'
import { StrategicFocus } from '@/components/home/StrategicFocus'
import { PersonaSpotlight } from '@/components/home/PersonaSpotlight'
import type { ExecutiveBriefing, Signal, Persona } from '@/types'

const ACTIVITY_ICONS: Record<TimelineEventType, typeof Users> = {
  persona_created: UserPlus2,
  interview_completed: MessageSquare,
  interview_started: MessageSquare,
  report_generated: FileCheck,
  signal_discovered: SignalIcon,
  file_uploaded: UploadIcon,
}

// Home is read-only except for the AI briefing, which refreshes itself
// client-side (see BriefingCard) — the page never blocks on a Claude call.
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
  const allPersonas: Persona[] = personas ?? []
  const allInterviews = interviews ?? []
  const allSignals: Signal[] = signals ?? []
  const allReports = reports ?? []

  // Briefing is read from cache only here — generation happens async,
  // client-side, in BriefingCard. Previously this awaited a Claude call on
  // every stale/cold page load, which is what made Home slow to open.
  const cachedBriefing: ExecutiveBriefing | null = profile?.briefing ?? null
  const generatedAt = profile?.briefing_generated_at ? new Date(profile.briefing_generated_at).getTime() : 0
  const isStale = Date.now() - generatedAt > BRIEFING_STALE_AFTER_MS

  // ── Stats ────────────────────────────────────────────────────────────────
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const interviewsThisMonth = allInterviews.filter(iv => new Date(iv.created_at) >= monthStart).length

  const avgConfidence = allSignals.length > 0
    ? Math.round(allSignals.reduce((sum, s) => sum + s.confidence_score, 0) / allSignals.length)
    : 0

  const researchStatus = allSignals.length === 0 ? 'No data yet' : avgConfidence >= 80 ? 'Strong signal' : avgConfidence >= 60 ? 'Developing' : 'Early stage'

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  // ── Smart quick-action destinations ─────────────────────────────────────
  // "Generate Report" and "Upload Research" used to both dead-end at
  // /projects (redundant with "New Project"). Route to the actual next
  // actionable place instead.
  const reportableInterview = allInterviews.find(iv => iv.status === 'completed' && !iv.report_id)
  const generateReportHref = reportableInterview ? `/interviews/${reportableInterview.id}` : '/interviews'

  const uploadTargetProject = allProjects[0]
  const uploadResearchHref = uploadTargetProject ? `/projects/${uploadTargetProject.id}?tab=Files` : '/projects'

  // ── Recent activity (cross-project) ─────────────────────────────────────
  const timelineEvents = buildTimelineEvents({
    personas: allPersonas,
    interviews: allInterviews,
    reports: allReports,
    signals: allSignals,
    files: [],
  }).slice(0, 6)

  // ── Active projects with rollups ────────────────────────────────────────
  const activeProjects = allProjects.slice(0, 6).map(project => {
    const projectInterviews = allInterviews.filter(iv => iv.project_id === project.id)
    const projectSignals = allSignals.filter(s => s.project_id === project.id)
    const projectConfidence = projectSignals.length > 0
      ? Math.round(projectSignals.reduce((sum, s) => sum + s.confidence_score, 0) / projectSignals.length)
      : null
    return { project, interviewCount: projectInterviews.length, signalCount: projectSignals.length, confidence: projectConfidence }
  })

  // ── Trending signals — ranked by real mention growth, not a guess ───────
  const signalTrends = allSignals.map(s => ({
    signal: s,
    direction: getTrendDirection(s),
    mentionTrendPercent: getMentionTrendPercent(s),
  }))
  const trendingSignals = [...signalTrends]
    .filter(t => t.signal.confidence_score >= 70)
    .sort((a, b) => {
      const aScore = a.mentionTrendPercent ?? -Infinity
      const bScore = b.mentionTrendPercent ?? -Infinity
      if (aScore !== bScore) return bScore - aScore
      return b.signal.confidence_score - a.signal.confidence_score
    })
    .slice(0, 4)

  // ── Strategic focus — the project with the most signals right now ──────
  const focusProject = activeProjects.reduce<typeof activeProjects[number] | null>((best, p) => {
    if (p.signalCount === 0) return best
    if (!best || p.signalCount > best.signalCount) return p
    return best
  }, null)
  const focusSignals = focusProject
    ? signalTrends
        .filter(t => t.signal.project_id === focusProject.project.id)
        .sort((a, b) => b.signal.confidence_score - a.signal.confidence_score)
        .slice(0, 3)
    : []

  // ── Persona spotlight — a real quote from a real signal ─────────────────
  let spotlight: { persona: Persona; quote: string; interviewId: string | null } | null = null
  for (const s of allSignals) {
    const quote = s.supporting_quotes.find(q => q.persona_id)
    if (!quote) continue
    const persona = allPersonas.find(p => p.id === quote.persona_id)
    if (persona) {
      spotlight = { persona, quote: quote.text, interviewId: quote.interview_id }
      break
    }
  }

  return (
    <div style={{ background: '#F9F9F9', minHeight: '100%' }} className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="heading-editorial text-2xl text-neutral-900">
          <Greeting firstName={firstName} />
        </h1>
        <p className="text-sm mt-1" style={{ color: '#5F6368' }}>
          {interviewsThisMonth > 0
            ? `You've generated ${interviewsThisMonth} customer interview${interviewsThisMonth === 1 ? '' : 's'} this month.`
            : "You haven't run any interviews this month yet."}
        </p>
      </div>

      {/* Quick actions — compact utility strip */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <QuickAction href="/projects" icon={Plus} label="New Project" />
        <QuickAction href="/personas/new" icon={UserPlus} label="Create Persona" />
        <QuickAction href="/interviews/new" icon={PlayCircle} label="Run Interview" />
        <QuickAction href={generateReportHref} icon={FileBarChart} label="Generate Report" />
        <QuickAction href={uploadResearchHref} icon={Upload} label="Upload Research" />
      </div>

      {/* 1. AI Briefing */}
      <BriefingCard
        initialBriefing={cachedBriefing}
        isStale={isStale}
        signalsDiscovered={allSignals.length}
        avgConfidence={avgConfidence}
        researchStatus={researchStatus}
      />

      {/* 2. Trending signals + Strategic focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900">Trending Signals</h2>
            <Link href="/signals" className="text-[11px] font-semibold" style={{ color: '#1C3D2E' }}>View all signals →</Link>
          </div>
          {trendingSignals.length === 0 ? (
            <EmptyCard text="Signals will appear here once you generate reports from interviews inside a project." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trendingSignals.map(({ signal, direction, mentionTrendPercent }) => {
                const TrendIcon = mentionTrendPercent !== null && mentionTrendPercent < 0 ? TrendingDown : TrendingUp
                return (
                  <Link key={signal.id} href={`/projects/${signal.project_id}?tab=Signals`} className="rounded-2xl p-5 block transition-all hover:border-neutral-300 hover:shadow-sm" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: signal.status === 'validated' ? '#E8F3EF' : '#F4F6F8', color: signal.status === 'validated' ? '#1C3D2E' : '#6B7280' }}>
                        {signal.status}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: '#1C3D2E' }}>{signal.confidence_score}% confidence</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 mb-1.5 leading-snug">{signal.title}</p>
                    <p className="text-xs text-neutral-500 leading-relaxed mb-3 line-clamp-2">{signal.summary}</p>
                    <div className="flex items-center justify-between text-[11px]" style={{ color: '#9CA3AF' }}>
                      <span>Detected in {signal.related_interview_ids.length} interview{signal.related_interview_ids.length === 1 ? '' : 's'}</span>
                      {mentionTrendPercent !== null && mentionTrendPercent !== 0 && (
                        <span className="flex items-center gap-1" style={{ color: mentionTrendPercent > 0 ? '#1C3D2E' : '#B45309' }}>
                          <TrendIcon size={11} /> {Math.abs(mentionTrendPercent)}%
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        <div>
          {focusProject ? (
            <StrategicFocus projectId={focusProject.project.id} projectName={focusProject.project.name} signals={focusSignals} />
          ) : (
            <EmptyCard text="Strategic focus will surface here once a project has multiple signals." />
          )}
        </div>
      </div>

      {/* 3. Recent activity + Persona spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">Recent Activity</h2>
          {timelineEvents.length === 0 ? (
            <EmptyCard text="Nothing yet — create a persona or run an interview to get started." />
          ) : (
            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
              <ul className="space-y-4">
                {timelineEvents.map((e, i) => {
                  const Icon = ACTIVITY_ICONS[e.type]
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E8F3EF' }}>
                        <Icon size={13} style={{ color: '#1C3D2E' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-neutral-800">{e.title}</p>
                          <span className="text-[10px] flex-shrink-0" style={{ color: '#9CA3AF' }}>{formatRelativeTime(e.timestamp)}</span>
                        </div>
                        {e.detail && <p className="text-[11px] mt-0.5 truncate" style={{ color: '#5F6368' }}>{e.detail}</p>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
        <div>
          {spotlight ? (
            <PersonaSpotlight persona={spotlight.persona} quote={spotlight.quote} interviewId={spotlight.interviewId} />
          ) : (
            <EmptyCard text="A persona spotlight will appear here once a signal captures a notable quote." />
          )}
        </div>
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
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">Active Projects</h2>
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
    <div className="rounded-2xl p-6 text-center h-full flex items-center justify-center" style={{ background: 'white', border: '1px dashed #E0E2E4' }}>
      <p className="text-xs" style={{ color: '#5F6368' }}>{text}</p>
    </div>
  )
}
