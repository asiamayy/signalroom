import Link from 'next/link'
import { Users, MessageSquare, Quote, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react'
import { formatRelativeTime, getSignalTypeColor, getSignalStatusColor, getSignalImpactColor } from '@/lib/utils'
import { getTrendDirection, getMentionTrendPercent } from '@/lib/utils/signals'
import { SIGNAL_TYPE_LABELS, SIGNAL_STATUS_LABELS, SIGNAL_IMPACT_LABELS } from '@/types'
import type { Signal } from '@/types'

const cardStyle = { background: 'white', boxShadow: '0 1px 2px rgba(31,36,32,0.04)', border: '1px solid #E0E2E4' }

const TREND_META = {
  strengthening: { icon: TrendingUp, color: '#1C3D2E', label: 'Strengthening' },
  weakening: { icon: TrendingDown, color: '#B45309', label: 'Weakening' },
  stable: { icon: Minus, color: '#9CA3AF', label: 'Stable' },
  new: { icon: Sparkles, color: '#9CA3AF', label: 'Newly discovered' },
}

export function SignalCard({ signal }: { signal: Signal }) {
  const trend = getTrendDirection(signal)
  const trendPercent = getMentionTrendPercent(signal)
  const TrendIcon = TREND_META[trend].icon

  return (
    <div className="rounded-2xl p-5" style={cardStyle}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-neutral-900 leading-snug">{signal.title}</h3>
        <div className="flex items-center gap-1 flex-shrink-0" title={TREND_META[trend].label}>
          <TrendIcon size={12} style={{ color: TREND_META[trend].color }} />
          <span className="text-xs font-semibold" style={{ color: '#1C3D2E' }}>{signal.confidence_score}%</span>
        </div>
      </div>

      {trendPercent !== null && trendPercent !== 0 && (
        <p className="text-[11px] mb-2" style={{ color: trendPercent > 0 ? '#1C3D2E' : '#B45309' }}>
          Mentions {trendPercent > 0 ? 'up' : 'down'} {Math.abs(trendPercent)}% over the last 30 days
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${getSignalTypeColor(signal.type)}`}>
          {SIGNAL_TYPE_LABELS[signal.type]}
        </span>
        <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${getSignalStatusColor(signal.status)}`}>
          {SIGNAL_STATUS_LABELS[signal.status]}
        </span>
        {signal.impact && (
          <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${getSignalImpactColor(signal.impact)}`}>
            {SIGNAL_IMPACT_LABELS[signal.impact]}
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-600 leading-relaxed mb-3">{signal.summary}</p>

      {signal.supporting_quotes.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {signal.supporting_quotes.slice(0, 2).map((q, i) => {
            const quote = (
              <span className={q.interview_id ? 'hover:text-neutral-700 transition-colors' : undefined}>
                &ldquo;{q.text}&rdquo;
              </span>
            )
            return (
              <div key={i} className="flex items-start gap-1.5 text-xs italic text-neutral-500">
                <Quote size={11} className="flex-shrink-0 mt-0.5 text-neutral-300" />
                {q.interview_id ? <Link href={`/interviews/${q.interview_id}`}>{quote}</Link> : quote}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-neutral-400 mb-3">
        <span className="flex items-center gap-1"><MessageSquare size={11} /> {signal.related_interview_ids.length} interview{signal.related_interview_ids.length === 1 ? '' : 's'}</span>
        <span className="flex items-center gap-1"><Users size={11} /> {signal.related_persona_ids.length} persona{signal.related_persona_ids.length === 1 ? '' : 's'}</span>
      </div>

      {signal.strategic_recommendation && (
        <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background: '#E8F3EF' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#1C3D2E' }}>Strategic recommendation</p>
          <p className="text-xs" style={{ color: '#1C3D2E' }}>{signal.strategic_recommendation}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-2" style={{ borderTop: '1px solid #F0F1F0' }}>
        <span>Discovered {formatRelativeTime(signal.created_at)}</span>
        {signal.updated_at !== signal.created_at && <span>Updated {formatRelativeTime(signal.updated_at)}</span>}
      </div>
    </div>
  )
}
