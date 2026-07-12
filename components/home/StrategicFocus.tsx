import Link from 'next/link'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { HOME_COLORS } from '@/lib/home-theme'
import { CARD_SHADOW } from '@/lib/utils'
import type { Signal } from '@/types'

const TREND_ICON = { strengthening: TrendingUp, weakening: TrendingDown, stable: Minus, new: Minus }

interface StrategicFocusProps {
  projectId: string
  projectName: string
  signals: { signal: Signal; direction: 'strengthening' | 'weakening' | 'stable' | 'new' }[]
}

export function StrategicFocus({ projectId, projectName, signals }: StrategicFocusProps) {
  return (
    <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#ECEAE9', boxShadow: CARD_SHADOW }}>
      <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: `${HOME_COLORS.primary}0d` }} />

      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 relative" style={{ color: HOME_COLORS.onSurface }}>
        <BarChart3 size={16} style={{ color: HOME_COLORS.primary }} />
        Strategic Focus
      </h4>

      {/* Real confidence chart for this project's top signals — not decoration */}
      <div className="rounded-lg mb-6 p-4 flex items-end gap-2 h-24" style={{ background: HOME_COLORS.surfaceContainerLowest }}>
        {signals.map(({ signal }) => (
          <div key={signal.id} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${signal.title} — ${signal.confidence_score}%`}>
            <div className="w-full rounded-t" style={{ height: `${Math.max(signal.confidence_score, 6)}%`, background: HOME_COLORS.primaryFixedDim }} />
          </div>
        ))}
      </div>

      <p className="text-sm mb-6" style={{ color: HOME_COLORS.onSurfaceVariant }}>
        Your current focus on <Link href={`/projects/${projectId}`} className="font-semibold" style={{ color: HOME_COLORS.onSurface }}>{projectName}</Link> has uncovered {signals.length} overlapping signal{signals.length === 1 ? '' : 's'}.
      </p>

      <div className="space-y-3">
        {signals.map(({ signal, direction }, i) => {
          const Icon = TREND_ICON[direction]
          return (
            <Link key={signal.id} href={`/projects/${projectId}?tab=Signals`} className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:brightness-95" style={{ background: HOME_COLORS.surfaceContainerLowest }}>
              <span className="font-bold text-sm" style={{ color: HOME_COLORS.primary }}>{i + 1}.</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide truncate" style={{ color: HOME_COLORS.onSurface }}>{signal.title}</span>
              <Icon size={16} className="ml-auto flex-shrink-0" style={{ color: direction === 'strengthening' ? HOME_COLORS.primary : direction === 'weakening' ? '#B45309' : HOME_COLORS.onSurfaceVariant }} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
