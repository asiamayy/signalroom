'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, Zap, Users, Building2, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

const TRADITIONAL_COST_PER_INTERVIEW = 750
const TRADITIONAL_HOURS_PER_INTERVIEW = 2
const TRADITIONAL_WEEKS_TURNAROUND = 3

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" }

const HERO_WORDS = ['opinions', 'objections', 'blindspots', 'expectations']

function HeroWordCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % HERO_WORDS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const word = HERO_WORDS[index]
  const letters = word.split('')

  return (
    <span className="inline-block relative not-italic" style={{ ...SERIF, color: '#2A5C4E' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={word}
          className="inline-block"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {letters.map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function ROICalculator() {
  const [interviews, setInterviews] = useState(8)
  const traditionalCost = interviews * TRADITIONAL_COST_PER_INTERVIEW
  const traditionalHours = interviews * TRADITIONAL_HOURS_PER_INTERVIEW
  const savings = traditionalCost - 99
  const annualSavings = savings * 12
  const timeReduction = Math.round((1 - (10 / (TRADITIONAL_WEEKS_TURNAROUND * 5 * 8))) * 100)

  return (
    <div className="border border-neutral-200">
      <div className="px-6 py-5 border-b border-neutral-200">
        <h3 style={SERIF} className="text-lg text-neutral-900">See your savings</h3>
        <p className="text-sm text-neutral-500 mt-1">Traditional tools charge $8,000+ for 6 months. Compare that to SignalRoom.</p>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs uppercase tracking-wider text-neutral-500">Interviews per month</label>
            <span style={SERIF} className="text-xl text-neutral-900">{interviews}</span>
          </div>
          <input type="range" min={1} max={30} step={1} value={interviews}
            onChange={e => setInterviews(Number(e.target.value))}
            className="w-full accent-neutral-900" />
          <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
            <span>1</span><span>30</span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-neutral-200 border border-neutral-200">
          <div className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">Traditional</p>
            <p style={SERIF} className="text-2xl text-neutral-900">${traditionalCost.toLocaleString()}</p>
            <p className="text-[11px] text-neutral-500 mb-3">/month</p>
            <div className="border-t border-neutral-200 pt-2.5 space-y-1.5">
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
          <div className="p-4" style={{ background: '#F0F4F1' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#2A5C4E] mb-2">SignalRoom</p>
            <p style={SERIF} className="text-2xl text-[#2A5C4E]">$99</p>
            <p className="text-[11px] text-[#2A5C4E] mb-3">unlimited/month</p>
            <div className="pt-2.5 space-y-1.5" style={{ borderTop: '1px solid #D3DEDA' }}>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#2A5C4E]">Time</span>
                <span className="font-medium text-[#2A5C4E]">Minutes</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#2A5C4E]">Per interview</span>
                <span className="font-medium text-[#2A5C4E]">~$0</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#2A5C4E]">Hours</span>
                <span className="font-medium text-[#2A5C4E]">&lt; 1h</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">You save</p>
            <p style={SERIF} className="text-2xl text-white">${savings.toLocaleString()}<span className="text-sm font-sans font-normal text-neutral-400">/mo</span></p>
            <p className="text-[11px] text-neutral-400 mt-0.5">${annualSavings.toLocaleString()}/year</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Time saved</p>
            <p style={SERIF} className="text-2xl text-white">{timeReduction}%</p>
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
    const navHeight = 80 // matches nav bar height with buffer

    const doScroll = () => {
      const el = document.getElementById(id)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight
      window.scrollTo({ top, behavior: 'smooth' })
    }

    if (menuOpen) {
      // Close mobile menu first, then wait for DOM reflow before measuring position
      setMenuOpen(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(doScroll)
      })
    } else {
      doScroll()
    }
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo href="/" size="md" />
          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors">How it works</a>
            <a href="#pricing" onClick={scrollToSection('pricing')} className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors">Pricing</a>
            <a href="#roi" onClick={scrollToSection('roi')} className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors">ROI</a>
            <Link href="/login" className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors">Sign in</Link>
            <Link href="/signup" className="bg-neutral-900 text-white text-xs uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-neutral-700 transition-colors">
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
          <div className="md:hidden border-t border-neutral-200 bg-white px-6 py-4 space-y-3">
            <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="block text-xs uppercase tracking-widest text-neutral-600 py-1">How it works</a>
            <a href="#pricing" onClick={scrollToSection('pricing')} className="block text-xs uppercase tracking-widest text-neutral-600 py-1">Pricing</a>
            <a href="#roi" onClick={scrollToSection('roi')} className="block text-xs uppercase tracking-widest text-neutral-600 py-1">ROI</a>
            <Link href="/login" className="block text-xs uppercase tracking-widest text-neutral-600 py-1">Sign in</Link>
            <Link href="/signup" className="block text-center bg-neutral-900 text-white text-xs uppercase tracking-widest px-4 py-3 rounded-full mt-2">
              Start free
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center border-b border-neutral-200">
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-1.5 text-[11px] uppercase tracking-widest text-neutral-500 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2A5C4E] flex-shrink-0" />
          AI-powered market research for founders &amp; product teams
        </div>
        <h1 style={SERIF} className="text-5xl sm:text-6xl lg:text-8xl font-normal text-neutral-900 leading-[1.05] mb-6 tracking-tight">
          Your market has<br />
          <HeroWordCarousel />.<br />
          Now you can ask.
        </h1>
        <p className="text-base sm:text-lg text-neutral-500 max-w-xl mx-auto mb-3 leading-relaxed font-normal">
          Build AI personas that represent your exact target customer — fully defined by you. Interview them. Get structured research insights in minutes, not weeks.
        </p>
        <p className="text-sm text-neutral-400 max-w-md mx-auto mb-10">
          Built for seed-stage teams who can't afford to ship the wrong thing.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link href="/signup" className="w-full sm:w-auto bg-neutral-900 text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-neutral-700 transition-colors inline-flex items-center justify-center gap-2">
            Start free trial <ArrowRight size={15} />
          </Link>
          <a href="#roi" onClick={scrollToSection('roi')} className="w-full sm:w-auto border border-neutral-300 bg-white text-neutral-700 px-7 py-3.5 rounded-full text-sm font-medium hover:border-neutral-900 hover:text-neutral-900 transition-colors text-center">
            Calculate your savings
          </a>
        </div>
        <div className="grid grid-cols-3 divide-x divide-neutral-200 border-t border-neutral-200 pt-8">
          {[
            ['< 1 hour', 'From idea to structured report'],
            ['< 10 min', 'First insight'],
            ['$8,000+', 'What competitors charge for 6 months'],
          ].map(([num, label]) => (
            <div key={num} className="text-center px-2">
              <p style={SERIF} className="text-xl sm:text-2xl text-neutral-900">{num}</p>
              <p className="text-xs text-neutral-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-20 border-b border-neutral-200">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">01 — How it works</p>
        <h2 style={SERIF} className="text-3xl sm:text-4xl text-neutral-900 mb-10">
          Three steps to <em className="text-[#2A5C4E] not-italic">real insight</em>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 border border-neutral-200">
          {[
            { n: '01', title: 'Build your persona', body: 'Define who you want to talk to. Name them, give them a job, income, and frustrations. AI fills in the details from a single sentence.' },
            { n: '02', title: 'Run the interview', body: 'Ask anything — your idea, pricing, landing page copy. They respond in character with real nuance, hesitation, and honest pushback.' },
            { n: '03', title: 'Get your report', body: 'Key themes, verbatim quotes, confidence score, and recommendations — formatted like a real research report you can share.' },
          ].map(step => (
            <div key={step.n} className="p-7">
              <span style={SERIF} className="text-sm text-neutral-300 block mb-4">{step.n}</span>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2 uppercase tracking-wide">{step.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed font-normal">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Example report preview ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-b border-neutral-200">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">02 — What you get</p>
        <h2 style={SERIF} className="text-3xl sm:text-4xl text-neutral-900 mb-10">
          A report your team can <em className="text-[#2A5C4E] not-italic">actually use</em>
        </h2>
        <div className="border border-neutral-200">
          {/* Report header */}
          <div className="px-7 py-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">Pricing Validation — Sarah K. · Head of Marketing</h3>
              <p className="text-xs text-neutral-400">Concept testing · 8 messages · Generated in 4 minutes</p>
            </div>
            <div className="flex items-center divide-x divide-neutral-200 border border-neutral-200">
              <div className="text-center px-5 py-2.5">
                <p style={SERIF} className="text-xl text-neutral-900 leading-none">74</p>
                <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wide">Confidence</p>
              </div>
              <div className="text-center px-5 py-2.5">
                <p style={SERIF} className="text-xl text-neutral-900 leading-none">5</p>
                <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wide">Key themes</p>
              </div>
              <div className="text-center px-5 py-2.5">
                <p style={SERIF} className="text-xl text-neutral-900 leading-none">4</p>
                <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wide">Recommendations</p>
              </div>
            </div>
          </div>
          {/* Report body */}
          <div className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">Key themes</p>
              <div className="space-y-4">
                {[
                  { label: 'Price anchoring needed', sentiment: 'negative', quote: '"$99/month feels abstract without knowing what I\'m comparing it to."' },
                  { label: 'Speed is the core value prop', sentiment: 'positive', quote: '"If this genuinely takes 10 minutes, that alone justifies the price."' },
                  { label: 'Free trial reduces risk', sentiment: 'positive', quote: '"The first interview being free is what made me actually try it."' },
                ].map(theme => (
                  <div key={theme.label} className="border-l-2 pl-3" style={{ borderColor: theme.sentiment === 'positive' ? '#2A5C4E' : '#EF4444' }}>
                    <p className="text-xs font-semibold text-neutral-800 mb-1">{theme.label}</p>
                    <p className="text-xs text-neutral-500 italic leading-relaxed">{theme.quote}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">Top recommendations</p>
              <div className="space-y-4">
                {[
                  { priority: 'High', text: 'Lead with time savings in pricing page headline — $99/month lands better when anchored against $8,000 alternatives.' },
                  { priority: 'High', text: 'Surface the free first interview earlier — it\'s the primary conversion trigger for skeptical buyers.' },
                  { priority: 'Medium', text: 'Add a sample report download to the landing page so buyers can see output quality before signing up.' },
                ].map(rec => (
                  <div key={rec.text} className="flex items-start gap-3">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5', rec.priority === 'High' ? 'bg-[#F0F4F1] text-[#2A5C4E]' : 'bg-neutral-100 text-neutral-500')}>
                      {rec.priority}
                    </span>
                    <p className="text-xs text-neutral-600 leading-relaxed">{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* CTA */}
          <div className="px-7 py-5 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">Your first interview generates a report like this — free, no credit card required.</p>
            <Link href="/signup" className="flex-shrink-0 bg-neutral-900 text-white text-xs uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-neutral-700 transition-colors">
              Get your free report →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-b border-neutral-200">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">03 — Who it's for</p>
        <h2 style={SERIF} className="text-3xl sm:text-4xl text-neutral-900 mb-2">
          Built for people who <em className="text-[#2A5C4E] not-italic">already do the work</em>
        </h2>
        <p className="text-sm text-neutral-500 mb-10 font-normal">Fast like an AI tool. Structured like a research firm.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 border border-neutral-200">
          {[
            {
              title: 'Founders pre-launch',
              body: 'You\'re validating pricing and messaging before writing code. You need structured customer evidence — not gut feel and not a $15,000 research engagement.',
            },
            {
              title: 'Product managers moving fast',
              body: 'Your next sprint locks in 48 hours. SignalRoom gives you themes, quotes, and recommendations you can paste directly into your PRD — in under an hour.',
            },
            {
              title: 'Teams who need to align',
              body: 'Bring customer evidence to your next meeting. Download a PDF report with confidence scores your stakeholders can act on — no synthesis required.',
            },
          ].map((item, i) => (
            <div key={item.title} className="p-7">
              <span style={SERIF} className="text-sm text-neutral-300 block mb-4">0{i + 1}</span>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2 uppercase tracking-wide">{item.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed font-normal">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROI Calculator ── */}
      <section id="roi" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-20 border-b border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">04 — ROI calculator</p>
            <h2 style={SERIF} className="text-3xl sm:text-4xl text-neutral-900 mb-5">
              See what you're <em className="text-[#2A5C4E] not-italic">actually spending</em>
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6 font-normal">
              Traditional market research tools cost $8,000 or more for a 6-month subscription — before you factor in recruiting, moderation, and analysis. SignalRoom replaces all of that for a flat monthly fee with no contracts.
            </p>
            <div className="border-l-2 pl-4 mb-6" style={{ borderColor: '#2A5C4E' }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2A5C4E] mb-1">Fully customizable to your market</p>
              <p className="text-xs text-neutral-500 leading-relaxed">Every persona is built around your exact target customer — their age, job, income, frustrations, buying behavior, and emotional context. The more specific you are, the more precise the insight.</p>
            </div>
            <div className="space-y-3">
              {['No recruiting fees', 'No scheduling overhead', 'No 6-month contracts', 'Results in minutes, not weeks'].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <Check size={14} className="text-[#2A5C4E] flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-sm text-neutral-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <ROICalculator />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-20 border-b border-neutral-200">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">05 — Pricing</p>
        <h2 style={SERIF} className="text-3xl sm:text-4xl text-neutral-900 mb-2">
          Simple pricing. <em className="text-[#2A5C4E] not-italic">No surprises.</em>
        </h2>
        <p className="text-sm text-neutral-500 mb-2 font-normal">Start free. Upgrade when it's earning its keep.</p>
        <p className="text-sm text-neutral-400 mb-10 font-normal">One wrong product decision costs more than a year of SignalRoom.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 border border-neutral-200">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div key={plan.name} className="p-7 flex flex-col relative" style={plan.highlight ? { background: '#F0F4F1' } : undefined}>
                {plan.highlight && (
                  <span className="self-start text-[10px] font-medium uppercase tracking-wide bg-[#2A5C4E] text-white px-2.5 py-1 rounded-full mb-4">Most popular</span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className="text-neutral-400" />
                  <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">{plan.name}</h3>
                </div>
                <p className="text-xs text-neutral-500 mb-4">{plan.tagline}</p>
                <p style={SERIF} className="text-4xl text-neutral-900 mb-0.5">${plan.price}</p>
                <p className="text-xs text-neutral-400 mb-5 uppercase tracking-wide">/month</p>
                <hr className="border-neutral-200 mb-5" />
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-neutral-600">
                      <Check size={11} className="text-[#2A5C4E] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={cn('block text-center text-xs uppercase tracking-widest py-3 rounded-full transition-colors', plan.highlight ? 'bg-neutral-900 text-white hover:bg-neutral-700' : 'border border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900')}>
                  Get started
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="bg-neutral-900 py-20 text-center px-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-4">06 — Get started</p>
        <h2 style={SERIF} className="text-4xl sm:text-5xl text-white mb-4 tracking-tight">
          Bring your brief.<br />
          <em className="text-[#A3C6BC] not-italic">We'll find the signal.</em>
        </h2>
        <p className="text-sm text-neutral-400 mb-8 font-normal">Start with a real active project. First interview free. No credit card required.</p>
        <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-medium px-7 py-3.5 rounded-full hover:bg-neutral-100 transition-colors">
          Open the Signal<span style={SERIF} className="text-[#2A5C4E] not-italic">room</span>
          <ArrowRight size={15} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo href="/" size="sm" />
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'FAQ', 'Contact'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} className="text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors">{l}</Link>
            ))}
          </div>
          <p className="text-xs text-neutral-400">© 2026 SignalRoom</p>
        </div>
      </footer>
    </div>
  )
}
