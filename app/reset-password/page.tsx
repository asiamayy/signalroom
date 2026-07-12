'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function verifyResetLink() {
      // The Supabase client here (@supabase/ssr) uses the PKCE flow by
      // default, so the reset email actually lands with a `code` query
      // param — not the old implicit-flow `#access_token=...` hash this
      // page used to look for exclusively, which is why the form used to
      // show up (after a blind timeout) with no real session behind it.
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) setLinkError('This reset link is invalid or has expired. Please request a new one.')
        setReady(true)
        return
      }

      // Fall back to the legacy hash-fragment tokens in case the project's
      // email template still uses the old implicit flow.
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      if (accessToken && type === 'recovery') {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        })
        if (error) setLinkError('This reset link is invalid or has expired. Please request a new one.')
        setReady(true)
        return
      }

      // No code or token in the URL at all — confirm there's at least
      // already a valid session before giving up.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) setLinkError('This reset link is invalid or has expired. Please request a new one.')
      setReady(true)
    }

    verifyResetLink()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/personas')
    }
  }

  if (ready && linkError) {
    return (
      <div className="min-h-screen bg-[#FCFCFB] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <Link href="/" className="inline-flex">
              <img
                src="/signalroom-logo.svg"
                alt="SignalRoom Logo"
                width="94"
                height="55"
                className="h-14 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="bg-white border border-[#E3E5E3] rounded-[12px] p-8">
            <h2 className="text-lg tracking-tight text-[#121314] mb-2 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Link invalid or expired</h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">{linkError}</p>
            <Link href="/forgot-password" className="inline-block bg-[#1A3024] text-white text-[11px] font-medium uppercase tracking-[0.2em] py-3 px-6 rounded-[4px] hover:bg-[#5A7973] transition-all duration-300">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FCFCFB] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <Link href="/" className="inline-flex">
              <img
                src="/signalroom-logo.svg"
                alt="SignalRoom Logo"
                width="94"
                height="55"
                className="h-14 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="bg-white border border-[#E3E5E3] rounded-[12px] p-8">
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-6 w-6 text-[#1A3024]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-500">Verifying your reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FCFCFB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <img
              src="/signalroom-logo.svg"
              alt="SignalRoom Logo"
              width="94"
              height="55"
              className="h-14 w-auto object-contain"
            />
          </Link>
        </div>
        <div className="bg-white border border-[#E3E5E3] rounded-[12px] p-8">
          <h1 className="text-xl tracking-tight text-[#121314] mb-1 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Set new password</h1>
          <p className="text-sm text-neutral-500 mb-6">Choose a strong password for your account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#121314]">New password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#E3E5E3] rounded-[8px] text-[#121314] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A3024] focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#121314]">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat your password"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#E3E5E3] rounded-[8px] text-[#121314] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A3024] focus:border-transparent"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A3024] text-white text-[11px] font-medium uppercase tracking-[0.2em] py-3 rounded-[4px] hover:bg-[#5A7973] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FCFCFB] flex items-center justify-center">
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
