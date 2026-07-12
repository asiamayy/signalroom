'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

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
        a: 'The Free plan includes 1 persona and 1 interview per month, no credit card required. The Pulse plan ($199/month) includes 3 personas and 10 interviews per month. The Signal plan ($499/month) includes unlimited personas and interviews. The Broadcast plan ($1,999/month) adds team seats and white-label reports. Deleted personas free up your slots — limits are based on how many you have at one time, not total ever created.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. You can cancel your subscription at any time from the Settings page. Your plan stays active until the end of the billing period — we don\'t prorate or charge cancellation fees.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Every account starts on the Free plan — no credit card required. Sign up, create a persona, and run a full interview before committing to anything. When you\'re ready to do more, upgrade to Pulse, Signal, or Broadcast from the Settings page.',
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
      className="w-full text-left py-4 border-b border-[#E3E5E3] last:border-0"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cn('text-sm font-medium transition-colors', open ? 'text-[#121314]' : 'text-[#454947]')}>
          {q}
        </span>
        <span className="flex-shrink-0 mt-0.5">
          {open
            ? <Minus size={14} className="text-[#1A3024]" />
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
    <div className="min-h-screen bg-[#FCFCFB] text-[#121314]">
      <SiteNav />

      <div className="max-w-2xl mx-auto px-6 pt-32 sm:pt-40 pb-16">
        <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#5A7973] mb-4 block">Support</span>
        <h1 className="text-[34px] sm:text-[44px] tracking-tighter font-normal text-[#121314] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Frequently asked questions
        </h1>
        <p className="text-sm text-neutral-500 mb-12">Everything you need to know about SignalRoom.</p>

        <div className="space-y-10">
          {FAQS.map(section => (
            <div key={section.category}>
              <h2 className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500 mb-2">{section.category}</h2>
              <div className="bg-white border border-[#E3E5E3] rounded-[8px] px-5">
                {section.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#1A3024] rounded-[8px] p-8 text-center">
          <h3 className="text-xl text-white mb-2 tracking-tight font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Still have questions?</h3>
          <p className="text-sm text-white/70 mb-5">We're happy to help. Reach out and we'll get back to you within 1 business day.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-[#1A3024] text-[11px] font-medium uppercase tracking-[0.2em] px-6 py-3 rounded-[4px] hover:bg-[#f0f2f0] transition-colors"
          >
            Contact us
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
