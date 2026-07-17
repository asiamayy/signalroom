import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  formatDate,
  getPriorityColor,
  INTERVIEW_TYPE_LABELS,
  CARD_SHADOW,
} from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { DownloadReportButton } from '@/components/ui/DownloadReportButton'
import { CopyLinkButton } from '@/components/ui/CopyLinkButton'
import { ThemesClient } from '@/app/(dashboard)/reports/[id]/ThemesClient'
import type { ReportTheme, ReportRecommendation } from '@/types'

const cardStyle = { background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }

export default async function PublicReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Use service role key — server component only, never reaches browser
  // Bypasses RLS for this single query without exposing data publicly via anon policies
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: report, error } = await supabase
    .from('reports')
    .select(`
      *,
      interview:interviews(
        id, title, type, context, messages, created_at,
        persona:personas(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !report) notFound()

  const interview = report.interview
  const persona = interview?.persona

  const score = report.confidence_score
  const scoreColor = score >= 75 ? HOME_COLORS.primary : score >= 50 ? '#B45309' : HOME_COLORS.error
  const scoreBg = score >= 75 ? HOME_COLORS.secondaryContainer : score >= 50 ? '#FEF3C7' : '#FFDAD6'
  const scoreLabel = score >= 75 ? 'Strong Signal' : score >= 50 ? 'Moderate Signal' : 'Weak Signal'

  const themes: ReportTheme[] = report.key_themes ?? []
  const recommendations: ReportRecommendation[] = report.recommendations ?? []
  const messageCount = interview?.messages?.length ?? 0

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY, minHeight: '100vh' }}>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">

        {/* Public header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="https://getsignalroom.com" className="flex items-center transition-opacity hover:opacity-80">
            <img src="/signalroom-logo.svg" alt="SignalRoom" width="94" height="55" className="h-12 w-auto object-contain" />
          </Link>
          <Link
            href="/signup"
            className="text-xs font-semibold px-4 py-2 rounded-full transition-opacity hover:opacity-90"
            style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}
          >
            Try SignalRoom free →
          </Link>
        </div>

        {/* Report header */}
        <div className="rounded-2xl p-4 sm:p-6 mb-6" style={cardStyle}>
          <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-4">
              <PersonaAvatar avatarUrl={persona?.avatar_url} avatarInitials={persona?.avatar_initials} avatarColor={persona?.avatar_color} name={persona?.name} size="lg" />
              <div className="min-w-0">
                <h1 className="mb-0.5" style={{ ...DISPLAY_LG_STYLE, fontSize: '22px', lineHeight: '28px', color: HOME_COLORS.onSurface }}>
                  {interview?.title ?? 'Untitled interview'}
                </h1>
                <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  {persona?.name} · {INTERVIEW_TYPE_LABELS[interview?.type] ?? 'Interview'} · {formatDate(report.created_at)}
                </p>
                {interview?.context && (
                  <p className="text-xs mt-2 max-w-lg leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                    <span className="font-medium">Tested: </span>
                    {interview.context}
                  </p>
                )}
              </div>
            </div>

            {/* Confidence score badge */}
            <div className="flex-shrink-0 text-center rounded-xl px-4 py-3 self-start sm:self-auto" style={{ background: scoreBg }}>
              <p className="text-3xl font-semibold leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, color: scoreColor }}>{score}</p>
              <p className="text-[11px] font-semibold mt-1 uppercase tracking-wider" style={{ color: scoreColor }}>{scoreLabel}</p>
              <p className="text-[10px] mt-0.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>Signal Strength</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-5 pt-5" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}4d` }}>
            <div>
              <p className="text-lg font-semibold" style={{ color: HOME_COLORS.onSurface }}>{themes.length}</p>
              <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Key themes</p>
            </div>
            <div>
              <p className="text-lg font-semibold" style={{ color: HOME_COLORS.onSurface }}>{recommendations.length}</p>
              <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Recommendations</p>
            </div>
            <div>
              <p className="text-lg font-semibold" style={{ color: HOME_COLORS.onSurface }}>{messageCount}</p>
              <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Messages</p>
            </div>
            <div className="flex items-center gap-3 sm:ml-auto w-full sm:w-auto">
              <DownloadReportButton />
              <CopyLinkButton />
            </div>
          </div>
        </div>

        {/* AI Verdict */}
        {report.ai_verdict && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: HOME_COLORS.primaryFixed }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} style={{ color: HOME_COLORS.onPrimaryFixed }} />
              <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onPrimaryFixed }}>
                AI Verdict
              </h2>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onPrimaryFixed }}>{report.ai_verdict.summary}</p>
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: `1px solid ${HOME_COLORS.onPrimaryFixedVariant}33` }}>
              <p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onPrimaryFixed }}>
                <span className="font-semibold">Validate next: </span>{report.ai_verdict.validate_next}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onPrimaryFixed }}>
                <span className="font-semibold">Ask real users: </span>&ldquo;{report.ai_verdict.follow_up_question}&rdquo;
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Executive summary */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={15} style={{ color: HOME_COLORS.onSurfaceVariant }} />
                <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  Executive summary
                </h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{report.executive_summary}</p>
            </div>

            {/* Key themes */}
            {themes.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  Key themes
                </h2>
                <ThemesClient themes={themes} confidenceScore={score} />
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  Recommendations
                </h2>
                {recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">

            {/* Confidence explainer */}
            <div className="rounded-2xl p-4" style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Info size={13} style={{ color: HOME_COLORS.onSurfaceVariant }} />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>About this score</h3>
              </div>
              <div className="space-y-2.5">
                <ConfidenceBar label="Depth of responses" value={Math.min(100, messageCount * 12)} />
                <ConfidenceBar label="Persona specificity" value={getPersonaSpecificity(persona)} />
                <ConfidenceBar label="Theme consistency" value={score} />
              </div>
              <p className="text-xs mt-3 leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                Higher scores reflect longer sessions with a well-defined persona. Validate key findings with real users.
              </p>
            </div>

            {/* Sentiment breakdown */}
            {themes.length > 0 && (
              <div className="rounded-2xl p-4" style={cardStyle}>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  Sentiment breakdown
                </h3>
                <SentimentBreakdown themes={themes} />
              </div>
            )}

            {/* Persona summary */}
            {persona && (
              <div className="rounded-2xl p-4" style={cardStyle}>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  Interviewed
                </h3>
                <div className="flex items-center gap-2.5 mb-3">
                  <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{persona.name}</p>
                    <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{persona.traits?.job_title}</p>
                  </div>
                </div>
                <dl className="space-y-1.5">
                  {[
                    ['Age', persona.traits?.age],
                    ['Location', persona.traits?.location],
                    ['Industry', persona.traits?.industry],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between">
                      <dt className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{label}</dt>
                      <dd className="text-xs font-medium" style={{ color: HOME_COLORS.onSurface }}>{value}</dd>
                    </div>
                  ))}
                </dl>
                <Link href={`/personas/${persona.id}`} className="block text-xs mt-3 transition-colors" style={{ color: HOME_COLORS.primary }}>
                  View full persona →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Recommendation card ───────────────────────────────────────────────────────

function RecommendationCard({ rec }: { rec: ReportRecommendation }) {
  const priorityClass = getPriorityColor(rec.priority)
  const PriorityIcon = rec.priority === 'high' ? AlertCircle
    : rec.priority === 'medium' ? Info
    : CheckCircle2

  return (
    <div className="rounded-2xl p-5" style={cardStyle}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 p-1 rounded-md ${priorityClass}`}>
          <PriorityIcon size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{rec.title}</h3>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${priorityClass}`}>
              {rec.priority}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{rec.detail}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Confidence bar ────────────────────────────────────────────────────────────

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  const capped = Math.min(100, Math.max(0, value))
  const color = capped >= 75 ? HOME_COLORS.primary : capped >= 50 ? '#D97706' : '#EF4444'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: HOME_COLORS.onSurfaceVariant }}>{label}</span>
        <span className="font-medium" style={{ color: HOME_COLORS.onSurface }}>{capped}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: HOME_COLORS.surfaceContainer }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${capped}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Sentiment breakdown ───────────────────────────────────────────────────────

function SentimentBreakdown({ themes }: { themes: ReportTheme[] }) {
  const counts = themes.reduce((acc, t) => {
    acc[t.sentiment] = (acc[t.sentiment] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = themes.length
  const sentiments: { key: string; label: string; color: string }[] = [
    { key: 'positive', label: 'Positive', color: HOME_COLORS.primary },
    { key: 'mixed', label: 'Mixed', color: '#D97706' },
    { key: 'neutral', label: 'Neutral', color: HOME_COLORS.outline },
    { key: 'negative', label: 'Negative', color: '#EF4444' },
  ]

  return (
    <div className="space-y-2.5">
      {sentiments.filter(s => counts[s.key]).map(s => {
        const count = counts[s.key] ?? 0
        const pct = Math.round((count / total) * 100)
        return (
          <div key={s.key}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: s.color }}>{s.label}</span>
              <span style={{ color: HOME_COLORS.onSurfaceVariant }}>{count} theme{count !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: HOME_COLORS.surfaceContainer }}>
              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: s.color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getPersonaSpecificity(persona: any): number {
  if (!persona?.traits) return 30
  const t = persona.traits
  let score = 0
  if (t.job_title) score += 15
  if (t.location) score += 10
  if (t.goals?.filter(Boolean).length > 0) score += 20
  if (t.frustrations?.filter(Boolean).length > 0) score += 20
  if (t.buying_behavior) score += 20
  if (t.additional_context) score += 15
  return Math.min(100, score)
}
