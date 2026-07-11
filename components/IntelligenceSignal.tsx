'use client'

// A dense, clearly-visible triangulated mesh network (matching the reference
// "polygon network" style) sits as a constant ambient backdrop — always on
// screen, not tied to the narrative timing. Layered on top of it are four
// "concept" nodes (one per label below), each with its own pulsing ring and
// a highlighted connection into the mesh that lights up as that concept
// activates in sequence, so the mesh reads as a living, richly-connected
// network rather than a single line or a sparse, barely-visible scatter.
//
// One shared 19s @keyframes clock drives the four concept nodes' opacity via
// percentage keyframes, so nothing can drift out of sync across loops. The
// ambient mesh itself is static (always visible) — that's what gives the
// graphic its density; the animated layer is the narrative on top of it.

// dense ambient mesh — always visible, forms the triangulated backdrop
const MESH_NODES = [
  { cx: 25, cy: 55 }, { cx: 65, cy: 145 }, { cx: 115, cy: 35 },
  { cx: 150, cy: 105 }, { cx: 195, cy: 165 }, { cx: 228, cy: 65 },
  { cx: 278, cy: 125 }, { cx: 318, cy: 25 }, { cx: 358, cy: 88 },
  { cx: 405, cy: 155 }, { cx: 448, cy: 45 }, { cx: 488, cy: 118 },
  { cx: 528, cy: 58 }, { cx: 565, cy: 138 }, { cx: 555, cy: 30 },
]
const MESH_LINES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 3], [2, 5], [3, 4], [3, 5],
  [4, 6], [5, 6], [5, 7], [6, 8], [7, 8], [6, 9], [8, 9],
  [8, 10], [9, 11], [10, 11], [10, 12], [11, 13], [12, 13],
  [12, 14], [7, 5], [9, 6], [13, 11],
]

// the four narrative concept nodes, matching the four labels below
const n = {
  a: { cx: 80, cy: 100 },
  b: { cx: 248, cy: 45 },
  p: { cx: 358, cy: 140 },
  c: { cx: 505, cy: 85 },
}

export default function IntelligenceSignal() {
  return (
    <div className="relative w-full h-32 sm:h-28 mt-4">
      <svg viewBox="0 0 600 190" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-[75%]">

        {/* dense ambient mesh — always on, gives the graphic its density */}
        <g className="mesh">
          {MESH_LINES.map(([i, j], idx) => (
            <line
              key={idx}
              x1={MESH_NODES[i].cx} y1={MESH_NODES[i].cy}
              x2={MESH_NODES[j].cx} y2={MESH_NODES[j].cy}
              className="mesh-line"
            />
          ))}
          {MESH_NODES.map((node, idx) => (
            <circle key={idx} cx={node.cx} cy={node.cy} r="2.25" className="mesh-node" />
          ))}
        </g>

        {/* narrative links: each concept ties into two nearby mesh nodes, lit as it activates */}
        <line x1={n.a.cx} y1={n.a.cy} x2={MESH_NODES[1].cx} y2={MESH_NODES[1].cy} className="link link-a" />
        <line x1={n.a.cx} y1={n.a.cy} x2={MESH_NODES[3].cx} y2={MESH_NODES[3].cy} className="link link-a" />
        <line x1={n.b.cx} y1={n.b.cy} x2={MESH_NODES[5].cx} y2={MESH_NODES[5].cy} className="link link-b" />
        <line x1={n.b.cx} y1={n.b.cy} x2={MESH_NODES[7].cx} y2={MESH_NODES[7].cy} className="link link-b" />
        <line x1={n.p.cx} y1={n.p.cy} x2={MESH_NODES[9].cx} y2={MESH_NODES[9].cy} className="link link-p" />
        <line x1={n.p.cx} y1={n.p.cy} x2={MESH_NODES[10].cx} y2={MESH_NODES[10].cy} className="link link-p" />
        <line x1={n.c.cx} y1={n.c.cy} x2={MESH_NODES[11].cx} y2={MESH_NODES[11].cy} className="link link-c" />
        <line x1={n.c.cx} y1={n.c.cy} x2={MESH_NODES[12].cx} y2={MESH_NODES[12].cy} className="link link-c" />

        {/* the four concept nodes — each with a continuous pulsing ring once active */}
        <circle cx={n.a.cx} cy={n.a.cy} r="5" className="concept-pulse pulse-a" style={{ transformOrigin: `${n.a.cx}px ${n.a.cy}px` }} />
        <circle cx={n.a.cx} cy={n.a.cy} r="3.5" fill="#5F7A70" className="concept-node node-a" />

        <circle cx={n.b.cx} cy={n.b.cy} r="5" className="concept-pulse pulse-b" style={{ transformOrigin: `${n.b.cx}px ${n.b.cy}px` }} />
        <circle cx={n.b.cx} cy={n.b.cy} r="3.5" fill="#5F7A70" className="concept-node node-b" />

        <circle cx={n.p.cx} cy={n.p.cy} r="5" className="concept-pulse pulse-p" style={{ transformOrigin: `${n.p.cx}px ${n.p.cy}px` }} />
        <circle cx={n.p.cx} cy={n.p.cy} r="3.5" fill="#5F7A70" className="concept-node node-p" />

        <circle cx={n.c.cx} cy={n.c.cy} r="5" className="concept-pulse pulse-c" style={{ transformOrigin: `${n.c.cx}px ${n.c.cy}px` }} />
        <circle cx={n.c.cx} cy={n.c.cy} r="3.5" fill="#5F7A70" className="concept-node node-c" />
      </svg>

      <div className="absolute bottom-0 left-0 w-full h-[25%] flex items-start justify-between px-2 sm:px-4">
        <span className="signal-label label-a text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] max-w-[100px] sm:max-w-none sm:whitespace-nowrap text-left" style={{ color: '#1A3024' }}>
          Customer expectation detected
        </span>
        <span className="signal-label label-b text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] whitespace-nowrap hidden sm:inline" style={{ color: '#1A3024' }}>
          Hidden objection
        </span>
        <span className="signal-label label-p text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] whitespace-nowrap hidden sm:inline" style={{ color: '#1A3024' }}>
          Pattern recognized
        </span>
        <span className="signal-label label-c text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] max-w-[100px] sm:max-w-none sm:whitespace-nowrap text-right" style={{ color: '#1A3024' }}>
          Emerging opportunity
        </span>
      </div>

      <style jsx global>{`
        /* dense ambient mesh — always visible, clearly readable but recedes
           behind the narrative layer */
        .mesh-line { stroke: #8FA097; stroke-width: 0.85; opacity: 0.4; }
        .mesh-node { fill: #8FA097; opacity: 0.55; }

        .link {
          stroke: #5F7A70;
          stroke-width: 1.25;
          opacity: 0;
          animation-duration: 19s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .concept-node {
          opacity: 0.3;
          animation-duration: 19s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .concept-pulse {
          fill: none;
          stroke: #5F7A70;
          stroke-width: 1.25;
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
        }

        .link-a { animation-name: linkA; }
        .link-b { animation-name: linkB; }
        .link-p { animation-name: linkP; }
        .link-c { animation-name: linkC; }
        .node-a { animation-name: nodeA; }
        .node-b { animation-name: nodeB; }
        .node-p { animation-name: nodeP; }
        .node-c { animation-name: nodeC; }
        .pulse-a { animation-name: pulseA; }
        .pulse-b { animation-name: pulseB; }
        .pulse-p { animation-name: pulseP; }
        .pulse-c { animation-name: pulseC; }
        .label-a { animation-name: labelA; }
        .label-b { animation-name: labelB; }
        .label-p { animation-name: labelPr; }
        .label-c { animation-name: labelC; }

        /* ── concept A: opens the sequence ── */
        @keyframes nodeA {
          0% { opacity: 0.3; transform: scale(1); }
          3% { opacity: 0.75; transform: scale(1.3); }
          10% { opacity: 0.55; transform: scale(1); }
          94% { opacity: 0.55; transform: scale(1); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        @keyframes pulseA {
          0%, 2% { opacity: 0; transform: scale(1); }
          3% { opacity: 0.5; transform: scale(1); }
          11% { opacity: 0; transform: scale(4); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes linkA {
          0%, 6% { opacity: 0; }
          8% { opacity: 0.55; }
          94% { opacity: 0.55; }
          100% { opacity: 0; }
        }
        @keyframes labelA {
          0%, 15% { opacity: 0; }
          18% { opacity: 1; }
          25% { opacity: 1; }
          29% { opacity: 0; }
          100% { opacity: 0; }
        }

        /* ── concept B ── */
        @keyframes nodeB {
          0%, 20% { opacity: 0.3; transform: scale(1); }
          23% { opacity: 0.75; transform: scale(1.3); }
          30% { opacity: 0.55; transform: scale(1); }
          94% { opacity: 0.55; transform: scale(1); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        @keyframes pulseB {
          0%, 22% { opacity: 0; transform: scale(1); }
          23% { opacity: 0.5; transform: scale(1); }
          31% { opacity: 0; transform: scale(4); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes linkB {
          0%, 26% { opacity: 0; }
          28% { opacity: 0.55; }
          94% { opacity: 0.55; }
          100% { opacity: 0; }
        }
        @keyframes labelB {
          0%, 39% { opacity: 0; }
          42% { opacity: 1; }
          49% { opacity: 1; }
          53% { opacity: 0; }
          100% { opacity: 0; }
        }

        /* ── concept P (pattern recognized) ── */
        @keyframes nodeP {
          0%, 42% { opacity: 0.3; transform: scale(1); }
          45% { opacity: 0.75; transform: scale(1.3); }
          52% { opacity: 0.55; transform: scale(1); }
          94% { opacity: 0.55; transform: scale(1); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        @keyframes pulseP {
          0%, 44% { opacity: 0; transform: scale(1); }
          45% { opacity: 0.5; transform: scale(1); }
          53% { opacity: 0; transform: scale(4); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes linkP {
          0%, 48% { opacity: 0; }
          50% { opacity: 0.55; }
          94% { opacity: 0.55; }
          100% { opacity: 0; }
        }
        @keyframes labelPr {
          0%, 55% { opacity: 0; }
          58% { opacity: 1; }
          65% { opacity: 1; }
          69% { opacity: 0; }
          100% { opacity: 0; }
        }

        /* ── concept C: the sequence completes ── */
        @keyframes nodeC {
          0%, 66% { opacity: 0.3; transform: scale(1); }
          69% { opacity: 0.75; transform: scale(1.3); }
          76% { opacity: 0.55; transform: scale(1); }
          94% { opacity: 0.55; transform: scale(1); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        @keyframes pulseC {
          0%, 68% { opacity: 0; transform: scale(1); }
          69% { opacity: 0.5; transform: scale(1); }
          77% { opacity: 0; transform: scale(4); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes linkC {
          0%, 72% { opacity: 0; }
          74% { opacity: 0.55; }
          94% { opacity: 0.55; }
          100% { opacity: 0; }
        }
        @keyframes labelC {
          0%, 79% { opacity: 0; }
          82% { opacity: 1; }
          91% { opacity: 1; }
          94% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
