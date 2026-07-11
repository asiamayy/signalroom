'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, MessageSquare, Swords } from 'lucide-react'
import { Button, Input, Textarea, Select, Card } from '@/components/ui'
import { cn, INTERVIEW_TYPE_LABELS, getAvatarColor } from '@/lib/utils'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import type { Persona, InterviewType } from '@/types'

const INTERVIEW_TYPES: { value: InterviewType; label: string; description: string }[] = [
  { value: 'concept_testing', label: 'Concept testing', description: 'Test whether an idea resonates before building it' },
  { value: 'pricing_discovery', label: 'Pricing discovery', description: 'Find the price point your customer will say yes to' },
  { value: 'message_testing', label: 'Message testing', description: 'Test headlines, copy, and positioning before launch' },
  { value: 'competitive_positioning', label: 'Competitive positioning', description: 'Understand how they perceive you vs. alternatives' },
  { value: 'feature_prioritization', label: 'Feature prioritization', description: "Find what they actually want, not what you assume" },
  { value: 'custom', label: 'Custom interview', description: 'Open-ended — ask whatever you need' },
]

const CONTEXT_TEMPLATES: Record<InterviewType, string> = {
  concept_testing: "I'm building [describe your product or feature in one sentence]. It's designed for [target customer] who struggle with [pain point]. I want to understand whether this idea resonates and what concerns they might have.",
  pricing_discovery: "I'm validating pricing for [product/feature]. It currently costs [price] per month and includes [key features]. I want to understand whether this feels fair, what they'd compare it to, and what would make them say yes or no.",
  message_testing: "I want to test this positioning for [product]: '[your headline or value prop]'. I need to understand whether this resonates, what it means to them, and what would make them click through or scroll past.",
  competitive_positioning: "I'm trying to understand how [target customer] thinks about solving [problem] today. I want to know what tools they use, what frustrates them, and what it would take to switch to something new.",
  feature_prioritization: "I'm deciding what to build next for [product]. The options are: [list 2-3 features]. I want to understand which of these would be most valuable to them and why.",
  custom: "",
}

function NewInterviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPersonaId = searchParams.get('persona_id') ?? ''
  const projectId = searchParams.get('project_id')

  const [personas, setPersonas] = useState<Persona[]>([])
  const [personaId, setPersonaId] = useState(preselectedPersonaId)
  const [type, setType] = useState<InterviewType>('concept_testing')
  const [title, setTitle] = useState('')
  const [context, setContext] = useState(CONTEXT_TEMPLATES['concept_testing'])

  const handleTypeChange = (newType: InterviewType) => {
    setType(newType)
    // Only auto-populate if context is empty or still matches a template
    const isTemplate = Object.values(CONTEXT_TEMPLATES).includes(context)
    if (!context.trim() || isTemplate) {
      setContext(CONTEXT_TEMPLATES[newType])
    }
  }
  const [devilsAdvocate, setDevilsAdvocate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load personas
  useEffect(() => {
    setLoading(true)
    fetch('/api/personas')
      .then(r => r.json())
      .then(json => setPersonas(json.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const selectedPersona = personas.find(p => p.id === personaId)

  const handleStart = async () => {
    if (!personaId) { setError('Select a persona to interview'); return }
    if (!title.trim()) { setError('Give this interview a title'); return }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: personaId, title, type, context, devils_advocate: devilsAdvocate, project_id: projectId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      router.push(`/interviews/${json.data.id}`)
    } catch (e: any) {
      setError(e.message ?? 'Failed to create interview')
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="heading-editorial text-2xl text-neutral-900">New interview</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Set up your session before entering the room</p>
      </div>

      <div className="space-y-7">

        {/* ── Persona selection ─────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Who are you interviewing?
          </label>

          {loading && (
            <p className="text-sm text-neutral-400">Loading personas...</p>
          )}

          {!loading && personas.length === 0 && (
            <div className="border border-dashed border-neutral-200 rounded-xl p-6 text-center">
              <p className="text-sm text-neutral-500 mb-3">No personas yet. Create one first.</p>
              <Button variant="secondary" size="sm" onClick={() => router.push('/personas/new')}>
                Create a persona
              </Button>
            </div>
          )}

          {!loading && personas.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {personas.map(persona => {
                const selected = persona.id === personaId

                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setPersonaId(persona.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                      selected
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    )}
                  >
                  <PersonaAvatar
                      avatarUrl={persona.avatar_url}
                      avatarInitials={persona.avatar_initials}
                      avatarColor={persona.avatar_color}
                      name={persona.name}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className={cn('text-sm font-medium truncate', selected ? 'text-white' : 'text-neutral-900')}>
                        {persona.name}
                      </p>
                      <p className={cn('text-xs truncate', selected ? 'text-neutral-300' : 'text-neutral-500')}>
                        {persona.traits?.job_title ?? 'No role'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Interview type ────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            What kind of interview?
          </label>
          <div className="space-y-1.5">
            {INTERVIEW_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTypeChange(t.value)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all',
                  type === t.value
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                )}
              >
                <div>
                  <p className={cn('text-sm font-medium', type === t.value ? 'text-neutral-900' : 'text-neutral-700')}>
                    {t.label}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t.description}</p>
                </div>
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex-shrink-0 ml-3 transition-colors',
                  type === t.value ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-300'
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <Input
          label="Interview title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={
            type === 'concept_testing' ? 'e.g. Testing SignalRoom concept with early-stage founders'
            : type === 'pricing_discovery' ? 'e.g. $99/month pricing test — startup founders'
            : type === 'message_testing' ? 'e.g. Landing page headline A/B'
            : 'Interview title'
          }
          hint="Give it a name you'll recognize later"
        />

        {/* ── Context ───────────────────────────────────────────────────── */}
        <Textarea
          label="What are you testing?"
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder={
            type === 'concept_testing'
              ? 'Describe your idea in 2-3 sentences. The more specific, the better the feedback.'
              : type === 'pricing_discovery'
              ? 'Describe the product and the price point(s) you want to test.'
              : type === 'message_testing'
              ? 'Paste the headline, copy, or message you want to test.'
              : 'Give context for what you want to learn from this session.'
          }
          rows={4}
          hint="This gives the persona context for the session — they'll respond in light of it."
        />

        {/* ── Devil's Advocate ──────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setDevilsAdvocate(d => !d)}
          className={cn(
            'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
            devilsAdvocate
              ? 'border-red-300 bg-red-50'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
            devilsAdvocate ? 'bg-red-100' : 'bg-neutral-100'
          )}>
            <Swords size={15} className={devilsAdvocate ? 'text-red-600' : 'text-neutral-500'} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className={cn('text-sm font-medium', devilsAdvocate ? 'text-red-800' : 'text-neutral-900')}>
                Devil's Advocate mode
              </p>
              <div className={cn(
                'w-8 h-4 rounded-full transition-colors flex-shrink-0',
                devilsAdvocate ? 'bg-red-500' : 'bg-neutral-200'
              )}>
                <div className={cn(
                  'w-3 h-3 bg-white rounded-full shadow transition-transform mt-0.5',
                  devilsAdvocate ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                )} />
              </div>
            </div>
            <p className={cn('text-xs mt-0.5', devilsAdvocate ? 'text-red-700' : 'text-neutral-500')}>
              {devilsAdvocate
                ? 'On — persona will lead with skepticism and challenge your assumptions before engaging'
                : 'Off — persona responds naturally. Turn on to stress-test your idea against hard pushback.'
              }
            </p>
          </div>
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-between pt-2 border-t border-neutral-100">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleStart} loading={saving}>
            <MessageSquare size={14} />
            Enter the room
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NewInterviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading...</div>}>
      <NewInterviewForm />
    </Suspense>
  )
}
