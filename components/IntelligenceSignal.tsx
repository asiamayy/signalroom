'use client'

import { useEffect, useRef, useState } from 'react'

// Simplified sequential node animation — prototype.
//
// Node 1 is measured live off `anchorRef` (pass it to the "N" span in your
// "Now you can ask." headline) so it always sits directly beneath the N, at
// any viewport width. Nodes 2–4 are laid out in even horizontal strides
// from there — down-right, a shorter up-right hop, then flat across —
// mirroring a line chart's rhythm. Each node lights up and stays lit once
// the line reaches it; the whole chain holds, fades together, and loops.
//
// Usage in the page:
//
//   const nRef = useRef<HTMLSpanElement>(null)
//   ...
//   <span ref={nRef}>N</span>ow you can ask.
//   ...
//   <IntelligenceSignal anchorRef={nRef} />

type Point = { x: number; y: number }

const LABELS = [
  'Customer expectation detected',
  'Hidden objection',
  'Pattern recognized',
  'Emerging opportunity',
] as const

interface IntelligenceSignalProps {
  anchorRef: React.RefObject<HTMLElement | null>
}

export default function IntelligenceSignal({ anchorRef }: IntelligenceSignalProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 960, h: 340 })
  const [pts, setPts] = useState<{ A: Point; B: Point; C: Point; D: Point }>({
    A: { x: 80, y: 46 },
    B: { x: 310, y: 166 },
    C: { x: 540, y: 116 },
    D: { x: 770, y: 116 },
  })

  useEffect(() => {
    function place() {
      const wrap = wrapRef.current
      const anchor = anchorRef.current
      if (!wrap || !anchor) return

      const wrapRect = wrap.getBoundingClientRect()
      const w = wrapRect.width
      const h = wrapRect.height
      setBox({ w, h })

      const nRect = anchor.getBoundingClientRect()
      const ax = nRect.left + nRect.width / 2 - wrapRect.left
      const ay = 46

      // even horizontal strides, like the x-axis intervals on a line chart —
      // only the y-offsets change to draw the down / short-rise / flat shape
      const step = Math.min(230, (w - ax - 60) / 3)

      const bx = ax + step, by = ay + 120
      const cx = bx + step, cy = by - 50
      const dx = cx + step, dy = cy

      setPts({
        A: { x: ax, y: ay },
        B: { x: bx, y: by },
        C: { x: cx, y: cy },
        D: { x: dx, y: dy },
      })
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchorRef])

  const nodes = [
    { key: 'a', pt: pts.A, label: LABELS[0], labelSide: 'below' as const },
    { key: 'b', pt: pts.B, label: LABELS[1], labelSide: 'below' as const },
    { key: 'c', pt: pts.C, label: LABELS[2], labelSide: 'above' as const },
    { key: 'd', pt: pts.D, label: LABELS[3], labelSide: 'above' as const },
  ]

  const links = [
    { key: 'a', from: pts.A, to: pts.B },
    { key: 'b', from: pts.B, to: pts.C },
    { key: 'c', from: pts.C, to: pts.D },
  ]

  return (
    <div ref={wrapRef} className="relative w-full h-[340px] mt-4">
      <svg viewBox={`0 0 ${box.w} ${box.h}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" />
          </filter>
        </defs>

        {links.map(({ key, from, to }) => (
          <line
            key={key}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset="100"
            className={`link link-${key}`}
          />
        ))}

        {nodes.map(({ key, pt }) => (
          <circle key={`halo-${key}`} cx={pt.x} cy={pt.y} r="11" className="node-halo" />
        ))}

        {nodes.map(({ key, pt }) => (
          <g key={key}>
            <circle
              cx={pt.x} cy={pt.y} r="9"
              className={`concept-pulse pulse-${key}`}
            />
            <circle
              cx={pt.x} cy={pt.y} r="6.5" fill="#5F7A70"
              className={`concept-node node-${key}`}
            />
          </g>
        ))}
      </svg>

      {nodes.map(({ key, pt, label, labelSide }) => (
        <span
          key={key}
          className={`signal-label label-${key} absolute text-[10px] font-medium uppercase tracking-[0.14em] whitespace-nowrap`}
          style={{
            color: '#1A3024',
            left: pt.x,
            top: labelSide === 'below' ? pt.y + 20 : pt.y - 34,
            transform: 'translateX(-50%)',
          }}
        >
          {label}
        </span>
      ))}

      <style jsx global>{`
        .node-halo { fill: #FCFCFB; }

        .link {
          stroke: #5F7A70;
          stroke-width: 1.75;
          stroke-linecap: round;
          opacity: 0;
          animation-duration: 24s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
        }
        .concept-node {
          opacity: 0.28;
          animation-duration: 24s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
          filter: url(#node-glow);
        }
        .concept-pulse {
          fill: none;
          stroke: #5F7A70;
          stroke-width: 1.75;
          stroke-linecap: round;
          opacity: 0;
          animation-duration: 24s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
        }
        .signal-label {
          opacity: 0;
          pointer-events: none;
          animation-duration: 24s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-iteration-count: infinite;
        }

        .link-a { animation-name: linkA; }
        .link-b { animation-name: linkB; }
        .link-c { animation-name: linkC; }
        .node-a { animation-name: nodeA; }
        .node-b { animation-name: nodeB; }
        .node-c { animation-name: nodeC; }
        .node-d { animation-name: nodeD; }
        .pulse-a { animation-name: pulseA; }
        .pulse-b { animation-name: pulseB; }
        .pulse-c { animation-name: pulseC; }
        .pulse-d { animation-name: pulseD; }
        .label-a { animation-name: labelA; }
        .label-b { animation-name: labelB; }
        .label-c { animation-name: labelC; }
        .label-d { animation-name: labelD; }

        /* ── node 1: opens the sequence immediately ── */
        @keyframes nodeA {
          0%, 3%  { opacity: 0.28; }
          10%     { opacity: 0.85; }
          88%     { opacity: 0.85; }
          100%    { opacity: 0.28; }
        }
        @keyframes pulseA {
          0%, 3%  { opacity: 0; r: 9; }
          9%      { opacity: 0.6; r: 9; }
          22%     { opacity: 0; r: 40; }
          100%    { opacity: 0; r: 9; }
        }
        @keyframes labelA {
          0%, 12% { opacity: 0; }
          16%     { opacity: 1; }
          22%     { opacity: 1; }
          26%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes linkA {
          0%, 9%  { opacity: 0; stroke-dashoffset: 100; }
          18%     { opacity: 0.6; stroke-dashoffset: 0; }
          88%     { opacity: 0.6; stroke-dashoffset: 0; }
          100%    { opacity: 0; stroke-dashoffset: 0; }
        }

        /* ── node 2: down-right ── */
        @keyframes nodeB {
          0%, 27% { opacity: 0.28; }
          34%     { opacity: 0.85; }
          88%     { opacity: 0.85; }
          100%    { opacity: 0.28; }
        }
        @keyframes pulseB {
          0%, 27% { opacity: 0; r: 9; }
          33%     { opacity: 0.6; r: 9; }
          46%     { opacity: 0; r: 40; }
          100%    { opacity: 0; r: 9; }
        }
        @keyframes labelB {
          0%, 36% { opacity: 0; }
          40%     { opacity: 1; }
          46%     { opacity: 1; }
          50%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes linkB {
          0%, 33% { opacity: 0; stroke-dashoffset: 100; }
          42%     { opacity: 0.6; stroke-dashoffset: 0; }
          88%     { opacity: 0.6; stroke-dashoffset: 0; }
          100%    { opacity: 0; stroke-dashoffset: 0; }
        }

        /* ── node 3: short up-right hop ── */
        @keyframes nodeC {
          0%, 51% { opacity: 0.28; }
          58%     { opacity: 0.85; }
          88%     { opacity: 0.85; }
          100%    { opacity: 0.28; }
        }
        @keyframes pulseC {
          0%, 51% { opacity: 0; r: 9; }
          57%     { opacity: 0.6; r: 9; }
          70%     { opacity: 0; r: 40; }
          100%    { opacity: 0; r: 9; }
        }
        @keyframes labelC {
          0%, 60% { opacity: 0; }
          64%     { opacity: 1; }
          70%     { opacity: 1; }
          74%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes linkC {
          0%, 57% { opacity: 0; stroke-dashoffset: 100; }
          66%     { opacity: 0.6; stroke-dashoffset: 0; }
          88%     { opacity: 0.6; stroke-dashoffset: 0; }
          100%    { opacity: 0; stroke-dashoffset: 0; }
        }

        /* ── node 4: flat across, sequence closes ── */
        @keyframes nodeD {
          0%, 75% { opacity: 0.28; }
          82%     { opacity: 0.85; }
          90%     { opacity: 0.85; }
          100%    { opacity: 0.28; }
        }
        @keyframes pulseD {
          0%, 75% { opacity: 0; r: 9; }
          81%     { opacity: 0.6; r: 9; }
          94%     { opacity: 0; r: 40; }
          100%    { opacity: 0; r: 9; }
        }
        @keyframes labelD {
          0%, 84% { opacity: 0; }
          88%     { opacity: 1; }
          94%     { opacity: 1; }
          98%     { opacity: 0; }
          100%    { opacity: 0; }
        }
      `}</style>
    </div>
  )
}