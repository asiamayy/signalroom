'use client'

import { useEffect, useRef, useState } from 'react';

/**
 * Refined signal-flow animation that sits behind the hero interview card.
 * Upgraded from the original 3-path SVG: a richer mesh of flowing signal
 * lines with gradient strokes, glowing pulse dots that travel the paths,
 * soft ambient glow, and gentle mouse parallax — all in the brand palette.
 */
export default function HeroSignalNetwork({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setParallax({ x: nx * 24, y: ny * 18 }));
    };
    const handleLeave = () => setParallax({ x: 0, y: 0 });

    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  // Signal paths — organic curves radiating from the right side (near the card)
  const paths = [
    { d: 'M 760 120 Q 580 180 640 320 T 580 540', dur: '9s', delay: '0s', dash: '180 520', w: 1.6, op: 0.22 },
    { d: 'M 720 60  Q 520 200 600 360 T 520 560',  dur: '13s', delay: '-2s', dash: '140 420', w: 1.2, op: 0.16 },
    { d: 'M 680 180 Q 440 120 520 300 T 460 520',  dur: '11s', delay: '-4s', dash: '220 660', w: 2,   op: 0.10 },
    { d: 'M 800 240 Q 620 280 680 420 T 620 580',  dur: '15s', delay: '-1s', dash: '120 360', w: 1,   op: 0.18 },
    { d: 'M 740 340 Q 560 300 600 460 T 540 600',  dur: '10s', delay: '-3s', dash: '160 480', w: 1.4, op: 0.14 },
    { d: 'M 700 100 Q 480 240 560 400 T 500 580',  dur: '17s', delay: '-5s', dash: '200 600', w: 1.8, op: 0.08 },
  ];

  // Pulse dots that travel along select paths
  const pulses = [
    { pathIdx: 0, dur: '9s',   delay: '0s',   r: 3.5, color: '#1A3024', op: 0.55 },
    { pathIdx: 1, dur: '13s',  delay: '-4s',  r: 2.5, color: '#5A7973', op: 0.45 },
    { pathIdx: 3, dur: '15s',  delay: '-7s',  r: 2,   color: '#1A3024', op: 0.40 },
    { pathIdx: 4, dur: '10s',  delay: '-2s',  r: 3,   color: '#5A7973', op: 0.50 },
    { pathIdx: 0, dur: '9s',   delay: '-4.5s', r: 2,  color: '#5A7973', op: 0.35 },
    { pathIdx: 2, dur: '11s',  delay: '-6s',  r: 2.5, color: '#1A3024', op: 0.30 },
  ];

  return (
    <div ref={containerRef} className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}>
      {/* Ambient soft glow anchored near the card */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '55%', height: '70%', right: '2%', top: '10%',
          background: 'radial-gradient(circle, rgba(90,121,115,0.10) 0%, rgba(90,121,115,0) 70%)',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        style={{
          transform: `translate(${parallax.x}px, ${parallax.y}px)`,
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <defs>
          <linearGradient id="signal-fade" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A3024" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#5A7973" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1A3024" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="signal-fade-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5A7973" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1A3024" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="pulse-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5A7973" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#5A7973" stopOpacity="0" />
          </radialGradient>
          <filter id="soft-blur"><feGaussianBlur stdDeviation="0.6" /></filter>
        </defs>

        {/* Static faint mesh lines for depth */}
        <g stroke="#1A3024" fill="none" opacity="0.05">
          <path d="M 800 80 Q 500 150 600 300 T 450 550" strokeWidth="0.8" />
          <path d="M 750 200 Q 450 250 550 400 T 400 580" strokeWidth="0.8" />
          <path d="M 800 350 Q 550 320 620 460 T 500 600" strokeWidth="0.8" />
        </g>

        {/* Flowing signal paths */}
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={i % 2 === 0 ? 'url(#signal-fade)' : 'url(#signal-fade-2)'}
            strokeWidth={p.w}
            strokeDasharray={p.dash}
            strokeLinecap="round"
            opacity={p.op}
            filter="url(#soft-blur)"
          >
            <animate
              attributeName="stroke-dashoffset"
              dur={p.dur}
              from={p.dash.split(' ').map(Number).reduce((a, b) => a + b, 0)}
              to="0"
              repeatCount="indefinite"
              begin={p.delay}
            />
          </path>
        ))}

        {/* Crisp accent paths (no blur) for contrast */}
        {paths.slice(0, 3).map((p, i) => (
          <path
            key={`crisp-${i}`}
            d={p.d}
            fill="none"
            stroke="#1A3024"
            strokeWidth={p.w * 0.5}
            strokeDasharray={p.dash}
            strokeLinecap="round"
            opacity={p.op * 0.5}
          >
            <animate
              attributeName="stroke-dashoffset"
              dur={p.dur}
              from={p.dash.split(' ').map(Number).reduce((a, b) => a + b, 0)}
              to="0"
              repeatCount="indefinite"
              begin={p.delay}
            />
          </path>
        ))}

        {/* Glowing pulse dots traveling along paths */}
        {pulses.map((pulse, i) => {
          const path = paths[pulse.pathIdx];
          return (
            <g key={`pulse-${i}`}>
              {/* glow halo */}
              <circle r={pulse.r * 3} fill="url(#pulse-glow)" opacity={pulse.op * 0.6}>
                <animateMotion dur={pulse.dur} path={path.d} repeatCount="indefinite" begin={pulse.delay} />
              </circle>
              {/* core dot */}
              <circle r={pulse.r} fill={pulse.color} opacity={pulse.op}>
                <animateMotion dur={pulse.dur} path={path.d} repeatCount="indefinite" begin={pulse.delay} />
              </circle>
            </g>
          );
        })}

        {/* Static node anchors at path origins (near card edge) */}
        {[
          { cx: 760, cy: 120, r: 3 },
          { cx: 720, cy: 60, r: 2 },
          { cx: 680, cy: 180, r: 2.5 },
          { cx: 800, cy: 240, r: 2 },
          { cx: 740, cy: 340, r: 3 },
          { cx: 700, cy: 100, r: 2 },
        ].map((n, i) => (
          <g key={`node-${i}`}>
            <circle cx={n.cx} cy={n.cy} r={n.r * 2.5} fill="#5A7973" opacity="0.12">
              <animate
                attributeName="r"
                values={`${n.r * 2};${n.r * 3.5};${n.r * 2}`}
                dur={`${4 + i * 0.7}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.08;0.2;0.08"
                dur={`${4 + i * 0.7}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={n.cx} cy={n.cy} r={n.r} fill="#1A3024" opacity="0.35" />
          </g>
        ))}
      </svg>
    </div>
  );
}
