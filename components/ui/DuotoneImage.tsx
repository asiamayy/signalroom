import { HOME_COLORS } from '@/lib/home-theme'

// Getting an AI image generator to hit an exact brand hex reliably doesn't
// work — text-to-image models read color language approximately, and
// literal hex codes in a prompt just confuse them (they're not trained to
// parse colorimetric strings). So we stop asking the model for color at
// all: it generates pure black-and-white line art (something these models
// are actually good at), and this SVG filter remaps black->shadowColor and
// white->highlightColor deterministically in the browser. The brand color
// is then guaranteed exact, because it's applied by CSS, not interpreted
// by the AI.

const FILTER_ID = 'project-cover-duotone'

function hexToUnit(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ]
}

// Renders the filter definition once (it's referenced by id, not re-created
// per image) — mount this a single time near the top of any page that uses
// DuotoneImage.
export function DuotoneFilterDefs({
  shadowColor = HOME_COLORS.primary,
  highlightColor = HOME_COLORS.surface,
}: { shadowColor?: string; highlightColor?: string }) {
  const [r0, g0, b0] = hexToUnit(shadowColor)
  const [r1, g1, b1] = hexToUnit(highlightColor)

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id={FILTER_ID} colorInterpolationFilters="sRGB">
          {/* Force grayscale first in case the source image isn't perfectly
              monochrome, using standard luminance weights. */}
          <feColorMatrix
            type="matrix"
            values={`0.2126 0.7152 0.0722 0 0
                     0.2126 0.7152 0.0722 0 0
                     0.2126 0.7152 0.0722 0 0
                     0 0 0 1 0`}
          />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={`${r0} ${r1}`} />
            <feFuncG type="table" tableValues={`${g0} ${g1}`} />
            <feFuncB type="table" tableValues={`${b0} ${b1}`} />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  )
}

export function DuotoneImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} style={{ filter: `url(#${FILTER_ID})` }} />
}
