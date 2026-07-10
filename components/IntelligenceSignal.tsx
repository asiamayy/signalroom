'use client'

// Full-scale, high-visibility structural configuration.
// Perfect uniform cluster shapes: Cluster 1 (V) | Cluster 2 (<) | Cluster 3 (^)
// Gradual, highly visible intermediate branching micro-networks between nodes.

const d = {
  // Cluster 1: V
  a1: { cx: 80, cy: 190 }, a2: { cx: 130, cy: 280 }, a3: { cx: 180, cy: 190 },
  // Cluster 2: < 
  b1: { cx: 550, cy: 40 }, b2: { cx: 500, cy: 180 }, b3: { cx: 550, cy: 320 },
  // Cluster 3: ^
  c1: { cx: 820, cy: 280 }, c2: { cx: 870, cy: 190 }, c3: { cx: 920, cy: 280 },
  // Hubs (Adjusted for the mountain shape)
  hubAB: { cx: 320, cy: 180 }, hubBC: { cx: 680, cy: 180 },
  // Branches
  abScat1: { cx: 280, cy: 250 }, abScat2: { cx: 360, cy: 250 }, abScat3: { cx: 320, cy: 80 },
  bcScat1: { cx: 640, cy: 250 }, bcScat2: { cx: 720, cy: 250 }, bcScat3: { cx: 680, cy: 80 }
}

export default function IntelligenceSignal() {
  return (
    <div className="relative w-full h-[400px] overflow-visible bg-transparent">
      <svg viewBox="0 0 1000 380" className="absolute top-0 left-0 w-full h-full overflow-visible" style={{ stroke: '#AAB0A3', fill: '#AAB0A3' }}>
        
        {/* Hubs */}
        <g className="hub1">
          <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="18" className="hub-ring" />
          <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="10" className="hub-pulse" />
          <circle cx={d.hubAB.cx} cy={d.hubAB.cy} r="6" className="hub-core" />
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat1.cx} y2={d.abScat1.cy} className="hub-line hl1a" />
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat2.cx} y2={d.abScat2.cy} className="hub-line hl1b" />
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.abScat3.cx} y2={d.abScat3.cy} className="hub-line hl1c" />
        </g>

        <g className="hub2">
          <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="18" className="hub-ring" />
          <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="10" className="hub-pulse" />
          <circle cx={d.hubBC.cx} cy={d.hubBC.cy} r="6" className="hub-core" />
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat1.cx} y2={d.bcScat1.cy} className="hub-line hl2a" />
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat2.cx} y2={d.bcScat2.cy} className="hub-line hl2b" />
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.bcScat3.cx} y2={d.bcScat3.cy} className="hub-line hl2c" />
        </g>

        {/* Backbone */}
        <g className="main-line">
          <line x1={d.a2.cx} y1={d.a2.cy} x2={d.hubAB.cx} y2={d.hubAB.cy} />
          <line x1={d.hubAB.cx} y1={d.hubAB.cy} x2={d.b2.cx} y2={d.b2.cy} />
          <line x1={d.b2.cx} y1={d.b2.cy} x2={d.hubBC.cx} y2={d.hubBC.cy} />
          <line x1={d.hubBC.cx} y1={d.hubBC.cy} x2={d.c2.cx} y2={d.c2.cy} />
        </g>

        {/* Clusters */}
        <g className="cluster">
          <line x1={d.a1.cx} y1={d.a1.cy} x2={d.a2.cx} y2={d.a2.cy} className="cluster-wire" />
          <line x1={d.a2.cx} y1={d.a2.cy} x2={d.a3.cx} y2={d.a3.cy} className="cluster-wire" />
          <circle cx={d.a2.cx} cy={d.a2.cy} r="8" className="pulse" />
          <circle cx={d.a2.cx} cy={d.a2.cy} r="5" />
          <circle cx={d.a1.cx} cy={d.a1.cy} r="5" />
          <circle cx={d.a3.cx} cy={d.a3.cy} r="5" />
          <text x={d.a2.cx} y={d.a2.cy + 60} textAnchor="middle" className="cluster-label">CUSTOMER EXPECTATION DETECTED</text>
        </g>

        <g className="cluster">
          <line x1={d.b1.cx} y1={d.b1.cy} x2={d.b2.cx} y2={d.b2.cy} className="cluster-wire" />
          <line x1={d.b2.cx} y1={d.b2.cy} x2={d.b3.cx} y2={d.b3.cy} className="cluster-wire" />
          <circle cx={d.b2.cx} cy={d.b2.cy} r="8" className="pulse" />
          <circle cx={d.b2.cx} cy={d.b2.cy} r="5" />
          <circle cx={d.b1.cx} cy={d.b1.cy} r="5" />
          <circle cx={d.b3.cx} cy={d.b3.cy} r="5" />
          <text x={d.b2.cx} y={d.b1.cy - 20} textAnchor="middle" className="cluster-label">HIDDEN OBJECTION</text>
        </g>

        <g className="cluster">
          <line x1={d.c1.cx} y1={d.c1.cy} x2={d.c2.cx} y2={d.c2.cy} className="cluster-wire" />
          <line x1={d.c2.cx} y1={d.c2.cy} x2={d.c3.cx} y2={d.c3.cy} className="cluster-wire" />
          <circle cx={d.c2.cx} cy={d.c2.cy} r="8" className="pulse" />
          <circle cx={d.c2.cx} cy={d.c2.cy} r="5" />
          <circle cx={d.c1.cx} cy={d.c1.cy} r="5" />
          <circle cx={d.c3.cx} cy={d.c3.cy} r="5" />
          <text x={d.c2.cx} y={d.c2.cy + 60} textAnchor="middle" className="cluster-label">EMERGING OPPORTUNITY</text>
        </g>
      </svg>

      <style jsx>{`
        .hub-ring { fill: none; stroke: #AAB0A3; stroke-width: 1; opacity: .6; animation: ringExpand 2.8s ease-out infinite; }
        @keyframes ringExpand { 0% { opacity: .8; transform: scale(.5); } 100% { opacity: 0; transform: scale(2.5); } }
        
        .hub1 { animation: hub1-anim 19s infinite, hubGrow 3s ease-in-out infinite; }
        .hub2 { animation: hub2-anim 19s infinite, hubGrow 3s ease-in-out infinite; }
        @keyframes hubGrow { 0% { transform: scale(.3); } 25% { transform: scale(1.4); } 45% { transform: scale(1); } 65% { transform: scale(1.2); } 100% { transform: scale(.3); } }
        
        .hub-line { stroke: #AAB0A3; stroke-width: 1.5; stroke-dasharray: 150; }
        .hl1a { animation: hl1a 19s infinite linear; } .hl1b { animation: hl1b 19s infinite linear; } .hl1c { animation: hl1c 19s infinite linear; }
        .hl2a { animation: hl2a 19s infinite linear; } .hl2b { animation: hl2b 19s infinite linear; } .hl2c { animation: hl2c 19s infinite linear; }
        
        @keyframes hl1a { 0%, 15% { stroke-dashoffset: 150; } 30% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
        @keyframes hl1b { 0%, 18% { stroke-dashoffset: 150; } 33% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
        @keyframes hl1c { 0%, 21% { stroke-dashoffset: 150; } 36% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
        @keyframes hl2a { 0%, 15% { stroke-dashoffset: 150; } 30% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
        @keyframes hl2b { 0%, 18% { stroke-dashoffset: 150; } 33% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
        @keyframes hl2c { 0%, 21% { stroke-dashoffset: 150; } 36% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
        
        .main-line { stroke-width: 2.8; stroke-linecap: round; }
        .cluster-wire { stroke-width: 3; stroke-linecap: round; }
        .cluster-label { fill: #1A3024; font-size: 16px; font-weight: 600; letter-spacing: .18em; font-family: inherit; }
        .pulse { fill: none; stroke-width: 2; animation: pulse 3s infinite; }
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(5); } }
      `}</style>
    </div>
  )
}