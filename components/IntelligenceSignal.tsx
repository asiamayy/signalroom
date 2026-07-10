'use client'

// Expanded, high-contrast structural system.
// Cluster A: "V" | Cluster B: Wide "<" | Cluster C: "^"
// In-between segments surface a micro-hub branching to 3 subtle scattered nodes.

const DESKTOP_DOTS = {
  // Cluster A: "V"
  a1: { cx: 40, cy: 75 },
  a2: { cx: 70, cy: 110 },
  a3: { cx: 100, cy: 75 },
  
  // Cluster B: Broadened Left Wedge "<"
  b1: { cx: 340, cy: 15 },
  b2: { cx: 290, cy: 65 },
  b3: { cx: 340, cy: 115 },
  
  // Cluster C: "^"
  c1: { cx: 580, cy: 110 },
  c2: { cx: 610, cy: 75 },
  c3: { cx: 640, cy: 110 },

  // Hidden Micro-Hubs in Transit Paths
  hubAB: { cx: 180, cy: 88 },
  hubBC: { cx: 450, cy: 88 },

  // Subtle Scattered Nodes for Hub AB
  abScat1: { cx: 150, cy: 30 },
  abScat2: { cx: 210, cy: 120 },
  abScat3: { cx: 240, cy: 50 },

  // Subtle Scattered Nodes for Hub BC
  bcScat1: { cx: 400, cy: 120 },
  bcScat2: { cx: 430, cy: 30 },
  bcScat3: { cx: 490, cy: 40 }
}

export default function IntelligenceSignal() {
  const d = DESKTOP_DOTS;

  return (
    <div className="relative w-full h-48 overflow-visible bg-transparent">
      <svg viewBox="0 0 700 180" className="absolute top-0 left-0 w-full h-full overflow-visible">
        
        {/* ── SUBTLE MICRO-NETWORKS (BACKGROUND LAYER) ── */}
        {/* AB Scattered Branches */}
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat1.cx} y2={d.abScat1.cy} className="subtle-branch branch-ab" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat2.cx} y2={d.abScat2.cy} className="subtle-branch branch-ab" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat3.cx} y2={d.abScat3.cy} className="subtle-branch branch-ab" />
        
        {/* BC Scattered Branches */}
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat1.cx} y2={d.bcScat1.cy} className="subtle-branch branch-bc" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat2.cx} y2={d.bcScat2.cy} className="subtle-branch branch-bc" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat3.cx} y2={d.bcScat3.cy} className="subtle-branch branch-bc" />

        {/* Subtle Background Node Rings */}
        <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="4" className="subtle-pulse pulse-ab" />
        <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="4" className="subtle-pulse pulse-ab" />
        <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="4" className="subtle-pulse pulse-ab" />
        <circle cx={d.bcScat1.cx} cy={d.bcScat1.cy} r="4" className="subtle-pulse pulse-bc" />
        <circle cx={d.bcScat2.cx} cy={d.bcScat2.cy} r="4" className="subtle-pulse pulse-bc" />
        <circle cx={d.bcScat3.cx} cy={d.bcScat3.cy} r="4" className="subtle-pulse pulse-bc" />

        {/* Faint Center Cores for Scattered Nodes */}
        <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="1.5" fill="#AAB0A3" className="subtle-core core-ab" />
        <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="1.5" fill="#AAB0A3" className="subtle-core core-ab" />
        <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="1.5" fill="#AAB0A3" className="subtle-core core-ab" />
        <circle cx={d.bcScat1.cx} cy={d.bcScat1.cy} r="1.5" fill="#AAB0A3" className="subtle-core core-bc" />
        <circle cx={d.bcScat2.cx} cy={d.bcScat2.cy} r="1.5" fill="#AAB0A3" className="subtle-core core-bc" />
        <circle cx={d.bcScat3.cx} cy={d.bcScat3.cy} r="1.5" fill="#AAB0A3" className="subtle-core core-bc" />

        {/* ── MAIN CHEVRON TRANSIT BACKBONE ── */}
        <line x1={d.a2.cx} y1={d.a2.cy} x2={d.hubAB.cx} y2={d.hubAB.cy} className="signal-line line-backbone-a" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.b2.cx} y2={d.b2.cy} className="signal-line line-backbone-a" />
        
        <line x1={d.b2.cx} y1={d.b2.cy} x2={d.hubBC.cx} y2={d.hubBC.cy} className="signal-line line-backbone-b" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.c2.cx} y2={d.c2.cy} className="signal-line line-backbone-b" />

        {/* Transiting Micro-Hub Cores */}
        <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="2.5" fill="#AAB0A3" className="signal-dot core-hub-ab" />
        <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="2.5" fill="#AAB0A3" className="signal-dot core-hub-bc" />

        {/* ── CLUSTER GLYPH STRUCTURES ── */}
        {/* Cluster A: V */}
        <line x1={d.a1.cx} y1={d.a1.cy} x2={d.a2.cx} y2={d.a2.cy} className="signal-line signal-line-a" />
        <line x1={d.a2.cx} y1={d.a2.cy} x2={d.a3.cx} y2={d.a3.cy} className="signal-line signal-line-a" />
        {/* Cluster B: Wide < */}
        <line x1={d.b1.cx} y1={d.b1.cy} x2={d.b2.cx} y2={d.b2.cy} className="signal-line signal-line-b" />
        <line x1={d.b2.cx} y1={d.b2.cy} x2={d.b3.cx} y2={d.b3.cy} className="signal-line signal-line-b" />
        {/* Cluster C: ^ */}
        <line x1={d.c1.cx} y1={d.c1.cy} x2={d.c2.cx} y2={d.c2.cy} className="signal-line signal-line-c" />
        <line x1={d.c2.cx} y1={d.c2.cy} x2={d.c3.cx} y2={d.c3.cy} className="signal-line signal-line-c" />

        {/* Radial Waves */}
        <circle cx={d.a2.cx} cy={d.a2.cy} r="3" className="signal-ripple ripple-primary-a" style={{ transformOrigin: `${d.a2.cx}px ${d.a2.cy}px` }} />
        <circle cx={d.b2.cx} cy={d.b2.cy} r="3" className="signal-ripple ripple-primary-b" style={{ transformOrigin: `${d.b2.cx}px ${d.b2.cy}px` }} />
        <circle cx={d.c2.cx} cy={d.c2.cy} r="3" className="signal-ripple ripple-primary-c" style={{ transformOrigin: `${d.c2.cx}px ${d.c2.cy}px` }} />

        {/* Anchor Dot Nodes */}
        <circle cx={d.a2.cx} cy={d.a2.cy} r="3" fill="#AAB0A3" className="signal-dot dot-main" />
        <circle cx={d.a1.cx} cy={d.a1.cy} r="2.5" fill="#AAB0A3" className="signal-dot dot-sub" />
        <circle cx={d.a3.cx} cy={d.a3.cy} r="2.5" fill="#AAB0A3" className="signal-dot dot-sub" />
        
        <circle cx={d.b2.cx} cy={d.b2.cy} r="3" fill="#AAB0A3" className="signal-dot dot-main" />
        <circle cx={d.b1.cx} cy={d.b1.cy} r="2.5" fill="#AAB0A3" className="signal-dot dot-sub" />
        <circle cx={d.b3.cx} cy={d.b3.cy} r="2.5" fill="#AAB0A3" className="signal-dot dot-sub" />
        
        <circle cx={d.c2.cx} cy={d.c2.cy} r="3" fill="#AAB0A3" className="signal-dot dot-main" />
        <circle cx={d.c1.cx} cy={d.c1.cy} r="2.5" fill="#AAB0A3" className="signal-dot dot-sub" />
        <circle cx={d.c3.cx} cy={d.c3.cy} r="2.5" fill="#AAB0A3" className="signal-dot dot-sub" />
      </svg>

      {/* ── SEPARATED TYPOGRAPHY BASELINE (NO OVERLAP) ── */}
      <div className="absolute top-[145px] left-0 w-full hidden md:block pointer-events-none">
        <span className="signal-label absolute text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024', left: `${(d.a2.cx / 700) * 100}%`, transform: 'translateX(-10%)', animationName: 'lblA' }}>
          Customer expectation detected
        </span>
        <span className="signal-label absolute text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024', left: `${(d.b2.cx / 700) * 100}%`, transform: 'translateX(-35%)', animationName: 'lblB' }}>
          Hidden objection
        </span>
        <span className="signal-label absolute text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024', left: `${(d.c2.cx / 700) * 100}%`, transform: 'translateX(-60%)', animationName: 'lblC' }}>
          Emerging opportunity
        </span>
      </div>

      <style jsx global>{`
        .signal-line { stroke: #aab0a3; stroke-width: 0.85; opacity: 0; animation: genericFade 19s ease-in-out infinite; }
        .signal-dot { opacity: 0.15; animation: genericFade 19s ease-in-out infinite; }
        .signal-ripple { fill: none; stroke: #aab0a3; stroke-width: 1; opacity: 0; animation-duration: 19s; animation-timing-function: ease-out; animation-iteration-count: infinite; }
        .signal-label { opacity: 0; animation-duration: 19s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; white-space: nowrap; }

        /* Subtle Background Networks */
        .subtle-branch { stroke: #aab0a3; stroke-width: 0.45; stroke-dasharray: 2 2; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }
        .subtle-pulse { fill: none; stroke: #aab0a3; stroke-width: 0.5; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }
        .subtle-core { opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }

        /* Sequential Timing Logic Maps */
        .line-backbone-a, .core-hub-ab { animation-name: netABTransit; }
        .branch-ab, .pulse-ab, .core-hub-ab, .core-ab { animation-name: netABDetails; }
        
        .line-backbone-b, .core-hub-bc { animation-name: netBCTransit; }
        .branch-bc, .pulse-bc, .core-hub-bc, .core-bc { animation-name: netBCDetails; }

        .signal-line-a { animation-name: mainA; }
        .signal-line-b { animation-name: mainB; }
        .signal-line-c { animation-name: mainC; }
        .ripple-primary-a { animation-name: ripA; }
        .ripple-primary-b { animation-name: ripB; }
        .ripple-primary-c { animation-name: ripC; }

        @keyframes genericFade { 0%, 100% { opacity: 0.15; } 18%, 92% { opacity: 0.4; } }
        @keyframes mainA { 0%, 26%, 100% { opacity: 0; } 27%, 94% { opacity: 0.35; } }
        @keyframes mainB { 0%, 44%, 100% { opacity: 0; } 45%, 94% { opacity: 0.35; } }
        @keyframes mainC { 0%, 72%, 100% { opacity: 0; } 73%, 94% { opacity: 0.35; } }

        /* Transition Phase AB Network */
        @keyframes netABTransit { 0%, 18%, 100% { opacity: 0; } 22%, 36% { opacity: 0.3; } 38% { opacity: 0; } }
        @keyframes netABDetails { 0%, 21%, 100% { opacity: 0; } 24% { opacity: 0.5; } 25%, 34% { opacity: 0.25; } 36% { opacity: 0; } }
        @keyframes ripA { 0%, 18%, 100% { opacity: 0; transform: scale(1); } 20% { opacity: 0.5; } 26% { opacity: 0; transform: scale(5.5); } }
        @keyframes lblA { 0%, 24%, 38%, 100% { opacity: 0; } 27%, 35% { opacity: 1; } }

        /* Transition Phase BC Network */
        @keyframes netBCTransit { 0%, 46%, 100% { opacity: 0; } 50%, 64% { opacity: 0.3; } 66% { opacity: 0; } }
        @keyframes netBCDetails { 0%, 49%, 100% { opacity: 0; } 52% { opacity: 0.5; } 53%, 62% { opacity: 0.25; } 64% { opacity: 0; } }
        @keyframes ripB { 0%, 36%, 100% { opacity: 0; transform: scale(1); } 38% { opacity: 0.5; } 44% { opacity: 0; transform: scale(5.5); } }
        @keyframes lblB { 0%, 41%, 54%, 100% { opacity: 0; } 44%, 51% { opacity: 1; } }

        /* Cluster C Peak Sequence */
        @keyframes ripC { 0%, 64%, 100% { opacity: 0; transform: scale(1); } 66% { opacity: 0.5; } 72% { opacity: 0; transform: scale(5.5); } }
        @keyframes lblC { 0%, 69%, 82%, 100% { opacity: 0; } 72%, 79% { opacity: 1; } }
      `}</style>
    </div>
  )
}