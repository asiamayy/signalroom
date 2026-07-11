import Link from 'next/link'
import {
  AlertTriangle, ShieldAlert, Target, Lightbulb, Zap, TrendingUp, Sparkles, AlertOctagon,
  BarChart3, ShieldCheck,
} from 'lucide-react'
import { HOME_COLORS, HOME_FONT_DISPLAY } from '@/lib/home-theme'
import { CARD_SHADOW, formatRelativeTime } from '@/lib/utils'
import { SIGNAL_TYPE_LABELS, SIGNAL_IMPACT_LABELS } from '@/types'
import type { Signal, SignalType, SignalImpact } from '@/types'

type IconType = typeof AlertTriangle

const TYPE_ICON: Record<SignalType, IconType> = {
  pain_point: AlertTriangle,
  objection: ShieldAlert,
  desired_outcome: Target,
  feature_request: Lightbulb,
  buying_trigger: Zap,
  trend: TrendingUp,
  opportunity: Sparkles,
  risk: AlertOctagon,
}

// Cosmetic grouping only (badge color) — the type label shown is always the
// signal's real SIGNAL_TYPE_LABELS value, never invented copy.
const TYPE_BADGE: Record<SignalType, { bg: string; text: string }> = {
  pain_point: { bg: HOME_COLORS.primary, text: HOME_COLORS.onPrimary },
  objection: { bg: HOME_COLORS.primary, text: HOME_COLORS.onPrimary },
  risk: { bg: HOME_COLORS.primary, text: HOME_COLORS.onPrimary },
  desired_outcome: { bg: HOME_COLORS.secondary, text: HOME_COLORS.onSecondary },
  feature_request: { bg: HOME_COLORS.secondary, text: HOME_COLORS.onSecondary },
  buying_trigger: { bg: HOME_COLORS.secondary, text: HOME_COLORS.onSecondary },
  trend: { bg: HOME_COLORS.tertiary, text: HOME_COLORS.onTertiary },
  opportunity: { bg: HOME_COLORS.tertiary, text: HOME_COLORS.onTertiary },
}

const IMPACT_DOT: Record<SignalImpact, string> = {
  high: HOME_COLORS.error,
  medium: '#B45309',
  low: HOME_COLORS.outlineVariant,
}

interface SignalFeedCardProps {
  signal: Signal
  variant?: 'standard' | 'wide'
}

export function SignalFeedCard({ signal, variant = 'standard' }: SignalFeedCardProps) {
  const Icon = TYPE_ICON[signal.type]
  const badge = TYPE_BADGE[signal.type]
  const href = `/projects/${signal.project_id}?tab=Signals`

  if (variant === 'wide') {
    return (
      <article className="rounded-xl overflow-hidden transition-all hover:shadow-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
        <div className="grid grid-cols-12">
          <div className="col-span-12 sm:col-span-4 min-h-[160px] sm:min-h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${HOME_COLORS.primaryContainer}, ${HOME_COLORS.primary})` }}>
            <Icon size={48} strokeWidth={1.1} style={{ color: `${HOME_COLORS.primaryFixedDim}99` }} />
          </div>
          <div className="col-span-12 sm:col-span-8 p-6 sm:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full" style={{ background: badge.bg, color: badge.text }}>
                {SIGNAL_TYPE_LABELS[signal.type]}
              </span>
              <span className="text-xs uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(signal.created_at)}</span>
            </div>
            <Link href={href}>
              <h3 className="text-xl sm:text-2xl mb-3 leading-snug" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>{signal.title}</h3>
            </Link>
            <p className="text-sm leading-relaxed mb-5 line-clamp-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>{signal.summary}</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} style={{ color: HOME_COLORS.primary }} />
                <span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{signal.impact ? SIGNAL_IMPACT_LABELS[signal.impact] : 'Impact not assessed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: HOME_COLORS.primary }} />
                <span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{signal.confidence_score}% Conf.</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group rounded-xl p-6 sm:p-8 transition-all hover:shadow-xl hover:-translate-y-1" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full" style={{ background: badge.bg, color: badge.text }}>
            {SIGNAL_TYPE_LABELS[signal.type]}
          </span>
          <span className="text-xs uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(signal.created_at)}</span>
        </div>
      </div>

      <Link href={href}>
        <h3 className="text-xl sm:text-2xl mb-4 leading-snug transition-transform group-hover:translate-x-1 cursor-pointer" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>
          {signal.title}
        </h3>
      </Link>
      <p className="text-sm leading-relaxed mb-8 line-clamp-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>{signal.summary}</p>

      <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}4d` }}>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Impact Level</span>
          {signal.impact ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: IMPACT_DOT[signal.impact] }} />
              <span className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{SIGNAL_IMPACT_LABELS[signal.impact]}</span>
            </div>
          ) : (
            <span className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Not assessed</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Confidence</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold flex-shrink-0" style={{ color: HOME_COLORS.onSurface }}>{signal.confidence_score}%</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: HOME_COLORS.surfaceContainer }}>
              <div className="h-full rounded-full" style={{ width: `${signal.confidence_score}%`, background: HOME_COLORS.primary }} />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Sources</span>
          <span className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{signal.supporting_quotes.length} quote{signal.supporting_quotes.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </article>
  )
}
