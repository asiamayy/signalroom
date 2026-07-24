'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Loader2, Lock, Sparkles, Trophy, CheckSquare, Square, ImagePlus, X, Plus, Trash2, ChevronDown } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import type { Persona, Plan, ConceptTestResult } from '@/types'

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

  const updateConcept = (i: number, patch: Partial<ConceptDraft>) => {
    setConcepts(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c))
  }
  const addConcept = () => setConcepts(prev => prev.length < MAX_CONCEPTS ? [...prev, emptyConcept()] : prev)
  const removeConcept = (i: number) => setConcepts(prev => prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev)

  const handleImage = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      const res = ev.target?.result as string
      updateConcept(i, { imagePreview: res, imageData: res.split(',')[1], imageMediaType: file.type || 'image/jpeg' })
    }
    reader.readAsDataURL(file)
  }

  const filledConcepts = concepts.filter(c => c.description.trim() || c.imageData)
  const canRun = !loading && selectedIds.length >= MIN_PERSONAS && filledConcepts.length >= 2

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
      <section className="relative px-4 sm:px-10 pt-10 sm:pt-14 pb-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Concept Testing</span>
          </div>
          <h1 className="mb-4 leading-tight" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onSurface }}>
            Put your concepts <span className="italic" style={{ fontWeight: 400 }}>head to head</span>.
          </h1>
          <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            The same panel reacts to every concept, so you get an apples-to-apples comparison — each concept scored, ranked, and explained, with a clear winner.
          </p>
        </div>
      </section>

      <div className="px-4 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        {/* Sidebar — persona selection */}
        <aside className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
          <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Judging Panel</h3>
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

          <button
            onClick={handleRun}
            disabled={!canRun}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all disabled:cursor-not-allowed"
            style={{ background: canRun ? HOME_COLORS.primary : HOME_COLORS.surfaceContainerHigh, color: canRun ? HOME_COLORS.onPrimary : HOME_COLORS.onSurfaceVariant }}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Testing concepts…</> : <><Layers size={15} /> Run concept test</>}
          </button>
          {error && <p className="text-sm rounded-lg px-3 py-2" style={{ color: HOME_COLORS.error, background: '#FFDAD6' }}>{error}</p>}
        </aside>

        {/* Main — concept builder + results */}
        <main className="lg:col-span-8 flex flex-col gap-8 order-1 lg:order-2 min-w-0">
          {/* Concept builder */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Concepts to compare ({concepts.length})</h3>
              {concepts.length < MAX_CONCEPTS && (
                <button onClick={addConcept} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors" style={{ border: `1px solid ${HOME_COLORS.outlineVariant}`, color: HOME_COLORS.onSurface }}>
                  <Plus size={13} /> Add concept
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {concepts.map((c, i) => (
                <div key={i} className="rounded-xl p-4 flex flex-col gap-3" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}>{String.fromCharCode(65 + i)}</span>
                    <input
                      value={c.label}
                      onChange={e => updateConcept(i, { label: e.target.value })}
                      placeholder={`Concept ${i + 1} name`}
                      maxLength={120}
                      className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none"
                      style={{ color: HOME_COLORS.onSurface }}
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
                    className="w-full rounded-lg p-3 text-sm outline-none resize-none"
                    style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
                  />
                  {c.imagePreview ? (
                    <div className="relative w-fit">
                      <img src={c.imagePreview} alt="Concept preview" className="h-16 w-auto rounded-lg object-cover" style={{ border: `1px solid ${HOME_COLORS.outlineVariant}` }} />
                      <button type="button" onClick={() => updateConcept(i, { imageData: null, imagePreview: null })} className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg cursor-pointer w-fit transition-colors" style={{ border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurfaceVariant }}>
                      <ImagePlus size={13} /> Attach image
                      <input type="file" accept="image/*" onChange={e => handleImage(i, e)} className="hidden" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Results */}
          {result && (
            <section className="flex flex-col gap-5">
              {result.overall_recommendation && (
                <div className="rounded-xl p-6" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
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
                    className="rounded-xl p-5 sm:p-6"
                    style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW, border: isWinner ? `2px solid ${HOME_COLORS.primary}` : '2px solid transparent' }}
                  >
                    <div className="flex items-start gap-4">
                      {c.avg_score !== null && <ScoreRing score={c.avg_score} size={52} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[11px] font-bold" style={{ color: HOME_COLORS.onSurfaceVariant }}>#{c.rank}</span>
                          <h3 className="text-base font-semibold" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>{c.label}</h3>
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
                          <div className="rounded-lg p-3" style={{ background: HOME_COLORS.secondaryContainer }}>
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: HOME_COLORS.primary }}>Strength</p>
                            <p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{c.strength}</p>
                          </div>
                        )}
                        {c.weakness && (
                          <div className="rounded-lg p-3" style={{ background: '#FFDAD6' }}>
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: HOME_COLORS.error }}>Weakness</p>
                            <p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{c.weakness}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {c.reactions.length > 0 && (
                      <>
                        <button
                          onClick={() => setExpandedId(isOpen ? null : c.id)}
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
                                  <div key={r.persona_id} className="rounded-lg p-3 flex flex-col gap-2" style={{ background: HOME_COLORS.surfaceContainerLow }}>
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
          )}
        </main>
      </div>
    </div>
  )
}
