import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
}

const WIDTHS = { sm: 120, md: 220, lg: 280, xl: 340 }

export function Logo({ size = 'md', href, className }: LogoProps) {
  const w = WIDTHS[size]
  const mark = (
    <span className={cn('flex items-center select-none', className)}>
      <Image
        src="/signalroom-logo.png"
        alt="Signalroom"
        width={w}
        height={Math.round(w / 4.4)}
        style={{ width: `${w}px`, height: 'auto' }}
        priority
        unoptimized
      />
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="focus:outline-none">
        {mark}
      </Link>
    )
  }

  return mark
}
