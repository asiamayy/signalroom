'use client'

import { useState, useEffect } from 'react'
import { GitCompare, Loader2, Plus, X, ChevronDown } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { Modal } from '@/components/ui/Modal'
import { cn, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import type { Persona, InterviewType } from '@/types'

const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: 'concept_testing', label: 'Concept testing' },
  { value: 'pricing_discovery', label: 'Pricing discovery' },
  { value: 'message_testing', label: 'Message testing' },
  { value: 'competitive_positioning', label: 'Competitive positioning' },
  { value: 'feature_prioritization', label: 'Feature prioritization' },
  { value: 'custom', label: 'Custom' },
]

interface CompareResult {
  persona_id: string
  persona_name: string
  avatar_initials: string
  avatar_color: any
  avatar_url: string | null
  job_title: string
  location: string
  response: string | null
  error: string | null
}

export default function ComparePage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [context, setContext] = useState('')
  const [interviewType, setInterviewType] = useState<InterviewType>('concept_testing')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CompareResult[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [openResponseId, setOpenResponseId] = useState<string | null>(null)

  // Load personas
  useEffect(() => {
    fetch('/api/personas')
      .then(r => r.json())
      .then(json => setPersonas(json.data ?? []))
      .finally(() => setLoadingPersonas(false))
  }, [])

  const togglePersona = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev
    )
  }

  const handleCompare = async () => {
    if (selectedIds.length < 2) { setError('Select at least 2 personas'); return }
    if (!question.trim()) { setError('Enter a question to ask'); return }

    setLoading(true)
    setError('')
    setResults([])
    setActiveTab(null)

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_ids: selectedIds,
          question,
          context,
          interview_type: interviewType,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setResults(json.data)
      setActiveTab(json.data[0]?.persona_id ?? null)
    } catch (e: any) {
      setError(e.message ?? 'Failed to run comparison')
    } finally {
      setLoading(false)
    }
  }

  const activeResult = results.find(r => r.persona_id === activeTab)

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-serif tracking-tight text-neutral-900">Compare</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Ask the same question to multiple personas and compare responses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Setup ── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Persona selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select personas <span className="text-neutral-400 font-normal">(2–4)</span>
            </label>

            {loadingPersonas && <p className="text-sm text-neutral-400">Loading...</p>}

            {!loadingPersonas && personas.length === 0 && (
              <p className="text-sm text-neutral-400">No personas yet. Create some first.</p>
            )}

            {!loadingPersonas && personas.length > 0 && (
              <div className="space-y-1.5">
                {personas.map(persona => {
                  const selected = selectedIds.includes(persona.id)
                  const disabled = !selected && selectedIds.length >= 4
                  return (
                    <button
                      key={persona.id}
                      onClick={() => !disabled && togglePersona(persona.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all',
                        selected
                          ? 'border-neutral-900 bg-neutral-900'
                          : disabled
                            ? 'border-neutral-100 bg-neutral-50 opacity-40 cursor-not-allowed'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                      )}
                    >
                      <PersonaAvatar
                        avatarUrl={persona.avatar_url}
                        avatarInitials={persona.avatar_initials}
                        avatarColor={selected ? null : persona.avatar_color}
                        name={persona.name}
                        size="xs"
                        className={selected ? 'ring-1 ring-white/20' : ''}
                      />
                      <div className="min-w-0">
                        <p className={cn('text-xs font-medium truncate', selected ? 'text-white' : 'text-neutral-900')}>
                          {persona.name}
                        </p>
                        <p className={cn('text-[11px] truncate', selected ? 'text-neutral-400' : 'text-neutral-500')}>
                          {persona.traits?.job_title ?? 'No role'}
                        </p>
                      </div>
                      {selected && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-white font-medium">
                            {selectedIds.indexOf(persona.id) + 1}
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Interview type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Interview type</label>
            <select
              value={interviewType}
              onChange={e => setInterviewType(e.target.value as InterviewType)}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              {INTERVIEW_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Context <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={3}
              placeholder="Briefly describe what you're testing..."
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Question</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={4}
              placeholder="What question do you want to ask all personas?"
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleCompare}
            disabled={loading || selectedIds.length < 2 || !question.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
              !loading && selectedIds.length >= 2 && question.trim()
                ? 'bg-neutral-900 text-white hover:bg-neutral-700'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            )}
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Running comparison...</>
              : <><GitCompare size={14} /> Compare {selectedIds.length > 0 ? `${selectedIds.length} personas` : 'personas'}</>
            }
          </button>
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-2 min-w-0">
          {results.length === 0 && !loading && (
            <div className="h-full flex items-center justify-center border border-dashed border-neutral-200 rounded-xl">
              <div className="text-center p-12">
                <GitCompare size={24} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-500 mb-1">No results yet</p>
                <p className="text-xs text-neutral-400">Select personas and ask a question to compare responses</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full flex items-center justify-center border border-dashed border-neutral-200 rounded-xl">
              <div className="text-center p-12">
                <Loader2 size={24} className="text-neutral-300 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-neutral-500">Asking {selectedIds.length} personas...</p>
                <p className="text-xs text-neutral-400 mt-1">This takes about {selectedIds.length * 3} seconds</p>
              </div>
            </div>
          )}

          {results.length > 0 && !loading && (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden h-full flex flex-col">
              {/* Question recap */}
              <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50">
                <p className="text-xs text-neutral-500 font-medium mb-0.5">Question asked</p>
                <p className="text-sm text-neutral-800">{question}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-neutral-100 overflow-x-auto">
                {results.map(result => (
                  <button
                    key={result.persona_id}
                    onClick={() => setActiveTab(result.persona_id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors flex-shrink-0',
                      activeTab === result.persona_id
                        ? 'border-neutral-900 text-neutral-900 font-medium'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    )}
                  >
                    <PersonaAvatar
                      avatarUrl={result.avatar_url}
                      avatarInitials={result.avatar_initials}
                      avatarColor={result.avatar_color}
                      name={result.persona_name}
                      size="xs"
                    />
                    {result.persona_name}
                  </button>
                ))}
              </div>

              {/* Active response */}
              {activeResult && (
                <div className="flex-1 p-5">
                  <div
                    onClick={() => setOpenResponseId(activeResult.persona_id)}
                    className="-m-2 p-2 rounded-xl cursor-pointer transition-colors hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <PersonaAvatar
                        avatarUrl={activeResult.avatar_url}
                        avatarInitials={activeResult.avatar_initials}
                        avatarColor={activeResult.avatar_color}
                        name={activeResult.persona_name}
                        size="md"
                      />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{activeResult.persona_name}</p>
                        <p className="text-xs text-neutral-500">
                          {activeResult.job_title}{activeResult.location ? ` · ${activeResult.location}` : ''}
                        </p>
                      </div>
                    </div>

                    {activeResult.error ? (
                      <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{activeResult.error}</p>
                    ) : (
                      <div className="bg-neutral-50 rounded-xl px-5 py-4">
                        <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                          {activeResult.response}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Nav between tabs */}
                  <div className="flex justify-between mt-4 pt-4 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        const idx = results.findIndex(r => r.persona_id === activeTab)
                        if (idx > 0) setActiveTab(results[idx - 1].persona_id)
                      }}
                      disabled={results.findIndex(r => r.persona_id === activeTab) === 0}
                      className="text-xs text-neutral-500 hover:text-neutral-900 disabled:opacity-30 transition-colors"
                    >
                      ← Previous
                    </button>
                    <span className="text-xs text-neutral-400">
                      {results.findIndex(r => r.persona_id === activeTab) + 1} of {results.length}
                    </span>
                    <button
                      onClick={() => {
                        const idx = results.findIndex(r => r.persona_id === activeTab)
                        if (idx < results.length - 1) setActiveTab(results[idx + 1].persona_id)
                      }}
                      disabled={results.findIndex(r => r.persona_id === activeTab) === results.length - 1}
                      className="text-xs text-neutral-500 hover:text-neutral-900 disabled:opacity-30 transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!openResponseId} onClose={() => setOpenResponseId(null)} maxWidth={540}>
        {(() => {
          const response = results.find(r => r.persona_id === openResponseId)
          if (!response) return null
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
                  <p className="text-sm text-neutral-500">
                    {response.job_title}{response.location ? ` · ${response.location}` : ''}
                  </p>
                </div>
              </div>

              {response.error ? (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{response.error}</p>
              ) : (
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{response.response}</p>
              )}
            </>
          )
        })()}
      </Modal>
    </div>
  )
}
