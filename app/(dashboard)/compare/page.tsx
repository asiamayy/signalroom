'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare, Loader2, Radar, Compass, CheckSquare, Square, ImagePlus, X } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { Modal } from '@/components/ui/Modal'
import { Dropdown } from '@/components/ui/Dropdown'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW, INTERVIEW_TYPE_LABELS, stripLeadingScore } from '@/lib/utils'
import type { Persona, InterviewType } from '@/types'

const INTERVIEW_TYPE_OPTIONS = Object.entries(INTERVIEW_TYPE_LABELS).map(([value, label]) => ({ value, label }))

interface CompareResult {
  persona_id: string
  persona_name: string
  avatar_initials: string
  avatar_color: any
  avatar_url: string | null
  job_title: string
  location: string
  response: string | null
  score: number | null
  error: string | null
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimaryContainer }}>
      {score}
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Confidence</span>
    </span>
  )
}

function CompareResponseModalBody({ result }: { result: CompareResult }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-5 pr-8">
        <PersonaAvatar avatarUrl={result.avatar_url} avatarInitials={result.avatar_initials} avatarColor={result.avatar_color} name={result.persona_name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-neutral-900 truncate">{result.persona_name}</p>
          <p className="text-sm text-neutral-500">{result.job_title}{result.location ? ` · ${result.location}` : ''}</p>
        </div>
        {result.score !== null && <ScoreBadge score={result.score} />}
      </div>
      {result.error ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{result.error}</p>
      ) : (
        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
          {result.score !== null && result.response ? stripLeadingScore(result.response) : result.response}
        </p>
      )}
    </>
  )
}

export default function ComparePage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [context, setContext] = useState('')
  const [interviewType, setInterviewType] = useState<InterviewType>('concept_testing')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CompareResult[]>([])
  const [error, setError] = useState('')
  const [loadingPersonas, setLoadingPersonas] = useState(true)
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

  useEffect(() => {
    fetch('/api/personas')
      .then(r => r.json())
      .then(json => setPersonas(json.data ?? []))
      .finally(() => setLoadingPersonas(false))
  }, [])

  const togglePersona = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : prev.length < 4 ? [...prev, id] : prev)
  }

  const selectedPersonas = useMemo(() => personas.filter(p => selectedIds.includes(p.id)), [personas, selectedIds])

  // Real, computed overlap — shared tags across every selected persona —
  // not an AI estimate. Only meaningful once 2+ personas are selected.
  const overlap = useMemo(() => {
    if (selectedPersonas.length < 2) return null
    const tagSets = selectedPersonas.map(p => new Set(p.tags ?? []))
    const shared = [...tagSets[0]].filter(tag => tagSets.every(set => set.has(tag)))
    const totalUnique = new Set(selectedPersonas.flatMap(p => p.tags ?? [])).size
    const pct = totalUnique > 0 ? Math.round((shared.length / totalUnique) * 100) : 0
    return { shared, pct }
  }, [selectedPersonas])

  const divergentNeeds = useMemo(() =>
    selectedPersonas.map(p => ({
      persona: p,
      need: p.traits?.frustrations?.[0] ?? p.traits?.goals?.[0] ?? null,
    })).filter(d => d.need),
    [selectedPersonas]
  )

  const handleCompare = async () => {
    if (selectedIds.length < 2) { setError('Select at least 2 personas'); return }
    if (!question.trim() && !imageData) { setError('Enter a question to ask'); return }
    setLoading(true)
    setError('')
    setResults([])
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_ids: selectedIds, question, context, interview_type: interviewType, image: imageData, imageMediaType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setResults(json.data)
    } catch (e: any) {
      setError(e.message ?? 'Failed to run comparison')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full">
      {/* Hero */}
      <section className="px-4 sm:px-10 pt-10 sm:pt-16 pb-10 sm:pb-12">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Intelligence Stream</span>
          </div>
          <h1 className="mb-6 leading-tight" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onSurface }}>
            Persona <span className="italic" style={{ fontWeight: 400 }}>Synthesis</span>
          </h1>
          <p className="text-sm sm:text-base leading-relaxed max-w-2xl" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Ask the same question to 2–4 personas and see how their real answers diverge. Select personas from the panel, then run the synthesis.
          </p>
        </div>
      </section>

      {/* Content grid */}
      <div className="px-4 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 pb-20">
        {/* Left column — setup + results */}
        <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
          <div className="rounded-xl p-6 sm:p-8" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Interview type</label>
                <Dropdown value={interviewType} onChange={v => setInterviewType(v as InterviewType)} options={INTERVIEW_TYPE_OPTIONS} className="w-full" />
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Context <span className="normal-case font-normal">(optional)</span></label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={2}
                placeholder="Briefly describe what you're testing..."
                className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none"
                style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Question</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                rows={3}
                placeholder={imagePreview ? 'Ask all personas about this image...' : 'What question do you want to ask all personas?'}
                className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none"
                style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
              />
              <div className="flex items-center gap-3 mt-3">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Upload preview" className="h-16 w-auto rounded-lg object-cover" style={{ border: `1px solid ${HOME_COLORS.outlineVariant}66` }} />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center"
                      style={{ background: HOME_COLORS.primary }}
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
                      style={{ border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurfaceVariant }}
                      title="Attach an image for all personas to react to"
                    >
                      <ImagePlus size={13} />
                      Attach image
                    </button>
                  </>
                )}
              </div>
            </div>
            {error && <p className="text-sm rounded-lg px-3 py-2 mb-4" style={{ color: HOME_COLORS.error, background: '#FFDAD6' }}>{error}</p>}
            <button
              onClick={handleCompare}
              disabled={loading || selectedIds.length < 2 || (!question.trim() && !imageData)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all disabled:cursor-not-allowed"
              style={{ background: (!loading && selectedIds.length >= 2 && (question.trim() || imageData)) ? HOME_COLORS.primary : HOME_COLORS.surfaceContainerHigh, color: (!loading && selectedIds.length >= 2 && (question.trim() || imageData)) ? HOME_COLORS.onPrimary : HOME_COLORS.onSurfaceVariant }}
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Running synthesis...</> : <><GitCompare size={14} /> Generate comparison</>}
            </button>
          </div>

          {/* Results — one editorial "vector" card per persona response */}
          {results.length > 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${HOME_COLORS.outlineVariant}66` }}>
                <h2 className="text-base font-semibold" style={{ color: HOME_COLORS.onSurface }}>Synthesis Results</h2>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>&ldquo;{question || 'Reaction to shared image'}&rdquo;</span>
              </div>
              {results.map((result, i) => (
                <motion.article
                  key={result.persona_id}
                  layoutId={`compare-response-${result.persona_id}`}
                  onClick={() => setOpenResponseId(result.persona_id)}
                  className="rounded-xl p-6 sm:p-8 cursor-pointer transition-all hover:shadow-xl"
                  style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
                        Response {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-2">
                        <PersonaAvatar avatarUrl={result.avatar_url} avatarInitials={result.avatar_initials} avatarColor={result.avatar_color} name={result.persona_name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold leading-tight" style={{ color: HOME_COLORS.onSurface }}>{result.persona_name}</p>
                          <p className="text-[10px] uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>{result.job_title}</p>
                        </div>
                      </div>
                    </div>
                    {result.score !== null && <ScoreBadge score={result.score} />}
                  </div>
                  {result.error ? (
                    <p className="text-sm rounded-lg p-3" style={{ color: HOME_COLORS.error, background: '#FFDAD6' }}>{result.error}</p>
                  ) : (
                    <p className="leading-relaxed" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, fontSize: '19px', color: HOME_COLORS.onSurface }}>
                      &ldquo;{result.score !== null && result.response ? stripLeadingScore(result.response) : result.response}&rdquo;
                    </p>
                  )}
                </motion.article>
              ))}
            </div>
          )}
        </div>

        {/* Right column — sidebar */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Persona selection */}
            <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerHigh, boxShadow: CARD_SHADOW }}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Persona Selection</h4>
                <span className="text-xs font-bold" style={{ color: HOME_COLORS.primary }}>{selectedIds.length} / 4 selected</span>
              </div>
              {loadingPersonas ? (
                <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Loading...</p>
              ) : personas.length === 0 ? (
                <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>No personas yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {personas.map(persona => {
                    const selected = selectedIds.includes(persona.id)
                    const disabled = !selected && selectedIds.length >= 4
                    return (
                      <button
                        key={persona.id}
                        onClick={() => !disabled && togglePersona(persona.id)}
                        disabled={disabled}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: HOME_COLORS.surfaceContainerLowest, border: selected ? `2px solid ${HOME_COLORS.primary}` : '2px solid transparent', boxShadow: selected ? CARD_SHADOW : undefined }}
                      >
                        <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: HOME_COLORS.onSurface }}>{persona.name}</p>
                          <p className="text-[10px] uppercase" style={{ color: selected ? HOME_COLORS.primary : HOME_COLORS.onSurfaceVariant }}>{selected ? 'Selected' : (persona.traits?.job_title ?? 'Available')}</p>
                        </div>
                        {selected ? <CheckSquare size={20} style={{ color: HOME_COLORS.primary }} /> : <Square size={20} style={{ color: `${HOME_COLORS.onSurfaceVariant}66` }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Overlap analysis — real, from shared persona tags */}
            <section className="p-6 sm:p-8 rounded-xl" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Overlap Analysis</h4>
                  <p className="text-[11px] opacity-70">Shared tags across selection</p>
                </div>
                <Radar size={18} style={{ color: HOME_COLORS.onPrimaryContainer }} />
              </div>
              {overlap ? (
                <>
                  <div className="flex flex-col items-center py-2">
                    <GaugeRing percent={overlap.pct} />
                  </div>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-sm opacity-80 leading-relaxed">
                      {overlap.shared.length > 0
                        ? `Shared tags: ${overlap.shared.join(', ')}.`
                        : 'No shared tags between the selected personas — their profiles diverge structurally.'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm opacity-70">Select at least 2 personas to see overlap.</p>
              )}
            </section>

            {/* Divergent needs — real, from each persona's own traits */}
            <section className="p-6 sm:p-8 rounded-xl" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
              <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
                <Compass size={16} style={{ color: HOME_COLORS.primaryFixedDim }} />
                Divergent Needs
              </h4>
              {divergentNeeds.length === 0 ? (
                <p className="text-sm opacity-70">Select personas to see what sets them apart.</p>
              ) : (
                <div className="space-y-5">
                  {divergentNeeds.map(({ persona, need }) => (
                    <div key={persona.id} className="relative pl-5" style={{ borderLeft: `2px solid rgba(255,255,255,0.25)` }}>
                      <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full" style={{ background: HOME_COLORS.primaryFixedDim }} />
                      <span className="text-xs font-bold block mb-1" style={{ color: HOME_COLORS.primaryFixedDim }}>{persona.name}</span>
                      <p className="text-sm opacity-80 leading-relaxed">{need}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {openResponseId && (() => {
          const response = results.find(r => r.persona_id === openResponseId)
          if (!response) return null
          return (
            <Modal key="compare-modal" onClose={() => setOpenResponseId(null)} maxWidth={540} layoutId={`compare-response-${openResponseId}`}>
              <CompareResponseModalBody result={response} />
            </Modal>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

function GaugeRing({ percent }: { percent: number }) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={HOME_COLORS.primaryFixedDim} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, fontSize: '32px' }}>{percent}%</span>
        <span className="text-[10px] uppercase opacity-70">Shared tags</span>
      </div>
    </div>
  )
}
