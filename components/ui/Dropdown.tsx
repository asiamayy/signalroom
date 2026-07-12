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
}

// A real combobox — native <select> can't have its open-state option list
// styled (that popup is rendered by the OS, not the browser's CSS engine),
// which is why swapping in appearance-none/custom-chevron on the closed
// state alone never actually fixes the "it looks like a default Windows
// dropdown" complaint. This renders both the closed control and the open
// panel ourselves.
export function Dropdown({ value, onChange, options, placeholder, className }: DropdownProps) {
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

  return (
    <div className={`relative ${className ?? ''}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs rounded-lg pl-3 pr-2.5 py-2 whitespace-nowrap transition-colors"
        style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
      >
        {selected?.label ?? placeholder ?? 'Select'}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: HOME_COLORS.onSurfaceVariant }} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 rounded-xl overflow-hidden z-30 py-1 max-h-64 overflow-y-auto"
          style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}66`, boxShadow: CARD_SHADOW, minWidth: '170px' }}
        >
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="w-full text-left text-xs px-3 py-2 transition-colors hover:bg-black/[0.04]"
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
