'use client'

// Proportional, chronologically-locked layout.
// 1. Text weights, fonts, and styling fully restored.
// 2. Clusters 2 & 3 completely hidden at initiation.
// 3. Forward tracking links animate simultaneously with intermediate node branching.

const d = {
  // Cluster 1: Placed under 'Customer expectation detected'
  a1: { cx: 40, cy: 110 },
  a2: { cx: 70, cy: 140 },
  a3: { cx: 100, cy: 110 },
  
  // Cluster 2: Placed under 'Hidden objection'
  b1: { cx: 345, cy: 110 },
  b2: { cx: 315, cy: 140 },
  b3: { cx: 345, cy: 170 },
  
  // Cluster 3: Placed under 'Emerging opportunity'
  c1: { cx: 620, cy: 140 },
  c2: { cx: 650, cy: 110 },
  c3: { cx: 680, cy: 140 },

  // Transit Hub Centroids
  hubAB: { cx: 192, cy: 140 },
  hubBC: { cx: 482, cy: 125 },

  // Offset Micro-Nodes
  abScat1: { cx: 160, cy: 60 },
  abScat2: { cx: 220, cy: 210 },
  abScat3: { cx: 250, cy: 80 },

  // Offset Micro-Nodes
  bcScat1: { cx: 450, cy: 200 },
  bcScat2: { cx: 470, cy: 50 },
  bcScat3: { cx: 550, cy: 65 }
}

export default function IntelligenceSignal() {
  return (
    <div className="relative w-full h-64 overflow-visible bg-transparent mt-4">
      <svg viewBox="0 0 800 240" className="absolute top-0 left-0 w-full h-full overflow-visible">
        
        {/* ── LAYER 1: SUBTLE BACKGROUND MICRO-NETWORKS ── */}
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat1.cx} y2={d.abScat1.cy} className="subtle-seq-line ab-l1" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat2.cx} y2={d.abScat2.cy} className="subtle-seq-line ab-l2" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat3.cx} y2={d.abScat3.cy} className="subtle-seq-line ab-l3" />
        <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="2.5" className="subtle-node-core ab-c1" />
        <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="2.5" className="subtle-node-core ab-c2" />
        <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="2.5" className="subtle-node-core ab-c3" />

        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat1.cx} y2={d.bcScat1.cy} className="subtle-seq-line bc-l1" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat2.cx} y2={d.bcScat2.cy} className="subtle-seq-line bc-l2" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat3.cx} y2={d.bcScat3.cy} className="subtle-seq-line bc-l3" />
        <circle cx={d.bcScat1.cx} cy={d.bcScat1.cy} r="2.5" className="subtle-node-core bc-c1" />
        <circle cx={d.bcScat2.cx} cy={d.bcScat2.cy} r="2.5" className="subtle-node-core bc-c2" />
        <circle cx={d.bcScat3.cx} cy={d.bcScat3.cy} r="2.5" className="subtle-node-core bc-c3" />

        {/* ── LAYER 2: CHRONOLOGICAL TRANSIT BACKBONE ── */}
        <line x1={d.a2.cx} y1={d.a2.cy} x2={d.hubAB.cx} y2={d.hubAB.cy} className="primary-backbone-edge bb-a1" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.b2.cx} y2={d.b2.cy} className="primary-backbone-edge bb-a2" />
        <line x1={d.b2.cx} y1={d.b2.cy} x2={d.hubBC.cx} y2={d.hubBC.cy} className="primary-backbone-edge bb-b1" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.c2.cx} y2={d.c2.cy} className="primary-backbone-edge bb-b2" />

        <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="3" className="hub-center-pin pin-ab" />
        <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="3" className="hub-center-pin pin-bc" />

        {/* ── LAYER 3: GEOMETRIES PROPORTIONALLY LOCKED UNDER TEXT TRACKS ── */}
        {/* Cluster 1: V */}
        <g className="master-cluster cluster-reveal-1">
          <line x1={d.a1.cx} y1={d.a1.cy} x2={d.a2.cx} y2={d.a2.cy} className="cluster-wire" />
          <line x1={d.a2.cx} y1={d.a2.cy} x2={d.a3.cx} y2={d.a3.cy} className="cluster-wire" />
          <circle cx={d.a2.cx} cy={d.a2.cy} r="4" className="permanent-wave wave-loop-1" style={{ transformOrigin: `${d.a2.cx}px ${d.a2.cy}px` }} />
          <circle cx={d.a2.cx} cy={d.a2.cy} r="3.5" fill="#AAB0A3" className="permanent-dot" />
          <circle cx={d.a1.cx} cy={d.a1.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
          <circle cx={d.a3.cx} cy={d.a3.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
        </g>

        {/* Cluster 2: < */}
        <g className="master-cluster cluster-reveal-2">
          <line x1={d.b1.cx} y1={d.b1.cy} x2={d.b2.cx} y2={d.b2.cy} className="cluster-wire" />
          <line x1={d.b2.cx} y1={d.b2.cy} x2={d.b3.cx} y2={d.b3.cy} className="cluster-wire" />
          <circle cx={d.b2.cx} cy={d.b2.cy} r="4" className="permanent-wave wave-loop-2" style={{ transformOrigin: `${d.b2.cx}px ${d.b2.cy}px` }} />
          <circle cx={d.b2.cx} cy={d.b2.cy} r="3.5" fill="#AAB0A3" className="permanent-dot" />
          <circle cx={d.b1.cx} cy={d.b1.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
          <circle cx={d.b3.cx} cy={d.b3.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
        </g>

        {/* Cluster 3: ^ */}
        <g className="master-cluster cluster-reveal-3">
          <line x1={d.c1.cx} y1={d.c1.cy} x2={d.c2.cx} y2={d.c2.cy} className="cluster-wire" />
          <line x1={d.c2.cx} y1={d.c2.cy} x2={d.c3.cx} y2={d.c3.cy} className="cluster-wire" />
          <circle cx={d.c2.cx} cy={d.c2.cy} r="4" className="permanent-wave wave-loop-3" style={{ transformOrigin: `${d.c2.cx}px ${d.c2.cy}px` }} />
          <circle cx={d.c2.cx} cy={d.c2.cy} r="3.5" fill="#AAB0A3" className="permanent-dot" />
          <circle cx={d.c1.cx} cy={d.c1.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
          <circle cx={d.c3.cx} cy={d.c3.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
        </g>
      </svg>

      {/* ── LAYER 4: TEXT CONTEXT LABELS ── */}
      <div className="absolute pointer-events-none" style={{ left: '40px', top: '70px' }}>
        <span className="context-label label-fade-1">Customer expectation detected</span>
      </div>

      <div className="absolute pointer-events-none" style={{ left: '315px', top: '70px' }}>
        <span className="context-label label-fade-2">Hidden objection</span>
      </div>

      <div className="absolute pointer-events-none" style={{ left: '620px', top: '70px' }}>
        <span className="context-label label-fade-3">Emerging opportunity</span>
      </div>

      <style jsx global>{`
        /* Infrastructure Architecture Rules */
        .cluster-wire { stroke: #aab0a3; stroke-width: 1.2; opacity: 0.45; }
        .permanent-dot { opacity: 0.95; }
        .permanent-dot-ambient { opacity: 0.55; }
        
        /* Master Groups Hidden at Start */
        .master-cluster { opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        .cluster-reveal-1 { animation-name: revC1; }
        .cluster-reveal-2 { animation-name: revC2; }
        .cluster-reveal-3 { animation-name: revC3; }

        @keyframes revC1 { 0%, 94%, 100% { opacity: 1; } }
        @keyframes revC2 { 0%, 40% { opacity: 0; } 42%, 94% { opacity: 1; } 96%, 100% { opacity: 0; } }
        @keyframes revC3 { 0%, 74% { opacity: 0; } 76%, 94% { opacity: 1; } 96%, 100% { opacity: 0; } }

        /* Pulsing Wave Loops */
        .permanent-wave { fill: none; stroke: #aab0a3; stroke-width: 1.2; opacity: 0; animation: permanentPulse 3.8s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
        .wave-loop-2 { animation-delay: 0.4s; }
        .wave-loop-3 { animation-delay: 0.8s; }
        @keyframes permanentPulse { 0% { opacity: 0.75; transform: scale(1); } 100% { opacity: 0; transform: scale(5); } }

        /* Labels Fade-In on Node Connection Trigger */
        .context-label { display: block; text-transform: uppercase; font-size: 10px; tracking: 0.25em; color: #1A3024; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; white-space: nowrap; }
        .label-fade-1 { animation-name: kfL1; }
        .label-fade-2 { animation-name: kfL2; }
        .label-fade-3 { animation-name: kfL3; }

        @keyframes kfL1 { 0%, 94%, 100% { opacity: 1; } }
        @keyframes kfL2 { 0%, 40% { opacity: 0; } 42%, 94% { opacity: 1; } 96%, 100% { opacity: 0; } }
        @keyframes kfL3 { 0%, 74% { opacity: 0; } 76%, 94% { opacity: 1; } 96%, 100% { opacity: 0; } }

        /* Backbone & Transition Paths */
        .primary-backbone-edge { stroke: #aab0a3; stroke-width: 1.2; fill: none; stroke-dasharray: 200; stroke-dashoffset: 200; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: linear; }
        .hub-center-pin { fill: #AAB0A3; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }

        /* Sub-Networks */
        .subtle-seq-line { stroke: #aab0a3; stroke-width: 0.75; stroke-dasharray: 80; stroke-dashoffset: 80; fill: none; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: linear; }
        .subtle-node-core { fill: #AAB0A3; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }

        /* ── SIMULTANEOUS TRANSIT TIMELINE ENGINE ── */
        .bb-a1 { animation-name: anBB_A1; }
        @keyframes anBB_A1 { 0%, 14% { stroke-dashoffset: 200; opacity: 1; } 22%, 46% { stroke-dashoffset: 0; opacity: 1; } 48%, 100% { opacity: 0; } }
        
        .pin-ab { animation-name: anPinAB; transform-origin: 192px 140px; }
        @keyframes anPinAB { 0%, 21% { opacity: 0; transform: scale(0); } 22%, 46% { opacity: 0.7; transform: scale(1); } 48%, 100% { opacity: 0; } }

        /* Simultaneous Overlap: Transit Line 2 moves as Nodes branch out */
        .bb-a2 { animation-name: anBB_A2; }
        @keyframes anBB_A2 { 0%, 22% { stroke-dashoffset: 200; opacity: 1; } 42%, 94% { stroke-dashoffset: 0; opacity: 1; } 96%, 100% { opacity: 0; } }

        .ab-l1 { animation-name: anAB_L1; } @keyframes anAB_L1 { 0%, 22% { stroke-dashoffset: 80; opacity: 0.3; } 28%, 46% { stroke-dashoffset: 0; opacity: 0.3; } 48%, 100% { opacity: 0; } }
        .ab-c1 { animation-name: anAB_C1; } @keyframes anAB_C1 { 0%, 27% { opacity: 0; } 28%, 46% { opacity: 0.35; } 48%, 100% { opacity: 0; } }

        .ab-l2 { animation-name: anAB_L2; } @keyframes anAB_L2 { 0%, 27% { stroke-dashoffset: 80; opacity: 0.3; } 33%, 46% { stroke-dashoffset: 0; opacity: 0.3; } 48%, 100% { opacity: 0; } }
        .ab-c2 { animation-name: anAB_C2; } @keyframes anAB_C2 { 0%, 32% { opacity: 0; } 33%, 46% { opacity: 0.35; } 48%, 100% { opacity: 0; } }

        .ab-l3 { animation-name: anAB_L3; } @keyframes anAB_L3 { 0%, 33% { stroke-dashoffset: 80; opacity: 0.3; } 39%, 46% { stroke-dashoffset: 0; opacity: 0.3; } 48%, 100% { opacity: 0; } }
        .ab-c3 { animation-name: anAB_C3; } @keyframes anAB_C3 { 0%, 38% { opacity: 0; } 39%, 46% { opacity: 0.35; } 48%, 100% { opacity: 0; } }

        /* Segment B1 Transit */
        .bb-b1 { animation-name: anBB_B1; }
        @keyframes anBB_B1 { 0%, 48% { stroke-dashoffset: 200; opacity: 1; } 56%, 88% { stroke-dashoffset: 0; opacity: 1; } 92%, 100% { opacity: 0; } }
        
        .pin-bc { animation-name: anPinBC; transform-origin: 482px 125px; }
        @keyframes anPinBC { 0%, 55% { opacity: 0; transform: scale(0); } 56%, 88% { opacity: 0.7; transform: scale(1); } 92%, 100% { opacity: 0; } }

        /* Simultaneous Overlap: Transit Line 4 moves as Nodes branch out */
        .bb-b2 { animation-name: anBB_B2; }
        @keyframes anBB_B2 { 0%, 56% { stroke-dashoffset: 200; opacity: 1; } 76%, 94% { stroke-dashoffset: 0; opacity: 1; } 96%, 100% { opacity: 0; } }

        .bc-l1 { animation-name: anBC_L1; } @keyframes anBC_L1 { 0%, 56% { stroke-dashoffset: 80; opacity: 0.3; } 62%, 88% { stroke-dashoffset: 0; opacity: 0.3; } 92%, 100% { opacity: 0; } }
        .bc-c1 { animation-name: anBC_C1; } @keyframes anBC_C1 { 0%, 61% { opacity: 0; } 62%, 88% { opacity: 0.35; } 92%, 100% { opacity: 0; } }

        .bc-l2 { animation-name: anBC_L2; } @keyframes anBC_L2 { 0%, 62% { stroke-dashoffset: 80; opacity: 0.3; } 68%, 88% { stroke-dashoffset: 0; opacity: 0.3; } 92%, 100% { opacity: 0; } }
        .bc-c2 { animation-name: anBC_C2; } @keyframes anBC_C2 { 0%, 67% { opacity: 0; } 68%, 88% { opacity: 0.35; } 92%, 100% { opacity: 0; } }

        .bc-l3 { animation-name: anBC_L3; } @keyframes anBC_L3 { 0%, 68% { stroke-dashoffset: 80; opacity: 0.3; } 74%, 88% { stroke-dashoffset: 0; opacity: 0.3; } 92%, 100% { opacity: 0; } }
        .bc-c3 { animation-name: anBC_C3; } @keyframes anBC_C3 { 0%, 73% { opacity: 0; } 74%, 88% { opacity: 0.35; } 92%, 100% { opacity: 0; } }
      `}</style>
    </div>
  )
}