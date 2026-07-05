'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Loader2, ChevronDown, BarChart3, Lock } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
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

interface PanelResult {
  responses: PanelResponse[]
  themes: Theme[]
  sentiment_distribution: Record<string, number>
  consensus_score: number
  total_personas: number
  question: string
}

// ─── Sentiment helpers ────────────────────────────────────────────────────────

const SENTIMENT_COLORS = {
  positive: { bg: '#E8F5F1', text: '#0D5C45', bar: '#1A9B76' },
  neutral: { bg: '#F3F4F6', text: '#6B7280', bar: '#9CA3AF' },
  negative: { bg: '#FEF2F2', text: '#991B1B', bar: '#EF4444' },
  mixed: { bg: '#FFFBEB', text: '#92400E', bar: '#F59E0B' },
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const colors = SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutral
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ background: colors.bg, color: colors.text }}>
      {sentiment}
    </span>
  )
}

// ─── Sentiment donut chart (pure SVG) ────────────────────────────────────────

function SentimentDonut({ distribution, total }: { distribution: Record<string, number>; total: number }) {
  const order = ['positive', 'neutral', 'negative', 'mixed']
  const entries = order.filter(k => distribution[k] > 0).map(k => ({
    key: k,
    count: distribution[k],
    pct: distribution[k] / total,
    color: SENTIMENT_COLORS[k as keyof typeof SENTIMENT_COLORS]?.bar ?? '#9CA3AF',
  }))

  let offset = 0
  const r = 40
  const circumference = 2 * Math.PI * r
  const slices = entries.map(e => {
    const dash = e.pct * circumference
    const slice = { ...e, offset, dash }
    offset += dash
    return slice
  })

  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="18" />
        {slices.map(s => (
          <circle key={s.key} cx="50" cy="50" r={r} fill="none"
            stroke={s.color} strokeWidth="18"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            transform="rotate(-90 50 50)"
          />
        ))}
      </svg>
      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <span className="text-xs text-neutral-600 capitalize">{e.key}</span>
            <span className="text-xs font-semibold text-neutral-900 ml-auto">{e.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Theme bar chart (pure SVG) ──────────────────────────────────────────────

function ThemeBarChart({ themes, total }: { themes: Theme[]; total: number }) {
  const max = Math.max(...themes.map(t => t.count), 1)
  return (
    <div className="space-y-3">
      {themes.map((theme, i) => {
        const colors = SENTIMENT_COLORS[theme.sentiment as keyof typeof SENTIMENT_COLORS] ?? SENTIMENT_COLORS.neutral
        const pct = (theme.count / max) * 100
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-neutral-800 truncate max-w-[200px]">{theme.title}</span>
              <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">{theme.count} of {total}</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: colors.bar }} />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{theme.summary}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Response grid ────────────────────────────────────────────────────────────

function ResponseCard({ result }: { result: PanelResponse }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = (result.response?.length ?? 0) > 200
  const displayText = expanded || !isLong
    ? result.response
    : result.response?.slice(0, 200) + '...'

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-4"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div className="flex items-start gap-3 mb-3">
        <PersonaAvatar
          avatarUrl={result.avatar_url}
          avatarInitials={result.avatar_initials}
          avatarColor={result.avatar_color}
          name={result.persona_name}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-neutral-900">{result.persona_name}</span>
            <SentimentBadge sentiment={result.sentiment} />
          </div>
          <p className="text-xs text-neutral-400 truncate">{result.job_title}{result.location ? ` · ${result.location}` : ''}</p>
        </div>
      </div>

      {result.error ? (
        <p className="text-xs text-red-500">{result.error}</p>
      ) : (
        <>
          <p className="text-sm text-neutral-700 leading-relaxed">{displayText}</p>
          {isLong && (
            <button onClick={() => setExpanded(o => !o)}
              className="text-xs font-medium mt-2 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A9B76', padding: 0, fontFamily: 'inherit' }}>
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AudiencePanelPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PanelResult | null>(null)
  const [error, setError] = useState('')
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [plan, setPlan] = useState<Plan>('starter')
  const [showPersonaPicker, setShowPersonaPicker] = useState(false)

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
        : prev.length < maxPersonas
          ? [...prev, id]
          : prev
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

  // ── Upgrade gate ──────────────────────────────────────────────────────────

  if (!loadingPersonas && !hasAccess) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-serif tracking-tight text-neutral-900 flex items-center gap-2">
            <Users size={22} className="text-neutral-400" />
            Audience Panel
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Ask one question to 5-10 personas simultaneously and visualize the results</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#F3F4F6' }}>
            <Lock size={20} className="text-neutral-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Signal or Broadcast plan required</h2>
          <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
            Audience Panel lets you run batch research across 5-10 personas simultaneously with sentiment analysis, theme extraction, and visualizations.
          </p>
          <Link href="/settings"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-6 py-2.5 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #1A8C6A 0%, #2BAE86 100%)' }}>
            Upgrade plan →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-serif tracking-tight text-neutral-900 flex items-center gap-2">
          <BarChart3 size={22} className="text-neutral-400" />
          Audience Panel
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Ask one question to multiple personas simultaneously — see sentiment, themes, and patterns instantly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Setup panel ── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Question input */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
              Your question
            </label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Would you pay $49/month for an AI tool that runs customer interviews in minutes?"
              rows={4}
              className="w-full text-sm text-neutral-800 placeholder:text-neutral-400 resize-none focus:outline-none leading-relaxed"
              style={{ background: 'none', border: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Persona selector */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Personas
              </label>
              <span className="text-xs text-neutral-400">{selectedIds.length} / {maxPersonas} selected</span>
            </div>

            {loadingPersonas ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse bg-neutral-100" />)}
              </div>
            ) : personas.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-neutral-500 mb-2">No personas yet</p>
                <Link href="/personas/new" className="text-xs font-semibold" style={{ color: '#1A9B76' }}>Create your first persona →</Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {personas.map(persona => {
                  const isSelected = selectedIds.includes(persona.id)
                  const atLimit = selectedIds.length >= maxPersonas && !isSelected
                  return (
                    <button
                      key={persona.id}
                      onClick={() => !atLimit && togglePersona(persona.id)}
                      disabled={atLimit}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{
                        background: isSelected ? '#E8F5F1' : '#F9FAFB',
                        border: isSelected ? '1.5px solid #1A9B76' : '1.5px solid transparent',
                        cursor: atLimit ? 'not-allowed' : 'pointer',
                        opacity: atLimit ? 0.5 : 1,
                        fontFamily: 'inherit',
                      }}
                    >
                      <PersonaAvatar
                        avatarUrl={persona.avatar_url}
                        avatarInitials={persona.avatar_initials}
                        avatarColor={persona.avatar_color}
                        name={persona.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 truncate">{persona.name}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{persona.traits?.job_title ?? 'No role'}</p>
                      </div>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A9B76" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Minimum personas note */}
          {selectedIds.length > 0 && selectedIds.length < 5 && (
            <p className="text-xs text-amber-600 text-center">
              Select at least {5 - selectedIds.length} more persona{5 - selectedIds.length !== 1 ? 's' : ''} to run the panel
            </p>
          )}

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={loading || selectedIds.length < 5 || !question.trim()}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl text-white transition-all"
            style={{
              background: loading || selectedIds.length < 5 || !question.trim()
                ? '#E5E7EB'
                : 'linear-gradient(135deg, #1A8C6A 0%, #2BAE86 100%)',
              color: loading || selectedIds.length < 5 || !question.trim() ? '#9CA3AF' : 'white',
              cursor: loading || selectedIds.length < 5 || !question.trim() ? 'not-allowed' : 'pointer',
              border: 'none',
              fontFamily: 'inherit',
              boxShadow: loading || selectedIds.length < 5 || !question.trim() ? 'none' : '0 2px 8px rgba(26,140,106,0.3)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Running panel...
              </>
            ) : (
              <>
                <BarChart3 size={14} />
                Run Audience Panel
              </>
            )}
          </button>

          {loading && (
            <p className="text-xs text-neutral-400 text-center">
              Interviewing {selectedIds.length} personas simultaneously...
            </p>
          )}
        </div>

        {/* ── Results panel ── */}
        <div className="lg:col-span-2 space-y-5">

          {!result && !loading && (
            <div className="bg-white border border-dashed border-neutral-200 rounded-2xl p-12 text-center">
              <BarChart3 size={28} className="text-neutral-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neutral-900 mb-1">Results appear here</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Select 5-{maxPersonas} personas, type your question, and run the panel to see responses, themes, and sentiment visualized instantly.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <Loader2 size={28} className="text-neutral-300 mx-auto mb-3 animate-spin" />
              <h3 className="text-sm font-medium text-neutral-900 mb-1">Running panel</h3>
              <p className="text-xs text-neutral-400">Interviewing all {selectedIds.length} personas simultaneously...</p>
            </div>
          )}

          {result && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-neutral-200 rounded-2xl p-4 text-center"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <p className="text-2xl font-serif font-semibold text-neutral-900">{result.total_personas}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Personas</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-2xl p-4 text-center"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <p className="text-2xl font-serif font-semibold text-neutral-900">{result.themes.length}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Key themes</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-2xl p-4 text-center"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <p className="text-2xl font-serif font-semibold text-neutral-900">{result.consensus_score}%</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Consensus</p>
                </div>
              </div>

              {/* Question asked */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Question asked</p>
                <p className="text-sm text-neutral-800 leading-relaxed">"{result.question}"</p>
              </div>

              {/* Visualizations row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Sentiment distribution */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-5"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">Sentiment distribution</p>
                  <SentimentDonut distribution={result.sentiment_distribution} total={result.total_personas} />
                </div>

                {/* Theme frequency */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-5"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">Theme frequency</p>
                  <ThemeBarChart themes={result.themes} total={result.total_personas} />
                </div>
              </div>

              {/* Individual responses */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Individual responses</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.responses.map(r => (
                    <ResponseCard key={r.persona_id} result={r} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
