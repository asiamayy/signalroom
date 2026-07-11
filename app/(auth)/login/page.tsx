'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/home')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#FCFCFB] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
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
          <h1 className="text-xl tracking-tight text-[#121314] mb-1 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Welcome back</h1>
          <p className="text-sm text-neutral-500 mb-6">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-4">
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

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-[#121314]">Password</label>
                <Link href="/forgot-password" className="text-xs text-neutral-400 hover:text-[#1A3024] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#E3E5E3] rounded-[8px] text-[#121314] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A3024] focus:border-transparent"
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
              className="w-full bg-[#1A3024] text-white text-[11px] font-medium uppercase tracking-[0.2em] py-3 rounded-[4px] hover:bg-[#5A7973] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          No account?{' '}
          <Link href="/signup" className="text-[#1A3024] font-medium hover:text-[#5A7973] transition-colors">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  )
}
