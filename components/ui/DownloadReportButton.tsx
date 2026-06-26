'use client'

import { Download } from 'lucide-react'

export function DownloadReportButton() {
  const handleDownload = () => {
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
