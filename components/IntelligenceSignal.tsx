'use client'

// A slow (19s), continuously-looping "market intelligence coming into focus"
// sequence. Every element's opacity/transform is driven by CSS keyframe percentages of
// one shared 19s @keyframes duration.
// Both mobile and desktop viewports are now explicitly updated to trace a unified "/\" peak.

const MOBILE_DOTS = {
  a1: { cx: 70, cy: 97 },
  a2: { cx: 100, cy: 105 },
  a3: { cx: 130, cy: 97 },
  b1: { cx: 270, cy: 27 },
  b2: { cx: 300, cy: 35 },
  b3: { cx: 330, cy: 27 },
  c1: { cx: 470, cy: 97 },
  c2: { cx: 500, cy: 105 },
  c3: { cx: 530, cy: 97 },
  abWay1: { cx: 162, cy: 68 },
  abWay2: { cx: 250, cy: 70 },
  bcWay1: { cx: 358, cy: 70 },
  bcWay2: { cx: 454, cy: 76 },
}

// Normalized coordinate systems to map the /\_ shape across wide desktop containers
const DESKTOP_DOTS = {
  a1: { cx: 50, cy: 100 },
  a2: { cx: 80, cy: 108 },
  a3: { cx: 110, cy: 100 },
  b1: { cx: 270, cy: 30 },
  b2: { cx: 300, cy: 38 },
  b3: { cx: 330, cy: 30 },
  c1: { cx: 490, cy: 100 },
  c2: { cx: 520, cy: 108 },
  c3: { cx: 550, cy: 100 },
  abWay1: { cx: 150, cy: 70 },
  abWay2: { cx: 220, cy: 50 },
  bcWay1: { cx: 380, cy: 50 },
  bcWay2: { cx: 440, cy: 70 },
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

      {/* connecting lines within a cluster — fade in exactly when its label does */}
      <line x1={dots.a1.cx} y1={dots.a1.cy} x2={dots.a2.cx} y2={dots.a2.cy} className="signal-line signal-line-a" />
      <line x1={dots.a2.cx} y1={dots.a2.cy} x2={dots.a3.cx} y2={dots.a3.cy} className="signal-line signal-line-a" />
      <line x1={dots.b1.cx} y1={dots.b1.cy} x2={dots.b2.cx} y2={dots.b2.cy} className="signal-line signal-line-b" />
      <line x1={dots.b2.cx} y1={dots.b2.cy} x2={dots.b3.cx} y2={dots.b3.cy} className="signal-line signal-line-b" />
      <line x1={dots.c1.cx} y1={dots.c1.cy} x2={dots.c2.cx} y2={dots.c2.cy} className="signal-line signal-line-c" />
      <line x1={dots.c2.cx} y1={dots.c2.cy} x2={dots.c3.cx} y2={dots.c3.cy} className="signal-line signal-line-c" />

      {/* ripples (expanding rings, one per cluster) */}
      <circle cx={dots.a2.cx} cy={dots.a2.cy} r="3" className="signal-ripple signal-ripple-a" style={{ transformOrigin: `${dots.a2.cx}px ${dots.a2.cy}px` }} />
      <circle cx={dots.b2.cx} cy={dots.b2.cy} r="3" className="signal-ripple signal-ripple-b" style={{ transformOrigin: `${dots.b2.cx}px ${dots.b2.cy}px` }} />
      <circle cx={dots.c2.cx} cy={dots.c2.cy} r="3" className="signal-ripple signal-ripple-c" style={{ transformOrigin: `${dots.c2.cx}px ${dots.c2.cy}px` }} />

      {/* waypoint dots — same size/style as the cluster nodes */}
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
    <div className="relative w-full h-32 overflow-visible">
      {/* ── Mobile Viewport ── */}
      <div className="md:hidden absolute inset-0">
        <svg
          viewBox="0 0 600 145"
          preserveAspectRatio="none"
          style={{ overflow: 'visible' }}
          className="absolute top-0 left-0 w-full h-[75%]"
        >
          <ClusterDots dots={MOBILE_DOTS} />
        </svg>

        <div className="absolute bottom-0 left-0 w-full h-[25%] flex items-center justify-between px-1 sm:px-3">
          <span className="signal-label signal-label-a text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024' }}>
            Customer expectation detected
          </span>
          <span className="signal-label signal-label-b text-[10px] uppercase tracking-[0.25em] hidden sm:inline" style={{ color: '#1A3024' }}>
            Hidden objection
          </span>
          <span className="signal-label signal-label-c text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024' }}>
            Emerging opportunity
          </span>
        </div>
      </div>

      {/* ── Desktop Viewport: Standard Horizontal Alignment ── */}
      <div className="hidden md:block absolute inset-0">
        <svg
          viewBox="0 0 600 145"
          style={{ overflow: 'visible' }}
          className="absolute top-0 left-0 w-full h-full"
        >
          <ClusterDots dots={DESKTOP_DOTS} />
        </svg>

        <span
          className="signal-label absolute signal-label-a text-[10px] uppercase tracking-[0.25em]"
          style={{ color: '#1A3024', left: `${(DESKTOP_DOTS.a2.cx / 600) * 100}%`, top: `${(DESKTOP_DOTS.a3.cy / 145) * 100 + 12}%` }}
        >
          Customer expectation detected
        </span>
        <span
          className="signal-label absolute signal-label-b text-[10px] uppercase tracking-[0.25em]"
          style={{ color: '#1A3024', left: `${(DESKTOP_DOTS.b2.cx / 600) * 100}%`, top: `${(DESKTOP_DOTS.b3.cy / 145) * 100 - 18}%` }}
        >
          Hidden objection
        </span>
        <span
          className="signal-label absolute signal-label-c text-[10px] uppercase tracking-[0.25em]"
          style={{ color: '#1A3024', left: `${(DESKTOP_DOTS.c2.cx / 600) * 100}%`, top: `${(DESKTOP_DOTS.c3.cy / 145) * 100 + 12}%` }}
        >
          Emerging opportunity
        </span>
      </div>

      <style jsx global>{`
        .signal-line {
          stroke: #aab0a3;
          stroke-width: 0.75;
          opacity: 0;
          animation-duration: 19s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .signal-dot {
          opacity: 0.12;
          animation-duration: 19s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .signal-ripple {
          fill: none;
          stroke: #aab0a3;
          stroke-width: 1;
          opacity: 0;
          animation-duration: 19s;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
        }
        .signal-label {
          opacity: 0;
          animation-duration: 19s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          white-space: nowrap;
        }

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
          0% { opacity: 0.12; transform: scale(1); }
          2% { opacity: 0.5; transform: scale(1.15); }
          18% { opacity: 0.5; transform: scale(1.15); }
          20% { opacity: 0.85; transform: scale(1.35); }
          24% { opacity: 0.5; transform: scale(1.1); }
          94% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 0.12; transform: scale(1); }
        }
        @keyframes dotASide {
          0% { opacity: 0.12; transform: scale(1); }
          7% { opacity: 0.12; transform: scale(1); }
          8% { opacity: 0.45; transform: scale(1.1); }
          18% { opacity: 0.45; transform: scale(1.1); }
          20% { opacity: 0.8; transform: scale(1.3); }
          24% { opacity: 0.48; transform: scale(1.05); }
          94% { opacity: 0.48; transform: scale(1.05); }
          100% { opacity: 0.12; transform: scale(1); }
        }
        @keyframes dotAOuter {
          0% { opacity: 0.12; transform: scale(1); }
          13% { opacity: 0.12; transform: scale(1); }
          14% { opacity: 0.42; transform: scale(1.08); }
          18% { opacity: 0.42; transform: scale(1.08); }
          20% { opacity: 0.78; transform: scale(1.28); }
          24% { opacity: 0.46; transform: scale(1.04); }
          94% { opacity: 0.46; transform: scale(1.04); }
          100% { opacity: 0.12; transform: scale(1); }
        }

        @keyframes dotBGradual {
          0% { opacity: 0.12; transform: scale(1); }
          14% { opacity: 0.12; transform: scale(1); }
          22% { opacity: 0.25; transform: scale(1.05); }
          37% { opacity: 0.25; transform: scale(1.05); }
          38% { opacity: 0.85; transform: scale(1.35); }
          44% { opacity: 0.5; transform: scale(1.08); }
          94% { opacity: 0.5; transform: scale(1.08); }
          100% { opacity: 0.12; transform: scale(1); }
        }
        @keyframes dotCGradual {
          0% { opacity: 0.12; transform: scale(1); }
          38% { opacity: 0.12; transform: scale(1); }
          46% { opacity: 0.25; transform: scale(1.05); }
          65% { opacity: 0.25; transform: scale(1.05); }
          66% { opacity: 0.85; transform: scale(1.35); }
          72% { opacity: 0.5; transform: scale(1.08); }
          94% { opacity: 0.5; transform: scale(1.08); }
          100% { opacity: 0.12; transform: scale(1); }
        }

        @keyframes wayAB1 {
          0% { opacity: 0.12; transform: scale(1); }
          25% { opacity: 0.12; transform: scale(1); }
          26% { opacity: 0.55; transform: scale(1.15); }
          30% { opacity: 0.4; transform: scale(1.05); }
          94% { opacity: 0.4; transform: scale(1.05); }
          100% { opacity: 0.12; transform: scale(1); }
        }
        @keyframes wayAB2 {
          0% { opacity: 0.12; transform: scale(1); }
          29% { opacity: 0.12; transform: scale(1); }
          30% { opacity: 0.55; transform: scale(1.15); }
          34% { opacity: 0.4; transform: scale(1.05); }
          94% { opacity: 0.4; transform: scale(1.05); }
          100% { opacity: 0.12; transform: scale(1); }
        }
        @keyframes wayBC1 {
          0% { opacity: 0.12; transform: scale(1); }
          53% { opacity: 0.12; transform: scale(1); }
          54% { opacity: 0.55; transform: scale(1.15); }
          58% { opacity: 0.4; transform: scale(1.05); }
          94% { opacity: 0.4; transform: scale(1.05); }
          100% { opacity: 0.12; transform: scale(1); }
        }
        @keyframes wayBC2 {
          0% { opacity: 0.12; transform: scale(1); }
          57% { opacity: 0.12; transform: scale(1); }
          58% { opacity: 0.55; transform: scale(1.15); }
          62% { opacity: 0.4; transform: scale(1.05); }
          94% { opacity: 0.4; transform: scale(1.05); }
          100% { opacity: 0.12; transform: scale(1); }
        }

        @keyframes lineA {
          0% { opacity: 0; }
          28% { opacity: 0; }
          29% { opacity: 0.3; }
          94% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes lineB {
          0% { opacity: 0; }
          42% { opacity: 0; }
          43% { opacity: 0.3; }
          94% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes lineC {
          0% { opacity: 0; }
          70% { opacity: 0; }
          71% { opacity: 0.3; }
          94% { opacity: 0.3; }
          100% { opacity: 0; }
        }

        @keyframes legASeg1 {
          0% { opacity: 0; }
          25% { opacity: 0; }
          26% { opacity: 0.3; }
          94% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes legASeg2 {
          0% { opacity: 0; }
          29% { opacity: 0; }
          30% { opacity: 0.3; }
          94% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes legASeg3 {
          0% { opacity: 0; }
          33% { opacity: 0; }
          34% { opacity: 0.3; }
          94% { opacity: 0.3; }
          100% { opacity: 0; }
        }

        @keyframes legBSeg1 {
          0% { opacity: 0; }
          53% { opacity: 0; }
          54% { opacity: 0.3; }
          94% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes legBSeg2 {
          0% { opacity: 0; }
          57% { opacity: 0; }
          58% { opacity: 0.3; }
          94% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes legBSeg3 {
          0% { opacity: 0; }
          61% { opacity: 0; }
          62% { opacity: 0.3; }
          94% { opacity: 0.3; }
          100% { opacity: 0; }
        }

        @keyframes rippleA {
          0% { opacity: 0; transform: scale(1); }
          19% { opacity: 0; transform: scale(1); }
          20% { opacity: 0.5; transform: scale(1); }
          28% { opacity: 0; transform: scale(7); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes rippleB {
          0% { opacity: 0; transform: scale(1); }
          37% { opacity: 0; transform: scale(1); }
          38% { opacity: 0.5; transform: scale(1); }
          46% { opacity: 0; transform: scale(7); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes rippleC {
          0% { opacity: 0; transform: scale(1); }
          65% { opacity: 0; transform: scale(1); }
          66% { opacity: 0.5; transform: scale(1); }
          74% { opacity: 0; transform: scale(7); }
          100% { opacity: 0; transform: scale(1); }
        }

        @keyframes labelA {
          0% { opacity: 0; }
          25% { opacity: 0; }
          29% { opacity: 1; }
          34% { opacity: 1; }
          37% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes labelB {
          0% { opacity: 0; }
          39% { opacity: 0; }
          43% { opacity: 1; }
          50% { opacity: 1; }
          53% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes labelC {
          0% { opacity: 0; }
          67% { opacity: 0; }
          71% { opacity: 1; }
          78% { opacity: 1; }
          82% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}