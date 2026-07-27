'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Loader2, Lock, Sparkles, Trophy, CheckSquare, Square, Paperclip, X, Plus, Trash2, ChevronDown, History, Rocket, ShieldCheck, CheckCircle2, Circle } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW, formatRelativeTime } from '@/lib/utils'
import { compressImageFile } from '@/lib/utils/image'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import type { Persona, Plan, ConceptTestResult, ConceptTestRun, Workspace } from '@/types'

interface ConceptDraft {
  label: string
  description: string
  imageData: string | null
  imagePreview: string | null
  imageMediaType: string
}

const emptyConcept = (): ConceptDraft => ({ label: '', description: '', imageData: null, imagePreview: null, imageMediaType: 'image/jpeg' })
const MIN_PERSONAS = 3
const MAX_CONCEPTS = 4

// Extracted so the exact same rendering drives both a freshly-generated
// result and a historical run's stored result — no second, dumbed-down
// history view to build or keep in sync.
function ConceptTestResultsView({ result, expandedId, onToggleExpand }: { result: ConceptTestResult; expandedId: string | null; onToggleExpand: (id: string) => void }) {
  return (
    <section className="mt-4 flex flex-col gap-5 border-t pt-8" style={{ borderColor: `${HOME_COLORS.outlineVariant}66` }}>
      <div className="flex items-center gap-3"><span className="h-px w-10" style={{ background: HOME_COLORS.primary }} /><span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Test Results</span></div>
      {result.overall_recommendation && (
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimary }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} style={{ color: HOME_COLORS.primaryFixedDim }} />
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">Recommendation</span>
          </div>
          <p className="text-sm leading-relaxed">{result.overall_recommendation}</p>
          <p className="text-[11px] mt-3 opacity-60">{result.total_personas} personas · {result.completed_in_seconds}s</p>
        </div>
      )}

      {result.concepts.map(c => {
        const isWinner = c.id === result.winner_id
        const isOpen = expandedId === c.id
        return (
          <motion.article
            key={c.id}
            layout
            className="rounded-2xl p-5 sm:p-6"
            style={{ background: isWinner ? HOME_COLORS.surfaceContainerLowest : HOME_COLORS.surfaceContainerLow, border: isWinner ? `1.5px solid ${HOME_COLORS.primary}` : `1px solid ${HOME_COLORS.outlineVariant}66` }}
          >
            <div className="flex items-start gap-4">
              {c.avg_score !== null && <ScoreRing score={c.avg_score} size={52} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-bold" style={{ color: HOME_COLORS.onSurfaceVariant }}>#{c.rank}</span>
                  <h3 className="text-xl font-semibold" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>{c.label}</h3>
                  {isWinner && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
                      <Trophy size={10} /> Winner
                    </span>
                  )}
                </div>
                {c.verdict && <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{c.verdict}</p>}
              </div>
            </div>

            {(c.strength || c.weakness) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {c.strength && (
                  <div className="rounded-xl p-4" style={{ background: HOME_COLORS.primaryFixed }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: HOME_COLORS.primary }}>Strength</p>
                    <p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{c.strength}</p>
                  </div>
                )}
                {c.weakness && (
                  <div className="rounded-xl p-4" style={{ background: HOME_COLORS.surfaceContainer }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Consideration</p>
                    <p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{c.weakness}</p>
                  </div>
                )}
              </div>
            )}

            {c.reactions.length > 0 && (
              <>
                <button
                  onClick={() => onToggleExpand(c.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold mt-4 transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: HOME_COLORS.primary }}
                >
                  <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  {isOpen ? 'Hide' : 'Show'} {c.reactions.length} panelist reaction{c.reactions.length === 1 ? '' : 's'}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {c.reactions.map(r => (
                          <div key={r.persona_id} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: HOME_COLORS.surfaceContainer }}>
                            <div className="flex items-center gap-2">
                              <PersonaAvatar avatarUrl={r.avatar_url} avatarInitials={r.avatar_initials} avatarColor={r.avatar_color} name={r.persona_name} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: HOME_COLORS.onSurface }}>{r.persona_name}</p>
                                {r.job_title && <p className="text-[10px] uppercase truncate" style={{ color: HOME_COLORS.onSurfaceVariant }}>{r.job_title}</p>}
                              </div>
                              {r.score !== null && <ScoreRing score={r.score} size={34} />}
                            </div>
                            <p className="text-xs leading-relaxed italic" style={{ color: HOME_COLORS.onSurface }}>&ldquo;{r.reaction}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.article>
        )
      })}
    </section>
  )
}

export default function ConceptTestPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [concepts, setConcepts] = useState<ConceptDraft[]>([emptyConcept(), emptyConcept()])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConceptTestResult | null>(null)
  const [error, setError] = useState('')
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [plan, setPlan] = useState<Plan>('free')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Project/workspace — both optional, same as Compare/Audience Panel:
  // picking a project is what turns a run into persisted history with
  // signal extraction.
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [projectId, setProjectId] = useState('')
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = useState('personal')

  const [viewMode, setViewMode] = useState<'new' | 'history'>('new')
  const [historyRuns, setHistoryRuns] = useState<ConceptTestRun[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedRun, setSelectedRun] = useState<ConceptTestRun | null>(null)

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
    fetch('/api/projects')
      .then(r => r.json())
      .then(json => setProjects((json.data ?? []).filter((p: any) => !p.archived)))
      .catch(() => {})
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(json => setWorkspaces(json.data ?? []))
      .catch(() => {})
  }, [])

  const loadHistory = () => {
    setLoadingHistory(true)
    fetch('/api/concept-test')
      .then(r => r.json())
      .then(json => setHistoryRuns(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }

  useEffect(() => {
    if (viewMode === 'history') loadHistory()
  }, [viewMode])

  const togglePersona = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.length < maxPersonas ? [...prev, id] : prev)
  }

  const updateConcept = (i: number, patch: Partial<ConceptDraft>) => {
    setConcepts(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c))
  }
  const addConcept = () => setConcepts(prev => prev.length < MAX_CONCEPTS ? [...prev, emptyConcept()] : prev)
  const removeConcept = (i: number) => setConcepts(prev => prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev)

  const handleImage = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    try {
      const { dataUrl, base64, mediaType } = await compressImageFile(file)
      updateConcept(i, { imagePreview: dataUrl, imageData: base64, imageMediaType: mediaType })
    } catch {
      setError('Could not process that image — try a different file')
    }
  }

  const filledConcepts = concepts.filter(c => c.description.trim() || c.imageData)
  const canRun = !loading && selectedIds.length >= MIN_PERSONAS && filledConcepts.length >= 2
  const setupReadiness = Math.min(100, 15 + (selectedIds.length > 0 ? 35 : 0) + (filledConcepts.length >= 2 ? 50 : 0))

  const handleRun = async () => {
    if (selectedIds.length < MIN_PERSONAS) { setError(`Select at least ${MIN_PERSONAS} personas`); return }
    if (filledConcepts.length < 2) { setError('Add at least 2 concepts (each needs a description or image)'); return }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/concept-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_ids: selectedIds,
          concepts: concepts.map((c, i) => ({
            label: c.label.trim() || `Concept ${i + 1}`,
            description: c.description,
            image: c.imageData,
            imageMediaType: c.imageMediaType,
          })),
          project_id: projectId || null,
          workspace_id: workspaceId === 'personal' ? null : workspaceId,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong'); return }
      setResult(json.data)
      setExpandedId(null)
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
            <Layers size={22} style={{ color: HOME_COLORS.onSurfaceVariant }} />
            Concept Test
          </h1>
          <p className="text-sm mt-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Compare multiple concepts side by side across a panel of personas.</p>
        </div>
        <div className="rounded-2xl p-10 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: HOME_COLORS.surfaceContainerHigh }}>
            <Lock size={22} style={{ color: HOME_COLORS.onSurfaceVariant }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: HOME_COLORS.onSurface }}>Signal or Broadcast plan required</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Put 2–4 concepts in front of the same panel and get them scored, ranked, and reacted to side by side — with a clear recommended winner.
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
      <section className="relative px-4 py-8 sm:px-10 sm:py-9" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimary }}>
        <div className="max-w-6xl flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-px opacity-50" style={{ background: HOME_COLORS.primaryFixed }} />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primaryFixed }}>Concept Testing</span>
            </div>
            <h1 className="mb-6 leading-tight" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onPrimary }}>
              Put your concepts <span className="italic" style={{ color: HOME_COLORS.primaryFixed, fontWeight: 400 }}>head to head</span>.
            </h1>
            <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: HOME_COLORS.onPrimaryContainer }}>
              The same panel reacts to every concept, so you get an apples-to-apples comparison — each concept scored, ranked, and explained, with a clear winner.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setViewMode('new')}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors"
              style={viewMode === 'new' ? { background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed, border: 'none', cursor: 'pointer' } : { color: HOME_COLORS.onPrimaryContainer, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Sparkles size={13} /> New
            </button>
            <button
              onClick={() => setViewMode('history')}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors"
              style={viewMode === 'history' ? { background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed, border: 'none', cursor: 'pointer' } : { color: HOME_COLORS.onPrimaryContainer, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <History size={13} /> History
            </button>
          </div>
        </div>
      </section>

      {viewMode === 'history' ? (
        <div className="px-4 sm:px-10 pb-20 max-w-3xl">
          {loadingHistory ? (
            <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Loading...</p>
          ) : historyRuns.length === 0 ? (
            <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>No saved concept tests yet — run one with a project selected to see it here.</p>
          ) : selectedRun ? (
            <div className="flex flex-col gap-5">
              <button onClick={() => setSelectedRun(null)} className="text-xs font-semibold self-start" style={{ color: HOME_COLORS.primary, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to history</button>
              <ConceptTestResultsView result={selectedRun.result} expandedId={expandedId} onToggleExpand={id => setExpandedId(expandedId === id ? null : id)} />
            </div>
          ) : (
            <div className="space-y-2">
              {historyRuns.map(run => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className="w-full text-left p-4 rounded-xl transition-colors hover:shadow-md"
                  style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW, border: 'none', cursor: 'pointer' }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: HOME_COLORS.onSurface }}>{run.concepts.map(c => c.label).join(' vs ')}</p>
                  <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatRelativeTime(run.created_at)} · {run.persona_ids.length} personas</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="px-4 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 pt-6">
        {/* Sidebar — persona selection */}
        <aside className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
          <section className="p-6 rounded-xl border" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: '0 2px 8px rgba(15,23,42,0.05)', borderColor: `${HOME_COLORS.outlineVariant}4d` }}>
            <div className="flex items-center justify-between mb-5">
              <div><h3 className="text-lg font-semibold" style={{ color: HOME_COLORS.onSurface }}>Judging Panel</h3></div>
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
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {personas.map(persona => {
                  const isSelected = selectedIds.includes(persona.id)
                  const atLimit = selectedIds.length >= maxPersonas && !isSelected
                  return (
                    <button
                      key={persona.id}
                      onClick={() => !atLimit && togglePersona(persona.id)}
                      disabled={atLimit}
                      className="group w-full flex items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-all hover:border-[#c3c8c1]/20 hover:bg-[#eae7e7] disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: isSelected ? HOME_COLORS.secondaryContainer : 'transparent' }}
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                        <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="lg" className="transition-transform duration-500 group-hover:scale-[1.6]" />
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

          {/* Project / workspace — optional, saves this run as history + signals */}
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

        {/* Main — concept builder + results */}
        <main className="lg:col-span-6 flex flex-col gap-6 order-1 lg:order-2 min-w-0">
          {/* Concept builder */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><h3 className="text-2xl" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>Concepts to compare</h3><span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: HOME_COLORS.surfaceContainer, color: HOME_COLORS.onSurfaceVariant }}>{concepts.length}</span></div>
              {concepts.length < MAX_CONCEPTS && (
                <button onClick={addConcept} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-wide transition-colors hover:bg-[#e4e2e1]" style={{ background: HOME_COLORS.surfaceContainerHigh, color: HOME_COLORS.onSurface, border: 'none' }}>
                  <Plus size={16} /> Add Concept
                </button>
              )}
            </div>
            <div className="flex flex-col gap-6">
              {concepts.map((c, i) => (
                <div key={i} className="group relative rounded-2xl p-6 sm:p-8 flex flex-col gap-5 border transition-all duration-500 hover:shadow-xl" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}66`, boxShadow: CARD_SHADOW }}>
                  <span className="absolute -left-3 top-8 px-3 py-1 rounded-sm text-xs font-semibold" style={{ background: i === 0 ? HOME_COLORS.primary : HOME_COLORS.secondary, color: HOME_COLORS.onPrimary }}>{String.fromCharCode(65 + i)}</span>
                  <div className="flex items-center gap-2">
                    <input
                      value={c.label}
                      onChange={e => updateConcept(i, { label: e.target.value })}
                      placeholder={`Concept Name (e.g. '${i === 0 ? 'Efficiency Play' : 'Customer Delight'}')`}
                      maxLength={120}
                      className="flex-1 min-w-0 text-2xl bg-transparent outline-none placeholder:text-[#434843]/30"
                      style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}
                    />
                    {concepts.length > 2 && (
                      <button onClick={() => removeConcept(i)} aria-label="Remove concept" className="flex-shrink-0" style={{ background: 'none', border: 'none', cursor: 'pointer', color: HOME_COLORS.onSurfaceVariant }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={c.description}
                    onChange={e => updateConcept(i, { description: e.target.value })}
                    rows={4}
                    placeholder="Describe this concept — the headline, claim, pitch, or what the ad says…"
                    className="w-full rounded-xl p-5 text-sm outline-none resize-none transition-colors focus:bg-white"
                    style={{ background: 'rgba(255,255,255,0.5)', border: 'none', color: HOME_COLORS.onSurface }}
                  />
                  {c.imagePreview ? (
                    <div className="relative w-fit">
                      <img src={c.imagePreview} alt="Concept preview" className="h-16 w-auto rounded-lg object-cover" style={{ border: `1px solid ${HOME_COLORS.outlineVariant}` }} />
                      <button type="button" onClick={() => updateConcept(i, { imageData: null, imagePreview: null })} className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 text-[10px] font-semibold uppercase px-4 py-2 rounded-full cursor-pointer w-fit transition-colors" style={{ background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed }}>
                      <Paperclip size={15} /> Attach Image
                      <input type="file" accept="image/*" onChange={e => handleImage(i, e)} className="hidden" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </section>

          <button onClick={handleRun} disabled={!canRun} className="self-center flex items-center gap-3 px-10 py-5 rounded-full text-base font-semibold shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60" style={{ background: canRun ? HOME_COLORS.primary : HOME_COLORS.surfaceContainerHigh, color: canRun ? HOME_COLORS.onPrimary : HOME_COLORS.onSurfaceVariant }}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Running simulation...</> : <>Run Concept Test <Rocket size={18} /></>}
          </button>
          {error && <p className="text-sm rounded-lg px-3 py-2" style={{ color: HOME_COLORS.error, background: '#FFDAD6' }}>{error}</p>}
          {/* Results */}
          {result && <ConceptTestResultsView result={result} expandedId={expandedId} onToggleExpand={id => setExpandedId(expandedId === id ? null : id)} />}
        </main>
        <aside className="lg:col-span-3 flex flex-col gap-6 order-3">
          <section className="rounded-xl p-6 border" style={{ background: `${HOME_COLORS.surfaceContainerHigh}66`, borderColor: `${HOME_COLORS.outlineVariant}33` }}>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: HOME_COLORS.onSurface }}><ShieldCheck size={16} style={{ color: HOME_COLORS.primary }} /> Testing Protocols</h3>
            <div className="space-y-6">{[['01', 'Cognitive Bias Shield', 'Concepts are presented in randomized order to prevent sequence bias.'], ['02', 'Forced Choice Matrix', 'Personas must justify qualitative delta between both concepts.'], ['03', 'Evidence-Backed Comparison', 'Every recommendation is grounded in panel scores and individual written reactions.']].map(([number, title, copy]) => <div key={number} className="flex gap-4"><span className="text-lg" style={{ color: HOME_COLORS.primaryFixedDim, fontFamily: HOME_FONT_DISPLAY }}>{number}</span><div><p className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{title}</p><p className="mt-1 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{copy}</p></div></div>)}</div>
          </section>
          <section className="rounded-xl p-6 border shadow-sm" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}4d` }}>
            <div className="mb-4"><h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurface }}>Live Progress</h3></div>
            <div className="space-y-4"><div className="flex justify-between text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}><span>Setup Readiness</span><span>{setupReadiness}%</span></div><div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: HOME_COLORS.surfaceContainer }}><div className="h-full transition-all duration-700" style={{ width: `${setupReadiness}%`, background: HOME_COLORS.primary }} /></div><ul className="text-xs space-y-2 pt-2" style={{ color: HOME_COLORS.onSurfaceVariant }}><li className="flex items-center gap-2" style={{ color: HOME_COLORS.primary }}><CheckCircle2 size={14} /> Session Initialized</li><li className="flex items-center gap-2" style={{ opacity: selectedIds.length ? 1 : 0.5, color: selectedIds.length ? HOME_COLORS.primary : undefined }}>{selectedIds.length ? <CheckCircle2 size={14} /> : <Circle size={14} />} Select {MIN_PERSONAS}+ Personas</li><li className="flex items-center gap-2" style={{ opacity: filledConcepts.length >= 2 ? 1 : 0.5, color: filledConcepts.length >= 2 ? HOME_COLORS.primary : undefined }}>{filledConcepts.length >= 2 ? <CheckCircle2 size={14} /> : <Circle size={14} />} Add two concept descriptions</li></ul></div>
          </section>
        </aside>
      </div>
      )}
    </div>
  )
}
