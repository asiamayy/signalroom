'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Zap, Users, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

// ─── ROI Calculator ───────────────────────────────────────────────────────────

const TRADITIONAL_COST_PER_INTERVIEW = 750   // USD per in-depth interview
const TRADITIONAL_HOURS_PER_INTERVIEW = 2    // recruiting + session + analysis
const TRADITIONAL_WEEKS_TURNAROUND = 3

function ROICalculator() {
  const [interviews, setInterviews] = useState(8)

  const traditionalCost = interviews * TRADITIONAL_COST_PER_INTERVIEW
  const traditionalHours = interviews * TRADITIONAL_HOURS_PER_INTERVIEW
  const signalroomCost = 99
  const savings = traditionalCost - signalroomCost
  const annualSavings = savings * 12
  const timeReduction = Math.round((1 - (10 / (TRADITIONAL_WEEKS_TURNAROUND * 5 * 8))) * 100)

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100">
        <h3 className="text-base font-serif tracking-tight text-neutral-900">See your savings</h3>
        <p className="text-sm text-neutral-500 mt-0.5">Adjust the slider to match your research volume</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Slider */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-neutral-700">Interviews per month</label>
            <span className="text-lg font-serif font-semibold text-neutral-900">{interviews}</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={interviews}
            onChange={e => setInterviews(Number(e.target.value))}
            className="w-full accent-neutral-900"
          />
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>1</span>
            <span>30</span>
          </div>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-3">
          {/* Traditional */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">Traditional</p>
            <div className="space-y-3">
              <div>
                <p className="text-xl font-serif font-semibold text-neutral-900">
                  ${traditionalCost.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500">per month</p>
              </div>
              <div className="border-t border-neutral-200 pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Time to results</span>
                  <span className="text-neutral-700 font-medium">{TRADITIONAL_WEEKS_TURNAROUND} weeks</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Hours of work</span>
                  <span className="text-neutral-700 font-medium">{traditionalHours}h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Cost per interview</span>
                  <span className="text-neutral-700 font-medium">${TRADITIONAL_COST_PER_INTERVIEW}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SignalRoom */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-3">SignalRoom</p>
            <div className="space-y-3">
              <div>
                <p className="text-xl font-serif font-semibold text-emerald-800">
                  $99
                </p>
                <p className="text-xs text-emerald-600">per month — unlimited</p>
              </div>
              <div className="border-t border-emerald-200 pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-700">Time to results</span>
                  <span className="text-emerald-800 font-medium">Minutes</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-700">Hours of work</span>
                  <span className="text-emerald-800 font-medium">&lt; 1h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-700">Cost per interview</span>
                  <span className="text-emerald-800 font-medium">~$0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Savings callout */}
        <div className="bg-neutral-900 text-white rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-400 mb-0.5">You save</p>
            <p className="text-2xl font-serif font-semibold">
              ${savings.toLocaleString()}<span className="text-sm font-sans font-normal text-neutral-400">/mo</span>
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">${annualSavings.toLocaleString()} per year</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-400 mb-0.5">Time saved</p>
            <p className="text-2xl font-serif font-semibold">{timeReduction}%</p>
            <p className="text-xs text-neutral-400 mt-0.5">faster to insight</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pricing plans ────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Pulse',
    price: 49,
    tagline: 'For solo founders getting started',
    icon: Zap,
    features: ['3 personas', '10 interviews/month', 'Core templates', 'Basic reports'],
  },
  {
    name: 'Signal',
    price: 99,
    tagline: 'For teams validating fast',
    icon: Users,
    highlight: true,
    features: ['Unlimited personas', 'Unlimited interviews', 'All templates', 'Full reports', 'Multi-persona testing'],
  },
  {
    name: 'Broadcast',
    price: 249,
    tagline: 'For agencies and growing teams',
    icon: Building2,
    features: ['Everything in Signal', '10 team seats', 'White-label reports', 'Priority support'],
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo href="/" size="md" />
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Pricing</a>
            <a href="#roi" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">ROI</a>
            <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Sign in</Link>
            <Link href="/signup" className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1.5 text-xs text-neutral-500 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          AI-powered market research for founders &amp; marketers
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl tracking-tight text-neutral-900 leading-[1.05] mb-6">
          Your market has<br />
          <em className="text-emerald-600 not-italic">opinions.</em><br />
          Now you can ask.
        </h1>

        <p className="text-lg text-neutral-500 max-w-xl mx-auto mb-8 leading-relaxed font-light">
          Build AI personas that represent your exact target customer. Interview them. Get structured research insights in minutes — not weeks, not $8,000.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap mb-12">
          <Link href="/signup" className="bg-neutral-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors inline-flex items-center gap-2">
            Start free trial
            <ArrowRight size={15} />
          </Link>
          <a href="#roi" className="border border-neutral-200 bg-white text-neutral-700 px-6 py-3 rounded-lg text-sm font-medium hover:border-neutral-300 transition-colors">
            Calculate your savings
          </a>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-10 border-t border-neutral-200 pt-10 flex-wrap">
          {[
            ['~90%', 'Parity with real human research'],
            ['< 10 min', 'From idea to first insight'],
            ['$99/mo', 'vs. $8,000+ traditional tools'],
          ].map(([num, label]) => (
            <div key={num} className="text-center">
              <p className="font-serif text-2xl text-neutral-900">{num}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">How it works</p>
        <h2 className="font-serif text-3xl tracking-tight text-neutral-900 mb-10">
          Three steps to <em className="text-emerald-600 not-italic">real insight</em>
        </h2>

        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-200">
          {[
            {
              n: '01',
              title: 'Build your persona',
              body: 'Define who you want to talk to. Name them, give them a job, income, frustrations, and buying habits. AI can fill in the details from a single sentence.',
            },
            {
              n: '02',
              title: 'Run the interview',
              body: 'Ask your persona anything — your idea, your pricing, your landing page copy. They respond in character with real nuance, hesitation, and honest pushback.',
            },
            {
              n: '03',
              title: 'Get your report',
              body: 'Key themes, verbatim quotes, confidence score, and actionable recommendations — formatted like a real research report you can share with your team.',
            },
          ].map(step => (
            <div key={step.n} className="bg-white p-7">
              <span className="text-xs text-neutral-300 font-mono block mb-4">{step.n}</span>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">{step.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed font-light">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROI Calculator ───────────────────────────────────────────────── */}
      <section id="roi" className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">ROI calculator</p>
            <h2 className="font-serif text-3xl tracking-tight text-neutral-900 mb-4">
              See what you're <em className="text-emerald-600 not-italic">actually spending</em>
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6 font-light">
              Traditional market research runs $500–$1,000 per in-depth interview after you factor in recruiting, moderation, and analysis. SignalRoom replaces all of that for a flat monthly fee.
            </p>
            <div className="space-y-3">
              {[
                'No recruiting fees',
                'No scheduling overhead',
                'No transcription costs',
                'Results in minutes, not weeks',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-sm text-neutral-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <ROICalculator />
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Pricing</p>
        <h2 className="font-serif text-3xl tracking-tight text-neutral-900 mb-2">
          Simple pricing. <em className="text-emerald-600 not-italic">No surprises.</em>
        </h2>
        <p className="text-sm text-neutral-500 mb-10 font-light">Start free. Upgrade when it's earning its keep.</p>

        <div className="grid grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className={cn(
                  'bg-white rounded-2xl p-6 flex flex-col',
                  plan.highlight ? 'border-2 border-emerald-400' : 'border border-neutral-200'
                )}
              >
                {plan.highlight && (
                  <span className="self-start text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full mb-3">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={15} className="text-neutral-400" />
                  <h3 className="text-sm font-semibold text-neutral-900">{plan.name}</h3>
                </div>
                <p className="text-xs text-neutral-500 mb-4">{plan.tagline}</p>
                <p className="font-serif text-3xl text-neutral-900 mb-1">${plan.price}</p>
                <p className="text-xs text-neutral-400 mb-5">/month</p>
                <hr className="border-neutral-100 mb-5" />
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-neutral-600">
                      <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={cn(
                    'block text-center text-sm font-medium py-2.5 rounded-lg transition-colors',
                    plan.highlight
                      ? 'bg-neutral-900 text-white hover:bg-neutral-700'
                      : 'border border-neutral-200 text-neutral-700 hover:border-neutral-300'
                  )}
                >
                  Get started
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────────────── */}
      <section className="bg-neutral-900 py-20 text-center">
        <h2 className="font-serif text-4xl text-white tracking-tight mb-3">
          Stop guessing.<br />
          <em className="text-emerald-400 not-italic">Start listening.</em>
        </h2>
        <p className="text-sm text-neutral-400 mb-8 font-light">First interview free. No credit card required.</p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-medium px-6 py-3 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          Open the Signal<span className="text-emerald-500 font-serif not-italic">room</span>
          <ArrowRight size={15} />
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <Logo href="/" size="sm" />
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
                {l}
              </Link>
            ))}
          </div>
          <p className="text-xs text-neutral-400">© 2026 SignalRoom</p>
        </div>
      </footer>
    </div>
  )
}
