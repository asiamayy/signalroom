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

  useEffect(() => {
    const supabase = createClient()

    // Handle the hash fragment from the reset email
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (accessToken && type === 'recovery') {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? '',
      }).then(() => {
        setReady(true)
      })
    } else {
      // Also listen for the auth state change as fallback
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setReady(true)
        }
      })
      // Give it a moment to detect
      setTimeout(() => setReady(true), 2000)
      return () => subscription.unsubscribe()
    }
  }, [])

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
