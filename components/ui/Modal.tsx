'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  maxWidth?: number
  // Set when a GhostLayer transition already animated the card into this
  // exact position/size — the modal then just appears at its final state
  // instantly instead of re-running its own scale/opacity animation.
  instant?: boolean
  children: React.ReactNode
}

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

// Shared visual shell for the modal card — also used by each page to build
// the "modalContent" clone handed to GhostLayer, so the ghost's measured
// size/appearance matches what this component actually renders.
export function modalCardStyle(maxWidth: number): React.CSSProperties {
  return {
    maxWidth: `${maxWidth}px`,
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: '28px',
    borderRadius: '16px',
    background: 'white',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  }
}

// Shared modal shell — dark backdrop (200ms fade), centered white card. By
// default it plays its own balloon/spring open animation (scale 0.5 → 1.0,
// cubic-bezier(0.34, 1.56, 0.64, 1), 300ms) and a quick 150ms scale-down
// fade-out on close — this is the safe fallback used whenever a GhostLayer
// transition isn't in play. Modal content fades in with a 150ms delay after
// the expansion completes (progressive disclosure).
export function Modal({ isOpen, onClose, maxWidth = 540, instant = false, children }: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      if (instant) {
        setVisible(true)
        return
      }
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    if (instant) {
      setVisible(false)
      setMounted(false)
      return
    }
    setVisible(false)
    const timeout = setTimeout(() => setMounted(false), 150)
    return () => clearTimeout(timeout)
  }, [isOpen, instant])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative"
        style={{
          ...modalCardStyle(maxWidth),
          opacity: instant ? 1 : (visible ? 1 : 0),
          transform: instant ? 'none' : (visible ? 'scale(1)' : 'scale(0.5)'),
          transition: instant
            ? 'none'
            : visible
              ? `opacity 300ms ease, transform 300ms ${SPRING}`
              : 'opacity 150ms ease, transform 150ms ease',
        }}
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
            transition: visible ? `opacity 200ms ease ${instant ? 150 : 450}ms` : 'opacity 100ms ease',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
