'use client'

// Full-scale, high-visibility structural configuration.
// Perfect uniform cluster shapes: Cluster 1 (V) | Cluster 2 (<) | Cluster 3 (^)
// Gradual, highly visible intermediate branching micro-networks between nodes.

const DESKTOP_DOTS = {
  // Cluster A: Uniform "V"
  a1: { cx: 50, cy: 130 },
  a2: { cx: 80, cy: 160 },
  a3: { cx: 110, cy: 130 },
  
  // Cluster B: Uniform Left Wedge "<" (Tightened to match sizes)
  b1: { cx: 415, cy: 20 },
  b2: { cx: 385, cy: 50 },
  b3: { cx: 415, cy: 80 },
  
  // Cluster C: Uniform "^"
  c1: { cx: 690, cy: 160 },
  c2: { cx: 720, cy: 130 },
  c3: { cx: 750, cy: 160 },

  // Transit Hub Anchors directly tracking the main trajectory
  hubAB: { cx: 232, cy: 105 },
  hubBC: { cx: 552, cy: 90 },

  // High-Visibility Scattered Nodes for Hub AB
  abScat1: { cx: 190, cy: 50 },
  abScat2: { cx: 250, cy: 160 },
  abScat3: { cx: 290, cy: 80 },

  // High-Visibility Scattered Nodes for Hub BC
  bcScat1: { cx: 490, cy: 140 },
  bcScat2: { cx: 530, cy: 40 },
  bcScat3: { cx: 610, cy: 60 }
}

export default function IntelligenceSignal() {
  const d = DESKTOP_DOTS;

  return (
    <div className="relative w-full h-64 overflow-visible bg-transparent">
      <svg viewBox="0 0 800 240" className="absolute top-0 left-0 w-full h-full overflow-visible">
        
        {/* ── HIGH-VISIBILITY INTERMEDIATE MICRO-NETWORKS ── */}
        {/* AB Scattered System */}
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat1.cx} y2={d.abScat1.cy} className="visible-branch branch-ab" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat2.cx} y2={d.abScat2.cy} className="visible-branch branch-ab" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat3.cx} y2={d.abScat3.cy} className="visible-branch branch-ab" />
        
        {/* BC Scattered System */}
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat1.cx} y2={d.bcScat1.cy} className="visible-branch branch-bc" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat2.cx} y2={d.bcScat2.cy} className="visible-branch branch-bc" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat3.cx} y2={d.bcScat3.cy} className="visible-branch branch-bc" />

        {/* Pulsing Outer Rings for Scattered Nodes */}
        <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="5" className="visible-pulse pulse-ab" />
        <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="5" className="visible-pulse pulse-ab" />
        <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="5" className="visible-pulse pulse-ab" />
        <circle cx={d.bcScat1.cx} cy={d.bcScat1.cy} r="5" className="visible-pulse pulse-bc" />
        <circle cx={d.bcScat2.cx} cy={d.bcScat2.cy} r="5" className="visible-pulse pulse-bc" />
        <circle cx={d.bcScat3.cx} cy={d.bcScat3.cy} r="5" className="visible-pulse pulse-bc" />

        {/* Solid Cores for Scattered Nodes */}
        <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="2.5" fill="#AAB0A3" className="visible-core core-ab" />
        <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="2.5" fill="#AAB0A3" className="visible-core core-ab" />
        <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="2.5" fill="#AAB0A3" className="visible-core core-ab" />
        <circle cx={d.bcScat1.cx} cy={d.bcScat1.cy} r="2.5" fill="#AAB0A3" className="visible-core core-bc" />
        <circle cx={d.bcScat2.cx} cy={d.bcScat2.cy} r="2.5" fill="#AAB0A3" className="visible-core core-bc" />
        <circle cx={d.bcScat3.cx} cy={d.bcScat3.cy} r="2.5" fill="#AAB0A3" className="visible-core core-bc" />

        {/* ── PRIMARY MASTER CHEVRON BACKBONE ── */}
        <line x1={d.a2.cx} y1={d.a2.cy} x2={d.hubAB.cx} y2={d.hubAB.cy} className="signal-line line-backbone-a" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.b2.cx} y2={d.b2.cy} className="signal-line line-backbone-a" />
        
        <line x1={d.b2.cx} y1={d.b2.cy} x2={d.hubBC.cx} y2={d.hubBC.cy} className="signal-line line-backbone-b" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.c2.cx} y2={d.c2.cy} className="signal-line line-backbone-b" />

        {/* Micro-Hub Center Pins */}
        <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="3" fill="#AAB0A3" className="signal-dot core-hub-ab" />
        <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="3" fill="#AAB0A3" className="signal-dot core-hub-bc" />

        {/* ── UNIFORM CLUSTER GLYPH CONNECTIONS ── */}
        {/* Cluster 1: V */}
        <line x1={d.a1.cx} y1={d.a1.cy} x2={d.a2.cx} y2={d.a2.cy} className="signal-line signal-line-a" />
        <line x1={d.a2.cx} y1={d.a2.cy} x2={d.a3.cx} y2={d.a3.cy} className="signal-line signal-line-a" />
        {/* Cluster 2: < (Uniformly Proportioned) */}
        <line x1={d.b1.cx} y1={d.b1.cy} x2={d.b2.cx} y2={d.b2.cy} className="signal-line signal-line-b" />
        <line x1={d.b2.cx} y1={d.b2.cy} x2={d.b3.cx} y2={d.b3.cy} className="signal-line signal-line-b" />
        {/* Cluster 3: ^ */}
        <line x1={d.c1.cx} y1={d.c1.cy} x2={d.c2.cx} y2={d.c2.cy} className="signal-line signal-line-c" />
        <line x1={d.c2.cx} y1={d.c2.cy} x2={d.c3.cx} y2={d.c3.cy} className="signal-line signal-line-c" />

        {/* Main Ripple Pulses */}
        <circle cx={d.a2.cx} cy={d.a2.cy} r="4" className="signal-ripple ripple-primary-a" style={{ transformOrigin: `${d.a2.cx}px ${d.a2.cy}px` }} />
        <circle cx={d.b2.cx} cy={d.b2.cy} r="4" className="signal-ripple ripple-primary-b" style={{ transformOrigin: `${d.b2.cx}px ${d.b2.cy}px` }} />
        <circle cx={d.c2.cx} cy={d.c2.cy} r="4" className="signal-ripple ripple-primary-c" style={{ transformOrigin: `${d.c2.cx}px ${d.c2.cy}px` }} />

        {/* Node Physical Dot Vertices */}
        <circle cx={d.a2.cx} cy={d.a2.cy} r="3.5" fill="#AAB0A3" className="signal-dot dot-main" />
        <circle cx={d.a1.cx} cy={d.a1.cy} r="3" fill="#AAB0A3" className="signal-dot dot-sub" />
        <circle cx={d.a3.cx} cy={d.a3.cy} r="3" fill="#AAB0A3" className="signal-dot dot-sub" />
        
        <circle cx={d.b2.cx} cy={d.b2.cy} r="3.5" fill="#AAB0A3" className="signal-dot dot-main" />
        <circle cx={d.b1.cx} cy={d.b1.cy} r="3" fill="#AAB0A3" className="signal-dot dot-sub" />
        <circle cx={d.b3.cx} cy={d.b3.cy} r="3" fill="#AAB0A3" className="signal-dot dot-sub" />
        
        <circle cx={d.c2.cx} cy={d.c2.cy} r="3.5" fill="#AAB0A3" className="signal-dot dot-main" />
        <circle cx={d.c1.cx} cy={d.c1.cy} r="3" fill="#AAB0A3" className="signal-dot dot-sub" />
        <circle cx={d.c3.cx} cy={d.c3.cy} r="3" fill="#AAB0A3" className="signal-dot dot-sub" />
      </svg>

      {/* ── CLEARLY OFFSET LABELS (PERFECTLY MEASURED BASELINE BELOW SVG) ── */}
      <div className="absolute top-[205px] left-0 w-full hidden md:block pointer-events-none">
        <span className="signal-label absolute text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024', left: `${(d.a2.cx / 800) * 100}%`, transform: 'translateX(-20%)', animationName: 'lblA' }}>
          Customer expectation detected
        </span>
        <span className="signal-label absolute text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024', left: `${(d.b2.cx / 800) * 100}%`, transform: 'translateX(-40%)', animationName: 'lblB' }}>
          Hidden objection
        </span>
        <span className="signal-label absolute text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024', left: `${(d.c2.cx / 800) * 100}%`, transform: 'translateX(-55%)', animationName: 'lblC' }}>
          Emerging opportunity
        </span>
      </div>

      <style jsx global>{`
        .signal-line { stroke: #aab0a3; stroke-width: 1.2; opacity: 0; animation: genericFade 19s ease-in-out infinite; }
        .signal-dot { opacity: 0.2; animation: genericFade 19s ease-in-out infinite; }
        .signal-ripple { fill: none; stroke: #aab0a3; stroke-width: 1.5; opacity: 0; animation-duration: 19s; animation-timing-function: ease-out; animation-iteration-count: infinite; }
        .signal-label { opacity: 0; animation-duration: 19s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; white-space: nowrap; }

        /* Gradual, Highly-Visible Micro Networks */
        .visible-branch { stroke: #aab0a3; stroke-width: 0.8; stroke-dasharray: 3 3; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; transition: opacity 0.5s ease-in-out; }
        .visible-pulse { fill: none; stroke: #aab0a3; stroke-width: 1; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }
        .visible-core { opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }

        /* Solid Visibility Timeline Maps */
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

        @keyframes genericFade { 0%, 100% { opacity: 0.2; } 18%, 92% { opacity: 0.6; } }
        @keyframes mainA { 0%, 26%, 100% { opacity: 0; } 27%, 94% { opacity: 0.75; } }
        @keyframes mainB { 0%, 44%, 100% { opacity: 0; } 45%, 94% { opacity: 0.75; } }
        @keyframes mainC { 0%, 72%, 100% { opacity: 0; } 73%, 94% { opacity: 0.75; } }

        /* Gradual Entrance, Sustained Visible Anchor Paths (AB Segment) */
        @keyframes netABTransit { 0%, 12%, 100% { opacity: 0; } 18%, 38% { opacity: 0.8; } 40% { opacity: 0; } }
        @keyframes netABDetails { 0%, 15%, 100% { opacity: 0; } 20%, 36% { opacity: 0.75; } 38% { opacity: 0; } }
        @keyframes ripA { 0%, 18%, 100% { opacity: 0; transform: scale(1); } 20% { opacity: 0.6; } 26% { opacity: 0; transform: scale(6); } }
        @keyframes lblA { 0%, 24%, 38%, 100% { opacity: 0; } 27%, 35% { opacity: 1; } }

        /* Gradual Entrance, Sustained Visible Anchor Paths (BC Segment) */
        @keyframes netBCTransit { 0%, 40%, 100% { opacity: 0; } 46%, 66% { opacity: 0.8; } 68% { opacity: 0; } }
        @keyframes netBCDetails { 0%, 43%, 100% { opacity: 0; } 48%, 64% { opacity: 0.75; } 66% { opacity: 0; } }
        @keyframes ripB { 0%, 36%, 100% { opacity: 0; transform: scale(1); } 38% { opacity: 0.6; } 44% { opacity: 0; transform: scale(6); } }
        @keyframes lblB { 0%, 41%, 54%, 100% { opacity: 0; } 44%, 51% { opacity: 1; } }

        /* Cluster C Sequence */
        @keyframes ripC { 0%, 64%, 100% { opacity: 0; transform: scale(1); } 66% { opacity: 0.6; } 72% { opacity: 0; transform: scale(6); } }
        @keyframes lblC { 0%, 69%, 82%, 100% { opacity: 0; } 72%, 79% { opacity: 1; } }
      `}</style>
    </div>
  )
}