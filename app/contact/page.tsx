'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

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
    <div className="min-h-screen bg-[#FCFCFB] text-[#121314]">
      <SiteNav />

      <div className="max-w-lg mx-auto px-6 pt-32 sm:pt-40 pb-16">
        <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#5A7973] mb-4 block">Support</span>
        <h1 className="text-[34px] sm:text-[44px] tracking-tighter font-normal text-[#121314] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Get in touch
        </h1>
        <p className="text-sm text-neutral-500 mb-10">Have a question, a feature request, or just want to say hello? We'd love to hear from you.</p>

        {sent ? (
          <div className="bg-white border border-[#E3E5E3] rounded-[12px] p-8 text-center">
            <div className="w-12 h-12 bg-[#E3E5E3] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={20} className="text-[#1A3024]" />
            </div>
            <h2 className="text-lg text-[#121314] mb-2 tracking-tight font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Message sent</h2>
            <p className="text-sm text-neutral-500">We'll get back to you within 1–2 business days.</p>
            <Link href="/" className="inline-block mt-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[#1A3024] hover:text-[#5A7973] transition-colors">
              Back to home
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#E3E5E3] rounded-[12px] p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#121314]">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-[#E3E5E3] rounded-[8px] text-[#121314] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A3024] focus:border-transparent"
                />
              </div>
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
                <label className="block text-sm font-medium text-[#121314]">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="How can we help?"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-[#E3E5E3] rounded-[8px] text-[#121314] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1A3024] focus:border-transparent resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A3024] text-white text-[11px] font-medium uppercase tracking-[0.2em] py-3 rounded-[4px] hover:bg-[#5A7973] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {loading ? 'Sending...' : 'Send message'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#E3E5E3] space-y-2">
              <p className="text-xs text-neutral-500">
                <span className="font-medium text-[#121314]">General:</span>{' '}
                <a href="mailto:hello@signalroom.io" className="text-[#1A3024] font-medium hover:text-[#5A7973] transition-colors">hello@signalroom.io</a>
              </p>
              <p className="text-xs text-neutral-500">
                <span className="font-medium text-[#121314]">Support:</span>{' '}
                <a href="mailto:support@signalroom.io" className="text-[#1A3024] font-medium hover:text-[#5A7973] transition-colors">support@signalroom.io</a>
              </p>
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
