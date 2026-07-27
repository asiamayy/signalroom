'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAccept = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
        setLoading(false)
        return
      }
      router.push('/workspaces')
      router.refresh()
    } catch {
      setError('Something went wrong — please try again')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full bg-[#1A3024] text-white text-[11px] font-medium uppercase tracking-[0.2em] py-3 rounded-[4px] hover:bg-[#5A7973] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Joining...' : 'Accept invite'}
      </button>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
          {error}
        </p>
      )}
    </div>
  )
}

// Shown when the logged-in user's email doesn't match the invited address —
// signs them out and sends them to log in as the right person.
export function SignOutAndRetryLink({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-[#1A3024] font-medium hover:text-[#5A7973] transition-colors underline disabled:opacity-50"
    >
      {loading ? 'Signing out...' : 'Sign out and sign in as the invited address'}
    </button>
  )
}
