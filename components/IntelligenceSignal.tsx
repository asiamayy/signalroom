'use client'

// Clean Operational Infrastructure for SignalRoom UI
// 1. Permanent Main Node Pulses (Active from timestamp 0)
// 2. Proportional Cluster Proximity Locking
// 3. Subtle Sub-Networks offset from the primary vector paths

const d = {
  // Cluster 1: "V" Configuration
  a1: { cx: 40, cy: 90 },
  a2: { cx: 70, cy: 120 },
  a3: { cx: 100, cy: 90 },
  
  // Cluster 2: "<" Configuration (Unified scale alignment)
  b1: { cx: 385, cy: 20 },
  b2: { cx: 355, cy: 50 },
  b3: { cx: 385, cy: 80 },
  
  // Cluster 3: "^" Configuration
  c1: { cx: 660, cy: 120 },
  c2: { cx: 690, cy: 90 },
  c3: { cx: 720, cy: 120 },

  // Primary Transit Intermediate Hub Centroids
  hubAB: { cx: 212, cy: 85 },
  hubBC: { cx: 522, cy: 70 },

  // Offset Micro-Nodes (Safely cleared from backbone lines)
  abScat1: { cx: 180, cy: 30 },
  abScat2: { cx: 250, cy: 150 },
  abScat3: { cx: 280, cy: 40 },

  // Offset Micro-Nodes (Safely cleared from backbone lines)
  bcScat1: { cx: 480, cy: 130 },
  bcScat2: { cx: 510, cy: 25 },
  bcScat3: { cx: 590, cy: 35 }
}

export default function IntelligenceSignal() {
  return (
    <div className="relative w-full h-64 overflow-visible bg-transparent mt-4">
      <svg viewBox="0 0 800 240" className="absolute top-0 left-0 w-full h-full overflow-visible">
        
        {/* ── LAYER 1: SUBTLE BACKGROUND MICRO-NETWORKS ── */}
        {/* AB Sequential Delayed Branching */}
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat1.cx} y2={d.abScat1.cy} className="subtle-seq-line ab-l1" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat2.cx} y2={d.abScat2.cy} className="subtle-seq-line ab-l2" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat3.cx} y2={d.abScat3.cy} className="subtle-seq-line ab-l3" />
        <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="2.5" className="subtle-node-core ab-c1" />
        <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="2.5" className="subtle-node-core ab-c2" />
        <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="2.5" className="subtle-node-core ab-c3" />

        {/* BC Sequential Delayed Branching */}
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

        {/* Dynamic Wave Transit Hub Pins */}
        <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="3" className="hub-center-pin pin-ab" />
        <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="3" className="hub-center-pin pin-bc" />


        {/* ── LAYER 3: PERMANENT CLUSTER GEOMETRIES & CONTINUOUS PULSES ── */}
        {/* Cluster 1 Base Wiring */}
        <line x1={d.a1.cx} y1={d.a1.cy} x2={d.a2.cx} y2={d.a2.cy} className="cluster-wire" />
        <line x1={d.a2.cx} y1={d.a2.cy} x2={d.a3.cx} y2={d.a3.cy} className="cluster-wire" />
        {/* Continuous Loop Ripple (Active from timestamp 0) */}
        <circle cx={d.a2.cx} cy={d.a2.cy} r="4" className="permanent-wave wave-loop-1" style={{ transformOrigin: `${d.a2.cx}px ${d.a2.cy}px` }} />
        <circle cx={d.a2.cx} cy={d.a2.cy} r="3.5" fill="#AAB0A3" className="permanent-dot" />
        <circle cx={d.a1.cx} cy={d.a1.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
        <circle cx={d.a3.cx} cy={d.a3.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />

        {/* Cluster 2 Base Wiring */}
        <line x1={d.b1.cx} y1={d.b1.cy} x2={d.b2.cx} y2={d.b2.cy} className="cluster-wire" />
        <line x1={d.b2.cx} y1={d.b2.cy} x2={d.b3.cx} y2={d.b3.cy} className="cluster-wire" />
        {/* Continuous Loop Ripple */}
        <circle cx={d.b2.cx} cy={d.b2.cy} r="4" className="permanent-wave wave-loop-2" style={{ transformOrigin: `${d.b2.cx}px ${d.b2.cy}px` }} />
        <circle cx={d.b2.cx} cy={d.b2.cy} r="3.5" fill="#AAB0A3" className="permanent-dot" />
        <circle cx={d.b1.cx} cy={d.b1.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
        <circle cx={d.b3.cx} cy={d.b3.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />

        {/* Cluster 3 Base Wiring */}
        <line x1={d.c1.cx} y1={d.c1.cy} x2={d.c2.cx} y2={d.c2.cy} className="cluster-wire" />
        <line x1={d.c2.cx} y1={d.c2.cy} x2={d.c3.cx} y2={d.c3.cy} className="cluster-wire" />
        {/* Continuous Loop Ripple */}
        <circle cx={d.c2.cx} cy={d.c2.cy} r="4" className="permanent-wave wave-loop-3" style={{ transformOrigin: `${d.c2.cx}px ${d.c2.cy}px` }} />
        <circle cx={d.c2.cx} cy={d.c2.cy} r="3.5" fill="#AAB0A3" className="permanent-dot" />
        <circle cx={d.c1.cx} cy={d.c1.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
        <circle cx={d.c3.cx} cy={d.c3.cy} r="2.5" fill="#AAB0A3" className="permanent-dot-ambient" />
      </svg>

      {/* ── LAYER 4: ANCHOR-LOCKED LABELS (ALWAYS NEXT TO THEIR CLUSTERS) ── */}
      {/* Cluster 1 Label: Directly beneath the V baseline */}
      <div className="absolute font-medium pointer-events-none" style={{ left: '40px', top: '142px' }}>
        <span className="context-label label-fade-1">Customer expectation detected</span>
      </div>

      {/* Cluster 2 Label: Placed immediately above the apex tip */}
      <div className="absolute font-medium pointer-events-none" style={{ left: '315px', top: '0px' }}>
        <span className="context-label label-fade-2">Hidden objection</span>
      </div>

      {/* Cluster 3 Label: Positioned perfectly beneath the inverted chevron */}
      <div className="absolute font-medium pointer-events-none" style={{ left: '620px', top: '142px' }}>
        <span className="context-label label-fade-3">Emerging opportunity</span>
      </div>

      <style jsx global>{`
        /* Static Infrastructure Anchors */
        .cluster-wire { stroke: #aab0a3; stroke-width: 1.2; opacity: 0.35; }
        .permanent-dot { opacity: 0.85; }
        .permanent-dot-ambient { opacity: 0.45; }
        
        /* RESTORED: Continuous Pulsing Wave Loops */
        .permanent-wave { fill: none; stroke: #aab0a3; stroke-width: 1.2; opacity: 0; animation: permanentPulse 3.8s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
        .wave-loop-2 { animation-delay: 0.4s; }
        .wave-loop-3 { animation-delay: 0.8s; }
        @keyframes permanentPulse {
          0% { opacity: 0.75; transform: scale(1); }
          100% { opacity: 0; transform: scale(5); }
        }

        /* Context Labels Locked to Transitions */
        .context-label { text-transform: uppercase; font-size: 10px; tracking: 0.25em; color: #1A3024; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; white-space: nowrap; }
        .label-fade-1 { animation-name: kfL1; }
        .label-fade-2 { animation-name: kfL2; }
        .label-fade-3 { animation-name: kfL3; }

        @keyframes kfL1 { 0%, 20%, 92%, 100% { opacity: 0.15; } 2%, 18% { opacity: 1; } }
        @keyframes kfL2 { 0%, 38%, 68%, 100% { opacity: 0.15; } 42%, 64% { opacity: 1; } }
        @keyframes kfL3 { 0%, 66%, 94%, 100% { opacity: 0.15; } 70%, 90% { opacity: 1; } }

        /* Dynamic Linear Growth Vector Tracks */
        .primary-backbone-edge { stroke: #aab0a3; stroke-width: 1.2; fill: none; stroke-dasharray: 200; stroke-dashoffset: 200; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: linear; }
        .hub-center-pin { fill: #AAB0A3; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }

        /* Subtle Background Micro-Networks (Opacity set to 0.3 max for clean texture) */
        .subtle-seq-line { stroke: #aab0a3; stroke-width: 0.75; stroke-dasharray: 80; stroke-dashoffset: 80; fill: none; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: linear; }
        .subtle-node-core { fill: #AAB0A3; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }

        /* ── SEAMLESS SEQUENTIAL ENGINE TIMELINE (19s TOTAL) ── */
        
        /* Segment A1 Transit (14% -> 22%) */
        .bb-a1 { animation-name: anBB_A1; }
        @keyframes anBB_A1 { 0%, 14% { stroke-dashoffset: 200; opacity: 1; } 22%, 46% { stroke-dashoffset: 0; opacity: 1; } 48%, 100% { opacity: 0; } }
        
        /* Hub AB Activation & Background Sprout (22% -> 38%) */
        .pin-ab { animation-name: anPinAB; transform-origin: 212px 85px; }
        @keyframes anPinAB { 0%, 21% { opacity: 0; transform: scale(0); } 22%, 46% { opacity: 0.7; transform: scale(1); } 48%, 100% { opacity: 0; } }

        .ab-l1 { animation-name: anAB_L1; } @keyframes anAB_L1 { 0%, 22% { stroke-dashoffset: 80; opacity: 0.3; } 26%, 46% { stroke-dashoffset: 0; opacity: 0.3; } 48%, 100% { opacity: 0; } }
        .ab-c1 { animation-name: anAB_C1; } @keyframes anAB_C1 { 0%, 25% { opacity: 0; } 26%, 46% { opacity: 0.35; } 48%, 100% { opacity: 0; } }

        .ab-l2 { animation-name: anAB_L2; } @keyframes anAB_L2 { 0%, 26% { stroke-dashoffset: 80; opacity: 0.3; } 30%, 46% { stroke-dashoffset: 0; opacity: 0.3; } 48%, 100% { opacity: 0; } }
        .ab-c2 { animation-name: anAB_C2; } @keyframes anAB_C2 { 0%, 29% { opacity: 0; } 30%, 46% { opacity: 0.35; } 48%, 100% { opacity: 0; } }

        .ab-l3 { animation-name: anAB_L3; } @keyframes anAB_L3 { 0%, 30% { stroke-dashoffset: 80; opacity: 0.3; } 34%, 46% { stroke-dashoffset: 0; opacity: 0.3; } 48%, 100% { opacity: 0; } }
        .ab-c3 { animation-name: anAB_C3; } @keyframes anAB_C3 { 0%, 33% { opacity: 0; } 34%, 46% { opacity: 0.35; } 48%, 100% { opacity: 0; } }

        /* Segment A2 Transit (34% -> 42%) */
        .bb-a2 { animation-name: anBB_A2; }
        @keyframes anBB_A2 { 0%, 34% { stroke-dashoffset: 200; opacity: 1; } 42%, 94% { stroke-dashoffset: 0; opacity: 1; } 96%, 100% { opacity: 0; } }

        /* Segment B1 Transit (48% -> 56%) */
        .bb-b1 { animation-name: anBB_B1; }
        @keyframes anBB_B1 { 0%, 48% { stroke-dashoffset: 200; opacity: 1; } 56%, 88% { stroke-dashoffset: 0; opacity: 1; } 92%, 100% { opacity: 0; } }

        /* Hub BC Activation & Background Sprout (56% -> 72%) */
        .pin-bc { animation-name: anPinBC; transform-origin: 522px 70px; }
        @keyframes anPinBC { 0%, 55% { opacity: 0; transform: scale(0); } 56%, 88% { opacity: 0.7; transform: scale(1); } 92%, 100% { opacity: 0; } }

        .bc-l1 { animation-name: anBC_L1; } @keyframes anBC_L1 { 0%, 56% { stroke-dashoffset: 80; opacity: 0.3; } 60%, 88% { stroke-dashoffset: 0; opacity: 0.3; } 92%, 100% { opacity: 0; } }
        .bc-c1 { animation-name: anBC_C1; } @keyframes anBC_C1 { 0%, 59% { opacity: 0; } 60%, 88% { opacity: 0.35; } 92%, 100% { opacity: 0; } }

        .bc-l2 { animation-name: anBC_L2; } @keyframes anBC_L2 { 0%, 60% { stroke-dashoffset: 80; opacity: 0.3; } 64%, 88% { stroke-dashoffset: 0; opacity: 0.3; } 92%, 100% { opacity: 0; } }
        .bc-c2 { animation-name: anBC_C2; } @keyframes anBC_C2 { 0%, 63% { opacity: 0; } 64%, 88% { opacity: 0.35; } 92%, 100% { opacity: 0; } }

        .bc-l3 { animation-name: anBC_L3; } @keyframes anBC_L3 { 0%, 64% { stroke-dashoffset: 80; opacity: 0.3; } 68%, 88% { stroke-dashoffset: 0; opacity: 0.3; } 92%, 100% { opacity: 0; } }
        .bc-c3 { animation-name: anBC_C3; } @keyframes anBC_C3 { 0%, 67% { opacity: 0; } 68%, 88% { opacity: 0.35; } 92%, 100% { opacity: 0; } }

        /* Segment B2 Transit (68% -> 76%) */
        .bb-b2 { animation-name: anBB_B2; }
        @keyframes anBB_B2 { 0%, 68% { stroke-dashoffset: 200; opacity: 1; } 76%, 94% { stroke-dashoffset: 0; opacity: 1; } 96%, 100% { opacity: 0; } }
      `}</style>
    </div>
  )
}