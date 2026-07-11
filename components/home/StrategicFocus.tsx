import Link from 'next/link'
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Signal } from '@/types'

const TREND_ICON = { strengthening: TrendingUp, weakening: TrendingDown, stable: Minus, new: Minus }

interface StrategicFocusProps {
  projectId: string
  projectName: string
  signals: { signal: Signal; direction: 'strengthening' | 'weakening' | 'stable' | 'new' }[]
}

export function StrategicFocus({ projectId, projectName, signals }: StrategicFocusProps) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
      <div className="flex items-center gap-2 mb-3">
        <Target size={13} style={{ color: '#1C3D2E' }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#1C3D2E' }}>Strategic Focus</span>
      </div>
      <p className="text-xs leading-relaxed mb-4" style={{ color: '#5F6368' }}>
        Your current focus on <Link href={`/projects/${projectId}`} className="font-semibold" style={{ color: '#1C3D2E' }}>{projectName}</Link> has uncovered {signals.length} signal{signals.length === 1 ? '' : 's'} worth watching.
      </p>
      <ol className="space-y-2.5">
        {signals.map(({ signal, direction }, i) => {
          const Icon = TREND_ICON[direction]
          return (
            <li key={signal.id}>
              <Link href={`/projects/${projectId}?tab=Signals`} className="flex items-center justify-between gap-2 text-xs group">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-neutral-400 flex-shrink-0">{i + 1}.</span>
                  <span className="font-medium text-neutral-800 uppercase tracking-wide truncate group-hover:text-neutral-900">{signal.title}</span>
                </span>
                <Icon size={12} className="flex-shrink-0" style={{ color: direction === 'strengthening' ? '#1C3D2E' : direction === 'weakening' ? '#B45309' : '#9CA3AF' }} />
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
