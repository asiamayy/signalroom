import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
}

const SIZES = {
  sm: 'text-base',
  md: 'text-[20px]',
  lg: 'text-2xl',
  xl: 'text-[36px]',
}

export function Logo({ size = 'md', href, className }: LogoProps) {
  const sizeClass = SIZES[size]

  const mark = (
    <span className={cn('flex items-baseline gap-0 select-none', className)}>
      <span
        className={cn('tracking-tight text-neutral-900 leading-none', sizeClass)}
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
      >
        Signal
      </span>
      <span
        className={cn('tracking-tight text-emerald-600 leading-none', sizeClass)}
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'normal' }}
      >
        room
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
