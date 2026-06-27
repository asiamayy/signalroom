import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
}

const HEIGHTS = { sm: 32, md: 40, lg: 52, xl: 64 }

function LogoMark({ h }: { h: number }) {
  const w = h * 5
  return (
    <span className="flex items-center select-none flex-shrink-0">
      <svg width={w} height={h} viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Top half of S */}
        <path d="M56 12 L44 12 C32 12 22 20 22 32 C22 44 32 52 44 52 L56 52" stroke="#1C1C1C" strokeWidth="12" strokeLinecap="round" fill="none"/>
        {/* Bottom half of S */}
        <path d="M24 52 L36 52 C48 52 58 60 58 72 C58 84 48 92 36 92" stroke="#3BAF8A" strokeWidth="12" strokeLinecap="round" fill="none"/>
        {/* Top right accent */}
        <polygon points="50,4 72,4 64,16 42,16" fill="#3BAF8A"/>
        {/* Bottom left accent */}
        <polygon points="30,76 8,76 16,88 38,88" fill="#3BAF8A"/>
        {/* Signal */}
        <text x="88" y="57" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="800" fontSize="40" fill="#1C1C1C" letterSpacing="-1">Signal</text>
        {/* room */}
        <text x="246" y="57" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="800" fontSize="40" fill="#3BAF8A" letterSpacing="-1">room</text>
      </svg>
    </span>
  )
}

export function Logo({ size = 'md', href, className }: LogoProps) {
  const h = HEIGHTS[size]

  if (href) {
    return (
      <Link href={href} className={cn('focus:outline-none', className)}>
        <LogoMark h={h} />
      </Link>
    )
  }

  return <LogoMark h={h} />
}
