'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Minus } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    category: 'About SignalRoom',
    items: [
      {
        q: 'What is SignalRoom?',
        a: 'SignalRoom is an AI-powered market research platform that lets you create synthetic personas representing your target customers and interview them to validate ideas, test messaging, and understand customer behavior — in minutes, not weeks.',
      },
      {
        q: 'Is this a replacement for real user research?',
        a: 'No — and we\'re honest about that. SignalRoom is best used as a first filter: a fast, affordable way to pressure-test assumptions before committing to real research or building something. Think of it as stress-testing your ideas before you spend real research budget on them. For high-stakes decisions, validate key findings with real users.',
      },
      {
        q: 'How accurate are AI personas compared to real people?',
        a: 'Studies show AI persona responses achieve roughly 90% correlation with real human responses on average. The quality depends heavily on how specifically you define your persona — the more detailed the traits, context, and background you provide, the more accurate and nuanced the responses. Generic personas produce generic answers.',
      },
      {
        q: 'What is Devil\'s Advocate mode?',
        a: 'Devil\'s Advocate mode instructs the persona to lead every response with its biggest objection, concern, or point of skepticism before engaging with any positives. It\'s designed for stress-testing ideas rather than validating them — ideal when you want to find the flaws in a concept before committing to it.',
      },
    ],
  },
  {
    category: 'Features',
    items: [
      {
        q: 'Can I upload images during an interview?',
        a: 'Yes. You can upload a screenshot, mockup, ad creative, or any image directly into the interview chat and ask the persona for their reaction. This is useful for testing landing pages, ad concepts, product designs, or packaging before launch.',
      },
      {
        q: 'What is the Compare feature?',
        a: 'Compare lets you run the same question across 2 to 4 personas simultaneously and see how different customer segments respond — tabbed side by side. It\'s useful for understanding where your target segments agree and where they diverge on the same concept.',
      },
      {
        q: 'Can I download my reports?',
        a: 'Yes. Every report has a Download PDF button that generates a clean, printable version with all themes, quotes, recommendations, and the confidence score — formatted as a professional research deliverable you can share with your team or investors.',
      },
      {
        q: 'Can I delete or edit personas?',
        a: 'You can delete personas at any time — deleted personas free up your slot so you can create new ones. Editing an existing persona\'s traits is coming soon.',
      },
    ],
  },
  {
    category: 'Pricing and plans',
    items: [
      {
        q: 'What are the plan limits?',
        a: 'The Pulse plan ($49/month) includes 3 personas and 10 interviews per month. The Signal plan ($99/month) includes unlimited personas and interviews. The Broadcast plan ($249/month) adds team seats and white-label reports. Deleted personas free up your slots — limits are based on how many you have at one time, not total ever created.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. You can cancel your subscription at any time from the Settings page. Your plan stays active until the end of the billing period — we don\'t prorate or charge cancellation fees.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes — your first interview is free with no credit card required. Sign up, create a persona, and run a full interview before committing to a plan. When you\'re ready to do more, upgrade from the Settings page.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We don\'t offer refunds for partial months, but you can cancel before your next billing date to avoid being charged again. If you have a specific issue, reach out to us at support@getsignalroom.com and we\'ll work something out.',
      },
    ],
  },
  {
    category: 'Privacy and data',
    items: [
      {
        q: 'Who can see my interviews and reports?',
        a: 'Only you. Your personas, interviews, and reports are private to your account. We do not share, sell, or use your research content for any purpose other than providing the service.',
      },
      {
        q: 'Is my data used to train AI models?',
        a: 'No. The content you submit through SignalRoom is processed through Anthropic\'s Claude API to generate responses, but we do not use your interview content to train AI models.',
      },
      {
        q: 'What AI model powers SignalRoom?',
        a: 'SignalRoom uses Anthropic\'s Claude for persona interviews and report generation, and fal.ai\'s FLUX model for generating persona portrait photos.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left py-4 border-b border-neutral-100 last:border-0"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cn('text-sm font-medium transition-colors', open ? 'text-neutral-900' : 'text-neutral-700')}>
          {q}
        </span>
        <span className="flex-shrink-0 mt-0.5">
          {open
            ? <Minus size={14} className="text-neutral-400" />
            : <Plus size={14} className="text-neutral-400" />
          }
        </span>
      </div>
      {open && (
        <p className="text-sm text-neutral-500 leading-relaxed mt-3 text-left">
          {a}
        </p>
      )}
    </button>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <Logo href="/" size="md" />
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Sign in</Link>
          <Link href="/signup" className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors">
            Start free
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-serif text-3xl tracking-tight text-neutral-900 mb-2">Frequently asked questions</h1>
        <p className="text-sm text-neutral-500 mb-12">Everything you need to know about SignalRoom.</p>

        <div className="space-y-10">
          {FAQS.map(section => (
            <div key={section.category}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">{section.category}</h2>
              <div className="bg-white border border-neutral-200 rounded-xl px-5">
                {section.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-neutral-900 rounded-2xl p-8 text-center">
          <h3 className="font-serif text-xl text-white mb-2">Still have questions?</h3>
          <p className="text-sm text-neutral-400 mb-5">We're happy to help. Reach out and we'll get back to you within 1 business day.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors">
            Contact us
          </Link>
        </div>
      </div>

      <footer className="border-t border-neutral-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <Logo href="/" size="sm" />
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-neutral-400 hover:text-neutral-700">Privacy</Link>
            <Link href="/terms" className="text-xs text-neutral-400 hover:text-neutral-700">Terms</Link>
            <Link href="/faq" className="text-xs text-neutral-400 hover:text-neutral-700">FAQ</Link>
            <Link href="/contact" className="text-xs text-neutral-400 hover:text-neutral-700">Contact</Link>
          </div>
          <p className="text-xs text-neutral-400">© 2026 SignalRoom</p>
        </div>
      </footer>
    </div>
  )
}
