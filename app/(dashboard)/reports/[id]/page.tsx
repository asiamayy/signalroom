import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  formatDate,
  getSentimentColor,
  getPriorityColor,
  INTERVIEW_TYPE_LABELS,
} from '@/lib/utils'
import {
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Quote,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import type { ReportTheme, ReportRecommendation } from '@/types'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

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
  const color = persona?.avatar_color
    ? (typeof persona.avatar_color === 'string'
        ? JSON.parse(persona.avatar_color)
        : persona.avatar_color)
    : { bg: '#E1F5EE', text: '#0F6E56' }

  const score = report.confidence_score
  const scoreColor = score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'
  const scoreBg = score >= 75 ? 'bg-emerald-50 border-emerald-100' : score >= 50 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
  const scoreLabel = score >= 75 ? 'High confidence' : score >= 50 ? 'Moderate confidence' : 'Low confidence'

  const themes: ReportTheme[] = report.key_themes ?? []
  const recommendations: ReportRecommendation[] = report.recommendations ?? []
  const messageCount = interview?.messages?.length ?? 0

  return (
    <div className="p-8 max-w-4xl">

      {/* Back */}
      <Link
        href="/reports"
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-6 transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        All reports
      </Link>

      {/* ── Report header ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
              style={{ background: color.bg, color: color.text }}
            >
              {persona?.avatar_initials ?? '?'}
            </div>
            <div>
              <h1 className="text-xl font-serif tracking-tight text-neutral-900 mb-0.5">
                {interview?.title ?? 'Untitled interview'}
              </h1>
              <p className="text-sm text-neutral-500">
                {persona?.name} · {INTERVIEW_TYPE_LABELS[interview?.type] ?? 'Interview'} · {formatDate(report.created_at)}
              </p>
              {interview?.context && (
                <p className="text-xs text-neutral-400 mt-2 max-w-lg leading-relaxed">
                  <span className="font-medium text-neutral-500">Tested: </span>
                  {interview.context}
                </p>
              )}
            </div>
          </div>

          {/* Confidence score badge */}
          <div className={`flex-shrink-0 text-center border rounded-xl px-5 py-3 ${scoreBg}`}>
            <p className={`text-3xl font-serif font-semibold ${scoreColor}`}>{score}</p>
            <p className={`text-[11px] font-medium mt-0.5 ${scoreColor}`}>{scoreLabel}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mt-5 pt-5 border-t border-neutral-100">
          <div>
            <p className="text-lg font-semibold text-neutral-900">{themes.length}</p>
            <p className="text-xs text-neutral-500">Key themes</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">{recommendations.length}</p>
            <p className="text-xs text-neutral-500">Recommendations</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">{messageCount}</p>
            <p className="text-xs text-neutral-500">Messages</p>
          </div>
          <div className="ml-auto">
            <Link
              href={`/interviews/${interview?.id}`}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <MessageSquare size={13} />
              View full transcript
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">

          {/* ── Executive summary ──────────────────────────────────────────── */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-neutral-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Executive summary
              </h2>
            </div>
            <p className="text-sm text-neutral-800 leading-relaxed">{report.executive_summary}</p>
          </div>

          {/* ── Key themes ─────────────────────────────────────────────────── */}
          {themes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Key themes
                </h2>
              </div>
              {themes.map((theme, i) => (
                <ThemeCard key={i} theme={theme} index={i} />
              ))}
            </div>
          )}

          {/* ── Recommendations ────────────────────────────────────────────── */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Recommendations
              </h2>
              {recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} />
              ))}
            </div>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Confidence explainer */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={13} className="text-neutral-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">About this score</h3>
            </div>
            <div className="space-y-2.5">
              <ConfidenceBar label="Depth of responses" value={Math.min(100, messageCount * 12)} />
              <ConfidenceBar label="Persona specificity" value={getPersonaSpecificity(persona)} />
              <ConfidenceBar label="Theme consistency" value={score} />
            </div>
            <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
              Higher scores reflect longer sessions with a well-defined persona. Validate key findings with real users.
            </p>
          </div>

          {/* Sentiment breakdown */}
          {themes.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Sentiment breakdown
              </h3>
              <SentimentBreakdown themes={themes} />
            </div>
          )}

          {/* Persona summary */}
          {persona && (
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Interviewed
              </h3>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{ background: color.bg, color: color.text }}
                >
                  {persona.avatar_initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{persona.name}</p>
                  <p className="text-xs text-neutral-500">{persona.traits?.job_title}</p>
                </div>
              </div>
              <dl className="space-y-1.5">
                {[
                  ['Age', persona.traits?.age],
                  ['Location', persona.traits?.location],
                  ['Industry', persona.traits?.industry],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between">
                    <dt className="text-xs text-neutral-400">{label}</dt>
                    <dd className="text-xs text-neutral-700 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href={`/personas/${persona.id}`}
                className="block text-xs text-neutral-400 hover:text-neutral-700 mt-3 transition-colors"
              >
                View full persona →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Theme card ────────────────────────────────────────────────────────────────

function ThemeCard({ theme, index }: { theme: ReportTheme; index: number }) {
  const sentimentClass = getSentimentColor(theme.sentiment)
  const SentimentIcon = theme.sentiment === 'positive' ? CheckCircle2
    : theme.sentiment === 'negative' ? AlertCircle
    : Info

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <span className="text-xs text-neutral-300 font-mono mt-0.5 flex-shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="text-sm font-semibold text-neutral-900">{theme.title}</h3>
        </div>
        <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${sentimentClass}`}>
          <SentimentIcon size={10} />
          {theme.sentiment}
        </span>
      </div>

      <p className="text-sm text-neutral-600 leading-relaxed mb-4 pl-6">{theme.summary}</p>

      {theme.quotes && theme.quotes.length > 0 && (
        <div className="pl-6 space-y-2">
          {theme.quotes.map((quote, i) => (
            <blockquote
              key={i}
              className="flex gap-2.5 text-sm text-neutral-700 bg-neutral-50 border-l-2 border-neutral-200 pl-3 py-1.5 pr-3 rounded-r-md italic leading-relaxed"
            >
              <Quote size={12} className="text-neutral-300 flex-shrink-0 mt-1" />
              {quote}
            </blockquote>
          ))}
        </div>
      )}
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
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 p-1 rounded-md ${priorityClass.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
          <PriorityIcon size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-neutral-900">{rec.title}</h3>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${priorityClass}`}>
              {rec.priority}
            </span>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">{rec.detail}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Confidence bar ────────────────────────────────────────────────────────────

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  const capped = Math.min(100, Math.max(0, value))
  const color = capped >= 75 ? 'bg-emerald-400' : capped >= 50 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-500">{label}</span>
        <span className="text-neutral-700 font-medium">{capped}%</span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${capped}%` }}
        />
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
  const sentiments: { key: string; label: string; color: string; bg: string }[] = [
    { key: 'positive', label: 'Positive', color: 'bg-emerald-400', bg: 'text-emerald-700' },
    { key: 'mixed', label: 'Mixed', color: 'bg-amber-400', bg: 'text-amber-700' },
    { key: 'neutral', label: 'Neutral', color: 'bg-neutral-300', bg: 'text-neutral-600' },
    { key: 'negative', label: 'Negative', color: 'bg-red-400', bg: 'text-red-700' },
  ]

  return (
    <div className="space-y-2.5">
      {sentiments.filter(s => counts[s.key]).map(s => {
        const count = counts[s.key] ?? 0
        const pct = Math.round((count / total) * 100)
        return (
          <div key={s.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className={s.bg}>{s.label}</span>
              <span className="text-neutral-500">{count} theme{count !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-1.5 rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
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


