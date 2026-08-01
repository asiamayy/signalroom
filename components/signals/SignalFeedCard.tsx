import { motion } from 'framer-motion'
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
  priority?: boolean
  // Opens the full-text preview modal (mirrors the Personas "Show preview"
  // pattern) instead of navigating away to the project's Signals tab.
  onPreview: (signal: Signal, layoutId: string) => void
}

export function SignalFeedCard({ signal, variant = 'standard', priority = false, onPreview }: SignalFeedCardProps) {
  const Icon = TYPE_ICON[signal.type]
  const badge = TYPE_BADGE[signal.type]
  const layoutId = `signal-feed-${variant}-${signal.id}`
  const sourceCount = signal.related_interview_ids.length + signal.related_run_ids.length
  const evidenceCount = sourceCount + signal.supporting_quotes.length

  if (variant === 'wide') {
    return (
      <motion.article
        layoutId={layoutId}
        onClick={() => onPreview(signal, layoutId)}
        className="rounded-xl overflow-hidden cursor-pointer"
        whileHover={{ y: -4, boxShadow: '0 10px 24px -8px rgba(0,0,0,0.14)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}
      >
        <div className="grid grid-cols-12">
          <div className="relative col-span-12 min-h-[188px] overflow-hidden p-6 sm:col-span-4 sm:min-h-full" style={{ background: priority ? HOME_COLORS.primary : `linear-gradient(135deg, ${HOME_COLORS.primaryContainer}, ${HOME_COLORS.primary})` }}>
            <div className="absolute -right-12 -bottom-10 h-44 w-44 rounded-full border border-white/10" />
            <div className="absolute right-7 top-8 h-24 w-24 rounded-full border border-white/10" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10"><Icon size={24} strokeWidth={1.25} style={{ color: HOME_COLORS.primaryFixedDim }} /></span>{priority && <span className="rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white">Priority</span>}</div>
              <div><p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/55">Evidence strength</p><div className="mb-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full" style={{ width: `${signal.confidence_score}%`, background: HOME_COLORS.primaryFixedDim }} /></div><div className="flex items-end justify-between"><div><p className="text-3xl leading-none text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>{signal.confidence_score}%</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/55">Confidence</p></div><p className="text-right text-xs font-semibold text-white/80">{evidenceCount}<span className="ml-1 text-[9px] font-bold uppercase tracking-wider text-white/55">evidence</span></p></div></div>
            </div>
          </div>
          <div className="col-span-12 sm:col-span-8 p-6 sm:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full" style={{ background: badge.bg, color: badge.text }}>
                {SIGNAL_TYPE_LABELS[signal.type]}
              </span>
              {priority && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: HOME_COLORS.primary }}>Top priority</span>}
              <span className="text-xs uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(signal.created_at)}</span>
            </div>
            <h3 className="text-xl sm:text-2xl mb-3 leading-snug" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>{signal.title}</h3>
            <p className="text-sm leading-relaxed mb-5 line-clamp-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>{signal.summary}</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} style={{ color: HOME_COLORS.primary }} />
                <span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{signal.impact ? SIGNAL_IMPACT_LABELS[signal.impact] : 'Impact not assessed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: HOME_COLORS.primary }} />
                <span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{signal.confidence_score}% confidence</span>
              </div>
              <span className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{evidenceCount} evidence item{evidenceCount === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article
      layoutId={layoutId}
      onClick={() => onPreview(signal, layoutId)}
      className="group rounded-xl p-6 sm:p-8 cursor-pointer"
      whileHover={{ y: -4, boxShadow: '0 10px 24px -8px rgba(0,0,0,0.14)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full" style={{ background: badge.bg, color: badge.text }}>
            {SIGNAL_TYPE_LABELS[signal.type]}
          </span>
          <span className="text-xs uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(signal.created_at)}</span>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl mb-4 leading-snug" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>
        {signal.title}
      </h3>
      <p className="text-sm leading-relaxed mb-8 line-clamp-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>{signal.summary}</p>

      <div className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}4d` }}>
        <div className="rounded-xl p-3" style={{ background: HOME_COLORS.surfaceContainerLow }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>Impact</span>
          {signal.impact ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: IMPACT_DOT[signal.impact] }} />
              <span className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{SIGNAL_IMPACT_LABELS[signal.impact]}</span>
            </div>
          ) : (
            <span className="mt-2 block text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Not assessed</span>
          )}
        </div>
        <div className="rounded-xl p-3" style={{ background: HOME_COLORS.secondaryContainer }}>
          <div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.primary }}>Confidence</span><span className="text-lg leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{signal.confidence_score}%</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: `${HOME_COLORS.primary}1a` }}>
            <div className="h-full rounded-full" style={{ width: `${signal.confidence_score}%`, background: HOME_COLORS.primary }} />
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ background: HOME_COLORS.surfaceContainerLow }}>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>Evidence</span>
          <div className="mt-2 flex items-center gap-1.5">
            {Array.from({ length: 4 }, (_, index) => <span key={index} className="h-5 flex-1 rounded-sm" style={{ background: index < Math.min(4, Math.max(1, evidenceCount)) ? HOME_COLORS.primaryFixedDim : HOME_COLORS.surfaceContainer }} />)}
          </div>
          <span className="mt-2 block text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{evidenceCount} source{evidenceCount === 1 ? '' : 's'}</span>
        </div>
      </div>
    </motion.article>
  )
}
