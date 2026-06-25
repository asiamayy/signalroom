import { cn } from '@/lib/utils'

interface PersonaAvatarProps {
  avatarUrl?: string | null
  avatarInitials?: string
  avatarColor?: { bg: string; text: string } | string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
}

export function PersonaAvatar({
  avatarUrl,
  avatarInitials,
  avatarColor,
  name,
  size = 'md',
  className,
}: PersonaAvatarProps) {
  const color = typeof avatarColor === 'string'
    ? (() => { try { return JSON.parse(avatarColor) } catch { return { bg: '#E1F5EE', text: '#0F6E56' } } })()
    : avatarColor ?? { bg: '#E1F5EE', text: '#0F6E56' }

  const sizeClass = SIZES[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? 'Persona avatar'}
        className={cn('rounded-full object-cover flex-shrink-0', sizeClass, className)}
      />
    )
  }

  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-medium flex-shrink-0', sizeClass, className)}
      style={{ background: color.bg, color: color.text }}
    >
      {avatarInitials ?? '?'}
    </div>
  )
}
