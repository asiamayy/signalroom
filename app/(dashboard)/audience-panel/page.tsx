'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Loader2, BarChart3, Lock, Sparkles, TrendingUp, AlertTriangle, Quote, Target, Clock, Waves } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { withViewTransition } from '@/lib/viewTransition'
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

// ─── Color system ─────────────────────────────────────────────────────────────

const SENTIMENT_COLORS = {
  positive: { bg: '#E8F5F1', text: '#0D5C45', bar: '#1A9B76', border: '#A7D9C8' },
  neutral:  { bg: '#F3F4F6', text: '#4B5563', bar: '#9CA3AF', border: '#D1D5DB' },
  negative: { bg: '#FEF2F2', text: '#991B1B', bar: '#EF4444', border: '#FECACA' },
  mixed:    { bg: '#FFFBEB', text: '#92400E', bar: '#F59E0B', border: '#FDE68A' },
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const c = SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutral
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
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
    color: SENTIMENT_COLORS[k as keyof typeof SENTIMENT_COLORS]?.bar ?? '#9CA3AF',
    bg: SENTIMENT_COLORS[k as keyof typeof SENTIMENT_COLORS]?.bg ?? '#F3F4F6',
    text: SENTIMENT_COLORS[k as keyof typeof SENTIMENT_COLORS]?.text ?? '#4B5563',
  }))

  return (
    <div>
      <div className="flex h-8 rounded-xl overflow-hidden gap-0.5 mb-4">
        {entries.map(e => (
          <div key={e.key} className="flex items-center justify-center transition-all duration-700"
            style={{ width: `${e.pct}%`, background: e.color, minWidth: e.pct > 5 ? undefined : '0' }}>
            {e.pct >= 15 && <span className="text-[10px] font-bold text-white">{Math.round(e.pct)}%</span>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {entries.map(e => (
          <div key={e.key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <span className="text-xs capitalize" style={{ color: e.text }}>{e.key}</span>
            <span className="text-xs font-semibold text-neutral-700">{e.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Unanimous sentiment callout — shown when every persona lands on the same side ──

function UnanimousSentiment({ sentiment, total }: { sentiment: string; total: number }) {
  const c = SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutral
  const label = sentiment.charAt(0).toUpperCase() + sentiment.slice(1)

  return (
    <div className="flex flex-col items-center text-center py-3">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: c.bg }}>
        <Waves size={24} style={{ color: c.bar }} />
      </div>
      <p className="text-lg font-serif font-bold text-neutral-900 mb-1">All {label}</p>
      <p className="text-xs text-neutral-500 leading-relaxed max-w-[220px] mb-3">
        Every persona expressed {sentiment} sentiment about this question.
      </p>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.bar }} />
        <span className="text-xs font-medium" style={{ color: c.text }}>{label}</span>
        <span className="text-xs font-semibold text-neutral-700">{total}/{total}</span>
        <span className="text-xs text-neutral-400">· All personas</span>
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
              <span className="text-sm font-medium text-neutral-900 flex-1 truncate">{theme.title}</span>
              <span className="text-[11px] font-semibold flex-shrink-0 px-2 py-0.5 rounded-full"
                style={{ background: c.bg, color: c.text }}>
                {pct}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: '#F3F4F6' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: c.bar }} />
            </div>
            <p className="text-[11px] text-neutral-400">Mentioned by {theme.count}/{total} personas</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Purchase likelihood gauge ────────────────────────────────────────────────

function PurchaseGauge({ value }: { value: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke="white" strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-serif font-bold text-white">{value}%</span>
        </div>
      </div>
      <p className="text-[11px] mt-2 font-medium text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>Likelihood of Purchase</p>
    </div>
  )
}

function ResponseCard({ result, isModalOpen, onReadMore }: { result: PanelResponse; isModalOpen: boolean; onReadMore: () => void }) {
  const c = SENTIMENT_COLORS[result.sentiment] ?? SENTIMENT_COLORS.neutral
  // Cleared while this card's modal is open so the modal exclusively owns
  // the shared view-transition-name during the morph (see Modal usage below).
  const viewTransitionName = isModalOpen ? undefined : `ap-response-${result.persona_id}`

  return (
    <div className="rounded-2xl p-4 flex flex-col h-full transition-all"
      style={{ background: 'white', border: `1px solid ${c.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', viewTransitionName } as React.CSSProperties}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <PersonaAvatar
          avatarUrl={result.avatar_url}
          avatarInitials={result.avatar_initials}
          avatarColor={result.avatar_color}
          name={result.persona_name}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{result.persona_name}</p>
          {result.job_title && (
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-0.5"
              style={{ background: '#E8F5F1', color: '#0D5C45' }}>
              {result.job_title}
            </span>
          )}
        </div>
      </div>

      <div className="mb-2.5">
        <SentimentBadge sentiment={result.sentiment} />
      </div>

      {result.error ? (
        <p className="text-xs text-red-500">{result.error}</p>
      ) : (
        <>
          <p className="text-xs text-neutral-600 leading-relaxed flex-1 line-clamp-2">
            {result.response}
          </p>
          <button onClick={onReadMore}
            className="text-[11px] font-semibold mt-2 self-start transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A9B76', padding: 0, fontFamily: 'inherit' }}>
            Read more →
          </button>
        </>
      )}
    </div>
  )
}

// ─── Quote highlight card ──────────────────────────────────────────────────────

function QuoteCard({ label, quote, source, accent }: { label: string; quote: string; source: string; accent: { text: string; bar: string } }) {
  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderLeft: `4px solid ${accent.bar}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-1.5 mb-3">
        <Quote size={13} style={{ color: accent.bar }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent.text }}>{label}</span>
      </div>
      <p className="text-sm text-neutral-800 leading-relaxed italic mb-2">"{quote}"</p>
      <p className="text-xs font-semibold" style={{ color: accent.text }}>— {source}</p>
    </div>
  )
}

// ─── Full response modal content ─────────────────────────────────────────────

function ResponseModalContent({ response }: { response: PanelResponse }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-5 pr-8">
        <PersonaAvatar
          avatarUrl={response.avatar_url}
          avatarInitials={response.avatar_initials}
          avatarColor={response.avatar_color}
          name={response.persona_name}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-neutral-900 truncate">{response.persona_name}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {response.job_title && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: '#E8F5F1', color: '#0D5C45' }}>
                {response.job_title}
              </span>
            )}
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

export default function AudiencePanelPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PanelResult | null>(null)
  const [error, setError] = useState('')
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [plan, setPlan] = useState<Plan>('starter')
  const [openResponseId, setOpenResponseId] = useState<string | null>(null)

  const maxPersonas = PLAN_LIMITS[plan].audience_panel_max
  const hasAccess = PLAN_LIMITS[plan].audience_panel

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('personas').select('*').eq('archived', false).order('updated_at', { ascending: false }),
      supabase.from('profiles').select('plan').single(),
    ]).then(([{ data: p }, { data: profile }]) => {
      setPersonas(p ?? [])
      setPlan((profile?.plan ?? 'starter') as Plan)
      setLoadingPersonas(false)
    })
  }, [])

  const togglePersona = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : prev.length < maxPersonas ? [...prev, id] : prev
    )
  }

  const handleRun = async () => {
    if (selectedIds.length < 5) { setError('Select at least 5 personas'); return }
    if (!question.trim()) { setError('Enter a question'); return }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/audience-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_ids: selectedIds, question }),
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

  const canRun = !loading && selectedIds.length >= 5 && question.trim()

  if (!loadingPersonas && !hasAccess) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-serif tracking-tight text-neutral-900 flex items-center gap-2">
            <BarChart3 size={22} className="text-neutral-400" />
            Audience Panel
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Ask one question to 5–10 personas simultaneously and visualize the results</p>
        </div>
        <div className="bg-white rounded-2xl p-10 text-center"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: '#F3F4F6' }}>
            <Lock size={22} className="text-neutral-400" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Signal or Broadcast plan required</h2>
          <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto leading-relaxed">
            Run batch research across 5–10 personas simultaneously. Get sentiment analysis, theme extraction, AI recommendations, and decision-ready visualizations — all in one panel.
          </p>
          <Link href="/settings"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-6 py-3 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #1A8C6A 0%, #2BAE86 100%)', boxShadow: '0 2px 10px rgba(26,140,106,0.3)' }}>
            Upgrade plan →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl" style={{ background: '#F7F8FA', minHeight: '100%' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-serif tracking-tight text-neutral-900 flex items-center gap-2">
          <BarChart3 size={22} style={{ color: '#1A9B76' }} />
          Audience Panel
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Ask one question — see how your entire audience responds, analyzed and visualized instantly</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">Your question</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Would you pay $49/month for an AI tool that runs customer interviews in minutes?"
              rows={5}
              className="w-full text-sm text-neutral-800 placeholder:text-neutral-400 resize-none focus:outline-none leading-relaxed"
              style={{ background: 'none', border: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Personas</label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: selectedIds.length >= 5 ? '#E8F5F1' : '#F3F4F6', color: selectedIds.length >= 5 ? '#0D5C45' : '#6B7280' }}>
                {selectedIds.length} / {maxPersonas}
              </span>
            </div>
            {loadingPersonas ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: '#F3F4F6' }} />)}</div>
            ) : personas.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-neutral-500 mb-2">No personas yet</p>
                <Link href="/personas/new" className="text-xs font-semibold" style={{ color: '#1A9B76' }}>Create your first persona →</Link>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {personas.map(persona => {
                  const isSelected = selectedIds.includes(persona.id)
                  const atLimit = selectedIds.length >= maxPersonas && !isSelected
                  return (
                    <button key={persona.id}
                      onClick={() => !atLimit && togglePersona(persona.id)}
                      disabled={atLimit}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{
                        background: isSelected ? '#E8F5F1' : '#F9FAFB',
                        border: isSelected ? '1.5px solid #1A9B76' : '1.5px solid transparent',
                        cursor: atLimit ? 'not-allowed' : 'pointer',
                        opacity: atLimit ? 0.45 : 1,
                        fontFamily: 'inherit',
                      }}>
                      <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 truncate">{persona.name}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{persona.traits?.job_title ?? 'No role'}</p>
                      </div>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A9B76" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          {selectedIds.length > 0 && selectedIds.length < 5 && (
            <p className="text-xs text-amber-600 text-center font-medium">
              Select {5 - selectedIds.length} more to run the panel
            </p>
          )}
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button onClick={handleRun} disabled={!canRun}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl transition-all"
            style={{
              background: canRun ? 'linear-gradient(135deg, #1A8C6A 0%, #2BAE86 100%)' : '#E5E7EB',
              color: canRun ? 'white' : '#9CA3AF',
              cursor: canRun ? 'pointer' : 'not-allowed',
              border: 'none',
              fontFamily: 'inherit',
              boxShadow: canRun ? '0 4px 14px rgba(26,140,106,0.35)' : 'none',
            }}>
            {loading ? <><Loader2 size={15} className="animate-spin" />Analyzing panel...</> : <><BarChart3 size={15} />Run Audience Panel</>}
          </button>
          {loading && (
            <p className="text-xs text-neutral-400 text-center">Interviewing {selectedIds.length} personas simultaneously...</p>
          )}

          {/* ── Quote highlights — filled in under the setup panel so this column isn't left empty ── */}
          {result && (
            <div className="space-y-3 pt-1">
              {result.summary.most_representative_quote && (
                <QuoteCard
                  label="Most Representative Quote"
                  quote={result.summary.most_representative_quote}
                  source={result.summary.most_representative_quote_persona}
                  accent={SENTIMENT_COLORS.positive}
                />
              )}
              {result.summary.biggest_objection_quote && (
                <QuoteCard
                  label="Biggest Objection"
                  quote={result.summary.biggest_objection_quote}
                  source={result.summary.biggest_objection_quote_persona}
                  accent={SENTIMENT_COLORS.negative}
                />
              )}
              {(() => {
                const takeaway = result.summary.recommended_actions?.length > 1
                  ? result.summary.recommended_actions[result.summary.recommended_actions.length - 1]
                  : result.summary.recommended_actions?.[0] ?? result.summary.overall_recommendation
                return takeaway ? (
                  <QuoteCard
                    label="Key Takeaway"
                    quote={takeaway}
                    source="Recommended next step"
                    accent={SENTIMENT_COLORS.neutral}
                  />
                ) : null
              })()}
            </div>
          )}
        </div>
        <div className="lg:col-span-2 space-y-5 min-w-0">
          {!result && !loading && (
            <div className="rounded-2xl p-14 text-center" style={{ background: 'white', border: '1.5px dashed #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <BarChart3 size={32} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
              <h3 className="text-sm font-semibold text-neutral-700 mb-1">Results appear here</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                Select 5–{maxPersonas} personas, type your question, and run the panel to see responses, themes, and an AI recommendation.
              </p>
            </div>
          )}
          {loading && (
            <div className="rounded-2xl p-14 text-center" style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <Loader2 size={32} className="mx-auto mb-3 animate-spin" style={{ color: '#1A9B76' }} />
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">Running panel</h3>
              <p className="text-xs text-neutral-400">Interviewing all {selectedIds.length} personas in parallel...</p>
            </div>
          )}
          {result && (
            <>
              {/* ── Stat cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { Icon: Users, value: result.total_personas, label: 'Personas Interviewed', iconBg: '#E8F5F1', iconColor: '#1A9B76' },
                  { Icon: Sparkles, value: result.themes.length, label: 'Key Themes Identified', iconBg: '#FFFBEB', iconColor: '#D97706' },
                  { Icon: Target, value: `${result.consensus_score}%`, label: 'Consensus Score', iconBg: '#EEF2FF', iconColor: '#6366F1' },
                  { Icon: Clock, value: `${result.summary.completed_in_seconds}s`, label: 'Time to Complete', sublabel: "That's 3–4 weeks saved", iconBg: '#EFF6FF', iconColor: '#3B82F6' },
                ] as { Icon: typeof Users; value: string | number; label: string; sublabel?: string; iconBg: string; iconColor: string }[]).map((s, i) => (
                  <div key={i} className="rounded-2xl p-4"
                    style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.iconBg }}>
                      <s.Icon size={16} style={{ color: s.iconColor }} />
                    </div>
                    <p className="text-2xl font-serif font-bold text-neutral-900 leading-none">{s.value}</p>
                    <p className="text-[11px] text-neutral-500 mt-1.5 font-medium">{s.label}</p>
                    {s.sublabel && <p className="text-[10px] mt-1 font-semibold" style={{ color: '#1A9B76' }}>{s.sublabel}</p>}
                  </div>
                ))}
              </div>

              {/* ── Executive Summary ── */}
              <div className="rounded-2xl p-6" style={{ background: '#0A4F3A', boxShadow: '0 4px 20px rgba(10,79,58,0.25)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={15} style={{ color: 'rgba(255,255,255,0.8)' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>Executive Summary</span>
                </div>
                <p className="text-base font-semibold leading-relaxed text-white mb-5">{result.summary.overall_recommendation}</p>

                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <TrendingUp size={13} style={{ color: 'rgba(255,255,255,0.8)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Top Opportunity</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">{result.summary.top_opportunity}</p>
                    </div>
                    <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle size={13} style={{ color: 'rgba(255,255,255,0.8)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Biggest Risk</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">{result.summary.biggest_risk}</p>
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
                          <span className="text-xs font-bold mt-0.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>→</span>
                          <p className="text-xs text-white leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[10px] mt-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Completed in ~{result.summary.completed_in_seconds}s · {result.total_personas} personas interviewed
                </p>
              </div>

              {/* ── Sentiment / Themes ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5"
                  style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Sentiment Overall</p>
                  {Object.keys(result.sentiment_distribution).length === 1 ? (
                    <UnanimousSentiment
                      sentiment={Object.keys(result.sentiment_distribution)[0]}
                      total={result.total_personas}
                    />
                  ) : (
                    <>
                      <SentimentBar distribution={result.sentiment_distribution} total={result.total_personas} />
                      {(() => {
                        const dominant = Object.entries(result.sentiment_distribution).reduce(
                          (max, cur) => (cur[1] > max[1] ? cur : max)
                        )
                        const [dominantKey, dominantCount] = dominant
                        const c = SENTIMENT_COLORS[dominantKey as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutral
                        return (
                          <div className="rounded-xl p-3.5 mt-4 flex items-start gap-2.5" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                            <Sparkles size={14} className="flex-shrink-0 mt-0.5" style={{ color: c.bar }} />
                            <p className="text-xs text-neutral-600 leading-relaxed">
                              <span className="font-semibold text-neutral-900 capitalize">Overall Sentiment: {dominantKey}</span>
                              {' — '}{dominantCount}/{result.total_personas} personas leaned {dominantKey}.
                            </p>
                          </div>
                        )
                      })()}
                    </>
                  )}
                </div>
                <div className="rounded-2xl p-5"
                  style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Theme Frequency</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">Mentioned by · Confidence</p>
                  </div>
                  <ThemeList themes={result.themes} total={result.total_personas} />
                </div>
              </div>

            </>
          )}
        </div>
      </div>

      {/* ── Individual responses — full page width, not confined to the results column ── */}
      {result && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Individual Responses</p>
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="grid gap-3" style={{ gridAutoFlow: 'column', gridAutoColumns: 'minmax(200px, 1fr)' }}>
              {result.responses.map(r => (
                <ResponseCard
                  key={r.persona_id}
                  result={r}
                  isModalOpen={openResponseId === r.persona_id}
                  onReadMore={() => withViewTransition(() => setOpenResponseId(r.persona_id), 'open')}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!openResponseId}
        onClose={() => withViewTransition(() => setOpenResponseId(null), 'close')}
        maxWidth={540}
        viewTransitionName={openResponseId ? `ap-response-${openResponseId}` : undefined}
      >
        {(() => {
          const response = result?.responses.find(r => r.persona_id === openResponseId)
          return response ? <ResponseModalContent response={response} /> : null
        })()}
      </Modal>
    </div>
  )
}
