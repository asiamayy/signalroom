import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
}

export function Logo({ size = 'md', href, className }: LogoProps) {
  const mark = (
    <span className={cn('flex items-center select-none', className)}>
      <Image
        src="/signalroom-logo.png"
        alt="Signalroom"
        width={220}
        height={52}
        style={{ width: '220px', height: 'auto' }}
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
