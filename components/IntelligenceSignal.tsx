'use client'

// Seamless Sequential Vector Pipeline.
// Coordinates and SVG paths adjusted to execute sequential line growth,
// one-by-one micro-network construction, and top-aligned apex labels.

const d = {
  // Cluster A: Uniform "V"
  a1: { cx: 50, cy: 130 },
  a2: { cx: 80, cy: 160 },
  a3: { cx: 110, cy: 130 },
  
  // Cluster B: Uniform Left Wedge "<"
  b1: { cx: 415, cy: 20 },
  b2: { cx: 385, cy: 50 },
  b3: { cx: 415, cy: 80 },
  
  // Cluster C: Uniform "^"
  c1: { cx: 690, cy: 160 },
  c2: { cx: 720, cy: 130 },
  c3: { cx: 750, cy: 160 },

  // Midpoint Waypoint Nodes
  hubAB: { cx: 232, cy: 105 },
  hubBC: { cx: 552, cy: 90 },

  // Sequenced Micro-Nodes (AB Section)
  abScat1: { cx: 190, cy: 50 },
  abScat2: { cx: 250, cy: 160 },
  abScat3: { cx: 290, cy: 80 },

  // Sequenced Micro-Nodes (BC Section)
  bcScat1: { cx: 490, cy: 140 },
  bcScat2: { cx: 530, cy: 40 },
  bcScat3: { cx: 610, cy: 60 }
}

export default function IntelligenceSignal() {
  return (
    <div className="relative w-full h-64 overflow-visible bg-transparent">
      <svg viewBox="0 0 800 240" className="absolute top-0 left-0 w-full h-full overflow-visible">
        
        {/* ── LAYER 1: SEQUENTIAL INTERMEDIATE SCATTERED SYSTEMS ── */}
        {/* AB Section: One-by-One Sprout Lines */}
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat1.cx} y2={d.abScat1.cy} className="seq-line ab-l1" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat2.cx} y2={d.abScat2.cy} className="seq-line ab-l2" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat3.cx} y2={d.abScat3.cy} className="seq-line ab-l3" />
        
        {/* BC Section: One-by-One Sprout Lines */}
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat1.cx} y2={d.bcScat1.cy} className="seq-line bc-l1" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat2.cx} y2={d.bcScat2.cy} className="seq-line bc-l2" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat3.cx} y2={d.bcScat3.cy} className="seq-line bc-l3" />

        {/* Sequenced Node Cores & Rings (AB) */}
        <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="5" className="seq-pulse ab-p1" />
        <circle cx={d.abScat1.cx} cy={d.abScat1.cy} r="2.5" className="seq-core ab-c1" />
        
        <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="5" className="seq-pulse ab-p2" />
        <circle cx={d.abScat2.cx} cy={d.abScat2.cy} r="2.5" className="seq-core ab-c2" />
        
        <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="5" className="seq-pulse ab-p3" />
        <circle cx={d.abScat3.cx} cy={d.abScat3.cy} r="2.5" className="seq-core ab-c3" />

        {/* Sequenced Node Cores & Rings (BC) */}
        <circle cx={d.bcScat1.cx} cy={d.bcScat1.cy} r="5" className="seq-pulse bc-p1" />
        <circle cx={d.bcScat1.cx} cy={d.bcScat1.cy} r="2.5" className="seq-core bc-c1" />
        
        <circle cx={d.bcScat2.cx} cy={d.bcScat2.cy} r="5" className="seq-pulse bc-p2" />
        <circle cx={d.bcScat2.cx} cy={d.bcScat2.cy} r="2.5" className="seq-core bc-c2" />
        
        <circle cx={d.bcScat3.cx} cy={d.bcScat3.cy} r="5" className="seq-pulse bc-p3" />
        <circle cx={d.bcScat3.cx} cy={d.bcScat3.cy} r="2.5" className="seq-core bc-c3" />


        {/* ── LAYER 2: PRIMARY TRANSIT CHEVRON BACKBONE ── */}
        {/* Dynamic Growth Paths using Vector Stroke Dash Arrays */}
        <line x1={d.a2.cx} y1={d.a2.cy} x2={d.hubAB.cx} y2={d.hubAB.cy} className="backbone-path bb-a1" />
        <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.b2.cx} y2={d.b2.cy} className="backbone-path bb-a2" />
        
        <line x1={d.b2.cx} y1={d.b2.cy} x2={d.hubBC.cx} y2={d.hubBC.cy} className="backbone-path bb-b1" />
        <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.c2.cx} y2={d.c2.cy} className="backbone-path bb-b2" />

        {/* Main Waypoint Intermediate Hub Pins */}
        <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="3" className="hub-pin pin-ab" />
        <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="3" className="hub-pin pin-bc" />


        {/* ── LAYER 3: STATIC CLUSTER INFRASTRUCTURES ── */}
        {/* Cluster 1: V */}
        <line x1={d.a1.cx} y1={d.a1.cy} x2={d.a2.cx} y2={d.a2.cy} className="cluster-base cl-a" />
        <line x1={d.a2.cx} y1={d.a2.cy} x2={d.a3.cx} y2={d.a3.cy} className="cluster-base cl-a" />
        <circle cx={d.a2.cx} cy={d.a2.cy} r="4" className="master-ripple rip-a" style={{ transformOrigin: `${d.a2.cx}px ${d.a2.cy}px` }} />
        <circle cx={d.a2.cx} cy={d.a2.cy} r="3.5" className="node-vertex vertex-a-main" />
        <circle cx={d.a1.cx} cy={d.a1.cy} r="3" className="node-vertex vertex-a-sub" />
        <circle cx={d.a3.cx} cy={d.a3.cy} r="3" className="node-vertex vertex-a-sub" />
        
        {/* Cluster 2: < */}
        <line x1={d.b1.cx} y1={d.b1.cy} x2={d.b2.cx} y2={d.b2.cy} className="cluster-base cl-b" />
        <line x1={d.b2.cx} y1={d.b2.cy} x2={d.b3.cx} y2={d.b3.cy} className="cluster-base cl-b" />
        <circle cx={d.b2.cx} cy={d.b2.cy} r="4" className="master-ripple rip-b" style={{ transformOrigin: `${d.b2.cx}px ${d.b2.cy}px` }} />
        <circle cx={d.b2.cx} cy={d.b2.cy} r="3.5" className="node-vertex vertex-b-main" />
        <circle cx={d.b1.cx} cy={d.b1.cy} r="3" className="node-vertex vertex-b-sub" />
        <circle cx={d.b3.cx} cy={d.b3.cy} r="3" className="node-vertex vertex-b-sub" />
        
        {/* Cluster 3: ^ */}
        <line x1={d.c1.cx} y1={d.c1.cy} x2={d.c2.cx} y2={d.c2.cy} className="cluster-base cl-c" />
        <line x1={d.c2.cx} y1={d.c2.cy} x2={d.c3.cx} y2={d.c3.cy} className="cluster-base cl-c" />
        <circle cx={d.c2.cx} cy={d.c2.cy} r="4" className="master-ripple rip-c" style={{ transformOrigin: `${d.c2.cx}px ${d.c2.cy}px` }} />
        <circle cx={d.c2.cx} cy={d.c2.cy} r="3.5" className="node-vertex vertex-c-main" />
        <circle cx={d.c1.cx} cy={d.c1.cy} r="3" className="node-vertex vertex-c-sub" />
        <circle cx={d.c3.cx} cy={d.c3.cy} r="3" className="node-vertex vertex-c-sub" />
      </svg>

      {/* ── LAYER 4: EXACT PLACEMENT TYPOGRAPHY ── */}
      <div className="absolute top-[215px] left-0 w-full hidden md:block pointer-events-none">
        <span className="lbl-text absolute text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024', left: `${(d.a2.cx / 800) * 100}%`, transform: 'translateX(-20%)', animationName: 'anLBLA' }}>
          Customer expectation detected
        </span>
        <span className="lbl-text absolute text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024', left: `${(d.b2.cx / 800) * 100}%`, transform: 'translateX(-60%)', animationName: 'anLBLC' }}>
          Emerging opportunity
        </span>
      </div>

      {/* "Hidden Objection" safely repositioned right at the top layout boundary of Cluster 2 */}
      <div className="absolute top-[5px] hidden md:block pointer-events-none" style={{ left: `${(d.b2.cx / 800) * 100}%`, transform: 'translateX(-35%)' }}>
        <span className="lbl-text text-[10px] uppercase tracking-[0.25em]" style={{ color: '#1A3024', animationName: 'anLBLB' }}>
          Hidden objection
        </span>
      </div>

      <style jsx global>{`
        /* Global Framework Rules */
        .cluster-base { stroke: #aab0a3; stroke-width: 1.2; opacity: 0.15; animation: clFade 19s infinite; }
        .node-vertex { fill: #AAB0A3; opacity: 0.2; animation: clFade 19s infinite; }
        .master-ripple { fill: none; stroke: #aab0a3; stroke-width: 1.5; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: ease-out; }
        .lbl-text { opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; white-space: nowrap; }

        /* Backbone Paths (Linear Growing Effect) */
        .backbone-path { stroke: #aab0a3; stroke-width: 1.2; fill: none; stroke-dasharray: 200; stroke-dashoffset: 200; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: linear; }
        .hub-pin { fill: #AAB0A3; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }

        /* Intermediate Micro-Network Foundations */
        .seq-line { stroke: #aab0a3; stroke-width: 0.9; stroke-dasharray: 100; stroke-dashoffset: 100; fill: none; animation-duration: 19s; animation-iteration-count: infinite; animation-timing-function: linear; }
        .seq-pulse { fill: none; stroke: #aab0a3; stroke-width: 1; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }
        .seq-core { fill: #AAB0A3; opacity: 0; animation-duration: 19s; animation-iteration-count: infinite; }

        /* Base Ambient Illumination */
        @keyframes clFade { 0%, 100% { opacity: 0.2; } 15%, 94% { opacity: 0.5; } }

        /* ── TRACK CHRONOLOGY SEQUENCING (19s GLOBAL CYCLE) ── */

        /* 1. Cluster A Spark (0% - 15%) */
        @keyframes ripA { 0% { opacity: 0; transform: scale(1); } 3% { opacity: 0.6; } 12% { opacity: 0; transform: scale(5); } 100% { opacity: 0; } }
        @keyframes anLBLA { 0%, 94% { opacity: 0; } 3%, 22% { opacity: 1; } 25% { opacity: 0; } }

        /* 2. Backbone Line 1 Growth: Cluster A -> Hub AB (15% - 21%) */
        .bb-a1 { animation-name: growBBA1; }
        @keyframes growBBA1 { 0%, 15% { stroke-dashoffset: 200; opacity: 1; } 21%, 42% { stroke-dashoffset: 0; opacity: 1; } 45%, 100% { opacity: 0; stroke-dashoffset: 200; } }
        @keyframes pinABPop { 0%, 20% { opacity: 0; transform: scale(0); } 21%, 42% { opacity: 1; transform: scale(1); } 45%, 100% { opacity: 0; } }
        .pin-ab { animation-name: pinABPop; transform-origin: 232px 105px; }

        /* 3. Micro-Network AB Sprout One-by-One (21% - 35%) */
        .ab-l1 { animation-name: growABL1; stroke-dasharray: 80; stroke-dashoffset: 80; }
        @keyframes growABL1 { 0%, 21% { stroke-dashoffset: 80; opacity: 1; } 24%, 42% { stroke-dashoffset: 0; opacity: 0.8; } 45%, 100% { opacity: 0; } }
        .ab-c1 { animation-name: coreABC1; } @keyframes coreABC1 { 0%, 23% { opacity: 0; } 24%, 42% { opacity: 0.8; } 45%, 100% { opacity: 0; } }
        .ab-p1 { animation-name: plsAB1; } @keyframes plsAB1 { 0%, 23% { opacity: 0; transform: scale(1); } 25% { opacity: 0.5; } 30% { opacity: 0; transform: scale(4); } 100% { opacity: 0; } }

        .ab-l2 { animation-name: growABL2; stroke-dasharray: 80; stroke-dashoffset: 80; }
        @keyframes growABL2 { 0%, 25% { stroke-dashoffset: 80; opacity: 1; } 28%, 42% { stroke-dashoffset: 0; opacity: 0.8; } 45%, 100% { opacity: 0; } }
        .ab-c2 { animation-name: coreABC2; } @keyframes coreABC2 { 0%, 27% { opacity: 0; } 28%, 42% { opacity: 0.8; } 45%, 100% { opacity: 0; } }
        .ab-p2 { animation-name: plsAB2; } @keyframes plsAB2 { 0%, 27% { opacity: 0; transform: scale(1); } 29% { opacity: 0.5; } 34% { opacity: 0; transform: scale(4); } 100% { opacity: 0; } }

        .ab-l3 { animation-name: growABL3; stroke-dasharray: 80; stroke-dashoffset: 80; }
        @keyframes growABL3 { 0%, 29% { stroke-dashoffset: 80; opacity: 1; } 32%, 42% { stroke-dashoffset: 0; opacity: 0.8; } 45%, 100% { opacity: 0; } }
        .ab-c3 { animation-name: coreABC3; } @keyframes coreABC3 { 0%, 31% { opacity: 0; } 32%, 42% { opacity: 0.8; } 45%, 100% { opacity: 0; } }
        .ab-p3 { animation-name: plsAB3; } @keyframes plsAB3 { 0%, 31% { opacity: 0; transform: scale(1); } 33% { opacity: 0.5; } 38% { opacity: 0; transform: scale(4); } 100% { opacity: 0; } }

        /* 4. Backbone Line 2 Growth: Hub AB -> Cluster B (35% - 44%) */
        .bb-a2 { animation-name: growBBA2; }
        @keyframes growBBA2 { 0%, 35% { stroke-dashoffset: 200; opacity: 1; } 42%, 94% { stroke-dashoffset: 0; opacity: 1; } 96%, 100% { opacity: 0; } }

        /* 5. Cluster B Activation Peak (44% - 56%) */
        @keyframes ripB { 0%, 41% { opacity: 0; } 43% { opacity: 0.6; transform: scale(1); } 52% { opacity: 0; transform: scale(5); } 100% { opacity: 0; } }
        @keyframes anLBLB { 0%, 41% { opacity: 0; } 44%, 62% { opacity: 1; } 65%, 100% { opacity: 0; } }

        /* 6. Backbone Line 3 Growth: Cluster B -> Hub BC (56% - 64%) */
        .bb-b1 { animation-name: growBBB1; }
        @keyframes growBBB1 { 0%, 56% { stroke-dashoffset: 200; opacity: 1; } 63%, 88% { stroke-dashoffset: 0; opacity: 1; } 92%, 100% { opacity: 0; } }
        @keyframes pinBCPop { 0%, 61% { opacity: 0; transform: scale(0); } 63%, 88% { opacity: 1; transform: scale(1); } 92%, 100% { opacity: 0; } }
        .pin-bc { animation-name: pinBCPop; transform-origin: 552px 90px; }

        /* 7. Micro-Network BC Sprout One-by-One (64% - 78%) */
        .bc-l1 { animation-name: growBCL1; stroke-dasharray: 80; stroke-dashoffset: 80; }
        @keyframes growBCL1 { 0%, 64% { stroke-dashoffset: 80; opacity: 1; } 67%, 88% { stroke-dashoffset: 0; opacity: 0.8; } 91%, 100% { opacity: 0; } }
        .bc-c1 { animation-name: coreBCC1; } @keyframes coreBCC1 { 0%, 66% { opacity: 0; } 67%, 88% { opacity: 0.8; } 91%, 100% { opacity: 0; } }
        .bc-p1 { animation-name: plsBC1; } @keyframes plsBC1 { 0%, 66% { opacity: 0; transform: scale(1); } 68% { opacity: 0.5; } 73% { opacity: 0; transform: scale(4); } 100% { opacity: 0; } }

        .bc-l2 { animation-name: growBCL2; stroke-dasharray: 80; stroke-dashoffset: 80; }
        @keyframes growBCL2 { 0%, 68% { stroke-dashoffset: 80; opacity: 1; } 71%, 88% { stroke-dashoffset: 0; opacity: 0.8; } 91%, 100% { opacity: 0; } }
        .bc-c2 { animation-name: coreBCC2; } @keyframes coreBCC2 { 0%, 70% { opacity: 0; } 71%, 88% { opacity: 0.8; } 91%, 100% { opacity: 0; } }
        .bc-p2 { animation-name: plsBC2; } @keyframes plsBC2 { 0%, 70% { opacity: 0; transform: scale(1); } 72% { opacity: 0.5; } 77% { opacity: 0; transform: scale(4); } 100% { opacity: 0; } }

        .bc-l3 { animation-name: growBCL3; stroke-dasharray: 80; stroke-dashoffset: 80; }
        @keyframes growBCL3 { 0%, 72% { stroke-dashoffset: 80; opacity: 1; } 75%, 88% { stroke-dashoffset: 0; opacity: 0.8; } 91%, 100% { opacity: 0; } }
        .bc-c3 { animation-name: coreBCC3; } @keyframes coreBCC3 { 0%, 74% { opacity: 0; } 75%, 88% { opacity: 0.8; } 91%, 100% { opacity: 0; } }
        .bc-p3 { animation-name: plsBC3; } @keyframes plsBC3 { 0%, 74% { opacity: 0; transform: scale(1); } 76% { opacity: 0.5; } 81% { opacity: 0; transform: scale(4); } 100% { opacity: 0; } }

        /* 8. Backbone Line 4 Growth: Hub BC -> Cluster C (78% - 86%) */
        .bb-b2 { animation-name: growBBB2; }
        @keyframes growBBB2 { 0%, 78% { stroke-dashoffset: 200; opacity: 1; } 85%, 94% { stroke-dashoffset: 0; opacity: 1; } 96%, 100% { opacity: 0; } }

        /* 9. Final Landing Cluster C Wave (86% - 94%) */
        @keyframes ripC { 0%, 84% { opacity: 0; } 86% { opacity: 0.6; transform: scale(1); } 93% { opacity: 0; transform: scale(5); } 100% { opacity: 0; } }
        @keyframes anLBLC { 0%, 83% { opacity: 0; } 86%, 94% { opacity: 1; } 96%, 100% { opacity: 0; } }
      `}</style>
    </div>
  )
}