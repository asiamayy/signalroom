import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
}

const SIZES = {
  sm: { text: 'text-[15px]', icon: 22, radius: 5, padding: 4, gap: 1.5, barW: 2.5 },
  md: { text: 'text-[20px]', icon: 28, radius: 7, padding: 5, gap: 2, barW: 3 },
  lg: { text: 'text-2xl', icon: 34, radius: 8, padding: 6, gap: 2.5, barW: 3.5 },
  xl: { text: 'text-[36px]', icon: 42, radius: 10, padding: 7, gap: 3, barW: 4 },
}

export function Logo({ size = 'md', href, className }: LogoProps) {
  const s = SIZES[size]

  const bars = [
    s.barW * 1.3,
    s.barW * 2.3,
    s.barW * 3.6,
    s.barW * 2.3,
    s.barW * 1.3,
  ]

  const mark = (
    <span className={cn('flex items-center gap-2 select-none', className)}>
      {/* Signal bars icon */}
      <span
        style={{
          width: s.icon,
          height: s.icon,
          borderRadius: s.radius,
          background: 'currentColor',
          display: 'inline-flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: s.padding,
          gap: s.gap,
          flexShrink: 0,
          color: 'var(--color-text-primary)',
        }}
      >
        {bars.map((h, i) => (
          <span
            key={i}
            style={{
              width: s.barW,
              height: h,
              background: '#5DCAA5',
              borderRadius: 1,
              display: 'block',
            }}
          />
        ))}
      </span>

      {/* Wordmark */}
      <span className="flex items-baseline gap-0">
        <span
          className={cn('tracking-tight text-neutral-900 leading-none', s.text)}
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
        >
          Signal
        </span>
        <span
          className={cn('tracking-tight text-emerald-600 leading-none', s.text)}
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'normal' }}
        >
          room
        </span>
      </span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm">
        {mark}
      </Link>
    )
  }

  return mark
}

