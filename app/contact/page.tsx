'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Check } from 'lucide-react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // In production wire this up to Resend or Formspree
    // For now just simulate a success
    await new Promise(resolve => setTimeout(resolve, 800))
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <Logo href="/" size="md" />
        <Link href="/signup" className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors">
          Start free
        </Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-16">
        <h1 className="font-serif text-3xl tracking-tight text-neutral-900 mb-2">Get in touch</h1>
        <p className="text-sm text-neutral-500 mb-10">Have a question, a feature request, or just want to say hello? We'd love to hear from you.</p>

        {sent ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={20} className="text-emerald-600" />
            </div>
            <h2 className="font-serif text-lg text-neutral-900 mb-2">Message sent</h2>
            <p className="text-sm text-neutral-500">We'll get back to you within 1–2 business days.</p>
            <Link href="/" className="inline-block mt-6 text-sm text-emerald-600 hover:underline">
              Back to home
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">Email</label>
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
                <label className="block text-sm font-medium text-neutral-700">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="How can we help?"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {loading ? 'Sending...' : 'Send message'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-100 space-y-2">
              <p className="text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">General:</span>{' '}
                <a href="mailto:hello@signalroom.io" className="text-emerald-600 hover:underline">hello@signalroom.io</a>
              </p>
              <p className="text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">Support:</span>{' '}
                <a href="mailto:support@signalroom.io" className="text-emerald-600 hover:underline">support@signalroom.io</a>
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-neutral-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <Logo href="/" size="sm" />
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-neutral-400 hover:text-neutral-700">Privacy</Link>
            <Link href="/terms" className="text-xs text-neutral-400 hover:text-neutral-700">Terms</Link>
            <Link href="/contact" className="text-xs text-neutral-400 hover:text-neutral-700">Contact</Link>
          </div>
          <p className="text-xs text-neutral-400">© 2026 SignalRoom</p>
        </div>
      </footer>
    </div>
  )
}
