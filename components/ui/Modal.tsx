'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  onClose: () => void
  // Shared Framer Motion layoutId — pass the same id on the source card's
  // motion.div (e.g. `persona-card-${id}`) so Framer Motion morphs between
  // the card and this modal automatically. The caller is responsible for
  // conditionally mounting <Modal> inside an <AnimatePresence> so the exit
  // (close) animation plays before it's removed from the DOM.
  layoutId: string
  maxWidth?: number
  children: React.ReactNode
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

// Shared visual shell for the modal card.
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

// Shared modal shell — dark backdrop, centered white card. The card shares a
// layoutId with the card that was clicked, so Framer Motion morphs the card
// into the modal on open and back into the card on close (balloon/spring
// feel via the shared SPRING transition). Modal content fades in slightly
// after the shape animation starts (progressive disclosure).
export function Modal({ onClose, layoutId, maxWidth = 540, children }: ModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        layoutId={layoutId}
        onClick={e => e.stopPropagation()}
        className="relative"
        style={modalCardStyle(maxWidth)}
        transition={SPRING}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors z-10"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        {/* Progressive disclosure — content fades in shortly after the morph starts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
