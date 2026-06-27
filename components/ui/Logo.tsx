import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
}

const HEIGHTS = { sm: 22, md: 28, lg: 34, xl: 42 }

export function Logo({ size = 'md', href, className }: LogoProps) {
  const h = HEIGHTS[size]
  // Aspect ratio of the logo image is approx 4:1
  const w = h * 4

  const mark = (
    <span className={cn('flex items-center select-none', className)}>
      <Image
        src="/signalroom-logo.png"
        alt="Signalroom"
        width={w}
        height={h}
        style={{ objectFit: 'contain', height: h, width: 'auto' }}
        priority
      />
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
