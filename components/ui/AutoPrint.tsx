'use client'

import { useEffect } from 'react'

// Triggers window.print() once, after layout/fonts have had a moment to
// settle. Used by report pages so navigating here with ?print=1 (e.g. from
// a project's Reports tab list) opens the print dialog automatically,
// instead of the user having to click Download PDF a second time.
export function AutoPrint({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (!trigger) return
    const timer = setTimeout(() => window.print(), 350)
    return () => clearTimeout(timer)
  }, [trigger])

  return null
}
