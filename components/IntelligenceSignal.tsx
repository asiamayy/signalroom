'use client'

// Clean 19s sequence mimicking the pure "/\" sketch path with zero intermediate waypoints.
// Shrunk y-coordinates slightly to shift the absolute physical layout position higher up.

const MOBILE_DOTS = {
  a1: { cx: 40, cy: 90 },
  a2: { cx: 70, cy: 98 },
  a3: { cx: 100, cy: 90 },
  b1: { cx: 270, cy: 20 },
  b2: { cx: 300, cy: 28 },
  b3: { cx: 330, cy: 20 },
  c1: { cx: 500, cy: 90 },
  c2: { cx: 530, cy: 98 },
  c3: { cx: 560, cy: 90 },
}

const DESKTOP_DOTS = {
  a1: { cx: 40, cy: 90 },
  a2: { cx: 70, cy: 98 },
  a3: { cx: 100, cy: 90 },
  b1: { cx: 270, cy: 15 },
  b2: { cx: 300, cy: 23 },
  b3: { cx: 330, cy: 15 },
  c1: { cx: 500, cy: 90 },
  c2: { cx: 530, cy: 98 },
  c3: { cx: 560, cy: 90 },
}

function ClusterDots({ dots }: { dots: typeof MOBILE_DOTS }) {
  return (
    <>
      {/* direct crisp alignment lines connecting directly between node cluster points */}
      <line x1={dots.a2.cx} y1={dots.a2.cy} x2={dots.b2.cx} y2={dots.b2.cy} className="signal-line signal-leg-a-seg1" />
      <line x1={dots.b2.cx} y1={dots.b2.cy} x2={dots.c2.cx} y2={dots.c2.cy} className="signal-line signal-leg-b-seg1" />

      <line x1={dots.a1.cx} y1={dots.a1.cy} x2={dots.a2.cx} y2={dots.a2.cy} className="signal-line signal-line-a" />
      <line x1={dots.a2.cx} y1={dots.a2.cy} x2={dots.a3.cx} y2={dots.a3.cy} className="signal-line signal-line-a" />
      <line x1={dots.b1.cx} y1={dots.b1.cy} x2={dots.b2.cx} y2={dots.b2.cy} className="signal-line signal-line-b" />
      <line x1={dots.b2.cx} y1={dots.b2.cy} x2={dots.b3.cx} y2={dots.b3.cy} className="signal-line signal-line-b" />
      <line x1={dots.c1.cx} y1={dots.c1.cy} x2={dots.c2.cx} y2={dots.c2.cy} className="signal-line signal-line-c" />
      <line x1={dots.c2.cx} y1={dots.c2.cy} x2={dots.c3.cx} y2={dots.c3.cy} className="signal-line signal-line-c" />

      <circle cx={dots.a2.cx} cy={dots.a2.cy} r="3" className="signal-ripple signal-ripple-a" style={{ transformOrigin: `${dots.a2.cx}px ${dots.a2.cy}px` }} />
      <circle cx={dots.b2.cx} cy={dots.b2.cy} r="3" className="signal-ripple signal-ripple-b" style={{ transformOrigin: `${dots.b2.cx}px ${dots.b2.cy}px` }} />
      <circle cx={dots.c2.cx} cy={dots.c2.cy} r="3" className="signal-ripple signal-ripple-c" style={{ transformOrigin: `${dots.c2.cx}px ${dots.c2.cy}px` }} />

      <circle cx={dots.a2.cx} cy={dots.a2.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-dot-a-hero" style={{ transformOrigin: `${dots.a2.cx}px ${dots.a2.cy}px` }} />
      <circle cx={dots.a1.cx} cy={dots.a1.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-dot-a-side" style={{ transformOrigin: `${dots.a1.cx}px ${dots.a1.cy}px` }} />
      <circle cx={dots.a3.cx} cy={dots.a3.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-dot-a-outer" style={{ transformOrigin: `${dots.a3.cx}px ${dots.a3.cy}px` }} />
      <circle cx={dots.b1.cx} cy={dots.b1.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-dot-b-gradual" style={{ transformOrigin: `${dots.b1.cx}px ${dots.b1.cy}px` }} />
      <circle cx={dots.b2.cx} cy={dots.b2.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-dot-b-gradual" style={{ transformOrigin: `${dots.b2.cx}px ${dots.b2.cy}px` }} />
      <circle cx={dots.b3.cx} cy={dots.b3.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-dot-b-gradual" style={{ transformOrigin: `${dots.b3.cx}px ${dots.b3.cy}px` }} />
      <circle cx={dots.c1.cx} cy={dots.c1.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-dot-c-gradual" style={{ transformOrigin: `${dots.c1.cx}px ${dots.c1.cy}px` }} />
      <circle cx={dots.c2.cx} cy={dots.c2.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-dot-c-gradual" style={{ transformOrigin: `${dots.c2.cx}px ${dots.c2.cy}px` }} />
      <circle cx={dots.c3.cx} cy={dots.c3.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-dot-c-gradual" style={{ transformOrigin: `${dots.c3.cx}px ${dots.c3.cy}px` }} />
    </>
  )
}

export default function IntelligenceSignal() {
  return (
    <div className="relative w-full h-28 overflow-visible bg-transparent">
      {/* ── Mobile Layout ── */}
      <div className="md:hidden absolute inset-0">
        <svg viewBox="0 0 600 120" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-[75%] overflow-visible">
          <ClusterDots dots={MOBILE_DOTS} />
        </svg>
        <div className="absolute bottom-0 left-0 w-full h-[25%] flex items-center justify-between px-2">
          <span className="signal-label signal-label-a text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024' }}>Customer expectation detected</span>
          <span className="signal-label signal-label-b text-[10px] uppercase tracking-[0.25em] hidden sm:inline" style={{ color: '#1A3024' }}>Hidden objection</span>
          <span className="signal-label signal-label-c text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024' }}>Emerging opportunity</span>
        </div>
      </div>

      {/* ── Desktop Layout ── */}
      <div className="hidden md:block absolute inset-0">
        <svg viewBox="0 0 600 120" className="absolute top-0 left-0 w-full h-full overflow-visible">
          <ClusterDots dots={DESKTOP_DOTS} />
        </svg>

        <span
          className="signal-label absolute signal-label-a text-[9px] lg:text-[10px] uppercase tracking-[0.25em]"
          style={{ color: '#1A3024', left: `${(DESKTOP_DOTS.a2.cx / 600) * 100}%`, top: `${(DESKTOP_DOTS.a2.cy / 120) * 100 + 10}%` }}
        >
          Customer expectation detected
        </span>
        <span
          className="signal-label absolute signal-label-b text-[9px] lg:text-[10px] uppercase tracking-[0.25em]"
          style={{ color: '#1A3024', left: `${(DESKTOP_DOTS.b2.cx / 600) * 100}%`, top: `${(DESKTOP_DOTS.b2.cy / 120) * 100 - 22}%` }}
        >
          Hidden objection
        </span>
        <span
          className="signal-label absolute signal-label-c text-[9px] lg:text-[10px] uppercase tracking-[0.25em]"
          style={{ color: '#1A3024', left: `${(DESKTOP_DOTS.c2.cx / 600) * 100}%`, top: `${(DESKTOP_DOTS.c2.cy / 120) * 100 + 10}%` }}
        >
          Emerging opportunity
        </span>
      </div>

      <style jsx global>{`
        .signal-line { stroke: #aab0a3; stroke-width: 0.75; opacity: 0; animation-duration: 19s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .signal-dot { opacity: 0.12; animation-duration: 19s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .signal-ripple { fill: none; stroke: #aab0a3; stroke-width: 1; opacity: 0; animation-duration: 19s; animation-timing-function: ease-out; animation-iteration-count: infinite; }
        .signal-label { opacity: 0; animation-duration: 19s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; white-space: nowrap; }

        .signal-line-a { animation-name: lineA; }
        .signal-line-b { animation-name: lineB; }
        .signal-line-c { animation-name: lineC; }
        .signal-leg-a-seg1 { animation-name: legASeg1; }
        .signal-leg-b-seg1 { animation-name: legBSeg1; }
        .signal-dot-a-hero { animation-name: dotAHero; }
        .signal-dot-a-side { animation-name: dotASide; }
        .signal-dot-a-outer { animation-name: dotAOuter; }
        .signal-dot-b-gradual { animation-name: dotBGradual; }
        .signal-dot-c-gradual { animation-name: dotCGradual; }
        .signal-ripple-a { animation-name: rippleA; }
        .signal-ripple-b { animation-name: rippleB; }
        .signal-ripple-c { animation-name: rippleC; }
        .signal-label-a { animation-name: labelA; }
        .signal-label-b { animation-name: labelB; }
        .signal-label-c { animation-name: labelC; }

        @keyframes dotAHero { 0%, 100% { opacity: 0.12; transform: scale(1); } 2%, 18% { opacity: 0.5; transform: scale(1.15); } 20% { opacity: 0.85; transform: scale(1.35); } 24%, 94% { opacity: 0.5; transform: scale(1.1); } }
        @keyframes dotASide { 0%, 7%, 100% { opacity: 0.12; transform: scale(1); } 8%, 18% { opacity: 0.45; transform: scale(1.1); } 20% { opacity: 0.8; transform: scale(1.3); } 24%, 94% { opacity: 0.48; transform: scale(1.05); } }
        @keyframes dotAOuter { 0%, 13%, 100% { opacity: 0.12; transform: scale(1); } 14%, 18% { opacity: 0.42; transform: scale(1.08); } 20% { opacity: 0.78; transform: scale(1.28); } 24%, 94% { opacity: 0.46; transform: scale(1.04); } }
        @keyframes dotBGradual { 0%, 14%, 100% { opacity: 0.12; transform: scale(1); } 22%, 37% { opacity: 0.25; transform: scale(1.05); } 38% { opacity: 0.85; transform: scale(1.35); } 44%, 94% { opacity: 0.5; transform: scale(1.08); } }
        @keyframes dotCGradual { 0%, 38%, 100% { opacity: 0.12; transform: scale(1); } 46%, 65% { opacity: 0.25; transform: scale(1.05); } 66% { opacity: 0.85; transform: scale(1.35); } 72%, 94% { opacity: 0.5; transform: scale(1.08); } }
        @keyframes lineA { 0%, 28%, 100% { opacity: 0; } 29%, 94% { opacity: 0.3; } }
        @keyframes lineB { 0%, 42%, 100% { opacity: 0; } 43%, 94% { opacity: 0.3; } }
        @keyframes lineC { 0%, 70%, 100% { opacity: 0; } 71%, 94% { opacity: 0.3; } }
        @keyframes legASeg1 { 0%, 25%, 100% { opacity: 0; } 26%, 94% { opacity: 0.3; } }
        @keyframes legBSeg1 { 0%, 53%, 100% { opacity: 0; } 54%, 94% { opacity: 0.3; } }
        @keyframes rippleA { 0%, 19%, 100% { opacity: 0; transform: scale(1); } 20% { opacity: 0.5; transform: scale(1); } 28% { opacity: 0; transform: scale(7); } }
        @keyframes rippleB { 0%, 37%, 100% { opacity: 0; transform: scale(1); } 38% { opacity: 0.5; transform: scale(1); } 46% { opacity: 0; transform: scale(7); } }
        @keyframes rippleC { 0%, 65%, 100% { opacity: 0; transform: scale(1); } 66% { opacity: 0.5; transform: scale(1); } 74% { opacity: 0; transform: scale(7); } }
        @keyframes labelA { 0%, 25%, 37%, 100% { opacity: 0; } 29%, 34% { opacity: 1; } }
        @keyframes labelB { 0%, 39%, 53%, 100% { opacity: 0; } 43%, 50% { opacity: 1; } }
        @keyframes labelC { 0%, 67%, 82%, 100% { opacity: 0; } 71%, 78% { opacity: 1; } }
      `}</style>
    </div>
  )
}