'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Eye, Loader2, Lock, Sparkles, ImagePlus, X, History, CheckSquare, Square,
  Send, ChevronDown, ChevronUp, HelpCircle, Target, CheckCircle2, Users, Shuffle, Heart, MessageCircle, Brain,
} from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW, formatRelativeTime } from '@/lib/utils'
import { compressImageFile } from '@/lib/utils/image'
import { computeSaliency, loadImageFromDataUrl, type SaliencyResult } from '@/lib/vision/saliency'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import type { Persona, Plan, Workspace, CreativeReviewResult, CreativeReviewRun, CreativePersonaReaction, Message, CreativeDiagnostic } from '@/types'

const MIN_PERSONAS = 2
const MAX_PERSONAS = 6

// Shared between the bar breakdown and the on-image floating labels so a
// given element reads as the same color in both places.
const ZONE_COLORS = ['#516354', '#96A998', '#D4A373', '#8D938E', '#B8CCBA', '#C1C8BF']

function ZoneBreakdown({ zones }: { zones: CreativeReviewResult['zones'] }) {
  if (!zones.length) {
    return <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>No distinct elements were detected in this asset.</p>
  }
  return (
    <div>
      <div className="flex h-6 rounded-lg overflow-hidden gap-0.5 mb-3">
        {zones.map((z, i) => (
          <div key={z.label} style={{ width: `${Math.max(2, z.attention_pct)}%`, background: ZONE_COLORS[i % ZONE_COLORS.length] }} title={`${z.label}: ${z.attention_pct}%`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {zones.map((z, i) => (
          <div key={z.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ZONE_COLORS[i % ZONE_COLORS.length] }} />
            <span className="text-xs" style={{ color: HOME_COLORS.onSurface }}>{z.label}</span>
            <span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurfaceVariant }}>{z.attention_pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Inline, per-persona follow-up thread — opened on demand so the initial
// result reads as a real conversation starter, not a dead report. Ephemeral:
// lives only in this component's state, never persisted.
function FollowUpChat({ reaction, image, imageMediaType, intendedFocus }: { reaction: CreativePersonaReaction; image: string | null; imageMediaType: string; intendedFocus: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    if (!draft.trim() || sending) return
    setError('')
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: draft.trim(), timestamp: new Date().toISOString() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setDraft('')
    setSending(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/creative-review/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: reaction.persona_id,
          image, imageMediaType,
          intended_focus: intendedFocus,
          initial_reaction: reaction.reaction,
          messages: nextMessages,
        }),
      })
      if (!res.ok || !res.body) throw new Error('Something went wrong')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) { full += data.text; setStreamingText(full) }
            if (data.error) throw new Error('Stream failed')
          } catch { /* ignore malformed keep-alive lines */ }
        }
      }

      if (full) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'persona', content: full, timestamp: new Date().toISOString() }])
      }
      setStreamingText('')
    } catch {
      setError('Could not get a response — try again')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-4 rounded-lg p-3" style={{ background: HOME_COLORS.surfaceContainerLow }}>
      <div className="space-y-2.5 mb-3 max-h-64 overflow-y-auto">
        {messages.map(m => (
          <div key={m.id} className={`text-xs leading-relaxed ${m.role === 'user' ? 'text-right' : ''}`}>
            <span className="inline-block rounded-lg px-3 py-2" style={m.role === 'user' ? { background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary } : { background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface }}>
              {m.content}
            </span>
          </div>
        ))}
        {sending && streamingText && (
          <div className="text-xs leading-relaxed">
            <span className="inline-block rounded-lg px-3 py-2" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface }}>{streamingText}</span>
          </div>
        )}
      </div>
      {error && <p className="text-xs mb-2" style={{ color: HOME_COLORS.error }}>{error}</p>}
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void send() } }}
          placeholder="Ask a follow-up..."
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-xs outline-none"
          style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
        />
        <button onClick={send} disabled={!draft.trim() || sending} className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40" style={{ background: HOME_COLORS.primary, border: 'none', cursor: 'pointer' }}>
          {sending ? <Loader2 size={13} className="animate-spin text-white" /> : <Send size={13} className="text-white" />}
        </button>
      </div>
    </div>
  )
}

function ReactionCard({ reaction, image, imageMediaType, intendedFocus }: { reaction: CreativePersonaReaction; image: string | null; imageMediaType: string; intendedFocus: string }) {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <article className="flex h-full flex-col rounded-xl border p-6 transition-shadow hover:shadow-md sm:p-8" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
      <div className="mb-7 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: `${HOME_COLORS.primary}1a` }}>
            <PersonaAvatar avatarUrl={reaction.avatar_url} avatarInitials={reaction.avatar_initials} avatarColor={reaction.avatar_color} name={reaction.persona_name} size="lg" />
          </div>
          <div className="min-w-0">
            <h3 className="break-words text-xl leading-tight" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>{reaction.persona_name}</h3>
            {reaction.job_title && <p className="mt-1 break-words text-[10px] font-bold uppercase leading-relaxed tracking-[0.14em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{reaction.job_title}</p>}
          </div>
        </div>
        {reaction.engagement_percentage !== null && <div className="justify-self-start text-left sm:justify-self-end sm:text-right"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Visual engagement</p><p className="text-3xl leading-none" style={{ color: HOME_COLORS.primary, fontFamily: HOME_FONT_DISPLAY }}>{reaction.engagement_percentage}%</p></div>}
      </div>

      {reaction.error ? (
        <p className="text-xs" style={{ color: HOME_COLORS.error }}>{reaction.error}</p>
      ) : (
        <>
          {reaction.notices.length > 0 && (
            <div className="mb-6 rounded-lg border-l-4 px-4 py-3" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: HOME_COLORS.primary }}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primary }}>First noticed</p>
              <ol className="space-y-1.5">
                {reaction.notices.map((n, i) => (
                  <li key={i} className="text-xs flex gap-1.5" style={{ color: HOME_COLORS.onSurface }}>
                    <span className="font-semibold" style={{ color: HOME_COLORS.primary }}>{i + 1}.</span> {n}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="mb-6 text-sm leading-relaxed italic" style={{ color: HOME_COLORS.onSurface }}>&ldquo;{reaction.reaction}&rdquo;</p>

          {(reaction.most_believable_claim || reaction.most_confusing_element) && <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reaction.most_believable_claim && (
              <div className="rounded-lg border-l-4 p-4" style={{ borderColor: HOME_COLORS.primary, background: HOME_COLORS.surfaceContainerLow }}>
                <div className="mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} style={{ color: HOME_COLORS.primary }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primary }}>Believes</p>
                </div>
                <p className="text-xs" style={{ color: HOME_COLORS.onSurface }}>{reaction.most_believable_claim}</p>
              </div>
            )}
            {reaction.most_confusing_element && (
              <div className="rounded-lg border-l-4 p-4" style={{ borderColor: HOME_COLORS.error, background: HOME_COLORS.surfaceContainerLow }}>
                <div className="mb-2 flex items-center gap-1.5">
                  <HelpCircle size={13} style={{ color: HOME_COLORS.error }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.error }}>Confused by</p>
                </div>
                <p className="text-xs" style={{ color: HOME_COLORS.onSurface }}>{reaction.most_confusing_element}</p>
              </div>
            )}
          </div>}

          {reaction.suggested_adjustment && (
            <div className="mt-auto border-t pt-5" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primary }}>Strategic adjustment</p>
              <p className="rounded-lg p-4 text-sm italic leading-relaxed" style={{ background: `${HOME_COLORS.primary}0d`, color: HOME_COLORS.onSurface }}>&ldquo;{reaction.suggested_adjustment}&rdquo;</p>
            </div>
          )}

          <button onClick={() => setChatOpen(o => !o)} className="mt-5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: HOME_COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {chatOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Ask a follow-up
          </button>
          {chatOpen && <FollowUpChat reaction={reaction} image={image} imageMediaType={imageMediaType} intendedFocus={intendedFocus} />}
        </>
      )}
    </article>
  )
}

// Where the real image content sits within a square frame under
// object-fit: contain (as a percentage of the square) — needed so on-image
// zone labels, which are positioned in the TRUE image's own 0-1 coordinates,
// land in the right spot instead of assuming the square has no letterboxing.
interface ContentBox { xPct: number; yPct: number; wPct: number; hPct: number }

function computeContentBox(naturalWidth: number, naturalHeight: number): ContentBox {
  if (!naturalWidth || !naturalHeight) return { xPct: 0, yPct: 0, wPct: 100, hPct: 100 }
  const aspect = naturalWidth / naturalHeight
  if (aspect >= 1) {
    const hPct = 100 / aspect
    return { xPct: 0, yPct: (100 - hPct) / 2, wPct: 100, hPct }
  }
  const wPct = 100 * aspect
  return { xPct: (100 - wPct) / 2, yPct: 0, wPct, hPct: 100 }
}

// Small pinned markers directly on the image at each zone's location —
// collapsed to just a dot by default so they don't clutter the image; click
// one to expand it into the label and measured percentage.
function ZoneCallouts({ zones, contentBox }: { zones: CreativeReviewResult['zones']; contentBox: ContentBox }) {
  const [openLabel, setOpenLabel] = useState<string | null>(null)

  return (
    <>
      {zones.map((z, i) => {
        const cx = contentBox.xPct + ((z.x0 + z.x1) / 2) * contentBox.wPct
        const cy = contentBox.yPct + ((z.y0 + z.y1) / 2) * contentBox.hPct
        const color = ZONE_COLORS[i % ZONE_COLORS.length]
        const open = openLabel === z.label
        return (
          <button
            key={z.label}
            type="button"
            onClick={() => setOpenLabel(open ? null : z.label)}
            className="absolute flex items-center gap-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all duration-150"
            style={{
              left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.72)', border: `1.5px solid ${color}`, color: 'white',
              padding: open ? '4px 10px 4px 6px' : '6px', cursor: 'pointer', zIndex: open ? 20 : 10,
            }}
            title={`${z.label}: ${z.attention_pct}%`}
          >
            <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: color }} />
            {open && <span>{z.label} · {z.attention_pct}%</span>}
          </button>
        )
      })}
    </>
  )
}

// A subtle "Analyzing" badge shown during generation, alongside a plain
// scan-line sweep over the image (see .creative-scan-line below). The
// heatmap itself is intentionally not shown here — just the plain asset
// with the scan animation while the panel call is in flight.
function AnalyzingBadge() {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider pointer-events-none" style={{ background: 'rgba(0,0,0,0.65)', color: 'white' }}>
      <Loader2 size={10} className="animate-spin" /> Analyzing
    </div>
  )
}

// Shared frame for every place the asset + heatmap + zone labels are shown —
// a white square card, image fully contained (never cropped or stretched),
// used for the analyzing state, the fresh result, and history.
function SquareImageFrame({ src, heatmapSrc, zones, analyzing = false, showHeatmapToggle = true }: {
  src: string
  heatmapSrc?: string | null
  zones: CreativeReviewResult['zones']
  analyzing?: boolean
  showHeatmapToggle?: boolean
}) {
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [contentBox, setContentBox] = useState<ContentBox>({ xPct: 0, yPct: 0, wPct: 100, hPct: 100 })

  return (
    <div className="group rounded-xl border p-5 sm:p-7" style={{ background: 'white', borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
      <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-lg">
        <img
          src={src}
          alt="Creative asset"
          className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.015]"
          onLoad={e => {
            const img = e.currentTarget
            setContentBox(computeContentBox(img.naturalWidth, img.naturalHeight))
          }}
        />
        {!analyzing && heatmapSrc && showHeatmap && (
          <img src={heatmapSrc} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        )}
        {analyzing && <div className="absolute left-0 right-0 h-1/3 creative-scan-line pointer-events-none" />}
        {!analyzing && zones.length > 0 && <ZoneCallouts zones={zones} contentBox={contentBox} />}
        {analyzing && <AnalyzingBadge />}
        {!analyzing && showHeatmapToggle && heatmapSrc && (
          <button onClick={() => setShowHeatmap(s => !s)} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: 'rgba(0,0,0,0.65)', color: 'white', border: 'none', cursor: 'pointer' }}>
            <Eye size={11} /> {showHeatmap ? 'Hide heatmap' : 'Show heatmap'}
          </button>
        )}
      </div>
      <style jsx global>{`
        .creative-scan-line {
          top: -34%;
          background: linear-gradient(
            180deg,
            rgba(150, 169, 152, 0) 0%,
            rgba(150, 169, 152, 0.55) 45%,
            rgba(212, 232, 213, 0.9) 50%,
            rgba(150, 169, 152, 0.55) 55%,
            rgba(150, 169, 152, 0) 100%
          );
          animation: creativeScanSweep 2.2s ease-in-out infinite;
        }
        @keyframes creativeScanSweep {
          0% { top: -34%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  )
}

// Measured-attention card, paired alongside the image in the bento row.
function MeasuredAttentionCard({ zones }: { zones: CreativeReviewResult['zones'] }) {
  return (
    <div className="w-full min-w-[260px] flex-1 rounded-xl border p-6 sm:p-7" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Measured attention</p>
      <h3 className="mb-5 text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.onSurface }}>Visual weight by element</h3>
      <ZoneBreakdown zones={zones} />
    </div>
  )
}

// Three real, computed counts (never fabricated) — no trend arrows or
// invented "readiness" labels, just what's actually in the reactions.
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
      <p className="text-3xl font-semibold" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{value}</p>
      <p className="mt-1.5 text-[10px] uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>{label}</p>
    </div>
  )
}

function StatCardsRow({ result }: { result: CreativeReviewResult }) {
  const withEngagement = result.reactions.filter(r => r.engagement_percentage !== null)
  const avgEngagement = withEngagement.length
    ? Math.round(withEngagement.reduce((sum, r) => sum + (r.engagement_percentage ?? 0), 0) / withEngagement.length)
    : null
  const highEngagementCount = withEngagement.filter(r => (r.engagement_percentage ?? 0) >= 70).length
  const confusedCount = result.reactions.filter(r => r.most_confusing_element).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard value={avgEngagement !== null ? `${avgEngagement}%` : '—'} label="Avg. visual engagement" />
      <StatCard value={`${highEngagementCount}/${result.total_personas}`} label="Engaged (70%+)" />
      <StatCard value={`${confusedCount}/${result.total_personas}`} label="Flagged confusion" />
    </div>
  )
}

const DIAGNOSTIC_DETAILS = {
  attention: { label: 'Attention', question: 'Does the hierarchy bring the right element forward?', color: '#2D5A3B', tint: '#E5F0E6', icon: Eye },
  emotion: { label: 'Emotion', question: 'What feeling does the creative leave behind?', color: '#A65068', tint: '#F7E8EC', icon: Heart },
  comprehension: { label: 'Message clarity', question: 'Can someone understand the message at a glance?', color: '#9A6A1C', tint: '#F9EFD8', icon: MessageCircle },
  memory: { label: 'Memory', question: 'Are the brand and message distinct enough to recall?', color: '#387B78', tint: '#E4F2F0', icon: Brain },
  persuasion: { label: 'Action pull', question: 'Does the creative give someone a reason to act next?', color: '#66639B', tint: '#EEEDF8', icon: Sparkles },
} as const

function CreativePerformanceDiagnostics({ diagnostics }: { diagnostics?: CreativeDiagnostic[] }) {
  if (!diagnostics?.length) return null

  const ordered = (Object.keys(DIAGNOSTIC_DETAILS) as Array<keyof typeof DIAGNOSTIC_DETAILS>)
    .map(dimension => diagnostics.find(item => item.dimension === dimension))
    .filter((item): item is CreativeDiagnostic => Boolean(item))

  if (!ordered.length) return null

  return (
    <section className="overflow-hidden rounded-xl border" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
      <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-end sm:p-8" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
        <div className="max-w-2xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Creative performance</p>
          <h2 className="mb-2 text-2xl sm:text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>Five signals behind the creative</h2>
          <p className="text-sm leading-relaxed text-white/70">A visual assessment of how the asset earns attention, clarity, recall, and momentum.</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80" style={{ borderColor: 'rgba(255,255,255,.18)' }}>AI-guided readout</span>
      </div>
      <div className="grid grid-cols-1 divide-y md:grid-cols-5 md:divide-x md:divide-y-0" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
        {ordered.map(diagnostic => {
          const detail = DIAGNOSTIC_DETAILS[diagnostic.dimension]
          const Icon = detail.icon
          return (
            <div key={diagnostic.dimension} className="min-w-0 p-5 sm:p-6">
              <div className="mb-8 flex items-start justify-between gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: detail.tint, color: detail.color }}><Icon size={17} /></span><span className="text-3xl leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, color: detail.color }}>{diagnostic.score}</span></div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: detail.color }}>{detail.label}</p>
              <p className="min-h-10 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{detail.question}</p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full" style={{ background: detail.tint }}><div className="h-full rounded-full" style={{ width: `${diagnostic.score}%`, background: detail.color }} /></div>
            </div>
          )
        })}
      </div>
      <div className="border-t p-6 sm:p-8" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}55` }}>
        <div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Diagnostic notes</p><h3 className="mt-1 text-xl" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>What to refine next</h3></div><span className="hidden h-px flex-1 sm:block" style={{ background: `${HOME_COLORS.outlineVariant}88` }} /></div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
          {ordered.map((diagnostic, index) => {
            const detail = DIAGNOSTIC_DETAILS[diagnostic.dimension]
            return <div key={diagnostic.dimension} className="flex gap-4"><span className="mt-0.5 text-lg leading-none" style={{ color: detail.color, fontFamily: HOME_FONT_DISPLAY }}>0{index + 1}</span><div><p className="mb-1 text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{diagnostic.finding}</p><p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}><span className="font-semibold" style={{ color: detail.color }}>Refine:</span> {diagnostic.recommendation}</p></div></div>
          })}
        </div>
        <p className="mt-6 text-[11px] leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Attention uses the image’s measured saliency map. The remaining dimensions are AI-guided visual assessments based on the asset and the panel’s reactions; validate important decisions with real customer research.</p>
      </div>
    </section>
  )
}

// The single most impactful change, read from generateCreativeReviewSummary
// — given its own prominent card since it's the one thing worth acting on
// first, rather than buried inside a stats box.
function TopRecommendedCard({ change }: { change: string }) {
  return (
    <div className="rounded-xl p-7 sm:p-9" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] opacity-65">Top recommended change</p>
      <p className="text-xl leading-relaxed sm:text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 500 }}>&ldquo;{change}&rdquo;</p>
    </div>
  )
}

// Genuine synthesis across the panel's real reactions — omitted entirely
// when the run has no summary (older persisted runs) or nothing to show.
function ConsensusDivergence({ overallTake, agree, diverge }: { overallTake?: string; agree: string | null; diverge: string | null }) {
  if (!overallTake && !agree && !diverge) return null
  return (
    <div className="rounded-xl border p-6 sm:p-8" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Consensus &amp; divergence</p>
      {overallTake && <p className="text-sm leading-relaxed mb-5" style={{ color: HOME_COLORS.onSurface }}>{overallTake}</p>}
      {(agree || diverge) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {agree && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Users size={13} style={{ color: HOME_COLORS.primary }} />
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>Where the panel agrees</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{agree}</p>
            </div>
          )}
          {diverge && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Shuffle size={13} style={{ color: HOME_COLORS.secondary }} />
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>Where they diverge</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{diverge}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CreativeReviewResultsView({ result, image, imageMediaType, heatmapDataUrl }: { result: CreativeReviewResult; image: string | null; imageMediaType: string; heatmapDataUrl: string | null }) {
  return (
    <div className="flex flex-col gap-6">
      {image && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8"><SquareImageFrame src={`data:${imageMediaType};base64,${image}`} heatmapSrc={heatmapDataUrl} zones={result.zones} /></div>
          <div className="lg:col-span-4"><MeasuredAttentionCard zones={result.zones} /></div>
        </div>
      )}

      <CreativePerformanceDiagnostics diagnostics={result.summary?.diagnostics} />

      <StatCardsRow result={result} />

      {result.summary?.top_recommended_change && <TopRecommendedCard change={result.summary.top_recommended_change} />}

      <ConsensusDivergence overallTake={result.summary?.overall_take} agree={result.summary?.where_personas_agree ?? null} diverge={result.summary?.where_personas_diverge ?? null} />

      <div className="mt-2">
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: HOME_COLORS.onSurfaceVariant }}>Persona reactions</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {result.reactions.map(r => (
            <ReactionCard key={r.persona_id} reaction={r} image={image} imageMediaType={imageMediaType} intendedFocus={result.intended_focus} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CreativeReviewPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [plan, setPlan] = useState<Plan>('free')

  const [imageData, setImageData] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageMediaType, setImageMediaType] = useState('image/jpeg')
  const [saliency, setSaliency] = useState<SaliencyResult | null>(null)
  const [processingImage, setProcessingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [intendedFocus, setIntendedFocus] = useState('')

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [projectId, setProjectId] = useState('')
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = useState('personal')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CreativeReviewResult | null>(null)
  const [error, setError] = useState('')

  const [viewMode, setViewMode] = useState<'new' | 'history'>('new')
  const [historyRuns, setHistoryRuns] = useState<CreativeReviewRun[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedRun, setSelectedRun] = useState<CreativeReviewRun | null>(null)
  const [historyImageUrl, setHistoryImageUrl] = useState<string | null>(null)

  const maxPersonas = MAX_PERSONAS
  const hasAccess = PLAN_LIMITS[plan].audience_panel

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('personas').select('*').eq('archived', false).order('updated_at', { ascending: false }),
      supabase.from('profiles').select('plan').single(),
    ]).then(([{ data: p }, { data: profile }]) => {
      setPersonas(p ?? [])
      setPlan((profile?.plan ?? 'free') as Plan)
      setLoadingPersonas(false)
    })
    fetch('/api/projects').then(r => r.json()).then(json => setProjects((json.data ?? []).filter((p: any) => !p.archived))).catch(() => {})
    fetch('/api/workspaces').then(r => r.json()).then(json => setWorkspaces(json.data ?? [])).catch(() => {})
  }, [])

  const loadHistory = () => {
    setLoadingHistory(true)
    fetch('/api/creative-review').then(r => r.json()).then(json => setHistoryRuns(json.data ?? [])).catch(() => {}).finally(() => setLoadingHistory(false))
  }

  useEffect(() => { if (viewMode === 'history') loadHistory() }, [viewMode])

  useEffect(() => {
    if (!selectedRun) { setHistoryImageUrl(null); return }
    const supabase = createClient()
    supabase.storage.from('creative-review-assets').createSignedUrl(selectedRun.image_storage_path, 3600)
      .then(({ data }) => setHistoryImageUrl(data?.signedUrl ?? null))
      .catch(() => setHistoryImageUrl(null))
  }, [selectedRun])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    setProcessingImage(true)
    setError('')
    try {
      const { dataUrl, base64, mediaType } = await compressImageFile(file)
      setImageMediaType(mediaType)
      setImagePreview(dataUrl)
      setImageData(base64)
      const imgEl = await loadImageFromDataUrl(dataUrl)
      setSaliency(computeSaliency(imgEl))
    } catch {
      setError('Could not process that image — try a different file')
    } finally {
      setProcessingImage(false)
    }
  }

  const clearImage = () => {
    setImageData(null); setImagePreview(null); setSaliency(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const togglePersona = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.length < maxPersonas ? [...prev, id] : prev)
  }

  const canRun = !loading && selectedIds.length >= MIN_PERSONAS && !!imageData && !!saliency

  const handleRun = async () => {
    if (selectedIds.length < MIN_PERSONAS) { setError(`Select at least ${MIN_PERSONAS} personas`); return }
    if (!imageData || !saliency) { setError('Upload an image to review'); return }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/creative-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_ids: selectedIds,
          image: imageData,
          imageMediaType,
          heatmap_image: saliency.heatmapDataUrl,
          saliency_grid: Array.from(saliency.grid),
          grid_width: saliency.gridWidth,
          grid_height: saliency.gridHeight,
          intended_focus: intendedFocus,
          project_id: projectId || null,
          workspace_id: workspaceId === 'personal' ? null : workspaceId,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong'); return }
      setResult(json.data)
    } catch {
      setError('Something went wrong — please try again')
    } finally {
      setLoading(false)
    }
  }

  const projectOptions = [{ value: '', label: 'No project (not saved)' }, ...projects.map(p => ({ value: p.id, label: p.name }))]
  const workspaceOptions = [{ value: 'personal', label: 'Personal (not shared)' }, ...workspaces.map(w => ({ value: w.id, label: w.name }))]

  if (!loadingPersonas && !hasAccess) {
    return (
      <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full px-4 py-10 sm:px-10 sm:py-14">
        <div className="max-w-2xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3"><span className="h-px w-12" style={{ background: HOME_COLORS.primary }} /><span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Visual perception</span></div>
          <h1 style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onSurface }}>Creative <span className="italic" style={{ fontWeight: 400 }}>Audit</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>See how your persona panel reads a packaging concept, ad, or landing page — grounded in measured attention, not a guess.</p>
        </div>
        <div className="rounded-xl border p-8 text-center sm:p-10" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full mx-auto" style={{ background: HOME_COLORS.secondaryContainer }}>
            <Lock size={21} style={{ color: HOME_COLORS.primary }} />
          </div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Plan feature</p>
          <h2 className="mb-3 text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.onSurface }}>Creative testing is available on Signal and Broadcast</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Upload a visual asset and see what each persona actually notices, trusts, and questions — backed by a real, independently-computed attention map.
          </p>
          <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold px-6 py-3 rounded-full text-white transition-transform hover:-translate-y-0.5" style={{ background: HOME_COLORS.primary, boxShadow: '0 10px 20px -14px rgba(4,18,8,.7)' }}>
            View plans →
          </Link>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full">
      <style jsx global>{`
        @keyframes creativeAssetReveal {
          0% { opacity: .68; transform: scale(.975); filter: saturate(.78) contrast(.94); }
          45% { opacity: 1; transform: scale(1.006); filter: saturate(1.04) contrast(1.02); }
          100% { opacity: 1; transform: scale(1); filter: saturate(1) contrast(1); }
        }
        @keyframes creativeBloomPulse {
          0%, 100% { opacity: .16; transform: scale(.82); }
          50% { opacity: .68; transform: scale(1.12); }
        }
        @keyframes creativeLoadingSweep {
          0% { transform: translateY(-130%); opacity: 0; }
          18% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(390%); opacity: 0; }
        }
        @keyframes creativeAnalysisProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(320%); }
        }
        .creative-upload-image--analyzing { animation: creativeAssetReveal 1.1s cubic-bezier(.2,.75,.25,1) both; }
        .creative-analysis-grid { background-image: linear-gradient(rgba(4,18,8,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(4,18,8,.08) 1px, transparent 1px); background-size: 28px 28px; mask-image: linear-gradient(to bottom, transparent, black 18%, black 82%, transparent); }
        .creative-heat-bloom { position: absolute; border-radius: 999px; pointer-events: none; mix-blend-mode: multiply; animation: creativeBloomPulse 1.9s ease-in-out infinite; }
        .creative-heat-bloom--one { left: 36%; top: 27%; height: 9rem; width: 9rem; background: radial-gradient(circle, rgba(184,204,185,.9) 0%, rgba(184,204,185,.34) 38%, rgba(184,204,185,0) 72%); }
        .creative-heat-bloom--two { right: 25%; bottom: 20%; height: 7rem; width: 7rem; background: radial-gradient(circle, rgba(212,163,115,.78) 0%, rgba(212,163,115,.25) 42%, rgba(212,163,115,0) 72%); animation-delay: .42s; }
        .creative-loading-sweep { height: 38%; background: linear-gradient(180deg, rgba(212,232,213,0) 0%, rgba(184,204,185,.26) 40%, rgba(212,232,213,.72) 50%, rgba(184,204,185,.26) 60%, rgba(212,232,213,0) 100%); animation: creativeLoadingSweep 2.35s ease-in-out infinite; }
        .creative-analysis-progress { animation: creativeAnalysisProgress 1.7s ease-in-out infinite; }
      `}</style>
      <section className="relative overflow-hidden px-4 pb-10 pt-10 sm:px-10 sm:pb-12 sm:pt-14">
        <div className="relative z-10 flex max-w-4xl flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Visual perception</span>
            </div>
            <h1 className="mb-6 leading-tight" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onSurface }}>
              Creative <span className="italic" style={{ fontWeight: 400 }}>Audit</span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: HOME_COLORS.onSurfaceVariant }}>
              Test what stands out in a packaging shot, ad, or landing page before you commit to the creative.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full flex-shrink-0" style={{ background: HOME_COLORS.surfaceContainerHigh }}>
            <button onClick={() => setViewMode('new')} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors" style={viewMode === 'new' ? { background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' } : { color: HOME_COLORS.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Sparkles size={13} /> New
            </button>
            <button onClick={() => setViewMode('history')} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors" style={viewMode === 'history' ? { background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' } : { color: HOME_COLORS.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer' }}>
              <History size={13} /> History
            </button>
          </div>
        </div>
      </section>

      {viewMode === 'history' ? (
        <div className="max-w-6xl px-4 pb-20 sm:px-10">
          {loadingHistory ? (
            <div className="rounded-xl border p-6" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44` }}><p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Loading saved reviews...</p></div>
          ) : historyRuns.length === 0 ? (
            <div className="rounded-xl border p-7 sm:p-9" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44` }}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Review library</p>
              <h2 className="mb-2 text-xl" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>No saved reviews yet</h2>
              <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Run a review with a project selected to keep it here for your team.</p>
            </div>
          ) : selectedRun ? (
            <div className="flex flex-col gap-8">
              <button onClick={() => setSelectedRun(null)} className="self-start rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#eef1ed]" style={{ color: HOME_COLORS.primary, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to history</button>
              <div className="flex flex-col gap-6">
                {historyImageUrl && (
                  <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-8"><SquareImageFrame src={historyImageUrl} zones={selectedRun.result.zones} showHeatmapToggle={false} /></div>
                    <div className="lg:col-span-4"><MeasuredAttentionCard zones={selectedRun.result.zones} /></div>
                  </div>
                )}
                <CreativePerformanceDiagnostics diagnostics={selectedRun.result.summary?.diagnostics} />
                <StatCardsRow result={selectedRun.result} />
                {selectedRun.result.summary?.top_recommended_change && <TopRecommendedCard change={selectedRun.result.summary.top_recommended_change} />}
                <ConsensusDivergence overallTake={selectedRun.result.summary?.overall_take} agree={selectedRun.result.summary?.where_personas_agree ?? null} diverge={selectedRun.result.summary?.where_personas_diverge ?? null} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                  {selectedRun.result.reactions.map(r => (
                    <ReactionCard key={r.persona_id} reaction={r} image={null} imageMediaType="image/jpeg" intendedFocus={selectedRun.result.intended_focus} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {historyRuns.map(run => (
                <button key={run.id} onClick={() => setSelectedRun(run)} className="group w-full rounded-xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW, cursor: 'pointer' }}>
                  <div className="mb-5 flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-full transition-colors group-hover:bg-[#dbe8dc]" style={{ background: HOME_COLORS.surfaceContainerHigh, color: HOME_COLORS.primary }}><Eye size={15} /></span><span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Open review</span></div>
                  <p className="mb-1 text-base" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>{run.intended_focus || 'Creative review'}</p>
                  <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(run.created_at)} · {run.persona_ids.length} personas</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 px-4 pb-20 sm:px-10 lg:grid-cols-12 lg:gap-8">
          <aside className="order-2 flex flex-col gap-6 lg:col-span-4 lg:order-2">
            <section className="rounded-xl border p-6 sm:p-7" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
              <div className="flex items-center justify-between mb-5">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Persona panel</p><h3 className="mt-1 text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.onSurface }}>Choose perspectives</h3></div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: selectedIds.length >= MIN_PERSONAS ? HOME_COLORS.secondaryContainer : HOME_COLORS.surfaceContainerHigh, color: selectedIds.length >= MIN_PERSONAS ? HOME_COLORS.primary : HOME_COLORS.onSurfaceVariant }}>
                  {selectedIds.length} / {maxPersonas}
                </span>
              </div>
              {loadingPersonas ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: HOME_COLORS.surfaceContainer }} />)}</div>
              ) : personas.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm mb-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>No personas yet</p>
                  <Link href="/personas/new" className="text-xs font-semibold" style={{ color: HOME_COLORS.primary }}>Create your first persona →</Link>
                </div>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {personas.map(persona => {
                    const isSelected = selectedIds.includes(persona.id)
                    const atLimit = selectedIds.length >= maxPersonas && !isSelected
                    return (
                      <button key={persona.id} onClick={() => !atLimit && togglePersona(persona.id)} disabled={atLimit} className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-all hover:border-[#c3c8c1]/30 hover:bg-[#f0edec] disabled:cursor-not-allowed disabled:opacity-40" style={isSelected ? { background: HOME_COLORS.secondaryContainer, borderColor: `${HOME_COLORS.primary}22` } : undefined}>
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                          <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: HOME_COLORS.onSurface }}>{persona.name}</p>
                          <p className="text-[11px] truncate" style={{ color: HOME_COLORS.onSurfaceVariant }}>{persona.traits?.job_title ?? 'No role'}</p>
                        </div>
                        {isSelected ? <CheckSquare size={16} style={{ color: HOME_COLORS.primary }} /> : <Square size={16} style={{ color: `${HOME_COLORS.onSurfaceVariant}66` }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-xl p-6 sm:p-7" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">Review setup</p>
              <h3 className="mt-1 mb-5 text-lg" style={{ fontFamily: HOME_FONT_DISPLAY }}>Save &amp; share</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/65">Project <span className="normal-case font-normal">(optional)</span></label>
                  <Dropdown value={projectId} onChange={setProjectId} options={projectOptions} className="w-full" />
                </div>
                {workspaces.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/65">Share with workspace</label>
                    <Dropdown value={workspaceId} onChange={setWorkspaceId} options={workspaceOptions} className="w-full" />
                  </div>
                )}
              </div>
            </section>
          </aside>

          <main className="order-1 flex min-w-0 flex-col gap-6 lg:col-span-8 lg:order-1">
            <section className="relative overflow-hidden rounded-xl border p-6 sm:p-8" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
              <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Visual analysis core</p><h3 className="mt-1 text-xl" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>Upload the asset</h3></div>{imagePreview && <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}>Ready to review</span>}</div>
              {imagePreview ? (
                <div className="relative mb-5 flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLow }}>
                  <img src={imagePreview} alt="Upload preview" className={`max-h-[340px] w-full rounded-lg object-contain transition-transform duration-500 hover:scale-[1.015] ${loading ? 'creative-upload-image--analyzing' : ''}`} />
                  {loading && <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="creative-analysis-grid absolute inset-0" />
                    <div className="creative-heat-bloom creative-heat-bloom--one" />
                    <div className="creative-heat-bloom creative-heat-bloom--two" />
                    <div className="creative-loading-sweep absolute inset-x-0 top-0" />
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white" style={{ background: 'rgba(4,18,8,.76)', backdropFilter: 'blur(8px)' }}><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: '#b8ccb9' }} /><span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#d4e8d5' }} /></span>Analyzing visual attention</div>
                  </div>}
                  <button type="button" onClick={clearImage} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-105" style={{ background: HOME_COLORS.error, border: 'none', cursor: 'pointer' }}>
                    <X size={13} />
                  </button>
                  {processingImage && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <Loader2 size={20} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="mb-5 flex min-h-[280px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-sm font-medium transition-colors hover:bg-[#f6f3f2]" style={{ borderColor: HOME_COLORS.outlineVariant, color: HOME_COLORS.onSurfaceVariant, background: 'none', cursor: 'pointer' }}>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}><ImagePlus size={21} /></span>
                    <span>{processingImage ? 'Processing image...' : 'Choose an image to begin'}</span>
                    <span className="text-xs font-normal" style={{ color: HOME_COLORS.onSurfaceVariant }}>PNG, JPG, or WEBP</span>
                  </button>
                </>
              )}

              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                <Target size={12} /> Where should attention land? <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                value={intendedFocus}
                onChange={e => setIntendedFocus(e.target.value)}
                placeholder="e.g. the call-to-action button"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
                style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
              />

              {error && <p className="text-sm mt-4" style={{ color: HOME_COLORS.error }}>{error}</p>}
              {selectedIds.length > 0 && selectedIds.length < MIN_PERSONAS && (
                <p className="text-xs mt-4" style={{ color: HOME_COLORS.onSurfaceVariant }}>Select {MIN_PERSONAS - selectedIds.length} more persona{MIN_PERSONAS - selectedIds.length === 1 ? '' : 's'} to run the review.</p>
              )}

              <button onClick={handleRun} disabled={!canRun} className="mt-5 flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: canRun ? 'pointer' : 'not-allowed', boxShadow: canRun ? '0 10px 20px -14px rgba(4,18,8,.7)' : 'none' }}>
                {loading ? <><Loader2 size={15} className="animate-spin" /> Reviewing...</> : <><Eye size={15} /> Run Creative Testing</>}
              </button>
            </section>

            {!result && !loading && (
              <div className="rounded-xl p-6 sm:p-8" style={{ background: HOME_COLORS.surfaceContainer, border: `1px solid ${HOME_COLORS.outlineVariant}44` }}>
                <div className="mb-5 flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: HOME_COLORS.primary }} /><span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Review feed</span></div>
                <Eye size={24} className="mb-3" style={{ color: HOME_COLORS.primary }} />
                <h3 className="mb-1 text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Results appear here</h3>
                <p className="max-w-sm text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  Upload an image and select {MIN_PERSONAS}–{maxPersonas} personas to see measured attention and how each one reads it.
                </p>
              </div>
            )}
            {loading && (
              <div className="rounded-xl border p-6 sm:p-7" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}44`, boxShadow: CARD_SHADOW }}>
                <div className="mb-4 flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: HOME_COLORS.primary }} /><span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: HOME_COLORS.primary }} /></span><span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Live analysis</span></div>
                <h3 className="mb-1 text-lg" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>Reading the creative</h3>
                <p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Mapping visual attention, then gathering reactions from {selectedIds.length} selected personas.</p>
                <div className="mt-5 h-1 overflow-hidden rounded-full" style={{ background: HOME_COLORS.surfaceContainerHigh }}><div className="creative-analysis-progress h-full w-1/3 rounded-full" style={{ background: HOME_COLORS.primary }} /></div>
              </div>
            )}

            {result && <CreativeReviewResultsView result={result} image={imageData} imageMediaType={imageMediaType} heatmapDataUrl={saliency?.heatmapDataUrl ?? null} />}

            <div className="flex items-start gap-2 rounded-xl p-4" style={{ background: HOME_COLORS.surfaceContainerLow }}>
              <HelpCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: HOME_COLORS.onSurfaceVariant }} />
              <p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                The attention breakdown is computed directly from the image's pixels in your browser — Claude never sees or influences those numbers, it only names what each region is. Treat it as a directional signal, not lab-validated eye-tracking.
              </p>
            </div>
          </main>
        </div>
      )}
    </div>
  )
}
