'use client'

// 1. Scaled drastically up (1000x380 viewBox).
// 2. Middle nodes have strong, visible drawing sequences and dedicated pulses, lingering after activation.
// 3. Perfect chronological overlap (Main line draws out while sub-lines draw simultaneously).
// 4. Texts precisely anchored. Cluster 2 text is at the absolute top apex.

const d = {
  // Cluster 1: V
  a1: { cx: 80, cy: 190 },
  a2: { cx: 130, cy: 240 },
  a3: { cx: 180, cy: 190 },

  // Cluster 2: < (Apex Point)
  b1: { cx: 550, cy: 40 },
  b2: { cx: 500, cy: 90 },
  b3: { cx: 550, cy: 140 },

  // Cluster 3: ^
  c1: { cx: 820, cy: 240 },
  c2: { cx: 870, cy: 190 },
  c3: { cx: 920, cy: 240 },

  // Middle Transit Nodes (Hubs exactly on the vector path)
  hubAB: { cx: 315, cy: 165 },
  hubBC: { cx: 685, cy: 140 }, 

  // Middle Node Branches (Hub AB)
  abScat1: { cx: 270, cy: 260 },
  abScat2: { cx: 370, cy: 250 },
  abScat3: { cx: 280, cy: 70 },

  // Middle Node Branches (Hub BC)
  bcScat1: { cx: 630, cy: 240 },
  bcScat2: { cx: 730, cy: 250 },
  bcScat3: { cx: 710, cy: 50 }
}

export default function IntelligenceSignal() {
  return (
    <div className="relative w-full h-[280px] sm:h-[350px] lg:h-[450px] overflow-visible bg-transparent mt-4">
      <svg viewBox="0 0 1000 380" className="absolute top-0 left-0 w-full h-full overflow-visible">
        
        {/* ── BACKGROUND LAYER: ROBUST MIDDLE NODES & BRANCHES ── */}
        
        {/* Hub AB Group */}
        <g className="hub-group hub1">
          {/* Branch Lines */}
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat1.cx} y2={d.abScat1.cy} className="hub-line hl1" />
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat2.cx} y2={d.abScat2.cy} className="hub-line hl1" />
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat3.cx} y2={d.abScat3.cy} className="hub-line hl1" />
          
          {/* Dedicated Hub Pulses and Dots */}
          <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="8" className="hub-pulse" />
          <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="4" className="hub-core" />
          
          {/* Branch Terminal Dots */}
          <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="3" className="hub-core" />
          <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="3" className="hub-core" />
          <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="3" className="hub-core" />
        </g>

        {/* Hub BC Group */}
        <g className="hub-group hub2">
          {/* Branch Lines */}
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat1.cx} y2={d.bcScat1.cy} className="hub-line hl2" />
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat2.cx} y2={d.bcScat2.cy} className="hub-line hl2" />
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat3.cx} y2={d.bcScat3.cy} className="hub-line hl2" />
          
          {/* Dedicated Hub Pulses and Dots */}
          <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="8" className="hub-pulse" />
          <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="4" className="hub-core" />
          
          {/* Branch Terminal Dots */}
          <circle cx={d.bcScat1.cx} cy={d.bcScat1.cy} r="3" className="hub-core" />
          <circle cx={d.bcScat2.cx} cy={d.bcScat2.cy} r="3" className="hub-core" />
          <circle cx={d.bcScat3.cx} cy={d.bcScat3.cy} r="3" className="hub-core" />
        </g>


        {/* ── MAIN LAYER: CONNECTING TRANSITION LINES (THE / \ SHAPE) ── */}
        
        {/* Line 1: Cluster 1 to Middle Node AB */}
        <line x1={d.a2.cx} y1={d.a2.cy} x2={d.hubAB.cx} y2={d.hubAB.cy} className="main-line bb1" />

        {/* Line 2: Middle Node AB to Cluster 2 (Draws simultaneously with Hub AB branches) */}
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.b2.cx} y2={d.b2.cy} className="main-line bb2" />

        {/* Line 3: Cluster 2 to Middle Node BC */}
        <line x1={d.b2.cx} y1={d.b2.cy} x2={d.hubBC.cx} y2={d.hubBC.cy} className="main-line bb3" />

        {/* Line 4: Middle Node BC to Cluster 3 (Draws simultaneously with Hub BC branches) */}
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.c2.cx} y2={d.c2.cy} className="main-line bb4" />


        {/* ── FOREGROUND LAYER: MAIN CLUSTERS AND LOCKED TEXT ── */}
        
        {/* Cluster 1 Group */}
        <g className="cluster-group c1-group">
          <line x1={d.a1.cx} y1={d.a1.cy} x2={d.a2.cx} y2={d.a2.cy} className="cluster-wire" />
          <line x1={d.a2.cx} y1={d.a2.cy} x2={d.a3.cx} y2={d.a3.cy} className="cluster-wire" />
          <circle cx={d.a2.cx} cy={d.a2.cy} r="6" className="cluster-pulse" style={{ transformOrigin: `${d.a2.cx}px ${d.a2.cy}px` }} />
          <circle cx={d.a2.cx} cy={d.a2.cy} r="5" className="cluster-dot-main" />
          <circle cx={d.a1.cx} cy={d.a1.cy} r="3.5" className="cluster-dot-sub" />
          <circle cx={d.a3.cx} cy={d.a3.cy} r="3.5" className="cluster-dot-sub" />
          {/* Text anchored directly below the cluster */}
          <text x={d.a2.cx} y={d.a2.cy + 45} textAnchor="middle" className="cluster-label">CUSTOMER EXPECTATION DETECTED</text>
        </g>

        {/* Cluster 2 Group */}
        <g className="cluster-group c2-group">
          <line x1={d.b1.cx} y1={d.b1.cy} x2={d.b2.cx} y2={d.b2.cy} className="cluster-wire" />
          <line x1={d.b2.cx} y1={d.b2.cy} x2={d.b3.cx} y2={d.b3.cy} className="cluster-wire" />
          <circle cx={d.b2.cx} cy={d.b2.cy} r="6" className="cluster-pulse" style={{ transformOrigin: `${d.b2.cx}px ${d.b2.cy}px` }} />
          <circle cx={d.b2.cx} cy={d.b2.cy} r="5" className="cluster-dot-main" />
          <circle cx={d.b1.cx} cy={d.b1.cy} r="3.5" className="cluster-dot-sub" />
          <circle cx={d.b3.cx} cy={d.b3.cy} r="3.5" className="cluster-dot-sub" />
          {/* Text anchored directly ABOVE the absolute top apex */}
          <text x={d.b2.cx} y={d.b1.cy - 12} textAnchor="middle" className="cluster-label">HIDDEN OBJECTION</text>
        </g>

        {/* Cluster 3 Group */}
        <g className="cluster-group c3-group">
          <line x1={d.c1.cx} y1={d.c1.cy} x2={d.c2.cx} y2={d.c2.cy} className="cluster-wire" />
          <line x1={d.c2.cx} y1={d.c2.cy} x2={d.c3.cx} y2={d.c3.cy} className="cluster-wire" />
          <circle cx={d.c2.cx} cy={d.c2.cy} r="6" className="cluster-pulse" style={{ transformOrigin: `${d.c2.cx}px ${d.c2.cy}px` }} />
          <circle cx={d.c2.cx} cy={d.c2.cy} r="5" className="cluster-dot-main" />
          <circle cx={d.c1.cx} cy={d.c1.cy} r="3.5" className="cluster-dot-sub" />
          <circle cx={d.c3.cx} cy={d.c3.cy} r="3.5" className="cluster-dot-sub" />
          {/* Text anchored directly below the cluster */}
          <text x={d.c2.cx} y={d.c1.cy + 45} textAnchor="middle" className="cluster-label">EMERGING OPPORTUNITY</text>
        </g>
      </svg>

      <style jsx global>{`
        /* Scaled-up, Premium SVG Architecture Styles */
        .cluster-wire { stroke: #1A3024; stroke-width: 2; opacity: 0.7; }
        .cluster-dot-main { fill: #1A3024; }
        .cluster-dot-sub { fill: #1A3024; opacity: 0.7; }
        
        .cluster-label { 
          fill: #1A3024; 
          font-size: 12px; 
          font-weight: 500;
          letter-spacing: 0.25em; 
          font-family: inherit;
        }

        /* Continuous High-Visibility Pulses */
        .cluster-pulse { 
          fill: none; 
          stroke: #1A3024; 
          stroke-width: 2; 
          animation: cPulse 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite; 
        }
        @keyframes cPulse { 0% { opacity: 0.7; transform: scale(1); } 100% { opacity: 0; transform: scale(3.5); } }

        .hub-pulse {
          fill: none;
          stroke: #aab0a3;
          stroke-width: 1.5;
          animation: hPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        @keyframes hPulse { 0% { opacity: 0.8; transform: scale(0.5); } 100% { opacity: 0; transform: scale(2.5); } }

        /* ── SEAMLESS 19s TIMELINE CHOREOGRAPHY ── */

        /* CLUSTER 1: Anchors the start of the animation */
        .c1-group { animation: c1-anim 19s infinite; }
        @keyframes c1-anim {
          0% { opacity: 0; }
          5%, 95% { opacity: 1; }
          95%, 100% { opacity: 0; }
        }

        /* LINE 1: C1 to Hub 1 */
        .main-line { stroke: #aab0a3; stroke-width: 1.75; fill: none; stroke-dasharray: 400; }
        .bb1 { animation: bb1-anim 19s infinite linear; }
        @keyframes bb1-anim {
          0%, 5% { stroke-dashoffset: 400; opacity: 1; }
          20%, 95% { stroke-dashoffset: 0; opacity: 1; }
          95%, 100% { opacity: 0; stroke-dashoffset: 0; }
        }
        
        /* HUB 1 & BRANCHES: Appear strongly, animate fully, fade gently to rest in background */
        .hub-core { fill: #aab0a3; }
        .hub-line { stroke: #aab0a3; stroke-width: 1.25; stroke-dasharray: 150; }
        
        .hub1 { animation: hub1-anim 19s infinite; }
        @keyframes hub1-anim {
          0%, 15% { opacity: 0; }
          30%, 40% { opacity: 0.85; }      /* Full strong visibility while drawing */
          55%, 95% { opacity: 0.25; }      /* Settles gently into the background architecture */
          95%, 100% { opacity: 0; }
        }

        .hl1 { animation: hl1-anim 19s infinite linear; }
        @keyframes hl1-anim { 0%, 15% { stroke-dashoffset: 150; } 35%, 100% { stroke-dashoffset: 0; } }

        /* LINE 2: Hub 1 to C2 (Draws SIMULTANEOUSLY with Hub 1 branches) */
        .bb2 { animation: bb2-anim 19s infinite linear; }
        @keyframes bb2-anim {
          0%, 20% { stroke-dashoffset: 400; opacity: 1; }
          40%, 95% { stroke-dashoffset: 0; opacity: 1; }
          95%, 100% { opacity: 0; stroke-dashoffset: 0; }
        }

        /* CLUSTER 2: Appears completely only when connection is fully established */
        .c2-group { animation: c2-anim 19s infinite; }
        @keyframes c2-anim {
          0%, 35% { opacity: 0; }
          50%, 95% { opacity: 1; }
          95%, 100% { opacity: 0; }
        }

        /* LINE 3: C2 to Hub 2 */
        .bb3 { animation: bb3-anim 19s infinite linear; }
        @keyframes bb3-anim {
          0%, 45% { stroke-dashoffset: 400; opacity: 1; }
          60%, 95% { stroke-dashoffset: 0; opacity: 1; }
          95%, 100% { opacity: 0; stroke-dashoffset: 0; }
        }

        /* HUB 2 & BRANCHES: Follows identical robust animation logic */
        .hub2 { animation: hub2-anim 19s infinite; }
        @keyframes hub2-anim {
          0%, 55% { opacity: 0; }
          70%, 80% { opacity: 0.85; }      /* Full strong visibility while drawing */
          90%, 95% { opacity: 0.25; }      /* Settles into background */
          95%, 100% { opacity: 0; }
        }

        .hl2 { animation: hl2-anim 19s infinite linear; }
        @keyframes hl2-anim { 0%, 55% { stroke-dashoffset: 150; } 75%, 100% { stroke-dashoffset: 0; } }

        /* LINE 4: Hub 2 to C3 (Draws SIMULTANEOUSLY with Hub 2 branches) */
        .bb4 { animation: bb4-anim 19s infinite linear; }
        @keyframes bb4-anim {
          0%, 60% { stroke-dashoffset: 400; opacity: 1; }
          80%, 95% { stroke-dashoffset: 0; opacity: 1; }
          95%, 100% { opacity: 0; stroke-dashoffset: 0; }
        }

        /* CLUSTER 3: Appears as the final connection lands */
        .c3-group { animation: c3-anim 19s infinite; }
        @keyframes c3-anim {
          0%, 75% { opacity: 0; }
          90%, 95% { opacity: 1; }
          95%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}