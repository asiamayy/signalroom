'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supportsViewTransitions } from '@/lib/viewTransition'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  maxWidth?: number
  // Shared view-transition-name for the card <-> modal morph. Pass the same
  // name on the source card element (cleared while its modal is open) and
  // here so the browser treats them as one element expanding/collapsing.
  viewTransitionName?: string
  children: React.ReactNode
}

// Shared modal shell — dark backdrop, centered white card. When the browser
// supports the View Transition API, the parent's state update is expected to
// run inside withViewTransition() (lib/viewTransition.ts), and the browser
// handles the shared-element morph natively — this component just mounts
// instantly and lets the native transition do the visual work. Otherwise it
// falls back to its own balloon/spring open animation (scale 0.5 → 1.0,
// cubic-bezier(0.34, 1.56, 0.64, 1), 300ms) and a quick 150ms scale-down
// fade-out on close. The backdrop always fades independently at 200ms.
// Modal content fades in with a 150ms delay after the expansion completes
// (progressive disclosure), in both the native and fallback paths.
export function Modal({ isOpen, onClose, maxWidth = 540, viewTransitionName, children }: ModalProps) {
  const [mounted, setMounted] = useState(supportsViewTransitions ? isOpen : false)
  const [visible, setVisible] = useState(supportsViewTransitions ? isOpen : false)

  useEffect(() => {
    if (supportsViewTransitions) {
      // No manual delay needed — the native transition already holds the
      // "old" visual in place while the DOM updates underneath it.
      setMounted(isOpen)
      setVisible(isOpen)
      return
    }
    if (isOpen) {
      setMounted(true)
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setVisible(false)
    const timeout = setTimeout(() => setMounted(false), 150)
    return () => clearTimeout(timeout)
  }, [isOpen])

  if (!mounted) return null

  const cardStyle = {
    maxWidth: `${maxWidth}px`,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: '28px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    viewTransitionName,
    ...(supportsViewTransitions
      ? { opacity: 1, transform: 'none' }
      : {
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.5)',
          transition: visible
            ? 'opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'opacity 150ms ease, transform 150ms ease',
        }),
  } as React.CSSProperties

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl w-full"
        style={cardStyle}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors z-10"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        {/* Progressive disclosure — content fades in 150ms after the expansion completes */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: visible ? 'opacity 200ms ease 450ms' : 'opacity 100ms ease',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
