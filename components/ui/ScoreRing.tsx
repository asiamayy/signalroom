import { HOME_COLORS, HOME_FONT_DISPLAY } from '@/lib/home-theme'

// Color-codes a 0-100 confidence score against the same behavioral anchors
// used to generate it (persona-engine.ts buildPersonaSystemPrompt): 70+ reads
// as genuine interest, 50-69 as lukewarm, below that as real reservations.
function getScoreColor(score: number) {
  if (score >= 70) return { bar: HOME_COLORS.primary, track: HOME_COLORS.secondaryContainer, text: HOME_COLORS.primary }
  if (score >= 50) return { bar: '#D97706', track: '#FEF3C7', text: '#B45309' }
  return { bar: HOME_COLORS.error, track: '#FFDAD6', text: HOME_COLORS.error }
}

// A per-persona circular confidence-score indicator — the score is always
// read from the persona's own generated response (never computed ahead of
// it), this just renders it more prominently than a text badge so it's the
// first thing a reader sees on the card, before the quoted response below it.
export function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  const c = getScoreColor(clamped)
  const strokeWidth = size <= 40 ? 3 : 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }} title={`Confidence score: ${score}`}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={c.track} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={c.bar}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 700, fontSize: size <= 40 ? '12px' : '15px', color: c.text }}>
          {score}
        </span>
      </div>
    </div>
  )
}
