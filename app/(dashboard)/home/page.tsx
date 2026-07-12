import Link from 'next/link'
import {
  FolderOpen, Users, Mic, Radar, ArrowRight, RefreshCw,
  UserPlus2, FileCheck, Sparkles as SignalIcon, Upload as UploadIcon, MessageSquare,
  AlertTriangle, ShieldAlert, Target, Lightbulb, Zap, TrendingUp, Sparkles, AlertOctagon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BRIEFING_STALE_AFTER_MS } from '@/lib/anthropic/briefing-engine'
import { buildTimelineEvents, type TimelineEventType } from '@/lib/utils/timeline'
import { getTrendDirection, getMentionTrendPercent } from '@/lib/utils/signals'
import { formatRelativeTime, CARD_SHADOW } from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY } from '@/lib/home-theme'
import { BriefingCard } from '@/components/home/BriefingCard'
import { StrategicFocus } from '@/components/home/StrategicFocus'
import { PersonaSpotlight } from '@/components/home/PersonaSpotlight'
import type { ExecutiveBriefing, Signal, Persona, SignalType } from '@/types'

const ACTIVITY_ICONS: Record<TimelineEventType, typeof Users> = {
  persona_created: UserPlus2,
  interview_completed: MessageSquare,
  interview_started: MessageSquare,
  report_generated: FileCheck,
  signal_discovered: SignalIcon,
  file_uploaded: UploadIcon,
}

const TYPE_ICON: Record<SignalType, typeof Users> = {
  pain_point: AlertTriangle,
  objection: ShieldAlert,
  desired_outcome: Target,
  feature_request: Lightbulb,
  buying_trigger: Zap,
  trend: TrendingUp,
  opportunity: Sparkles,
  risk: AlertOctagon,
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
    supabase.from('reports').select('*, interview:interviews(title)').eq('user_id', user.id).order('created_at', { ascending: false }),
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

  const avgConfidence = allSignals.length > 0
    ? Math.round(allSignals.reduce((sum, s) => sum + s.confidence_score, 0) / allSignals.length)
    : 0
  const validatedRatio = allSignals.length > 0
    ? Math.round((allSignals.filter(s => s.status === 'validated').length / allSignals.length) * 100)
    : 0
  const researchStatus = allSignals.length === 0 ? 'No data yet' : avgConfidence >= 80 ? 'Strong signal' : avgConfidence >= 60 ? 'Developing' : 'Early stage'

  // ── Recent activity (cross-project) ─────────────────────────────────────
  const timelineEvents = buildTimelineEvents({
    personas: allPersonas,
    interviews: allInterviews,
    reports: allReports,
    signals: allSignals,
    files: [],
  }).slice(0, 6)

  // ── Active projects with rollups ────────────────────────────────────────
  const activeProjects = allProjects.map(project => {
    const projectSignals = allSignals.filter(s => s.project_id === project.id)
    return { project, signalCount: projectSignals.length }
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

  // ── Involved personas — everyone behind the signals feeding the briefing ─
  const involvedPersonaIds = Array.from(new Set(allSignals.slice(0, 12).flatMap(s => s.related_persona_ids)))
  const involvedPersonas = involvedPersonaIds.map(id => allPersonas.find(p => p.id === id)).filter((p): p is Persona => !!p)
  const visibleInvolvedPersonas = involvedPersonas.slice(0, 5)
  const additionalPersonaCount = Math.max(0, involvedPersonas.length - visibleInvolvedPersonas.length)

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full">
      {/* Hero — AI briefing */}
      <BriefingCard
        initialBriefing={cachedBriefing}
        isStale={isStale}
        avgConfidence={avgConfidence}
        validatedRatio={validatedRatio}
        involvedPersonas={visibleInvolvedPersonas}
        additionalPersonaCount={additionalPersonaCount}
      />

      {/* Metrics ribbon — overlaps the hero */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-10 -mt-6 relative z-20">
        <RibbonStat icon={FolderOpen} label="Active Projects" value={allProjects.length} />
        <RibbonStat icon={Users} label="Total Personas" value={allPersonas.length} />
        <RibbonStat icon={Mic} label="Interviews" value={allInterviews.length} />
        <RibbonStat icon={Radar} label="Market Signals" value={allSignals.length} />
      </section>

      {/* Content grid */}
      <section className="px-4 sm:px-10 py-12 isolate relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl sm:text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>Trending Signals</h3>
              <Link href="/signals" className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider hover:underline" style={{ color: HOME_COLORS.primary }}>
                View all signals <ArrowRight size={13} />
              </Link>
            </div>

            {trendingSignals.length === 0 ? (
              <EmptyCard text="Signals will appear here once you generate reports from interviews inside a project." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trendingSignals.map(({ signal }) => {
                  const TypeIcon = TYPE_ICON[signal.type]
                  return (
                    <Link key={signal.id} href={`/projects/${signal.project_id}?tab=Signals`} className="rounded-2xl overflow-hidden block group transition-transform hover:-translate-y-0.5" style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}33`, boxShadow: CARD_SHADOW }}>
                      <div className="h-40 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${HOME_COLORS.primaryContainer}, ${HOME_COLORS.primary})` }}>
                        <TypeIcon size={40} style={{ color: HOME_COLORS.primaryFixedDim }} strokeWidth={1.25} />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed }}>
                            {signal.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur" style={{ background: 'rgba(255,255,255,0.9)', color: HOME_COLORS.primary }}>
                            {signal.confidence_score}% confidence
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="text-base font-semibold mb-2 transition-colors" style={{ color: HOME_COLORS.onSurface }}>{signal.title}</h4>
                        <p className="text-sm leading-relaxed line-clamp-3 mb-6" style={{ color: HOME_COLORS.onSurfaceVariant }}>{signal.summary}</p>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: HOME_COLORS.secondaryContainer }}>
                            <TypeIcon size={14} style={{ color: HOME_COLORS.onSecondaryContainer }} />
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                            Detected in {signal.related_interview_ids.length} interview{signal.related_interview_ids.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Recent activity */}
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}33`, boxShadow: CARD_SHADOW }}>
              <h3 className="text-sm font-semibold mb-6" style={{ color: HOME_COLORS.onSurface }}>Recent Activity</h3>
              {timelineEvents.length === 0 ? (
                <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Nothing yet — create a persona or run an interview to get started.</p>
              ) : (
                <div className="space-y-6">
                  {timelineEvents.map((e, i) => {
                    const Icon = ACTIVITY_ICONS[e.type]
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: i % 2 === 0 ? HOME_COLORS.primaryFixedDim : HOME_COLORS.secondaryContainer }}>
                          <Icon size={16} style={{ color: i % 2 === 0 ? HOME_COLORS.onPrimaryFixedVariant : HOME_COLORS.onSecondaryContainer }} />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: HOME_COLORS.onSurface }}>{e.title}</p>
                            {e.detail && <p className="text-xs truncate mt-0.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>{e.detail}</p>}
                          </div>
                          <span className="text-xs flex-shrink-0 whitespace-nowrap" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(e.timestamp)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="space-y-6">
              {focusProject ? (
                <StrategicFocus projectId={focusProject.project.id} projectName={focusProject.project.name} signals={focusSignals} />
              ) : (
                <EmptyCard text="Strategic focus will surface here once a project has multiple signals." />
              )}
              {spotlight ? (
                <PersonaSpotlight persona={spotlight.persona} quote={spotlight.quote} interviewId={spotlight.interviewId} />
              ) : (
                <EmptyCard text="A persona spotlight will appear here once a signal captures a notable quote." />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer meta bar */}
      <footer className="relative isolate px-4 sm:px-10 py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}33`, background: HOME_COLORS.surface }}>
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research Output</span>
            <span className="text-base font-semibold" style={{ color: HOME_COLORS.onSurface }}>{allReports.length} report{allReports.length === 1 ? '' : 's'} generated</span>
          </div>
          <div className="w-px h-10" style={{ background: `${HOME_COLORS.outlineVariant}55` }} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>AI Confidence</span>
            <span className="text-base font-semibold" style={{ color: HOME_COLORS.onSurface }}>{avgConfidence}% {researchStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {profile?.briefing_generated_at && (
            <span className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Last synced: {formatRelativeTime(profile.briefing_generated_at)}</span>
          )}
          <div className="p-2 rounded-full" style={{ background: HOME_COLORS.surfaceContainerHigh }}>
            <RefreshCw size={16} style={{ color: HOME_COLORS.onSurface }} />
          </div>
        </div>
      </footer>
    </div>
  )
}

function RibbonStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="p-5 sm:p-6 rounded-xl group transition-transform hover:-translate-y-1" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>{label}</span>
        <Icon size={18} style={{ color: HOME_COLORS.primary }} />
      </div>
      <h2 className="text-2xl sm:text-3xl leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>{value}</h2>
    </div>
  )
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl p-8 text-center h-full flex items-center justify-center" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px dashed ${HOME_COLORS.outlineVariant}` }}>
      <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>{text}</p>
    </div>
  )
}
