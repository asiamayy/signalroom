'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const PERKS = [
  'Build AI personas in under 2 minutes',
  'First insight in under 10 minutes',
  'No research background needed',
]

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Fire welcome email — non-blocking, don't await
      fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(err => console.error('Welcome email failed:', err))

      setConfirmed(true)
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <Logo href="/" size="lg" />
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-8">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={20} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-serif tracking-tight text-neutral-900 mb-2">Check your email</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              We sent a confirmation link to <span className="font-medium text-neutral-700">{email}</span>. Click it to activate your account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-8">
          <h1 className="text-lg font-serif tracking-tight text-neutral-900 mb-1">Start your free trial</h1>
          <p className="text-sm text-neutral-500 mb-5">No credit card required</p>

          {/* Perks */}
          <div className="space-y-2 mb-6 pb-6 border-b border-neutral-100">
            {PERKS.map(p => (
              <div key={p} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check size={9} className="text-emerald-600" strokeWidth={3} />
                </div>
                <span className="text-xs text-neutral-600">{p}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Maya Chen"
                className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Work email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Creating account...' : 'Create free account'}
            </button>

            <p className="text-xs text-neutral-400 text-center leading-relaxed">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="underline hover:text-neutral-700">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-neutral-700">Privacy Policy</Link>
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-neutral-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
