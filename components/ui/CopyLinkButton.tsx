'use client'

import { useState } from 'react'

// With a reportId (owner's report page): creates a share token on first copy,
// so nothing is public until the owner asks for a link, and shows a revoke
// control while a link is live. Without one (the public /r page): just copies
// the current URL.
export function CopyLinkButton({
  reportId,
  initialShared = false,
}: {
  reportId?: string
  initialShared?: boolean
} = {}) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(initialShared)
  const [busy, setBusy] = useState(false)

  const handleCopy = async () => {
    try {
      let publicUrl: string
      if (reportId) {
        setBusy(true)
        const res = await fetch(`/api/reports/${reportId}/share`, { method: 'POST' })
        if (!res.ok) return
        const { data } = await res.json()
        publicUrl = `${window.location.origin}/r/${data.token}`
        setShared(true)
      } else {
        // Public report page — the path already ends in the share token
        const token = window.location.pathname.split('/').pop()
        publicUrl = `${window.location.origin}/r/${token}`
      }
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // silently fail
    } finally {
      setBusy(false)
    }
  }

  const handleRevoke = async () => {
    if (!reportId) return
    try {
      setBusy(true)
      const res = await fetch(`/api/reports/${reportId}/share`, { method: 'DELETE' })
      if (res.ok) setShared(false)
    } catch {
      // silently fail
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="flex items-center gap-3">
      <button
        onClick={handleCopy}
        disabled={busy}
        className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A9B76" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ color: '#1A9B76' }}>Copied!</span>
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {reportId && !shared ? 'Share link' : 'Copy link'}
          </>
        )}
      </button>
      {reportId && shared && (
        <button
          onClick={handleRevoke}
          disabled={busy}
          title="Disable the public link — anyone with the old URL loses access"
          className="text-xs font-medium text-neutral-400 hover:text-red-600 transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Revoke link
        </button>
      )}
    </span>
  )
}
