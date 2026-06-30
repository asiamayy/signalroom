'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Zap, Users, Building2, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

const TRADITIONAL_COST_PER_INTERVIEW = 750
const TRADITIONAL_HOURS_PER_INTERVIEW = 2
const TRADITIONAL_WEEKS_TURNAROUND = 3

function ROICalculator() {
  const [interviews, setInterviews] = useState(8)
  const traditionalCost = interviews * TRADITIONAL_COST_PER_INTERVIEW
  const traditionalHours = interviews * TRADITIONAL_HOURS_PER_INTERVIEW
  const savings = traditionalCost - 99
  const annualSavings = savings * 12
  const timeReduction = Math.round((1 - (10 / (TRADITIONAL_WEEKS_TURNAROUND * 5 * 8))) * 100)

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100">
        <h3 className="text-base font-serif tracking-tight text-neutral-900">See your savings</h3>
        <p className="text-sm text-neutral-500 mt-0.5">Traditional tools charge $8,000+ for 6 months. Compare that to SignalRoom.</p>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-neutral-700">Interviews per month</label>
            <span className="text-lg font-serif font-semibold text-neutral-900">{interviews}</span>
          </div>
          <input type="range" min={1} max={30} step={1} value={interviews}
            onChange={e => setInterviews(Number(e.target.value))}
            className="w-full accent-neutral-900" />
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>1</span><span>30</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">Traditional</p>
            <p className="text-lg font-serif font-semibold text-neutral-900">${traditionalCost.toLocaleString()}</p>
            <p className="text-[11px] text-neutral-500 mb-2">/month</p>
            <div className="border-t border-neutral-200 pt-2 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-500">Time</span>
                <span className="font-medium text-neutral-700">3 weeks</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-500">Per interview</span>
                <span className="font-medium text-neutral-700">$750</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-500">Hours</span>
                <span className="font-medium text-neutral-700">{traditionalHours}h</span>
              </div>
            </div>
          </div>
          <div className="bg-[#E8F5F1] border border-[#A7D9C8] rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1A9B76] mb-2">SignalRoom</p>
            <p className="text-lg font-serif font-semibold text-[#0D5C45]">$99</p>
            <p className="text-[11px] text-[#1A9B76] mb-2">unlimited/month</p>
            <div className="border-t border-[#A7D9C8] pt-2 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#1A7A5E]">Time</span>
                <span className="font-medium text-[#0D5C45]">Minutes</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#1A7A5E]">Per interview</span>
                <span className="font-medium text-[#0D5C45]">~$0</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#1A7A5E]">Hours</span>
                <span className="font-medium text-[#0D5C45]">&lt; 1h</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-neutral-400 mb-0.5">You save</p>
            <p className="text-xl font-serif font-semibold text-white">${savings.toLocaleString()}<span className="text-sm font-sans font-normal text-neutral-400">/mo</span></p>
            <p className="text-[11px] text-neutral-400 mt-0.5">${annualSavings.toLocaleString()}/year</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-neutral-400 mb-0.5">Time saved</p>
            <p className="text-xl font-serif font-semibold text-white">{timeReduction}%</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">faster</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const PLANS = [
  {
    name: 'Pulse', price: 49, tagline: 'For solo founders getting started', icon: Zap,
    features: ['3 personas', '10 interviews/month', 'Core templates', 'Basic reports'],
  },
  {
    name: 'Signal', price: 99, tagline: 'For teams validating fast', icon: Users, highlight: true,
    features: ['Unlimited personas', 'Unlimited interviews', 'All templates', 'Full reports', 'Multi-persona testing'],
  },
  {
    name: 'Broadcast', price: 249, tagline: 'For agencies and growing teams', icon: Building2,
    features: ['Everything in Signal', '10 team seats', 'White-label reports', 'Priority support'],
  },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const navHeight = 80 // matches nav bar height with buffer
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight
    window.scrollTo({ top, behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo href="/" size="md" />
          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">How it works</a>
            <a href="#pricing" onClick={scrollToSection('pricing')} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Pricing</a>
            <a href="#roi" onClick={scrollToSection('roi')} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">ROI</a>
            <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Sign in</Link>
            <Link href="/signup" className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors">
              Start free
            </Link>
          </div>
          {/* Mobile menu button */}
          <button className="md:hidden p-1 text-neutral-600" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-neutral-100 bg-white px-5 py-4 space-y-3">
            <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="block text-sm text-neutral-600 py-1">How it works</a>
            <a href="#pricing" onClick={scrollToSection('pricing')} className="block text-sm text-neutral-600 py-1">Pricing</a>
            <a href="#roi" onClick={scrollToSection('roi')} className="block text-sm text-neutral-600 py-1">ROI</a>
            <Link href="/login" className="block text-sm text-neutral-600 py-1">Sign in</Link>
            <Link href="/signup" className="block text-center bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-lg mt-2">
              Start free
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-5 pt-14 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1.5 text-xs text-neutral-500 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8F5F1]0 flex-shrink-0" />
          AI-powered market research for founders &amp; marketers
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl tracking-tight text-neutral-900 leading-[1.05] mb-5">
          Your market has<br />
          <em className="text-[#1A9B76] not-italic">opinions.</em><br />
          Now you can ask.
        </h1>
        <p className="text-base sm:text-lg text-neutral-500 max-w-xl mx-auto mb-7 leading-relaxed font-light">
          Build AI personas that represent your exact target customer — fully defined by you. Interview them. Get structured research insights in minutes, not weeks.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link href="/signup" className="w-full sm:w-auto bg-neutral-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors inline-flex items-center justify-center gap-2">
            Start free trial <ArrowRight size={15} />
          </Link>
          <a href="#roi" onClick={scrollToSection('roi')} className="w-full sm:w-auto border border-neutral-200 bg-white text-neutral-700 px-6 py-3 rounded-lg text-sm font-medium hover:border-neutral-300 transition-colors text-center">
            Calculate your savings
          </a>
        </div>
        <div className="flex items-center justify-center gap-6 sm:gap-10 border-t border-neutral-200 pt-8 flex-wrap">
          {[
            ['~90%', 'Parity with real research'],
            ['< 10 min', 'First insight'],
            ['$8,000+', 'What competitors charge for 6 months'],
          ].map(([num, label]) => (
            <div key={num} className="text-center">
              <p className="font-serif text-xl sm:text-2xl text-neutral-900">{num}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-5 py-12 scroll-mt-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">How it works</p>
        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-neutral-900 mb-8">
          Three steps to <em className="text-[#1A9B76] not-italic">real insight</em>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-200">
          {[
            { n: '01', title: 'Build your persona', body: 'Define who you want to talk to. Name them, give them a job, income, and frustrations. AI fills in the details from a single sentence.' },
            { n: '02', title: 'Run the interview', body: 'Ask anything — your idea, pricing, landing page copy. They respond in character with real nuance, hesitation, and honest pushback.' },
            { n: '03', title: 'Get your report', body: 'Key themes, verbatim quotes, confidence score, and recommendations — formatted like a real research report you can share.' },
          ].map(step => (
            <div key={step.n} className="bg-white p-6">
              <span className="text-xs text-neutral-300 font-mono block mb-3">{step.n}</span>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">{step.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed font-light">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="max-w-5xl mx-auto px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Who it's for</p>
        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-neutral-900 mb-8">
          Built for people who <em className="text-[#1A9B76] not-italic">already do the work</em>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Founders pre-launch',
              body: 'You\'re validating an idea before writing code or raising money. You need signal, not a $15,000 research engagement.',
            },
            {
              title: 'Marketers with a brief',
              body: 'You\'re already lurking Reddit threads and caregiver forums trying to find the right language. SignalRoom structures what you\'re already doing.',
            },
            {
              title: 'Product teams moving fast',
              body: 'You need customer reaction in hours, not weeks. Test your messaging, pricing, or concept before your next sprint.',
            },
          ].map(item => (
            <div key={item.title} className="bg-white border border-neutral-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed font-light">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROI Calculator ── */}
      <section id="roi" className="max-w-5xl mx-auto px-5 py-12 scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">ROI calculator</p>
            <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-neutral-900 mb-4">
              See what you're <em className="text-[#1A9B76] not-italic">actually spending</em>
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-5 font-light">
              Traditional market research tools cost $8,000 or more for a 6-month subscription — before you factor in recruiting, moderation, and analysis. SignalRoom replaces all of that for a flat monthly fee with no contracts.
            </p>
            <div className="bg-[#E8F5F1] border border-[#C5EAE0] rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-[#0D5C45] mb-1">Fully customizable to your market</p>
              <p className="text-xs text-[#1A7A5E] leading-relaxed">Every persona is built around your exact target customer — their age, job, income, frustrations, buying behavior, and emotional context. The more specific you are, the more precise the insight.</p>
            </div>
            <div className="space-y-3">
              {['No recruiting fees', 'No scheduling overhead', 'No 6-month contracts', 'Results in minutes, not weeks'].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#1A9B76] flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-sm text-neutral-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <ROICalculator />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-5xl mx-auto px-5 py-12 scroll-mt-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Pricing</p>
        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-neutral-900 mb-2">
          Simple pricing. <em className="text-[#1A9B76] not-italic">No surprises.</em>
        </h2>
        <p className="text-sm text-neutral-500 mb-8 font-light">Start free. Upgrade when it's earning its keep.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div key={plan.name} className={cn('bg-white rounded-2xl p-5 flex flex-col', plan.highlight ? 'border-2 border-emerald-400' : 'border border-neutral-200')}>
                {plan.highlight && (
                  <span className="self-start text-[11px] font-medium bg-[#E8F5F1] text-[#1A7A5E] px-2 py-0.5 rounded-full mb-3">Most popular</span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className="text-neutral-400" />
                  <h3 className="text-sm font-semibold text-neutral-900">{plan.name}</h3>
                </div>
                <p className="text-xs text-neutral-500 mb-3">{plan.tagline}</p>
                <p className="font-serif text-3xl text-neutral-900 mb-0.5">${plan.price}</p>
                <p className="text-xs text-neutral-400 mb-4">/month</p>
                <hr className="border-neutral-100 mb-4" />
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-neutral-600">
                      <Check size={11} className="text-[#1A9B76] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={cn('block text-center text-sm font-medium py-2.5 rounded-lg transition-colors', plan.highlight ? 'bg-neutral-900 text-white hover:bg-neutral-700' : 'border border-neutral-200 text-neutral-700 hover:border-neutral-300')}>
                  Get started
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="bg-neutral-900 py-16 text-center px-5">
        <h2 className="font-serif text-3xl sm:text-4xl text-white tracking-tight mb-3">
          Bring your brief.<br />
          <em className="text-emerald-400 not-italic">We'll find the signal.</em>
        </h2>
        <p className="text-sm text-neutral-400 mb-7 font-light">Start with a real active project. First interview free. No credit card required.</p>
        <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-medium px-6 py-3 rounded-lg hover:bg-neutral-100 transition-colors">
          Open the Signal<span className="text-[#1A9B76] font-serif not-italic">room</span>
          <ArrowRight size={15} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo href="/" size="sm" />
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'FAQ', 'Contact'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">{l}</Link>
            ))}
          </div>
          <p className="text-xs text-neutral-400">© 2026 SignalRoom</p>
        </div>
      </footer>
    </div>
  )
}
