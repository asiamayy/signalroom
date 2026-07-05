'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  maxWidth?: number
  children: React.ReactNode
}

// Shared modal shell — dark backdrop, centered white card, balloon/spring open
// animation (scale 0.5 → 1.0, cubic-bezier(0.34, 1.56, 0.64, 1), 300ms) and a
// quick 150ms scale-down fade-out on close. Backdrop fades independently at 200ms.
export function Modal({ isOpen, onClose, maxWidth = 540, children }: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl w-full"
        style={{
          maxWidth: `${maxWidth}px`,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.5)',
          transition: visible
            ? 'opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
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
        {children}
      </div>
    </div>
  )
}
