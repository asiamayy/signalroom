'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight, BookOpen, Brain, CircleHelp, FileText, Lightbulb, Plus,
  Settings, ShieldCheck,
} from 'lucide-react'
import { HOME_FONT_BODY, HOME_FONT_DISPLAY } from '@/lib/home-theme'

const START_HERE = [
  { title: 'Build your audience', body: 'Create detailed personas that represent the customers you want to understand.', href: '/personas/new', action: 'Create a persona' },
  { title: 'Run an interview', body: 'Ask questions, test a concept, or share a visual with a persona in a focused interview.', href: '/interviews/new', action: 'Start an interview' },
  { title: 'Turn responses into insight', body: 'Generate a report to surface themes, evidence, recommendations, and a confidence score.', href: '/reports', action: 'Explore insights' },
]

const PRODUCT_GUIDES = [
  { icon: Brain, title: 'Personas and interviews', body: 'Use specific background, goals, and context to make each response more useful.', href: '/personas' },
  { icon: Lightbulb, title: 'Audience panels and concept tests', body: 'Compare reactions across several personas before investing in a concept or message.', href: '/audience-panel' },
  { icon: FileText, title: 'Reports and signals', body: 'Find patterns across research and share a clear, decision-ready summary with your team.', href: '/reports' },
  { icon: Settings, title: 'Plans, team, and workspace', body: 'Manage your plan, branding, members, and workspace preferences.', href: '/settings' },
]

const QUESTIONS = [
  { question: 'Where should I begin?', answer: 'We recommend starting by creating your first Persona to define your target audience characteristics.' },
  { question: 'Are AI personas a replacement for talking to real customers?', answer: 'AI personas are a powerful tool for initial hypothesis testing and sharpening your research questions, but should complement, not entirely replace, direct customer validation for high-stakes decisions.' },
  { question: 'How do I share research with my team?', answer: 'You can invite team members in Workspace settings or export individual signal reports as shareable summaries.' },
]

export default function HelpPage() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null)

  return (
    <div className="min-h-full bg-[#fcf9f8] px-4 py-6 sm:px-10" style={{ fontFamily: HOME_FONT_BODY }}>
      <div className="flex w-full max-w-6xl flex-col">
        <section className="mb-12">
          <div className="mb-8">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6b7280]">Help Center</p>
            <h1 className="mb-4 text-[40px] font-semibold leading-[48px] tracking-[-0.02em] text-[#041208]" style={{ fontFamily: HOME_FONT_DISPLAY }}>Help &amp; support</h1>
            <p className="max-w-3xl text-base leading-6 text-[#434843]">Practical guidance for planning research, getting useful answers, and turning customer signals into confident next steps.</p>
          </div>

          <div className="mt-10">
            <div className="mb-6 flex items-center justify-between border-b border-[#d1d5db] pb-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1b1c1b]">Start here</p>
              <p className="text-base italic text-[#6b7280]">Create, ask, synthesize</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {START_HERE.map(({ title, body, href, action }, index) => (
                <div key={title} className="flex flex-col">
                  <div className="mb-4 text-[32px] font-semibold leading-10 text-[#c3c8c1]" style={{ fontFamily: HOME_FONT_DISPLAY }}>0{index + 1}</div>
                  <h2 className="mb-2 text-[18px] font-semibold leading-6 text-[#1b1c1b]">{title}</h2>
                  <p className="mb-4 flex-1 text-[14px] leading-6 text-[#434843]">{body}</p>
                  <Link href={href} className="flex items-center gap-1 text-[12px] font-semibold tracking-[0.05em] text-[#041208] hover:underline">
                    {action}<ArrowRight size={18} strokeWidth={1.75} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-10 mt-12">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6b7280]">Product guides</p>
          <h2 className="text-[40px] font-semibold leading-[48px] tracking-[-0.02em] text-[#041208]" style={{ fontFamily: HOME_FONT_DISPLAY }}>Make the most of SignalRoom</h2>
        </section>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-6 lg:col-span-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {PRODUCT_GUIDES.map(({ icon: Icon, title, body, href }) => (
                <Link key={title} href={href} className="group flex gap-4 rounded border border-[#d1d5db] bg-[#fcf9f8] p-6 transition-all hover:bg-[#f6f3f2]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#f0edec] text-[#434843]"><Icon size={21} strokeWidth={1.75} /></span>
                  <span>
                    <span className="mb-1 block text-[18px] font-semibold leading-6 text-[#1b1c1b]">{title}</span>
                    <span className="block text-[14px] leading-relaxed text-[#434843]">{body}</span>
                  </span>
                </Link>
              ))}
            </div>

            <section className="mt-12">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#6b7280]">Common Questions</p>
              <h2 className="mb-6 text-[32px] font-semibold leading-10 text-[#041208]" style={{ fontFamily: HOME_FONT_DISPLAY }}>Quick answers</h2>
              <div className="divide-y divide-[#d1d5db] border-t border-[#d1d5db]">
                {QUESTIONS.map(({ question, answer }, index) => {
                  const isOpen = openQuestion === index
                  return (
                    <div key={question}>
                      <button
                        type="button"
                        onClick={() => setOpenQuestion(isOpen ? null : index)}
                        className="group flex w-full items-center justify-between py-6 text-left text-[#1b1c1b] transition-colors hover:text-[#041208]"
                        aria-expanded={isOpen}
                      >
                        <span className="text-base font-semibold leading-6">{question}</span>
                        <Plus size={22} strokeWidth={1.5} className="shrink-0 text-[#c3c8c1]" />
                      </button>
                      {isOpen && <div className="py-4 text-base leading-6 text-[#434843]">{answer}</div>}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          <aside className="col-span-12 space-y-6 lg:col-span-4">
            <section className="rounded-lg border border-[#d1d5db] bg-[#303030] p-8 text-[#f3f0ef]">
              <span className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><CircleHelp size={20} strokeWidth={1.75} /></span>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#f3f0ef]/60">Need a hand?</p>
              <h2 className="mb-4 text-[24px] font-semibold leading-8" style={{ fontFamily: HOME_FONT_DISPLAY }}>Talk to support</h2>
              <p className="mb-8 text-base leading-relaxed text-[#f3f0ef]/80">Send context on what you were trying to do, what happened, and any relevant report or project link. We&apos;ll take it from there.</p>
              <a href="mailto:hello@getsignalroom.com?subject=SignalRoom%20support%20request" className="flex w-fit items-center justify-center gap-2 rounded-full bg-[#b8cbb9] px-6 py-3 text-[12px] font-semibold tracking-[0.05em] text-[#041208] transition-colors hover:bg-white">
                Email support<ArrowRight size={18} strokeWidth={1.75} />
              </a>
            </section>

            <section className="rounded-lg border border-[#d1d5db] bg-[#f6f3f2] p-8">
              <div className="mb-6 flex items-center gap-2 text-[#1b1c1b]">
                <ShieldCheck size={20} strokeWidth={1.75} />
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.15em]">Research responsibly</h2>
              </div>
              <p className="mb-6 text-base leading-relaxed text-[#434843]">Use synthetic research to explore assumptions and sharpen questions. For decisions with material customer, financial, or regulatory impact, validate the important findings with real people.</p>
              <Link href="/faq" className="flex w-fit items-center gap-2 text-[12px] font-semibold tracking-[0.05em] text-[#041208] hover:underline">
                <BookOpen size={20} strokeWidth={1.75} />Read the full FAQ
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
