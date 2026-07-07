'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary: 'bg-[#1C3D2E] text-white hover:bg-[#163024] focus:ring-[#1C3D2E]',
      secondary: 'bg-white text-[#202124] border border-[#DADCE0] hover:bg-neutral-50 focus:ring-neutral-300',
      ghost: 'text-[#5F6368] hover:bg-neutral-100 hover:text-[#202124] focus:ring-neutral-300',
      danger: 'bg-[#DB4437] text-white hover:bg-[#c53727] focus:ring-red-500',
    }
    const sizes = {
      sm: 'text-xs px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-sm px-5 py-2.5',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#202124]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white border rounded-lg text-[#202124] placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-[#1C3D2E] focus:border-transparent',
            'disabled:bg-neutral-50 disabled:text-neutral-500',
            error ? 'border-red-400 focus:ring-red-500' : 'border-[#E0E2E4]',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#5F6368]">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#202124]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white border rounded-lg text-[#202124] placeholder:text-neutral-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-[#1C3D2E] focus:border-transparent',
            error ? 'border-red-400' : 'border-[#E0E2E4]',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#5F6368]">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, options, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#202124]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white border rounded-lg text-[#202124]',
            'focus:outline-none focus:ring-2 focus:ring-[#1C3D2E] focus:border-transparent',
            error ? 'border-red-400' : 'border-[#E0E2E4]',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {hint && !error && <p className="text-xs text-[#5F6368]">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[#E8F3EF] text-[#1C3D2E]',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-[#DB4437]',
    info: 'bg-blue-50 text-blue-700',
  }
  return (
    <span className={cn('inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full', variants[variant], className)}>
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn('bg-white border border-[#E0E2E4] rounded-2xl', className)} style={style}>
      {children}
    </div>
  )
}

// ─── Slider ───────────────────────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
  leftLabel?: string
  rightLabel?: string
}

export function Slider({ label, value, onChange, min = 1, max = 5, leftLabel, rightLabel }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-[#202124]">{label}</label>
        <span className="text-sm font-semibold text-[#1C3D2E] w-5 text-center">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#1C3D2E]"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-xs text-[#757575]">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  )
}

// ─── TagInput ────────────────────────────────────────────────────────────────

interface TagInputProps {
  label?: string
  hint?: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ label, hint, tags, onChange, placeholder = 'Add tag...' }: TagInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = e.currentTarget.value.trim()
      if (val && !tags.includes(val)) {
        onChange([...tags, val])
        e.currentTarget.value = ''
      }
    }
    if (e.key === 'Backspace' && e.currentTarget.value === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[#202124]">{label}</label>}
      <div className="flex flex-wrap gap-1.5 p-2 border border-[#E0E2E4] rounded-lg bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-[#1C3D2E] focus-within:border-transparent">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 text-xs bg-[#E8F3EF] text-[#1C3D2E] px-2 py-1 rounded-full">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter(t => t !== tag))}
              className="text-[#1C3D2E]/60 hover:text-[#1C3D2E]"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent text-[#202124] placeholder:text-neutral-400"
          placeholder={tags.length === 0 ? placeholder : ''}
          onKeyDown={handleKeyDown}
        />
      </div>
      {hint && <p className="text-xs text-[#5F6368]">{hint}</p>}
    </div>
  )
}

// ─── ListInput ────────────────────────────────────────────────────────────────

interface ListInputProps {
  label: string
  hint?: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  max?: number
}

export function ListInput({ label, hint, items, onChange, placeholder, max = 5 }: ListInputProps) {
  const handleChange = (index: number, value: string) => {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  const handleAdd = () => {
    if (items.length < max) onChange([...items, ''])
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#202124]">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={e => handleChange(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 text-sm bg-white border border-[#E0E2E4] rounded-lg text-[#202124] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1C3D2E] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="text-neutral-400 hover:text-[#DB4437] transition-colors px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {items.length < max && (
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs text-[#5F6368] hover:text-[#1C3D2E] transition-colors"
        >
          + Add another
        </button>
      )}
      {hint && <p className="text-xs text-[#5F6368]">{hint}</p>}
    </div>
  )
}
