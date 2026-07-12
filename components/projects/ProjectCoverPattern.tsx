import { HOME_COLORS } from '@/lib/home-theme'

// A small, fixed set of hand-built abstract line/node patterns — no AI
// generation involved, so there's no per-project variance, no risk of
// stray text or off-brand imagery. Echoes the landing page's node-diagram
// motif rather than literal illustration. Assigned deterministically per
// project (see getProjectCoverPatternIndex) the same way persona avatar
// colors are picked from a name.

function NetworkPattern() {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <g stroke={HOME_COLORS.primaryFixedDim} strokeOpacity="0.35" strokeWidth="1">
        <line x1="40" y1="150" x2="140" y2="60" />
        <line x1="140" y1="60" x2="230" y2="110" />
        <line x1="230" y1="110" x2="340" y2="50" />
        <line x1="230" y1="110" x2="300" y2="170" />
      </g>
      <g fill={HOME_COLORS.primaryFixedDim} fillOpacity="0.5">
        <circle cx="40" cy="150" r="4" />
        <circle cx="140" cy="60" r="4" />
        <circle cx="340" cy="50" r="3.5" />
        <circle cx="300" cy="170" r="3.5" />
      </g>
      <circle cx="230" cy="110" r="7" fill="none" stroke={HOME_COLORS.primaryFixed} strokeOpacity="0.6" strokeWidth="1.5" />
      <circle cx="230" cy="110" r="3" fill={HOME_COLORS.primaryFixed} fillOpacity="0.7" />
    </svg>
  )
}

function RingsPattern() {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <g fill="none" stroke={HOME_COLORS.primaryFixedDim}>
        <circle cx="300" cy="70" r="90" strokeOpacity="0.18" strokeWidth="1" />
        <circle cx="300" cy="70" r="60" strokeOpacity="0.28" strokeWidth="1" />
        <circle cx="300" cy="70" r="30" strokeOpacity="0.4" strokeWidth="1" />
      </g>
      <circle cx="300" cy="70" r="3" fill={HOME_COLORS.primaryFixed} fillOpacity="0.7" />
      <circle cx="70" cy="160" r="2.5" fill={HOME_COLORS.primaryFixedDim} fillOpacity="0.5" />
    </svg>
  )
}

function WavesPattern() {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <g fill="none" strokeWidth="1">
        <path d="M0 130 Q 60 90 120 130 T 240 130 T 360 130" stroke={HOME_COLORS.primaryFixedDim} strokeOpacity="0.4" />
        <path d="M0 160 Q 60 120 120 160 T 240 160 T 360 160" stroke={HOME_COLORS.primaryFixedDim} strokeOpacity="0.22" />
      </g>
      <g fill={HOME_COLORS.primaryFixed} fillOpacity="0.6">
        <circle cx="120" cy="130" r="3" />
        <circle cx="240" cy="130" r="3" />
      </g>
    </svg>
  )
}

function GridPattern() {
  const dots = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      dots.push(<circle key={`${row}-${col}`} cx={30 + col * 45} cy={30 + row * 45} r="2" fill={HOME_COLORS.primaryFixedDim} fillOpacity="0.3" />)
    }
  }
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      {dots}
      <line x1="20" y1="180" x2="380" y2="20" stroke={HOME_COLORS.primaryFixed} strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  )
}

function RadiatingPattern() {
  const lines = []
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 2 / 7) * i
    const x2 = 380 - Math.cos(angle) * 220
    const y2 = 10 + Math.sin(angle) * 220
    lines.push(<line key={i} x1="380" y1="10" x2={x2} y2={y2} stroke={HOME_COLORS.primaryFixedDim} strokeOpacity={0.12 + (i % 3) * 0.08} strokeWidth="1" />)
  }
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      {lines}
      <circle cx="80" cy="160" r="3" fill={HOME_COLORS.primaryFixed} fillOpacity="0.6" />
    </svg>
  )
}

const PATTERNS = [NetworkPattern, RingsPattern, WavesPattern, GridPattern, RadiatingPattern]

// Same deterministic-hash approach as getAvatarColor (lib/utils) — picks a
// consistent pattern per project name, no randomness, no API call.
export function getProjectCoverPatternIndex(name: string): number {
  return name.charCodeAt(0) % PATTERNS.length
}

export function ProjectCoverPattern({ index }: { index: number }) {
  const Pattern = PATTERNS[index % PATTERNS.length]
  return <Pattern />
}
