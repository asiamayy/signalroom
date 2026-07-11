'use client'

// A dense, clearly-visible triangulated mesh network sits as a constant
// ambient backdrop — always on screen, not tied to the narrative timing.
// Layered on top of it are four "concept" nodes (one per label below), each
// with its own soft glow, pulsing ring, and a hand-drawn connecting line
// into the mesh that traces in as that concept activates in sequence.
//
// One shared 32s @keyframes clock drives everything via percentage
// keyframes, so nothing can drift out of sync across loops. Each link uses
// `pathLength={100}` so the stroke-dasharray/dashoffset "draw-in" trick is
// exact regardless of each line's actual pixel length — without it, longer
// links render with a visible gap near the far end.

const MESH_NODES = [
  { cx: 30, cy: 80 }, { cx: 85, cy: 180 }, { cx: 140, cy: 50 },
  { cx: 180, cy: 140 }, { cx: 240, cy: 220 }, { cx: 275, cy: 90 },
  { cx: 335, cy: 160 }, { cx: 385, cy: 40 }, { cx: 430, cy: 120 },
  { cx: 485, cy: 200 }, { cx: 535, cy: 70 }, { cx: 580, cy: 150 },
  { cx: 620, cy: 90 }, { cx: 665, cy: 170 }, { cx: 655, cy: 45 },
]
const MESH_LINES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 3], [2, 5], [3, 4], [3, 5],
  [4, 6], [5, 6], [5, 7], [6, 8], [7, 8], [6, 9], [8, 9],
  [8, 10], [9, 11], [10, 11], [10, 12], [11, 13], [12, 13],
  [12, 14], [7, 5], [9, 6], [13, 11],
]

// a handful of ambient mesh nodes get an independent, staggered pulse — each
// with its own duration/delay so they never sync up, reading as scattered
// stylistic "activity" across the network rather than the narrative sequence
const PULSING_MESH: { idx: number; duration: string; delay: string }[] = [
  { idx: 1, duration: '4.2s', delay: '0.3s' },
  { idx: 4, duration: '5.1s', delay: '1.8s' },
  { idx: 7, duration: '3.6s', delay: '0.9s' },
  { idx: 10, duration: '4.8s', delay: '2.4s' },
  { idx: 13, duration: '3.9s', delay: '1.2s' },
]

// the four narrative concept nodes, matching the four labels below
const n = {
  a: { cx: 110, cy: 140 },
  b: { cx: 300, cy: 80 },
  p: { cx: 430, cy: 220 },
  c: { cx: 600, cy: 130 },
}

// each concept ties into three nearby mesh nodes, lit as it activates
const LINKS: { key: 'a' | 'b' | 'p' | 'c'; to: number }[] = [
  { key: 'a', to: 1 }, { key: 'a', to: 0 }, { key: 'a', to: 2 },
  { key: 'b', to: 5 }, { key: 'b', to: 3 }, { key: 'b', to: 6 },
  { key: 'p', to: 8 }, { key: 'p', to: 9 }, { key: 'p', to: 4 },
  { key: 'c', to: 11 }, { key: 'c', to: 10 }, { key: 'c', to: 12 },
]

export default function IntelligenceSignal() {
  return (
    <div className="relative w-full h-64 sm:h-64 mt-4">
      <svg viewBox="0 0 700 225" preserveAspectRatio="none" className="absolute top-0 left-0 w-full h-[80%]">
        <defs>
          <filter id="mesh-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
          </filter>
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
          </filter>
        </defs>

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
          {PULSING_MESH.map(({ idx, duration, delay }) => {
            const node = MESH_NODES[idx]
            return (
              <circle
                key={idx}
                cx={node.cx}
                cy={node.cy}
                r="2.25"
                className="mesh-node-pulse"
                style={{ animationDuration: duration, animationDelay: delay }}
              />
            )
          })}
        </g>

        {/* narrative links: each concept draws a connecting line into the mesh as it activates */}
        {LINKS.map(({ key, to }, idx) => (
          <line
            key={idx}
            x1={n[key].cx} y1={n[key].cy}
            x2={MESH_NODES[to].cx} y2={MESH_NODES[to].cy}
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset="100"
            className={`link link-${key}`}
          />
        ))}

        {/* the four concept nodes — each with a continuous pulsing ring once active */}
        <circle cx={n.a.cx} cy={n.a.cy} r="5" className="concept-pulse pulse-a" />
        <circle cx={n.a.cx} cy={n.a.cy} r="3.5" fill="#5F7A70" className="concept-node node-a" />

        <circle cx={n.b.cx} cy={n.b.cy} r="5" className="concept-pulse pulse-b" />
        <circle cx={n.b.cx} cy={n.b.cy} r="3.5" fill="#5F7A70" className="concept-node node-b" />

        <circle cx={n.p.cx} cy={n.p.cy} r="5" className="concept-pulse pulse-p" />
        <circle cx={n.p.cx} cy={n.p.cy} r="3.5" fill="#5F7A70" className="concept-node node-p" />

        <circle cx={n.c.cx} cy={n.c.cy} r="5" className="concept-pulse pulse-c" />
        <circle cx={n.c.cx} cy={n.c.cy} r="3.5" fill="#5F7A70" className="concept-node node-c" />
      </svg>

      <div className="absolute bottom-0 left-0 w-full h-[20%] flex items-start justify-between px-2 sm:px-4">
        <span className="signal-label label-a text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] max-w-[100px] sm:max-w-[130px] text-left" style={{ color: '#1A3024' }}>
          Customer expectation detected
        </span>
        <span className="signal-label label-b text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] whitespace-nowrap hidden sm:inline" style={{ color: '#1A3024' }}>
          Hidden objection
        </span>
        <span className="signal-label label-p text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] whitespace-nowrap hidden sm:inline" style={{ color: '#1A3024' }}>
          Pattern recognized
        </span>
        <span className="signal-label label-c text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] max-w-[100px] sm:max-w-[130px] text-right" style={{ color: '#1A3024' }}>
          Emerging opportunity
        </span>
      </div>

      <style jsx global>{`
        /* dense ambient mesh — always visible, clearly readable but recedes
           behind the narrative layer */
        .mesh-line { stroke: #8FA097; stroke-width: 0.85; opacity: 0.4; filter: url(#mesh-glow); }
        .mesh-node { fill: #8FA097; opacity: 0.55; }

        /* premium staggered pulse with a soft glow */
        .mesh-node-pulse {
          fill: #5F7A70;
          animation-name: meshNodePulse;
          animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
          animation-iteration-count: infinite;
          filter: url(#node-glow);
        }
        @keyframes meshNodePulse {
          0%, 100% { opacity: 0.4; r: 2.25; }
          50% { opacity: 0.9; r: 3.2; }
        }

        /* narrative links trace in with a trailing stroke, then hold, then fade */
        .link {
          stroke: #5F7A70;
          stroke-width: 1.25;
          stroke-linecap: round;
          opacity: 0;
          animation-duration: 32s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
        }
        .concept-node {
          opacity: 0.3;
          animation-duration: 32s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
          filter: url(#node-glow);
        }
        .concept-pulse {
          fill: none;
          stroke: #5F7A70;
          stroke-width: 1.25;
          stroke-linecap: round;
          opacity: 0;
          animation-duration: 32s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
        }
        .signal-label {
          opacity: 0;
          animation-duration: 32s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
          0%, 3% { opacity: 0.3; }
          12% { opacity: 0.6; }
          94% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        @keyframes pulseA {
          0%, 3% { opacity: 0; r: 5; }
          10% { opacity: 0.6; r: 5; }
          24% { opacity: 0; r: 21; }
          100% { opacity: 0; r: 5; }
        }
        @keyframes linkA {
          0%, 8% { opacity: 0; stroke-dashoffset: 100; }
          14% { opacity: 0.55; stroke-dashoffset: 0; }
          94% { opacity: 0.55; stroke-dashoffset: 0; }
          100% { opacity: 0; stroke-dashoffset: 0; }
        }
        @keyframes labelA {
          0%, 14% { opacity: 0; }
          17% { opacity: 1; }
          24% { opacity: 1; }
          28% { opacity: 0; }
          100% { opacity: 0; }
        }

        /* ── concept B ── */
        @keyframes nodeB {
          0%, 28% { opacity: 0.3; }
          37% { opacity: 0.6; }
          94% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        @keyframes pulseB {
          0%, 28% { opacity: 0; r: 5; }
          33% { opacity: 0.6; r: 5; }
          47% { opacity: 0; r: 21; }
          100% { opacity: 0; r: 5; }
        }
        @keyframes linkB {
          0%, 33% { opacity: 0; stroke-dashoffset: 100; }
          40% { opacity: 0.55; stroke-dashoffset: 0; }
          94% { opacity: 0.55; stroke-dashoffset: 0; }
          100% { opacity: 0; stroke-dashoffset: 0; }
        }
        @keyframes labelB {
          0%, 39% { opacity: 0; }
          43% { opacity: 1; }
          50% { opacity: 1; }
          54% { opacity: 0; }
          100% { opacity: 0; }
        }

        /* ── concept P (pattern recognized) ── */
        @keyframes nodeP {
          0%, 53% { opacity: 0.3; }
          62% { opacity: 0.6; }
          94% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        @keyframes pulseP {
          0%, 53% { opacity: 0; r: 5; }
          59% { opacity: 0.6; r: 5; }
          73% { opacity: 0; r: 21; }
          100% { opacity: 0; r: 5; }
        }
        @keyframes linkP {
          0%, 59% { opacity: 0; stroke-dashoffset: 100; }
          67% { opacity: 0.55; stroke-dashoffset: 0; }
          94% { opacity: 0.55; stroke-dashoffset: 0; }
          100% { opacity: 0; stroke-dashoffset: 0; }
        }
        @keyframes labelPr {
          0%, 65% { opacity: 0; }
          69% { opacity: 1; }
          75% { opacity: 1; }
          79% { opacity: 0; }
          100% { opacity: 0; }
        }

        /* ── concept C: the sequence completes ── */
        @keyframes nodeC {
          0%, 78% { opacity: 0.3; }
          87% { opacity: 0.6; }
          94% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        @keyframes pulseC {
          0%, 78% { opacity: 0; r: 5; }
          84% { opacity: 0.6; r: 5; }
          98% { opacity: 0; r: 21; }
          100% { opacity: 0; r: 5; }
        }
        @keyframes linkC {
          0%, 84% { opacity: 0; stroke-dashoffset: 100; }
          92% { opacity: 0.55; stroke-dashoffset: 0; }
          99% { opacity: 0.55; stroke-dashoffset: 0; }
          100% { opacity: 0; stroke-dashoffset: 0; }
        }
        @keyframes labelC {
          0%, 91% { opacity: 0; }
          94% { opacity: 1; }
          98% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
