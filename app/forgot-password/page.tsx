'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
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
            <div className="w-12 h-12 bg-[#E3E5E3] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={20} className="text-[#1A3024]" />
            </div>
            <h2 className="text-lg tracking-tight text-[#121314] mb-2 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Check your email</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              We sent a password reset link to <span className="font-medium text-[#121314]">{email}</span>. Click it to set a new password.
            </p>
            <Link href="/login" className="inline-block mt-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[#1A3024] hover:text-[#5A7973] transition-colors">
              Back to sign in
            </Link>
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
          <h1 className="text-xl tracking-tight text-[#121314] mb-1 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Reset your password</h1>
          <p className="text-sm text-neutral-500 mb-6">Enter your email and we'll send you a reset link.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#121314]">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
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
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-[#1A3024] font-medium hover:text-[#5A7973] transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
