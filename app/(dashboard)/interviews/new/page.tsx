'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, MessageSquare, Swords, Loader2, Plus } from 'lucide-react'
import { HOME_COLORS, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW } from '@/lib/utils'
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
    const isTemplate = Object.values(CONTEXT_TEMPLATES).includes(context)
    if (!context.trim() || isTemplate) {
      setContext(CONTEXT_TEMPLATES[newType])
    }
  }
  const [devilsAdvocate, setDevilsAdvocate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/personas')
      .then(r => r.json())
      .then(json => setPersonas(json.data ?? []))
      .finally(() => setLoading(false))
  }, [])

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

  const inputStyle = { background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full">
      <div className="px-4 sm:px-10 pt-10 sm:pt-16 pb-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Intelligence Stream</span>
        </div>
        <h1 className="mb-3 leading-tight" style={{ ...DISPLAY_LG_STYLE, fontSize: '32px', lineHeight: '40px', color: HOME_COLORS.onSurface }}>New Dialogue</h1>
        <p className="text-sm mb-10" style={{ color: HOME_COLORS.onSurfaceVariant }}>Set up your session before entering the room.</p>

        <div className="space-y-8">
          {/* Persona selection */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>Who are you interviewing?</label>

            {loading && <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Loading personas...</p>}

            {!loading && personas.length === 0 && (
              <div className="rounded-xl p-6 text-center" style={{ border: `1px dashed ${HOME_COLORS.outlineVariant}` }}>
                <p className="text-sm mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>No personas yet. Create one first.</p>
                <button
                  type="button"
                  onClick={() => router.push('/personas/new')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full"
                  style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}
                >
                  <Plus size={13} /> Create a persona
                </button>
              </div>
            )}

            {!loading && personas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {personas.map(persona => {
                  const selected = persona.id === personaId
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setPersonaId(persona.id)}
                      className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: selected ? HOME_COLORS.primary : HOME_COLORS.surfaceContainerLowest,
                        border: selected ? `1.5px solid ${HOME_COLORS.primary}` : `1.5px solid ${HOME_COLORS.outlineVariant}33`,
                        boxShadow: CARD_SHADOW,
                      }}
                    >
                      <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" className="flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: selected ? HOME_COLORS.onPrimary : HOME_COLORS.onSurface }}>{persona.name}</p>
                        <p className="text-xs truncate" style={{ color: selected ? 'rgba(255,255,255,0.7)' : HOME_COLORS.onSurfaceVariant }}>{persona.traits?.job_title ?? 'No role'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Interview type */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>What kind of interview?</label>
            <div className="space-y-2">
              {INTERVIEW_TYPES.map(t => {
                const selected = type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleTypeChange(t.value)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? HOME_COLORS.secondaryContainer : HOME_COLORS.surfaceContainerLowest,
                      border: selected ? `1.5px solid ${HOME_COLORS.primary}` : `1.5px solid ${HOME_COLORS.outlineVariant}33`,
                      boxShadow: CARD_SHADOW,
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{t.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>{t.description}</p>
                    </div>
                    <div className="w-4 h-4 rounded-full flex-shrink-0 ml-3" style={{ border: `2px solid ${selected ? HOME_COLORS.primary : HOME_COLORS.outlineVariant}`, background: selected ? HOME_COLORS.primary : 'transparent' }} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Interview title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                type === 'concept_testing' ? 'e.g. Testing SignalRoom concept with early-stage founders'
                : type === 'pricing_discovery' ? 'e.g. $99/month pricing test — startup founders'
                : type === 'message_testing' ? 'e.g. Landing page headline A/B'
                : 'Interview title'
              }
              className="w-full px-4 py-3 text-sm rounded-lg outline-none"
              style={inputStyle}
            />
            <p className="text-xs mt-1.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>Give it a name you&apos;ll recognize later.</p>
          </div>

          {/* Context */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>What are you testing?</label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={4}
              placeholder={
                type === 'concept_testing' ? 'Describe your idea in 2-3 sentences. The more specific, the better the feedback.'
                : type === 'pricing_discovery' ? 'Describe the product and the price point(s) you want to test.'
                : type === 'message_testing' ? 'Paste the headline, copy, or message you want to test.'
                : 'Give context for what you want to learn from this session.'
              }
              className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none"
              style={inputStyle}
            />
            <p className="text-xs mt-1.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>This gives the persona context for the session — they&apos;ll respond in light of it.</p>
          </div>

          {/* Devil's Advocate */}
          <button
            type="button"
            onClick={() => setDevilsAdvocate(d => !d)}
            className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all"
            style={{
              background: devilsAdvocate ? '#FFDAD6' : HOME_COLORS.surfaceContainerLowest,
              border: `1.5px solid ${devilsAdvocate ? '#FFB4AB' : `${HOME_COLORS.outlineVariant}33`}`,
              boxShadow: CARD_SHADOW,
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: devilsAdvocate ? '#FFB4AB' : HOME_COLORS.surfaceContainerHigh }}>
              <Swords size={15} style={{ color: devilsAdvocate ? HOME_COLORS.error : HOME_COLORS.onSurfaceVariant }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: devilsAdvocate ? HOME_COLORS.error : HOME_COLORS.onSurface }}>Devil&apos;s Advocate mode</p>
                <div className="w-8 h-4 rounded-full transition-colors flex-shrink-0" style={{ background: devilsAdvocate ? HOME_COLORS.error : HOME_COLORS.outlineVariant }}>
                  <div className="w-3 h-3 bg-white rounded-full shadow transition-transform mt-0.5" style={{ transform: devilsAdvocate ? 'translateX(18px)' : 'translateX(2px)' }} />
                </div>
              </div>
              <p className="text-xs mt-0.5" style={{ color: devilsAdvocate ? '#7A0000' : HOME_COLORS.onSurfaceVariant }}>
                {devilsAdvocate
                  ? 'On — persona will lead with skepticism and challenge your assumptions before engaging'
                  : 'Off — persona responds naturally. Turn on to stress-test your idea against hard pushback.'}
              </p>
            </div>
          </button>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ color: HOME_COLORS.error, background: '#FFDAD6' }}>{error}</p>
          )}

          <div className="flex justify-between items-center pt-4" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}4d` }}>
            <button type="button" onClick={() => router.back()} className="text-sm font-semibold px-5 py-2.5 rounded-full transition-colors" style={{ color: HOME_COLORS.onSurfaceVariant, border: `1px solid ${HOME_COLORS.outlineVariant}66` }}>
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-60"
              style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              Enter the room
              {!saving && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewInterviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Loading...</div>}>
      <NewInterviewForm />
    </Suspense>
  )
}
