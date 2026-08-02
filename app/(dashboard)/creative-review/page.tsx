'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Eye, Loader2, Lock, Sparkles, ImagePlus, X, History, CheckSquare, Square,
  Send, ChevronDown, ChevronUp, Quote, HelpCircle, Target,
} from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW, formatRelativeTime } from '@/lib/utils'
import { compressImageFile } from '@/lib/utils/image'
import { computeSaliency, loadImageFromDataUrl, type SaliencyResult } from '@/lib/vision/saliency'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import type { Persona, Plan, Workspace, CreativeReviewResult, CreativeReviewRun, CreativePersonaReaction, Message } from '@/types'

const MIN_PERSONAS = 2
const MAX_PERSONAS = 6

// Same engagement-level color anchors as the shared ScoreRing, but this is
// deliberately a separate small component: the field it renders means
// something different (this persona's own read on one asset, not a
// Confidence Score), and ScoreRing's tooltip/label is hardcoded to the
// latter, so reusing it here would mislabel what the number actually is.
function EngagementRing({ value, size = 44 }: { value: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = clamped >= 70 ? HOME_COLORS.primary : clamped >= 50 ? '#D97706' : HOME_COLORS.error
  const track = clamped >= 70 ? HOME_COLORS.secondaryContainer : clamped >= 50 ? '#FEF3C7' : '#FFDAD6'
  const strokeWidth = size <= 40 ? 3 : 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }} title={`Engagement: ${value}%`}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 700, fontSize: size <= 40 ? '11px' : '13px', color }}>{value}%</span>
      </div>
    </div>
  )
}

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
    <article className="rounded-xl p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
      <div className="flex items-start gap-3 mb-3">
        {reaction.engagement_percentage !== null && (
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <EngagementRing value={reaction.engagement_percentage} />
            <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>Engagement</span>
          </div>
        )}
        <PersonaAvatar avatarUrl={reaction.avatar_url} avatarInitials={reaction.avatar_initials} avatarColor={reaction.avatar_color} name={reaction.persona_name} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: HOME_COLORS.onSurface }}>{reaction.persona_name}</p>
          {reaction.job_title && <p className="text-[11px] truncate" style={{ color: HOME_COLORS.onSurfaceVariant }}>{reaction.job_title}</p>}
        </div>
      </div>

      {reaction.error ? (
        <p className="text-xs" style={{ color: HOME_COLORS.error }}>{reaction.error}</p>
      ) : (
        <>
          {reaction.notices.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>Notices, in order</p>
              <ol className="space-y-1">
                {reaction.notices.map((n, i) => (
                  <li key={i} className="text-xs flex gap-1.5" style={{ color: HOME_COLORS.onSurface }}>
                    <span className="font-semibold" style={{ color: HOME_COLORS.primary }}>{i + 1}.</span> {n}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="text-sm leading-relaxed italic mb-3" style={{ color: HOME_COLORS.onSurface }}>&ldquo;{reaction.reaction}&rdquo;</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {reaction.most_believable_claim && (
              <div className="rounded-lg p-2.5" style={{ background: HOME_COLORS.surfaceContainerLow }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: HOME_COLORS.primary }}>Believes</p>
                <p className="text-xs" style={{ color: HOME_COLORS.onSurface }}>{reaction.most_believable_claim}</p>
              </div>
            )}
            {reaction.most_confusing_element && (
              <div className="rounded-lg p-2.5" style={{ background: HOME_COLORS.surfaceContainerLow }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: HOME_COLORS.error }}>Confused by</p>
                <p className="text-xs" style={{ color: HOME_COLORS.onSurface }}>{reaction.most_confusing_element}</p>
              </div>
            )}
          </div>

          {reaction.suggested_adjustment && (
            <div className="rounded-lg p-2.5 mb-3" style={{ background: HOME_COLORS.secondaryContainer }}>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: HOME_COLORS.onSecondaryContainer }}>Suggested adjustment</p>
              <p className="text-xs" style={{ color: HOME_COLORS.onSecondaryContainer }}>{reaction.suggested_adjustment}</p>
            </div>
          )}

          <button onClick={() => setChatOpen(o => !o)} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: HOME_COLORS.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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

// A subtle "Analyzing" badge shown during generation — the actual visual
// interest is the heatmap reveal + scan line rendered in SquareImageFrame
// (see the creative-heatmap-reveal / creative-scan-line global styles
// below), which mirrors the reference video: the heatmap develops
// progressively as the scan line sweeps down the image, instead of just
// sitting fully-formed under a translucent bar.
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
    <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'white', boxShadow: CARD_SHADOW }}>
      <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-lg">
        <img
          src={src}
          alt="Creative asset"
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={e => {
            const img = e.currentTarget
            setContentBox(computeContentBox(img.naturalWidth, img.naturalHeight))
          }}
        />
        {heatmapSrc && (showHeatmap || analyzing) && (
          <img
            src={heatmapSrc}
            alt=""
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${analyzing ? 'creative-heatmap-reveal' : ''}`}
          />
        )}
        {analyzing && heatmapSrc && <div className="absolute left-0 right-0 h-[6%] creative-scan-line pointer-events-none" />}
        {!analyzing && zones.length > 0 && <ZoneCallouts zones={zones} contentBox={contentBox} />}
        {analyzing && <AnalyzingBadge />}
        {!analyzing && showHeatmapToggle && heatmapSrc && (
          <button onClick={() => setShowHeatmap(s => !s)} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: 'rgba(0,0,0,0.65)', color: 'white', border: 'none', cursor: 'pointer' }}>
            <Eye size={11} /> {showHeatmap ? 'Hide heatmap' : 'Show heatmap'}
          </button>
        )}
      </div>
      <style jsx global>{`
        .creative-heatmap-reveal {
          clip-path: inset(0 0 100% 0);
          animation: creativeHeatReveal 2s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate;
        }
        @keyframes creativeHeatReveal {
          0% { clip-path: inset(0 0 100% 0); }
          100% { clip-path: inset(0 0 0% 0); }
        }
        .creative-scan-line {
          top: 0%;
          background: linear-gradient(
            180deg,
            rgba(150, 169, 152, 0) 0%,
            rgba(150, 169, 152, 0.6) 35%,
            rgba(212, 232, 213, 0.95) 50%,
            rgba(150, 169, 152, 0.6) 65%,
            rgba(150, 169, 152, 0) 100%
          );
          box-shadow: 0 0 16px 2px rgba(212, 232, 213, 0.65);
          animation: creativeScanSweep 2s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate;
        }
        @keyframes creativeScanSweep {
          0% { top: -3%; }
          100% { top: 97%; }
        }
      `}</style>
    </div>
  )
}

// Headline read on the whole panel — real counts computed from the actual
// reactions (never fabricated), plus the genuine cross-panel synthesis from
// generateCreativeReviewSummary when the run has one.
function PanelHeadline({ result }: { result: CreativeReviewResult }) {
  const withEngagement = result.reactions.filter(r => r.engagement_percentage !== null)
  const avgEngagement = withEngagement.length
    ? Math.round(withEngagement.reduce((sum, r) => sum + (r.engagement_percentage ?? 0), 0) / withEngagement.length)
    : null
  const highEngagementCount = withEngagement.filter(r => (r.engagement_percentage ?? 0) >= 70).length
  const confusedCount = result.reactions.filter(r => r.most_confusing_element).length

  return (
    <div className="rounded-xl p-5 sm:p-6" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-2xl font-semibold" style={{ fontFamily: HOME_FONT_DISPLAY }}>{avgEngagement !== null ? `${avgEngagement}%` : '—'}</p>
          <p className="text-[10px] uppercase tracking-wider opacity-70 mt-1">Avg. engagement</p>
        </div>
        <div>
          <p className="text-2xl font-semibold" style={{ fontFamily: HOME_FONT_DISPLAY }}>{highEngagementCount}/{result.total_personas}</p>
          <p className="text-[10px] uppercase tracking-wider opacity-70 mt-1">Engaged (70%+)</p>
        </div>
        <div>
          <p className="text-2xl font-semibold" style={{ fontFamily: HOME_FONT_DISPLAY }}>{confusedCount}/{result.total_personas}</p>
          <p className="text-[10px] uppercase tracking-wider opacity-70 mt-1">Flagged confusion</p>
        </div>
      </div>

      {result.summary?.overall_take && (
        <div className="pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <p className="text-sm leading-relaxed mb-3">{result.summary.overall_take}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.summary.where_personas_agree && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Where the panel agrees</p>
                <p className="text-xs">{result.summary.where_personas_agree}</p>
              </div>
            )}
            {result.summary.where_personas_diverge && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Where they diverge</p>
                <p className="text-xs">{result.summary.where_personas_diverge}</p>
              </div>
            )}
          </div>
          {result.summary.top_recommended_change && (
            <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Top recommended change</p>
              <p className="text-xs">{result.summary.top_recommended_change}</p>
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
        <SquareImageFrame src={`data:${imageMediaType};base64,${image}`} heatmapSrc={heatmapDataUrl} zones={result.zones} />
      )}

      <PanelHeadline result={result} />

      <div className="rounded-xl p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Measured attention by element</p>
        <p className="text-[11px] mb-4" style={{ color: HOME_COLORS.onSurfaceVariant }}>Share of the heatmap's visual weight that falls on each element below, computed directly from the image's pixels.</p>
        <ZoneBreakdown zones={result.zones} />
      </div>

      <div>
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
      <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full p-4 sm:p-10 max-w-2xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-2" style={{ ...DISPLAY_LG_STYLE, fontSize: '28px', lineHeight: '36px', color: HOME_COLORS.onSurface }}>
            <Eye size={22} style={{ color: HOME_COLORS.onSurfaceVariant }} />
            Creative Testing
          </h1>
          <p className="text-sm mt-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>See how your persona panel reads a packaging concept, ad, or landing page — grounded in real measured attention, not a guess.</p>
        </div>
        <div className="rounded-2xl p-10 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: HOME_COLORS.surfaceContainerHigh }}>
            <Lock size={22} style={{ color: HOME_COLORS.onSurfaceVariant }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: HOME_COLORS.onSurface }}>Signal or Broadcast plan required</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Upload a visual asset and see what each persona actually notices, trusts, and questions — backed by a real, independently-computed attention map.
          </p>
          <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold px-6 py-3 rounded-full text-white transition-colors" style={{ background: HOME_COLORS.primary }}>
            Upgrade plan →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full">
      <section className="relative px-4 sm:px-10 pt-10 sm:pt-16 pb-10 sm:pb-12 overflow-hidden">
        <div className="relative z-10 max-w-3xl flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Creative Intelligence</span>
            </div>
            <h1 className="mb-6 leading-tight" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onSurface }}>
              See what each persona <span className="italic" style={{ fontWeight: 400 }}>notices</span>.
            </h1>
            <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: HOME_COLORS.onSurfaceVariant }}>
              Upload a packaging shot, ad, or landing page and see how each persona reads it.
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
        <div className="px-4 sm:px-10 pb-20 max-w-4xl">
          {loadingHistory ? (
            <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Loading...</p>
          ) : historyRuns.length === 0 ? (
            <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>No saved reviews yet — run one with a project selected to see it here.</p>
          ) : selectedRun ? (
            <div className="flex flex-col gap-8">
              <button onClick={() => setSelectedRun(null)} className="text-xs font-semibold self-start" style={{ color: HOME_COLORS.primary, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to history</button>
              <div className="flex flex-col gap-6">
                {historyImageUrl && (
                  <SquareImageFrame src={historyImageUrl} zones={selectedRun.result.zones} showHeatmapToggle={false} />
                )}
                <PanelHeadline result={selectedRun.result} />
                <div className="rounded-xl p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Measured attention by element</p>
                  <p className="text-[11px] mb-4" style={{ color: HOME_COLORS.onSurfaceVariant }}>Share of the heatmap's visual weight that falls on each element below, computed directly from the image's pixels.</p>
                  <ZoneBreakdown zones={selectedRun.result.zones} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {selectedRun.result.reactions.map(r => (
                    <ReactionCard key={r.persona_id} reaction={r} image={null} imageMediaType="image/jpeg" intendedFocus={selectedRun.result.intended_focus} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {historyRuns.map(run => (
                <button key={run.id} onClick={() => setSelectedRun(run)} className="w-full text-left p-4 rounded-xl transition-colors hover:shadow-md" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW, border: 'none', cursor: 'pointer' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: HOME_COLORS.onSurface }}>{run.intended_focus || 'Creative review'}</p>
                  <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(run.created_at)} · {run.persona_ids.length} personas</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 pb-20">
          <aside className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
            <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Personas</h3>
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
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {personas.map(persona => {
                    const isSelected = selectedIds.includes(persona.id)
                    const atLimit = selectedIds.length >= maxPersonas && !isSelected
                    return (
                      <button key={persona.id} onClick={() => !atLimit && togglePersona(persona.id)} disabled={atLimit} className="group w-full flex items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-all hover:border-[#c3c8c1]/20 hover:bg-[#eae7e7] disabled:cursor-not-allowed disabled:opacity-40" style={isSelected ? { background: HOME_COLORS.secondaryContainer } : undefined}>
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

            <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: HOME_COLORS.onSurface }}>Save to project</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>Project <span className="normal-case font-normal">(optional)</span></label>
                  <Dropdown value={projectId} onChange={setProjectId} options={projectOptions} className="w-full" />
                </div>
                {workspaces.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>Share with workspace</label>
                    <Dropdown value={workspaceId} onChange={setWorkspaceId} options={workspaceOptions} className="w-full" />
                  </div>
                )}
              </div>
            </section>
          </aside>

          <main className="lg:col-span-8 flex flex-col gap-8 order-1 lg:order-2 min-w-0">
            <section className="p-6 sm:p-8 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: HOME_COLORS.onSurface }}>Upload the asset</h3>
              {imagePreview ? (
                <div className="relative inline-block mb-4">
                  <img src={imagePreview} alt="Upload preview" className="max-h-52 w-auto rounded-lg object-contain" style={{ border: `1px solid ${HOME_COLORS.outlineVariant}66` }} />
                  <button type="button" onClick={clearImage} className="absolute -top-2 -right-2 w-6 h-6 text-white rounded-full flex items-center justify-center" style={{ background: HOME_COLORS.error, border: 'none', cursor: 'pointer' }}>
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
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-lg mb-4 transition-colors" style={{ border: `1px dashed ${HOME_COLORS.outlineVariant}`, color: HOME_COLORS.onSurfaceVariant, background: 'none', cursor: 'pointer' }}>
                    <ImagePlus size={16} />
                    {processingImage ? 'Processing...' : 'Choose an image'}
                  </button>
                </>
              )}

              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>
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

              <button onClick={handleRun} disabled={!canRun} className="mt-5 flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: canRun ? 'pointer' : 'not-allowed' }}>
                {loading ? <><Loader2 size={15} className="animate-spin" /> Reviewing...</> : <><Eye size={15} /> Run Creative Testing</>}
              </button>
            </section>

            {!result && !loading && (
              <div className="rounded-xl py-20 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px dashed ${HOME_COLORS.outlineVariant}` }}>
                <Eye size={28} className="mx-auto mb-3" style={{ color: HOME_COLORS.outlineVariant }} />
                <h3 className="text-sm font-semibold mb-1" style={{ color: HOME_COLORS.onSurface }}>Results appear here</h3>
                <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  Upload an image and select {MIN_PERSONAS}–{maxPersonas} personas to see measured attention and how each one reads it.
                </p>
              </div>
            )}
            {loading && (
              <div className="flex flex-col gap-4">
                {imagePreview && <SquareImageFrame src={imagePreview} heatmapSrc={saliency?.heatmapDataUrl ?? null} zones={[]} analyzing />}
                <div className="rounded-xl py-6 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: HOME_COLORS.onSurface }}>Reviewing asset</h3>
                  <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Identifying elements, then interviewing {selectedIds.length} personas...</p>
                </div>
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
