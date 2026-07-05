import { flushSync } from 'react-dom'

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished: Promise<void>
    ready: Promise<void>
    updateCallbackDone: Promise<void>
  }
}

export const supportsViewTransitions =
  typeof document !== 'undefined' && typeof (document as ViewTransitionDocument).startViewTransition === 'function'

// Runs a state update as a native View Transition (shared-element morph)
// when the browser supports it — flushSync forces the DOM to commit
// synchronously inside the transition callback, which the API requires.
// Falls back to a plain synchronous update on browsers without support;
// components/ui/Modal.tsx handles that case with its own CSS animation.
export function withViewTransition(callback: () => void, direction: 'open' | 'close') {
  const doc = document as ViewTransitionDocument

  if (!doc.startViewTransition) {
    callback()
    return
  }

  document.documentElement.dataset.vtDirection = direction
  const transition = doc.startViewTransition(() => flushSync(callback))
  transition.finished.finally(() => {
    delete document.documentElement.dataset.vtDirection
  })
}
