'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { HOME_COLORS } from '@/lib/home-theme'
import { CARD_SHADOW } from '@/lib/utils'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  className?: string
  // 'sm' (default) is the compact toolbar/filter look; 'md' renders as a
  // full-width form field (text-sm, roomier padding, chevron pushed right) so
  // it sits alongside labelled inputs without looking like a native select.
  size?: 'sm' | 'md'
  fullWidth?: boolean
}

// A real combobox — native <select> can't have its open-state option list
// styled (that popup is rendered by the OS, not the browser's CSS engine),
// which is why swapping in appearance-none/custom-chevron on the closed
// state alone never actually fixes the "it looks like a default Windows
// dropdown" complaint. This renders both the closed control and the open
// panel ourselves.
export function Dropdown({ value, onChange, options, placeholder, className, size = 'sm', fullWidth = false, }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selected = options.find(o => o.value === value)
  const md = size === 'md'

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} ${className ?? ''}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center transition-colors rounded-lg ${
          md ? 'w-full justify-between gap-2 text-sm px-3.5 py-2.5' : 'gap-2 text-xs pl-3 pr-2.5 py-2 whitespace-nowrap'
        }`}
        style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}${md ? '' : '66'}`, color: HOME_COLORS.onSurface }}
      >
        <span className={md ? 'truncate text-left' : ''}>{selected?.label ?? placeholder ?? 'Select'}</span>
        <ChevronDown size={md ? 16 : 13} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: HOME_COLORS.onSurfaceVariant }} />
      </button>
      {open && (
        <div
          className={`absolute top-full mt-1.5 rounded-xl overflow-hidden z-30 py-1 max-h-64 overflow-y-auto ${md ? 'left-0 right-0' : 'left-0'}`}
          style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}66`, boxShadow: CARD_SHADOW, minWidth: md ? undefined : '170px' }}
        >
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 transition-colors hover:bg-black/[0.04] ${md ? 'text-sm' : 'text-xs'}`}
              style={{ color: o.value === value ? HOME_COLORS.primary : HOME_COLORS.onSurface, fontWeight: o.value === value ? 600 : 400 }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
