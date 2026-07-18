'use client'

import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'

export function DownloadReportButton({ href }: { href?: string } = {}) {
  const router = useRouter()

  const handleDownload = () => {
    // Printing from a list page (e.g. a project's Reports tab) would print
    // whatever else is on screen (tabs, other reports, nav) instead of just
    // this report. Navigate to the report's own page first — it already has
    // print styles scoped to just its content — then auto-print once there.
    if (href) {
      router.push(`${href}?print=1`)
      return
    }
    window.print()
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 text-xs text-neutral-500 border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-neutral-300 hover:text-neutral-900 transition-colors"
    >
      <Download size={13} />
      Download PDF
    </button>
  )
}
