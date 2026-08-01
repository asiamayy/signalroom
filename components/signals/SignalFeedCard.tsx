import { motion } from 'framer-motion'
import {
  AlertTriangle, ShieldAlert, Target, Lightbulb, Zap, TrendingUp, Sparkles, AlertOctagon,
  BarChart3, Flag,
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
        style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW, border: '1px solid transparent', borderLeft: priority ? `3px solid ${HOME_COLORS.primaryFixedDim}` : '1px solid transparent' }}
      >
        <div className="grid grid-cols-12">
          <div className="col-span-12 min-h-[168px] p-6 sm:col-span-4 sm:min-h-full" style={{ background: priority ? HOME_COLORS.primary : `linear-gradient(135deg, ${HOME_COLORS.primaryContainer}, ${HOME_COLORS.primary})` }}>
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10"><Icon size={22} strokeWidth={1.25} style={{ color: HOME_COLORS.primaryFixedDim }} /></span></div>
              <div><div className="mb-2 flex items-end justify-between"><div><p className="text-3xl leading-none text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>{signal.confidence_score}%</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-white/55">Confidence</p></div><p className="text-right text-xs text-white/75">{evidenceCount} evidence source{evidenceCount === 1 ? '' : 's'}</p></div><div className="h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full" style={{ width: `${signal.confidence_score}%`, background: HOME_COLORS.primaryFixedDim }} /></div></div>
            </div>
          </div>
          <div className="col-span-12 sm:col-span-8 p-6 sm:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 font-bold text-[10px] uppercase tracking-wider rounded-full" style={{ background: badge.bg, color: badge.text }}>
                {SIGNAL_TYPE_LABELS[signal.type]}
              </span>
              {priority && <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed }}><Flag size={11} fill="currentColor" />Priority</span>}
              <span className="text-xs uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(signal.created_at)}</span>
            </div>
            <h3 className="text-xl sm:text-2xl mb-3 leading-snug" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>{signal.title}</h3>
            <p className="text-sm leading-relaxed mb-5 line-clamp-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>{signal.summary}</p>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} style={{ color: HOME_COLORS.primary }} />
                <span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{signal.impact ? SIGNAL_IMPACT_LABELS[signal.impact] : 'Impact not assessed'}</span>
              </div>
              <span className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Open full evidence</span>
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

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-5" style={{ borderColor: `${HOME_COLORS.outlineVariant}4d` }}>
        <div className="flex items-center gap-2"><span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>Impact</span>{signal.impact ? <><span className="h-2 w-2 rounded-full" style={{ background: IMPACT_DOT[signal.impact] }} /><span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{SIGNAL_IMPACT_LABELS[signal.impact]}</span></> : <span className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Not assessed</span>}</div>
        <div className="flex min-w-[180px] flex-1 items-center gap-3"><span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>Confidence</span><div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: HOME_COLORS.surfaceContainer }}><div className="h-full rounded-full" style={{ width: `${signal.confidence_score}%`, background: HOME_COLORS.primary }} /></div><span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{signal.confidence_score}%</span></div>
        <span className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{evidenceCount} evidence source{evidenceCount === 1 ? '' : 's'}</span>
      </div>
    </motion.article>
  )
}
