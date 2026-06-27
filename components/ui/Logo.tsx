import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
}

const HEIGHTS = { sm: 32, md: 40, lg: 52, xl: 64 }

export function Logo({ size = 'md', href, className }: LogoProps) {
  const h = HEIGHTS[size]
  // Logo image is approx 4.4:1 ratio
  const w = Math.round(h * 4.4)

  const mark = (
    <span className={cn('flex items-center select-none', className)}>
      <Image
        src="/signalroom-logo.png"
        alt="Signalroom"
        width={w}
        height={h}
        style={{ height: h, width: 'auto', objectFit: 'contain' }}
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
