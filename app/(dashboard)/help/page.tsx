import Link from 'next/link'
import {
  ArrowRight, BookOpen, Brain, CircleHelp, FileText, Lightbulb,
  MessageSquare, Settings, ShieldCheck, Users,
} from 'lucide-react'
import { DISPLAY_LG_STYLE, HOME_COLORS, HOME_FONT_BODY, HOME_FONT_DISPLAY } from '@/lib/home-theme'

const GETTING_STARTED = [
  { icon: Users, title: 'Build your audience', body: 'Create detailed personas that represent the customers you want to understand.', href: '/personas/new', action: 'Create a persona' },
  { icon: MessageSquare, title: 'Run an interview', body: 'Ask questions, test a concept, or share a visual with a persona in a focused interview.', href: '/interviews/new', action: 'Start an interview' },
  { icon: FileText, title: 'Turn responses into insight', body: 'Generate a report to surface themes, evidence, recommendations, and a confidence score.', href: '/reports', action: 'Explore insights' },
]

const FEATURE_GUIDES = [
  { icon: Brain, title: 'Personas and interviews', body: 'Use specific background, goals, and context to make each response more useful.', href: '/personas' },
  { icon: Lightbulb, title: 'Audience panels and concept tests', body: 'Compare reactions across several personas before investing in a concept or message.', href: '/audience-panel' },
  { icon: FileText, title: 'Reports and signals', body: 'Find patterns across research and share a clear, decision-ready summary with your team.', href: '/reports' },
  { icon: Settings, title: 'Plans, team, and workspace', body: 'Manage your plan, branding, members, and workspace preferences.', href: '/settings' },
]

const ANSWERS = [
  { question: 'Where should I begin?', answer: 'Start by creating one focused persona, then run a short interview around a single decision: a customer problem, message, audience, or concept. You can expand to an Audience Panel once you want to compare viewpoints.' },
  { question: 'Are AI personas a replacement for talking to real customers?', answer: 'No. SignalRoom helps you pressure-test assumptions quickly and discover what deserves deeper validation. For high-stakes decisions, use its findings to shape and prioritize real customer research.' },
  { question: 'How do I share research with my team?', answer: 'Open an insight report to download a PDF or use Share to create a link. Workspace members can also collaborate on shared content when workspace access is enabled for your plan.' },
  {
    question: 'What does a confidence score mean?',
    answer: 'Move Forward With Confidence. Every AI interview gets a Confidence Score — how strongly that persona\'s response indicates they\'d buy, adopt, or recommend what you\'re testing. It\'s a read on one simulated person\'s conviction, not a verdict on the market; validate real findings with real customers.',
    details: [
      { title: 'Stated conviction', body: 'Extracted directly from the persona\'s own response, not calculated as a separate judgment layered on top.' },
      { title: 'Behavioral anchors', body: 'Calibrated against concrete reactions, from “I\'d sign up today” to “this doesn\'t work for me,” so scores are differentiated instead of generic.' },
      { title: 'Visible justification', body: 'Every score includes a one-sentence reason pulled straight from what the persona said, so you can audit it instead of trusting a black box.' },
    ],
  },
  { question: 'How do plan limits work?', answer: 'Your Settings page shows the personas, interviews, and workspace capabilities included with your plan. You can update or cancel a plan there at any time.' },
]

export default function HelpPage() {
  return (
    <div className="min-h-full px-4 py-10 sm:px-10 sm:py-16" style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }}>
      <div className="mx-auto w-full max-w-[1320px]">
        <header className="mb-12 max-w-3xl sm:mb-16">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-12" style={{ background: `${HOME_COLORS.primary}33` }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Help Center</span>
          </div>
          <h1 className="mb-4" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.primary }}>
            Help &amp; <span className="italic" style={{ fontWeight: 400 }}>support</span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Practical guidance for planning research, getting useful answers, and turning customer signals into confident next steps.
          </p>
        </header>

        <section className="mb-12 sm:mb-16">
          <div className="mb-5 flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: `${HOME_COLORS.outlineVariant}80` }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Start here</p>
              <h2 className="mt-1 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>Your first research loop</h2>
            </div>
            <span className="hidden text-sm italic sm:block" style={{ color: HOME_COLORS.onSurfaceVariant }}>Create, ask, synthesize</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {GETTING_STARTED.map(({ icon: Icon, title, body, href, action }, index) => (
              <Link key={title} href={href} className="group rounded-xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(24,40,28,0.08)]" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}>
                <div className="mb-8 flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}><Icon size={19} /></span>
                  <span className="text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: `${HOME_COLORS.primary}55` }}>0{index + 1}</span>
                </div>
                <h3 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>{title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{body}</p>
                <span className="mt-6 flex items-center gap-2 text-xs font-semibold" style={{ color: HOME_COLORS.primary }}>{action}<ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <section className="lg:col-span-8">
            <div className="mb-5 border-b pb-4" style={{ borderColor: `${HOME_COLORS.outlineVariant}80` }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Product guides</p>
              <h2 className="mt-1 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>Make the most of SignalRoom</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {FEATURE_GUIDES.map(({ icon: Icon, title, body, href }) => (
                <Link key={title} href={href} className="group flex gap-4 rounded-xl border p-5 transition-all hover:border-[#737873] hover:bg-white" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}66` }}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.primary }}><Icon size={17} /></span>
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{title}<ArrowRight size={14} className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" /></span>
                    <span className="mt-1 block text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{body}</span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-12">
              <div className="mb-5 border-b pb-4" style={{ borderColor: `${HOME_COLORS.outlineVariant}80` }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Common questions</p>
                <h2 className="mt-1 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>Quick answers</h2>
              </div>
              <div className="overflow-hidden rounded-xl border" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}>
                {ANSWERS.map(({ question, answer, details }) => (
                  <details key={question} className="group border-b last:border-0" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-sm font-semibold marker:content-none" style={{ color: HOME_COLORS.onSurface }}>
                      {question}<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform group-open:rotate-45" style={{ background: HOME_COLORS.surfaceContainer, color: HOME_COLORS.primary }}>+</span>
                    </summary>
                    <div className="max-w-3xl px-5 pb-5 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                      <p>{answer}</p>
                      {details && <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {details.map(detail => <div key={detail.title} className="rounded-lg p-3" style={{ background: HOME_COLORS.surfaceContainerLow }}>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primary }}>{detail.title}</p>
                          <p className="mt-1 text-xs leading-relaxed">{detail.body}</p>
                        </div>)}
                      </div>}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6 lg:col-span-4">
            <section className="relative overflow-hidden rounded-xl p-7" style={{ background: HOME_COLORS.tertiary, color: HOME_COLORS.onTertiary }}>
              <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: `${HOME_COLORS.primaryFixed}1f`, color: HOME_COLORS.primaryFixed }}><CircleHelp size={21} /></span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.primaryFixed, opacity: 0.7 }}>Need a hand?</p>
              <h2 className="mt-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>Talk to support</h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: HOME_COLORS.onPrimaryContainer }}>Send context on what you were trying to do, what happened, and any relevant report or project link. We&apos;ll take it from there.</p>
              <a href="mailto:support@getsignalroom.com?subject=SignalRoom%20support%20request" className="mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold transition-all hover:-translate-y-0.5" style={{ background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed }}>Email support<ArrowRight size={14} /></a>
              <span className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full blur-3xl" style={{ background: `${HOME_COLORS.primaryFixed}16` }} />
            </section>

            <section className="rounded-xl p-6" style={{ background: HOME_COLORS.surfaceContainer }}>
              <div className="mb-4 flex items-center gap-2" style={{ color: HOME_COLORS.primary }}><ShieldCheck size={18} /><h2 className="text-sm font-semibold">Research responsibly</h2></div>
              <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Use synthetic research to explore assumptions and sharpen questions. For decisions with material customer, financial, or regulatory impact, validate the important findings with real people.</p>
              <Link href="/faq" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold transition-colors hover:text-[#737873]" style={{ color: HOME_COLORS.primary }}><BookOpen size={14} />Read the full FAQ</Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
