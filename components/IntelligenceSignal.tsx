'use client'

// A slow (19s), continuously-looping "market intelligence coming into focus" sequence. 
// Both mobile and desktop viewports trace a perfect "/\" triangle peak across the workspace.
// Waypoint dots are slightly scattered off the direct straight trajectory paths.

const MOBILE_DOTS = {
  a1: { cx: 40, cy: 110 },
  a2: { cx: 70, cy: 118 },
  a3: { cx: 100, cy: 110 },
  b1: { cx: 270, cy: 27 },
  b2: { cx: 300, cy: 35 },
  b3: { cx: 330, cy: 27 },
  c1: { cx: 500, cy: 110 },
  c2: { cx: 530, cy: 118 },
  c3: { cx: 560, cy: 110 },
  abWay1: { cx: 140, cy: 85 },
  abWay2: { cx: 210, cy: 55 },
  bcWay1: { cx: 390, cy: 60 },
  bcWay2: { cx: 450, cy: 88 },
}

// Custom coordinate structure establishing a clean macro "/\" peak across the container
const DESKTOP_DOTS = {
  a1: { cx: 30, cy: 115 },
  a2: { cx: 60, cy: 123 },
  a3: { cx: 90, cy: 115 },
  b1: { cx: 270, cy: 25 },
  b2: { cx: 300, cy: 33 },
  b3: { cx: 330, cy: 25 },
  c1: { cx: 510, cy: 115 },
  c2: { cx: 540, cy: 123 },
  c3: { cx: 570, cy: 115 },
  // Scattered waypoint coordinates breaking the clean ruler lines
  abWay1: { cx: 132, cy: 92 },
  abWay2: { cx: 205, cy: 52 },
  bcWay1: { cx: 402, cy: 48 },
  bcWay2: { cx: 468, cy: 86 },
}

function ClusterDots({ dots }: { dots: typeof MOBILE_DOTS }) {
  return (
    <>
      {/* leg A -> B: a 3-segment path through both scattered waypoints */}
      <line x1={dots.a2.cx} y1={dots.a2.cy} x2={dots.abWay1.cx} y2={dots.abWay1.cy} className="signal-line signal-leg-a-seg1" />
      <line x1={dots.abWay1.cx} y1={dots.abWay1.cy} x2={dots.abWay2.cx} y2={dots.abWay2.cy} className="signal-line signal-leg-a-seg2" />
      <line x1={dots.abWay2.cx} y1={dots.abWay2.cy} x2={dots.b2.cx} y2={dots.b2.cy} className="signal-line signal-leg-a-seg3" />

      {/* leg B -> C */}
      <line x1={dots.b2.cx} y1={dots.b2.cy} x2={dots.bcWay1.cx} y2={dots.bcWay1.cy} className="signal-line signal-leg-b-seg1" />
      <line x1={dots.bcWay1.cx} y1={dots.bcWay1.cy} x2={dots.bcWay2.cx} y2={dots.bcWay2.cy} className="signal-line signal-leg-b-seg2" />
      <line x1={dots.bcWay2.cx} y1={dots.bcWay2.cy} x2={dots.c2.cx} y2={dots.c2.cy} className="signal-line signal-leg-b-seg3" />

      {/* connecting lines within a cluster */}
      <line x1={dots.a1.cx} y1={dots.a1.cy} x2={dots.a2.cx} y2={dots.a2.cy} className="signal-line signal-line-a" />
      <line x1={dots.a2.cx} y1={dots.a2.cy} x2={dots.a3.cx} y2={dots.a3.cy} className="signal-line signal-line-a" />
      <line x1={dots.b1.cx} y1={dots.b1.cy} x2={dots.b2.cx} y2={dots.b2.cy} className="signal-line signal-line-b" />
      <line x1={dots.b2.cx} y1={dots.b2.cy} x2={dots.b3.cx} y2={dots.b3.cy} className="signal-line signal-line-b" />
      <line x1={dots.c1.cx} y1={dots.c1.cy} x2={dots.c2.cx} y2={dots.c2.cy} className="signal-line signal-line-c" />
      <line x1={dots.c2.cx} y1={dots.c2.cy} x2={dots.c3.cx} y2={dots.c3.cy} className="signal-line signal-line-c" />

      {/* ripples */}
      <circle cx={dots.a2.cx} cy={dots.a2.cy} r="3" className="signal-ripple signal-ripple-a" style={{ transformOrigin: `${dots.a2.cx}px ${dots.a2.cy}px` }} />
      <circle cx={dots.b2.cx} cy={dots.b2.cy} r="3" className="signal-ripple signal-ripple-b" style={{ transformOrigin: `${dots.b2.cx}px ${dots.b2.cy}px` }} />
      <circle cx={dots.c2.cx} cy={dots.c2.cy} r="3" className="signal-ripple signal-ripple-c" style={{ transformOrigin: `${dots.c2.cx}px ${dots.c2.cy}px` }} />

      {/* scattered waypoint nodes */}
      <circle cx={dots.abWay1.cx} cy={dots.abWay1.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-way-ab1" style={{ transformOrigin: `${dots.abWay1.cx}px ${dots.abWay1.cy}px` }} />
      <circle cx={dots.abWay2.cx} cy={dots.abWay2.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-way-ab2" style={{ transformOrigin: `${dots.abWay2.cx}px ${dots.abWay2.cy}px` }} />
      <circle cx={dots.bcWay1.cx} cy={dots.bcWay1.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-way-bc1" style={{ transformOrigin: `${dots.bcWay1.cx}px ${dots.bcWay1.cy}px` }} />
      <circle cx={dots.bcWay2.cx} cy={dots.bcWay2.cy} r="2.5" fill="#AAB0A3" className="signal-dot signal-way-bc2" style={{ transformOrigin: `${dots.bcWay2.cx}px ${dots.bcWay2.cy}px` }} />

      {/* cluster dots */}
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
    <div className="relative w-full h-36 overflow-visible bg-[#FCFCFB]">
      {/* ── Mobile layout ── */}
      <div className="md:hidden absolute inset-0">
        <svg viewBox="0 0 600 145" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-[75%] overflow-visible">
          <ClusterDots dots={MOBILE_DOTS} />
        </svg>
        <div className="absolute bottom-0 left-0 w-full h-[25%] flex items-center justify-between px-2">
          <span className="signal-label signal-label-a text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024' }}>Customer expectation detected</span>
          <span className="signal-label signal-label-b text-[10px] uppercase tracking-[0.25em] hidden sm:inline" style={{ color: '#1A3024' }}>Hidden objection</span>
          <span className="signal-label signal-label-c text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024' }}>Emerging opportunity</span>
        </div>
      </div>

      {/* ── Desktop Viewport ── */}
      <div className="hidden md:block absolute inset-0">
        <svg viewBox="0 0 600 145" className="absolute top-0 left-0 w-full h-full overflow-visible">
          <ClusterDots dots={DESKTOP_DOTS} />
        </svg>

        <span
          className="signal-label absolute signal-label-a text-[9px] lg:text-[10px] uppercase tracking-[0.25em]"
          style={{ color: '#1A3024', left: `${(DESKTOP_DOTS.a2.cx / 600) * 100}%`, top: `${(DESKTOP_DOTS.a2.cy / 145) * 100 - 16}%` }}
        >
          Customer expectation detected
        </span>
        <span
          className="signal-label absolute signal-label-b text-[9px] lg:text-[10px] uppercase tracking-[0.25em]"
          style={{ color: '#1A3024', left: `${(DESKTOP_DOTS.b2.cx / 600) * 100}%`, top: `${(DESKTOP_DOTS.b2.cy / 145) * 100 - 20}%` }}
        >
          Hidden objection
        </span>
        <span
          className="signal-label absolute signal-label-c text-[9px] lg:text-[10px] uppercase tracking-[0.25em]"
          style={{ color: '#1A3024', left: `${(DESKTOP_DOTS.c2.cx / 600) * 100}%`, top: `${(DESKTOP_DOTS.c2.cy / 145) * 100 - 16}%` }}
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
        .signal-leg-a-seg2 { animation-name: legASeg2; }
        .signal-leg-a-seg3 { animation-name: legASeg3; }
        .signal-leg-b-seg1 { animation-name: legBSeg1; }
        .signal-leg-b-seg2 { animation-name: legBSeg2; }
        .signal-leg-b-seg3 { animation-name: legBSeg3; }
        .signal-way-ab1 { animation-name: wayAB1; }
        .signal-way-ab2 { animation-name: wayAB2; }
        .signal-way-bc1 { animation-name: wayBC1; }
        .signal-way-bc2 { animation-name: wayBC2; }
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

        @keyframes dotAHero {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          2%, 18% { opacity: 0.5; transform: scale(1.15); }
          20% { opacity: 0.85; transform: scale(1.35); }
          24%, 94% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes dotASide {
          0%, 7%, 100% { opacity: 0.12; transform: scale(1); }
          8%, 18% { opacity: 0.45; transform: scale(1.1); }
          20% { opacity: 0.8; transform: scale(1.3); }
          24%, 94% { opacity: 0.48; transform: scale(1.05); }
        }
        @keyframes dotAOuter {
          0%, 13%, 100% { opacity: 0.12; transform: scale(1); }
          14%, 18% { opacity: 0.42; transform: scale(1.08); }
          20% { opacity: 0.78; transform: scale(1.28); }
          24%, 94% { opacity: 0.46; transform: scale(1.04); }
        }
        @keyframes dotBGradual {
          0%, 14%, 100% { opacity: 0.12; transform: scale(1); }
          22%, 37% { opacity: 0.25; transform: scale(1.05); }
          38% { opacity: 0.85; transform: scale(1.35); }
          44%, 94% { opacity: 0.5; transform: scale(1.08); }
        }
        @keyframes dotCGradual {
          0%, 38%, 100% { opacity: 0.12; transform: scale(1); }
          46%, 65% { opacity: 0.25; transform: scale(1.05); }
          66% { opacity: 0.85; transform: scale(1.35); }
          72%, 94% { opacity: 0.5; transform: scale(1.08); }
        }
        @keyframes wayAB1 {
          0%, 25%, 100% { opacity: 0.12; transform: scale(1); }
          26% { opacity: 0.55; transform: scale(1.15); }
          30%, 94% { opacity: 0.4; transform: scale(1.05); }
        }
        @keyframes wayAB2 {
          0%, 29%, 100% { opacity: 0.12; transform: scale(1); }
          30% { opacity: 0.55; transform: scale(1.15); }
          34%, 94% { opacity: 0.4; transform: scale(1.05); }
        }
        @keyframes wayBC1 {
          0%, 53%, 100% { opacity: 0.12; transform: scale(1); }
          54% { opacity: 0.55; transform: scale(1.15); }
          58%, 94% { opacity: 0.4; transform: scale(1.05); }
        }
        @keyframes wayBC2 {
          0%, 57%, 100% { opacity: 0.12; transform: scale(1); }
          58% { opacity: 0.55; transform: scale(1.15); }
          62%, 94% { opacity: 0.4; transform: scale(1.05); }
        }
        @keyframes lineA { 0%, 28%, 100% { opacity: 0; } 29%, 94% { opacity: 0.3; } }
        @keyframes lineB { 0%, 42%, 100% { opacity: 0; } 43%, 94% { opacity: 0.3; } }
        @keyframes lineC { 0%, 70%, 100% { opacity: 0; } 71%, 94% { opacity: 0.3; } }
        @keyframes legASeg1 { 0%, 25%, 100% { opacity: 0; } 26%, 94% { opacity: 0.3; } }
        @keyframes legASeg2 { 0%, 29%, 100% { opacity: 0; } 30%, 94% { opacity: 0.3; } }
        @keyframes legASeg3 { 0%, 33%, 100% { opacity: 0; } 34%, 94% { opacity: 0.3; } }
        @keyframes legBSeg1 { 0%, 53%, 100% { opacity: 0; } 54%, 94% { opacity: 0.3; } }
        @keyframes legBSeg2 { 0%, 57%, 100% { opacity: 0; } 58%, 94% { opacity: 0.3; } }
        @keyframes legBSeg3 { 0%, 61%, 100% { opacity: 0; } 62%, 94% { opacity: 0.3; } }
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