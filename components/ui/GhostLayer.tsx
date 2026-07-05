'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

export interface GhostRect {
  top: number
  left: number
  width: number
  height: number
}

interface GhostLayerContextValue {
  // Grows a clone of the clicked card (cardContent) from sourceRect into the
  // modal's natural centered size/position, then resolves with whether the
  // animation actually played. Callers should treat `false` as "GhostLayer
  // couldn't confirm this worked" and let the modal use its own fallback
  // scale+opacity animation instead of assuming it's already in position.
  startTransition: (sourceRect: GhostRect, cardContent: React.ReactNode, modalContent: React.ReactNode) => Promise<boolean>
  // Reverses the last startTransition — shrinks a clone of the modal back
  // down to the original card's rect. No args: it reuses what startTransition
  // captured. Resolves once the shrink finishes (or immediately if there's
  // nothing to reverse).
  endTransition: () => Promise<void>
}

const GhostLayerContext = createContext<GhostLayerContextValue | null>(null)

const OPEN_MS = 300
const CLOSE_MS = 150
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const IDENTITY = 'translate(0px, 0px) scale(1, 1)'

type Phase = null | 'measuring' | 'opening' | 'closing'

export function GhostLayerProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>(null)
  const [ghostNode, setGhostNode] = useState<React.ReactNode>(null)
  const [transform, setTransform] = useState(IDENTITY)
  const [sourceRect, setSourceRect] = useState<GhostRect | null>(null)

  const modalContentRef = useRef<React.ReactNode>(null)
  const openTransformRef = useRef(IDENTITY)
  const ghostBoxRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)

  const startTransition = useCallback((rect: GhostRect, cardContent: React.ReactNode, modalContent: React.ReactNode) => {
    return new Promise<boolean>((resolve) => {
      const fail = () => {
        setPhase(null)
        setGhostNode(null)
        setSourceRect(null)
        resolve(false)
      }

      if (rect.width <= 0 || rect.height <= 0) {
        fail()
        return
      }

      try {
        modalContentRef.current = modalContent
        setSourceRect(rect)
        setGhostNode(cardContent)
        setTransform(IDENTITY)
        setPhase('measuring')

        // Let the hidden probe (rendering modalContent) lay out so we can
        // measure the modal's natural centered rect before animating to it.
        requestAnimationFrame(() => {
          const probe = probeRef.current?.getBoundingClientRect()

          if (!probe || probe.width <= 0 || probe.height <= 0) {
            fail()
            return
          }

          const dx = probe.left - rect.left
          const dy = probe.top - rect.top
          const sx = probe.width / rect.width
          const sy = probe.height / rect.height
          const openTransform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
          openTransformRef.current = openTransform

          setPhase('opening')

          // Second rAF — the "PLAY" step. Ensures the browser has painted the
          // measuring-phase layout (ghost at identity transform) before we
          // flip to the target transform, so the CSS transition actually runs
          // instead of the two states being coalesced into one frame.
          requestAnimationFrame(() => {
            setTransform(openTransform)

            let settled = false
            const finish = () => {
              if (settled) return
              settled = true
              ghostBoxRef.current?.removeEventListener('transitionend', finish)
              setPhase(null)
              setGhostNode(null)
              resolve(true)
            }
            ghostBoxRef.current?.addEventListener('transitionend', finish)
            setTimeout(finish, OPEN_MS + 80)
          })
        })
      } catch {
        fail()
      }
    })
  }, [])

  const endTransition = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!sourceRect) {
        resolve()
        return
      }

      const cleanup = () => {
        setPhase(null)
        setGhostNode(null)
        setSourceRect(null)
        modalContentRef.current = null
        openTransformRef.current = IDENTITY
      }

      try {
        setGhostNode(modalContentRef.current)
        setTransform(openTransformRef.current)
        setPhase('closing')

        // Same two-rAF dance in reverse: paint at the modal's rect first,
        // then flip to identity so the shrink actually animates.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransform(IDENTITY)

            let settled = false
            const finish = () => {
              if (settled) return
              settled = true
              ghostBoxRef.current?.removeEventListener('transitionend', finish)
              cleanup()
              resolve()
            }
            ghostBoxRef.current?.addEventListener('transitionend', finish)
            setTimeout(finish, CLOSE_MS + 80)
          })
        })
      } catch {
        cleanup()
        resolve()
      }
    })
  }, [sourceRect])

  return (
    <GhostLayerContext.Provider value={{ startTransition, endTransition }}>
      {children}

      {/* GhostLayer — fixed, full-screen, highest z-index, only rendered while animating */}
      {phase && sourceRect && (
        <div className="fixed inset-0 z-[9999] pointer-events-none" aria-hidden="true">
          {phase === 'measuring' && (
            <div
              ref={probeRef}
              style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, visibility: 'hidden' }}
            >
              {modalContentRef.current}
            </div>
          )}

          <div
            ref={ghostBoxRef}
            style={{
              position: 'fixed',
              top: sourceRect.top,
              left: sourceRect.left,
              width: sourceRect.width,
              height: sourceRect.height,
              transformOrigin: 'top left',
              transform,
              transition: phase === 'closing'
                ? `transform ${CLOSE_MS}ms ease`
                : phase === 'opening'
                  ? `transform ${OPEN_MS}ms ${SPRING}`
                  : 'none',
              overflow: 'hidden',
              willChange: 'transform',
            }}
          >
            {ghostNode}
          </div>
        </div>
      )}
    </GhostLayerContext.Provider>
  )
}

export function useGhostLayer() {
  const ctx = useContext(GhostLayerContext)
  if (!ctx) throw new Error('useGhostLayer must be used within a GhostLayerProvider')
  return ctx
}
