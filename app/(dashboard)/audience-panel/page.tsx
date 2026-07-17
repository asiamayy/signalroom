'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Loader2, BarChart3, Lock, Sparkles, TrendingUp, AlertTriangle, Quote, Target, Clock, Waves, Terminal, ArrowRight, CheckSquare, Square, ImagePlus, X } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { Modal } from '@/components/ui/Modal'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import type { Persona, Plan } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PanelResponse {
  persona_id: string
  persona_name: string
  avatar_initials: string
  avatar_color: any
  avatar_url: string | null
  job_title: string
  location: string
  age: number | null
  industry: string
  response: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  error: string | null
}

interface Theme {
  title: string
  count: number
  sentiment: string
  summary: string
}

interface PanelSummary {
  overall_recommendation: string
  top_opportunity: string
  biggest_risk: string
  likelihood_of_purchase: number
  recommended_actions: string[]
  most_representative_quote: string
  most_representative_quote_persona: string
  biggest_objection_quote: string
  biggest_objection_quote_persona: string
  completed_in_seconds: number
}

interface PanelResult {
  responses: PanelResponse[]
  themes: Theme[]
  sentiment_distribution: Record<string, number>
  consensus_score: number
  total_personas: number
  question: string
  summary: PanelSummary
}

// ─── Color system — ported to the shared editorial palette ───────────────────

const SENTIMENT_COLORS = {
  positive: { bg: HOME_COLORS.secondaryContainer, text: HOME_COLORS.primary, bar: HOME_COLORS.primary, border: `${HOME_COLORS.primary}4d` },
  neutral: { bg: HOME_COLORS.surfaceContainerHigh, text: HOME_COLORS.onSurfaceVariant, bar: HOME_COLORS.outline, border: HOME_COLORS.outlineVariant },
  negative: { bg: '#FFDAD6', text: HOME_COLORS.error, bar: HOME_COLORS.error, border: '#FFB4AB' },
  mixed: { bg: '#FEF3C7', text: '#B45309', bar: '#D97706', border: '#FDE68A' },
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const c = SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutral
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {sentiment}
    </span>
  )
}

function SentimentBar({ distribution, total }: { distribution: Record<string, number>; total: number }) {
  const order = ['positive', 'neutral', 'mixed', 'negative']
  const entries = order.filter(k => distribution[k] > 0).map(k => ({
    key: k,
    count: distribution[k],
    pct: (distribution[k] / total) * 100,
    color: SENTIMENT_COLORS[k as keyof typeof SENTIMENT_COLORS]?.bar ?? HOME_COLORS.outline,
    text: SENTIMENT_COLORS[k as keyof typeof SENTIMENT_COLORS]?.text ?? HOME_COLORS.onSurfaceVariant,
  }))

  return (
    <div>
      <div className="flex h-8 rounded-xl overflow-hidden gap-0.5 mb-4">
        {entries.map(e => (
          <div key={e.key} className="flex items-center justify-center transition-all duration-700" style={{ width: `${e.pct}%`, background: e.color, minWidth: e.pct > 5 ? undefined : '0' }}>
            {e.pct >= 15 && <span className="text-[10px] font-bold text-white">{Math.round(e.pct)}%</span>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {entries.map(e => (
          <div key={e.key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <span className="text-xs capitalize" style={{ color: e.text }}>{e.key}</span>
            <span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{e.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UnanimousSentiment({ sentiment, total }: { sentiment: string; total: number }) {
  const c = SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutral
  const label = sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
  return (
    <div className="flex flex-col items-center text-center py-3">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: c.bg }}>
        <Waves size={24} style={{ color: c.bar }} />
      </div>
      <p className="text-lg mb-1" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>All {label}</p>
      <p className="text-xs leading-relaxed max-w-[220px] mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>Every persona expressed {sentiment} sentiment about this question.</p>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.bar }} />
        <span className="text-xs font-medium" style={{ color: c.text }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{total}/{total}</span>
      </div>
    </div>
  )
}

function ThemeList({ themes, total }: { themes: Theme[]; total: number }) {
  return (
    <div className="space-y-4">
      {themes.map((theme, i) => {
        const c = SENTIMENT_COLORS[theme.sentiment as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutral
        const pct = Math.round((theme.count / total) * 100)
        return (
          <div key={i}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.bar }} />
              <span className="text-sm font-medium flex-1 truncate" style={{ color: HOME_COLORS.onSurface }}>{theme.title}</span>
              <span className="text-[11px] font-semibold flex-shrink-0 px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: HOME_COLORS.surfaceContainer }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: c.bar }} />
            </div>
            <p className="text-[11px]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Mentioned by {theme.count}/{total} personas</p>
          </div>
        )
      })}
    </div>
  )
}

function PurchaseGauge({ value }: { value: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={HOME_COLORS.primaryFixedDim} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, fontSize: '24px', color: 'white' }}>{value}%</span>
        </div>
      </div>
      <p className="text-[11px] mt-2 font-medium text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>Likelihood of Purchase</p>
    </div>
  )
}

function ResponseModalContent({ response }: { response: PanelResponse }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-5 pr-8">
        <PersonaAvatar avatarUrl={response.avatar_url} avatarInitials={response.avatar_initials} avatarColor={response.avatar_color} name={response.persona_name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-neutral-900 truncate">{response.persona_name}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {response.job_title && <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}>{response.job_title}</span>}
            <SentimentBadge sentiment={response.sentiment} />
          </div>
        </div>
      </div>
      {response.error ? (
        <p className="text-sm text-red-500">{response.error}</p>
      ) : (
        <p className="text-sm text-neutral-700 leading-relaxed">{response.response}</p>
      )}
    </>
  )
}

function QuoteCard({ label, quote, source, accent }: { label: string; quote: string; source: string; accent: { text: string; bar: string } }) {
  return (
    <div className="rounded-xl p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, borderLeft: `4px solid ${accent.bar}`, boxShadow: CARD_SHADOW }}>
      <div className="flex items-center gap-1.5 mb-3">
        <Quote size={13} style={{ color: accent.bar }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent.text }}>{label}</span>
      </div>
      <p className="text-sm leading-relaxed italic mb-2" style={{ color: HOME_COLORS.onSurface }}>&ldquo;{quote}&rdquo;</p>
      <p className="text-xs font-semibold" style={{ color: accent.text }}>— {source}</p>
    </div>
  )
}

export default function AudiencePanelPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PanelResult | null>(null)
  const [error, setError] = useState('')
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [plan, setPlan] = useState<Plan>('free')
  const [openResponseId, setOpenResponseId] = useState<string | null>(null)
  const [imageData, setImageData] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageMediaType, setImageMediaType] = useState<string>('image/jpeg')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    setImageMediaType(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImagePreview(result)
      setImageData(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => { setImageData(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }

  const maxPersonas = PLAN_LIMITS[plan].audience_panel_max
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
  }, [])

  const togglePersona = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.length < maxPersonas ? [...prev, id] : prev)
  }

  const handleRun = async () => {
    if (selectedIds.length < 5) { setError('Select at least 5 personas'); return }
    if (!question.trim() && !imageData) { setError('Enter a question'); return }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/audience-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_ids: selectedIds, question, image: imageData, imageMediaType }),
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

  const canRun = !loading && selectedIds.length >= 5 && (question.trim() || !!imageData)

  if (!loadingPersonas && !hasAccess) {
    return (
      <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full p-4 sm:p-10 max-w-2xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-2" style={{ ...DISPLAY_LG_STYLE, fontSize: '28px', lineHeight: '36px', color: HOME_COLORS.onSurface }}>
            <BarChart3 size={22} style={{ color: HOME_COLORS.onSurfaceVariant }} />
            Audience Panel
          </h1>
          <p className="text-sm mt-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Ask one question to 5–10 personas simultaneously and visualize the results</p>
        </div>
        <div className="rounded-2xl p-10 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: HOME_COLORS.surfaceContainerHigh }}>
            <Lock size={22} style={{ color: HOME_COLORS.onSurfaceVariant }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: HOME_COLORS.onSurface }}>Signal or Broadcast plan required</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Run batch research across 5–10 personas simultaneously. Get sentiment analysis, theme extraction, AI recommendations, and decision-ready visualizations — all in one panel.
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
      {/* Hero */}
      <section className="relative px-4 sm:px-10 pt-10 sm:pt-16 pb-10 sm:pb-12 overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Audience Intelligence</span>
          </div>
          <h1 className="mb-6 leading-tight" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onSurface }}>
            Synthesize market voice through <span className="italic" style={{ fontWeight: 400 }}>neural modeling</span>.
          </h1>
          <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Bridge the gap between raw data and human resonance. Ask one question, get real answers from every selected persona — analyzed, themed, and summarized instantly.
          </p>
        </div>
        <div className="absolute right-4 sm:right-10 bottom-2 flex-col items-end opacity-20 hidden lg:flex pointer-events-none">
          <span style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, fontSize: '84px', color: HOME_COLORS.primary, lineHeight: 1 }}>{String(personas.length).padStart(2, '0')}</span>
          <span className="text-[11px] font-bold uppercase tracking-tight" style={{ color: HOME_COLORS.onSurface }}>Active Personas</span>
        </div>
      </section>

      {/* Content grid */}
      <div className="px-4 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 pb-20">
        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
          <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Target Personas</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: selectedIds.length >= 5 ? HOME_COLORS.secondaryContainer : HOME_COLORS.surfaceContainerHigh, color: selectedIds.length >= 5 ? HOME_COLORS.primary : HOME_COLORS.onSurfaceVariant }}>
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
                    <button
                      key={persona.id}
                      onClick={() => !atLimit && togglePersona(persona.id)}
                      disabled={atLimit}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: isSelected ? HOME_COLORS.secondaryContainer : HOME_COLORS.surfaceContainerLow, border: isSelected ? `1.5px solid ${HOME_COLORS.primary}` : '1.5px solid transparent' }}
                    >
                      <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" />
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

          {/* Readiness / neural pulse — real status, not a fabricated insight */}
          <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Panel Readiness</span>
              <Sparkles size={16} style={{ color: HOME_COLORS.primaryFixedDim }} />
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              {selectedIds.length >= 5
                ? `${selectedIds.length} personas selected — ready to run.`
                : `Select ${5 - selectedIds.length} more persona${5 - selectedIds.length === 1 ? '' : 's'} to unlock the panel.`}
              {result && ` Last run reached a ${result.consensus_score}% consensus score.`}
            </p>
          </section>

          {/* Quote highlights */}
          {result && (
            <div className="space-y-3">
              {result.summary.most_representative_quote && (
                <QuoteCard label="Most Representative Quote" quote={result.summary.most_representative_quote} source={result.summary.most_representative_quote_persona} accent={SENTIMENT_COLORS.positive} />
              )}
              {result.summary.biggest_objection_quote && (
                <QuoteCard label="Biggest Objection" quote={result.summary.biggest_objection_quote} source={result.summary.biggest_objection_quote_persona} accent={SENTIMENT_COLORS.negative} />
              )}
            </div>
          )}
        </aside>

        {/* Main column */}
        <main className="lg:col-span-8 flex flex-col gap-8 order-1 lg:order-2 min-w-0">
          {/* AI Inquiry Engine */}
          <section className="p-6 sm:p-8 rounded-xl relative overflow-hidden" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
            <div className="flex justify-between items-start mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <Terminal size={18} style={{ color: HOME_COLORS.primaryFixedDim }} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">AI Inquiry Engine</h4>
                  <p className="text-xs opacity-70">Querying <span className="font-bold" style={{ color: HOME_COLORS.primaryFixedDim }}>{selectedIds.length} selected persona{selectedIds.length === 1 ? '' : 's'}</span></p>
                </div>
              </div>
            </div>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={4}
              placeholder={imagePreview ? 'Ask your audience about this image...' : 'e.g. Would you pay $199/month for an AI tool that runs customer interviews in minutes?'}
              className="w-full rounded-xl p-5 sm:p-6 text-base outline-none resize-none transition-colors mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: HOME_COLORS.onPrimary }}
            />
            <div className="flex items-center gap-3 mb-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Upload preview" className="h-16 w-auto rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,0.2)' }} />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center"
                    style={{ background: HOME_COLORS.primaryFixedDim, color: HOME_COLORS.onPrimaryFixedVariant }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}
                    title="Attach an image for the panel to react to"
                  >
                    <ImagePlus size={13} />
                    Attach image
                  </button>
                </>
              )}
            </div>
            {error && <p className="text-sm mb-4" style={{ color: '#FFB4AB' }}>{error}</p>}
            {selectedIds.length > 0 && selectedIds.length < 5 && (
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Select {5 - selectedIds.length} more persona{5 - selectedIds.length === 1 ? '' : 's'} to run the panel.</p>
            )}
            <button
              onClick={handleRun}
              disabled={!canRun}
              className="flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all disabled:cursor-not-allowed"
              style={{ background: canRun ? HOME_COLORS.primaryFixedDim : 'rgba(255,255,255,0.1)', color: canRun ? HOME_COLORS.onPrimaryFixedVariant : 'rgba(255,255,255,0.4)' }}
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Analyzing panel...</> : <><BarChart3 size={15} /> Synthesize Intelligence</>}
            </button>
          </section>

          {!result && !loading && (
            <div className="rounded-xl py-20 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px dashed ${HOME_COLORS.outlineVariant}` }}>
              <BarChart3 size={28} className="mx-auto mb-3" style={{ color: HOME_COLORS.outlineVariant }} />
              <h3 className="text-sm font-semibold mb-1" style={{ color: HOME_COLORS.onSurface }}>Results appear here</h3>
              <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                {maxPersonas > 5 ? `Select 5–${maxPersonas} personas` : 'Select exactly 5 personas'}, type your question, and run the panel to see responses, themes, and an AI recommendation.
              </p>
            </div>
          )}
          {loading && (
            <div className="rounded-xl py-20 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
              <Loader2 size={28} className="mx-auto mb-3 animate-spin" style={{ color: HOME_COLORS.primary }} />
              <h3 className="text-sm font-semibold mb-1" style={{ color: HOME_COLORS.onSurface }}>Running panel</h3>
              <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Interviewing all {selectedIds.length} personas in parallel...</p>
            </div>
          )}

          {result && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { Icon: Users, value: result.total_personas, label: 'Personas Interviewed' },
                  { Icon: Sparkles, value: result.themes.length, label: 'Key Themes Identified' },
                  { Icon: Target, value: `${result.consensus_score}%`, label: 'Consensus Score' },
                  { Icon: Clock, value: `${result.summary.completed_in_seconds}s`, label: 'Time to Complete' },
                ] as { Icon: typeof Users; value: string | number; label: string }[]).map((s, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
                    <s.Icon size={16} style={{ color: HOME_COLORS.primary }} className="mb-3" />
                    <p className="text-2xl leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>{s.value}</p>
                    <p className="text-[11px] mt-1.5 font-medium" style={{ color: HOME_COLORS.onSurfaceVariant }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Executive summary */}
              <div className="rounded-xl p-6 sm:p-8" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={15} style={{ color: 'rgba(255,255,255,0.8)' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>Executive Summary</span>
                </div>
                <p className="text-lg leading-relaxed mb-5" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>{result.summary.overall_recommendation}</p>
                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <TrendingUp size={13} style={{ color: 'rgba(255,255,255,0.8)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Top Opportunity</span>
                      </div>
                      <p className="text-xs leading-relaxed">{result.summary.top_opportunity}</p>
                    </div>
                    <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle size={13} style={{ color: 'rgba(255,255,255,0.8)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Biggest Risk</span>
                      </div>
                      <p className="text-xs leading-relaxed">{result.summary.biggest_risk}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center lg:pl-5 lg:border-l" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                    <PurchaseGauge value={result.summary.likelihood_of_purchase} />
                  </div>
                </div>
                {result.summary.recommended_actions?.length > 0 && (
                  <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Recommended Actions</p>
                    <div className="space-y-1.5">
                      {result.summary.recommended_actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ArrowRight size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} />
                          <p className="text-xs leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sentiment / Themes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: HOME_COLORS.onSurfaceVariant }}>Sentiment Overall</p>
                  {Object.keys(result.sentiment_distribution).length === 1 ? (
                    <UnanimousSentiment sentiment={Object.keys(result.sentiment_distribution)[0]} total={result.total_personas} />
                  ) : (
                    <SentimentBar distribution={result.sentiment_distribution} total={result.total_personas} />
                  )}
                </div>
                <div className="rounded-xl p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: HOME_COLORS.onSurfaceVariant }}>Theme Frequency</p>
                  <ThemeList themes={result.themes} total={result.total_personas} />
                </div>
              </div>

              {/* Individual responses — editorial quote cards */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: HOME_COLORS.onSurfaceVariant }}>Individual Responses</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.responses.map(r => (
                    <motion.article
                      key={r.persona_id}
                      layoutId={`ap-response-${r.persona_id}`}
                      onClick={() => setOpenResponseId(r.persona_id)}
                      className="rounded-xl p-5 cursor-pointer transition-all hover:shadow-xl flex flex-col"
                      style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <PersonaAvatar avatarUrl={r.avatar_url} avatarInitials={r.avatar_initials} avatarColor={r.avatar_color} name={r.persona_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: HOME_COLORS.onSurface }}>{r.persona_name}</p>
                          {r.job_title && <p className="text-[10px] uppercase truncate" style={{ color: HOME_COLORS.onSurfaceVariant }}>{r.job_title}</p>}
                        </div>
                        <SentimentBadge sentiment={r.sentiment} />
                      </div>
                      {r.error ? (
                        <p className="text-xs" style={{ color: HOME_COLORS.error }}>{r.error}</p>
                      ) : (
                        <p className="text-sm leading-relaxed italic line-clamp-3" style={{ color: HOME_COLORS.onSurface }}>&ldquo;{r.response}&rdquo;</p>
                      )}
                    </motion.article>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <AnimatePresence>
        {openResponseId && (() => {
          const response = result?.responses.find(r => r.persona_id === openResponseId)
          if (!response) return null
          return (
            <Modal key="ap-modal" onClose={() => setOpenResponseId(null)} maxWidth={540} layoutId={`ap-response-${openResponseId}`}>
              <ResponseModalContent response={response} />
            </Modal>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
