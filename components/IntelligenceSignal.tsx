'use client'

// 1. Clusters hidden at start, appearing only upon connection.
// 2. Linear transitions (C1 -> Middle Node -> C2).
// 3. Middle node branches one-by-one simultaneously in the background.
// 4. Texts anchored exactly relative to their clusters (Hidden objection at TOP).
// 5. Old clusters fade as new ones connect.

const d = {
  // Cluster 1: V
  a1: { cx: 40, cy: 110 },
  a2: { cx: 80, cy: 150 },
  a3: { cx: 120, cy: 110 },
  
  // Cluster 2: < 
  b1: { cx: 415, cy: 10 },
  b2: { cx: 375, cy: 50 },
  b3: { cx: 415, cy: 90 },
  
  // Cluster 3: ^
  c1: { cx: 680, cy: 150 },
  c2: { cx: 720, cy: 110 },
  c3: { cx: 760, cy: 150 },

  // Middle Transit Nodes
  hubAB: { cx: 227, cy: 100 },
  hubBC: { cx: 547, cy: 80 },

  // Subtle Background Nodes (Placed far off the main diagonal path)
  abScat1: { cx: 200, cy: 160 }, // Below
  abScat2: { cx: 260, cy: 150 }, // Below
  abScat3: { cx: 210, cy: 40 },  // Above

  bcScat1: { cx: 520, cy: 140 }, // Below
  bcScat2: { cx: 580, cy: 150 }, // Below
  bcScat3: { cx: 550, cy: 30 }   // Above
}

export default function IntelligenceSignal() {
  return (
    <div className="relative w-full h-64 overflow-visible bg-transparent mt-4">
      <svg viewBox="0 0 800 240" className="absolute top-0 left-0 w-full h-full overflow-visible">
        
        {/* ── BACKGROUND LAYER: SUBTLE MIDDLE NODE BRANCHES ── */}
        <g className="subtle-network">
          {/* Hub 1 Branches */}
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat1.cx} y2={d.abScat1.cy} className="sub-line sub1-1" strokeDasharray="100" />
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat2.cx} y2={d.abScat2.cy} className="sub-line sub1-2" strokeDasharray="100" />
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat3.cx} y2={d.abScat3.cy} className="sub-line sub1-3" strokeDasharray="100" />
          <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="2" className="sub-dot sub1-1" />
          <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="2" className="sub-dot sub1-2" />
          <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="2" className="sub-dot sub1-3" />

          {/* Hub 2 Branches */}
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat1.cx} y2={d.bcScat1.cy} className="sub-line sub2-1" strokeDasharray="100" />
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat2.cx} y2={d.bcScat2.cy} className="sub-line sub2-2" strokeDasharray="100" />
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat3.cx} y2={d.bcScat3.cy} className="sub-line sub2-3" strokeDasharray="100" />
          <circle cx={d.bcScat1.cx} cy={d.bcScat1.cy} r="2" className="sub-dot sub2-1" />
          <circle cx={d.bcScat2.cx} cy={d.bcScat2.cy} r="2" className="sub-dot sub2-2" />
          <circle cx={d.bcScat3.cx} cy={d.bcScat3.cy} r="2" className="sub-dot sub2-3" />
        </g>

        {/* ── MAIN LAYER: CONNECTING TRANSITION LINES ── */}
        <g className="main-network">
          {/* Line: Cluster 1 to Middle Node 1 */}
          <line x1={d.a2.cx} y1={d.a2.cy} x2={d.hubAB.cx} y2={d.hubAB.cy} className="main-line bb1" strokeDasharray="300" />
          <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="3" className="hub-dot pin1" />

          {/* Line: Middle Node 1 to Cluster 2 */}
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.b2.cx} y2={d.b2.cy} className="main-line bb2" strokeDasharray="300" />

          {/* Line: Cluster 2 to Middle Node 2 */}
          <line x1={d.b2.cx} y1={d.b2.cy} x2={d.hubBC.cx} y2={d.hubBC.cy} className="main-line bb3" strokeDasharray="300" />
          <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="3" className="hub-dot pin2" />

          {/* Line: Middle Node 2 to Cluster 3 */}
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.c2.cx} y2={d.c2.cy} className="main-line bb4" strokeDasharray="300" />
        </g>

        {/* ── FOREGROUND LAYER: CLUSTERS AND LOCKED TEXT ── */}
        
        {/* Cluster 1 Group */}
        <g className="cluster-group c1-group">
          <line x1={d.a1.cx} y1={d.a1.cy} x2={d.a2.cx} y2={d.a2.cy} className="cluster-wire" />
          <line x1={d.a2.cx} y1={d.a2.cy} x2={d.a3.cx} y2={d.a3.cy} className="cluster-wire" />
          <circle cx={d.a2.cx} cy={d.a2.cy} r="4" className="pulse-ripple" style={{ transformOrigin: `${d.a2.cx}px ${d.a2.cy}px` }} />
          <circle cx={d.a2.cx} cy={d.a2.cy} r="3.5" className="cluster-dot-main" />
          <circle cx={d.a1.cx} cy={d.a1.cy} r="2.5" className="cluster-dot-sub" />
          <circle cx={d.a3.cx} cy={d.a3.cy} r="2.5" className="cluster-dot-sub" />
          {/* Label Directly Below Cluster 1 */}
          <text x={d.a2.cx} y={d.a2.cy + 35} textAnchor="middle" className="cluster-label">CUSTOMER EXPECTATION DETECTED</text>
        </g>

        {/* Cluster 2 Group */}
        <g className="cluster-group c2-group">
          <line x1={d.b1.cx} y1={d.b1.cy} x2={d.b2.cx} y2={d.b2.cy} className="cluster-wire" />
          <line x1={d.b2.cx} y1={d.b2.cy} x2={d.b3.cx} y2={d.b3.cy} className="cluster-wire" />
          <circle cx={d.b2.cx} cy={d.b2.cy} r="4" className="pulse-ripple" style={{ transformOrigin: `${d.b2.cx}px ${d.b2.cy}px` }} />
          <circle cx={d.b2.cx} cy={d.b2.cy} r="3.5" className="cluster-dot-main" />
          <circle cx={d.b1.cx} cy={d.b1.cy} r="2.5" className="cluster-dot-sub" />
          <circle cx={d.b3.cx} cy={d.b3.cy} r="2.5" className="cluster-dot-sub" />
          {/* Label Directly AT THE TOP of Cluster 2 */}
          <text x={d.b2.cx} y={d.b2.cy - 30} textAnchor="middle" className="cluster-label">HIDDEN OBJECTION</text>
        </g>

        {/* Cluster 3 Group */}
        <g className="cluster-group c3-group">
          <line x1={d.c1.cx} y1={d.c1.cy} x2={d.c2.cx} y2={d.c2.cy} className="cluster-wire" />
          <line x1={d.c2.cx} y1={d.c2.cy} x2={d.c3.cx} y2={d.c3.cy} className="cluster-wire" />
          <circle cx={d.c2.cx} cy={d.c2.cy} r="4" className="pulse-ripple" style={{ transformOrigin: `${d.c2.cx}px ${d.c2.cy}px` }} />
          <circle cx={d.c2.cx} cy={d.c2.cy} r="3.5" className="cluster-dot-main" />
          <circle cx={d.c1.cx} cy={d.c1.cy} r="2.5" className="cluster-dot-sub" />
          <circle cx={d.c3.cx} cy={d.c3.cy} r="2.5" className="cluster-dot-sub" />
          {/* Label Directly Below Cluster 3 */}
          <text x={d.c2.cx} y={d.c2.cy + 35} textAnchor="middle" className="cluster-label">EMERGING OPPORTUNITY</text>
        </g>
      </svg>

      <style jsx global>{`
        /* Global Base SVG Styles */
        .cluster-wire { stroke: #aab0a3; stroke-width: 1.5; opacity: 0.6; }
        .cluster-dot-main { fill: #AAB0A3; opacity: 1; }
        .cluster-dot-sub { fill: #AAB0A3; opacity: 0.6; }
        
        /* Restored Perfect Font Styling for SVG Text */
        .cluster-label { 
          fill: #1A3024; 
          font-size: 10px; 
          font-weight: 500;
          letter-spacing: 0.25em; 
          font-family: inherit;
        }

        /* Continuous Pulsing Effect (Runs constantly while cluster is visible) */
        .pulse-ripple { 
          fill: none; 
          stroke: #aab0a3; 
          stroke-width: 1.5; 
          animation: nodePulse 3s cubic-bezier(0.16, 1, 0.3, 1) infinite; 
        }
        @keyframes nodePulse {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(5); }
        }

        /* ── SEAMLESS 19s TIMELINE CHOREOGRAPHY ── */

        /* CLUSTER 1: Starts animation */
        .c1-group { animation: c1-anim 19s infinite; }
        @keyframes c1-anim {
          0%, 5% { opacity: 0; }
          10%, 35% { opacity: 1; }
          40%, 100% { opacity: 0; }
        }

        /* LINE 1: C1 to Middle Node 1 */
        .main-line { stroke: #aab0a3; stroke-width: 1.2; fill: none; }
        .bb1 { animation: bb1-anim 19s infinite linear; }
        @keyframes bb1-anim {
          0%, 15% { stroke-dashoffset: 300; opacity: 1; }
          25%, 35% { stroke-dashoffset: 0; opacity: 1; }
          40%, 100% { opacity: 0; stroke-dashoffset: 0; }
        }
        
        .pin1 { fill: #aab0a3; animation: pin1-anim 19s infinite; }
        @keyframes pin1-anim { 0%, 24% { opacity: 0; } 25%, 35% { opacity: 1; } 40%, 100% { opacity: 0; } }

        /* LINE 2: Middle Node 1 to C2 (Simultaneous with Sub-nodes below) */
        .bb2 { animation: bb2-anim 19s infinite linear; }
        @keyframes bb2-anim {
          0%, 25% { stroke-dashoffset: 300; opacity: 1; }
          35%, 70% { stroke-dashoffset: 0; opacity: 1; }
          75%, 100% { opacity: 0; stroke-dashoffset: 0; }
        }

        /* SUBTLE BACKGROUND NODES 1 (Draws one-by-one seamlessly alongside bb2) */
        .sub-line { stroke: #aab0a3; stroke-width: 0.75; stroke-dasharray: 2 2; fill: none; }
        .sub-dot { fill: #aab0a3; }
        
        .sub1-1 { animation: sub1-1-anim 19s infinite linear; }
        @keyframes sub1-1-anim { 0%, 25% { stroke-dashoffset: 100; opacity: 0; } 28%, 35% { stroke-dashoffset: 0; opacity: 0.3; } 40%, 100% { opacity: 0; } }
        
        .sub1-2 { animation: sub1-2-anim 19s infinite linear; }
        @keyframes sub1-2-anim { 0%, 28% { stroke-dashoffset: 100; opacity: 0; } 31%, 35% { stroke-dashoffset: 0; opacity: 0.3; } 40%, 100% { opacity: 0; } }
        
        .sub1-3 { animation: sub1-3-anim 19s infinite linear; }
        @keyframes sub1-3-anim { 0%, 31% { stroke-dashoffset: 100; opacity: 0; } 34%, 35% { stroke-dashoffset: 0; opacity: 0.3; } 40%, 100% { opacity: 0; } }

        /* CLUSTER 2: Appears upon connection completion, fades when C3 is done */
        .c2-group { animation: c2-anim 19s infinite; }
        @keyframes c2-anim {
          0%, 35% { opacity: 0; }
          40%, 70% { opacity: 1; }
          75%, 100% { opacity: 0; }
        }

        /* LINE 3: C2 to Middle Node 2 */
        .bb3 { animation: bb3-anim 19s infinite linear; }
        @keyframes bb3-anim {
          0%, 50% { stroke-dashoffset: 300; opacity: 1; }
          60%, 70% { stroke-dashoffset: 0; opacity: 1; }
          75%, 100% { opacity: 0; stroke-dashoffset: 0; }
        }

        .pin2 { fill: #aab0a3; animation: pin2-anim 19s infinite; }
        @keyframes pin2-anim { 0%, 59% { opacity: 0; } 60%, 70% { opacity: 1; } 75%, 100% { opacity: 0; } }

        /* LINE 4: Middle Node 2 to C3 (Simultaneous with Sub-nodes below) */
        .bb4 { animation: bb4-anim 19s infinite linear; }
        @keyframes bb4-anim {
          0%, 60% { stroke-dashoffset: 300; opacity: 1; }
          70%, 95% { stroke-dashoffset: 0; opacity: 1; }
          100% { opacity: 0; stroke-dashoffset: 0; }
        }

        /* SUBTLE BACKGROUND NODES 2 (Draws one-by-one seamlessly alongside bb4) */
        .sub2-1 { animation: sub2-1-anim 19s infinite linear; }
        @keyframes sub2-1-anim { 0%, 60% { stroke-dashoffset: 100; opacity: 0; } 63%, 70% { stroke-dashoffset: 0; opacity: 0.3; } 75%, 100% { opacity: 0; } }
        
        .sub2-2 { animation: sub2-2-anim 19s infinite linear; }
        @keyframes sub2-2-anim { 0%, 63% { stroke-dashoffset: 100; opacity: 0; } 66%, 70% { stroke-dashoffset: 0; opacity: 0.3; } 75%, 100% { opacity: 0; } }
        
        .sub2-3 { animation: sub2-3-anim 19s infinite linear; }
        @keyframes sub2-3-anim { 0%, 66% { stroke-dashoffset: 100; opacity: 0; } 69%, 70% { stroke-dashoffset: 0; opacity: 0.3; } 75%, 100% { opacity: 0; } }

        /* CLUSTER 3: Appears upon connection completion */
        .c3-group { animation: c3-anim 19s infinite; }
        @keyframes c3-anim {
          0%, 70% { opacity: 0; }
          75%, 95% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}