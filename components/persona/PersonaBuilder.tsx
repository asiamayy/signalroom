'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, ChevronRight, ChevronDown, ChevronUp, User, Loader2, Dices } from 'lucide-react'
import { Button } from '@/components/ui'
import { HOME_FONT_BODY, HOME_FONT_DISPLAY } from '@/lib/home-theme'
import type { PersonaTraits, PersonaGender, PersonaIncome, PersonaEducation, FunnelStage } from '@/types'

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 'identity', label: 'Identity', sublabel: 'Who is this person?' },
  { id: 'professional', label: 'Professional', sublabel: 'Work and context' },
  { id: 'psychology', label: 'Psychology', sublabel: 'Mindset and motivators' },
]

const STEP_CARD_COPY = [
  { title: "Let's start with the basics", subtitle: 'The identity details that make this persona feel like a real person.' },
  { title: 'Now, the professional details', subtitle: "Their work, goals, and what's standing in the way." },
  { title: 'Finally, their mindset', subtitle: 'How they think, decide, and approach risk.' },
]

const EXAMPLE_PROMPTS = [
  'A busy startup product manager',
  'A freelance developer focused on growth',
  'A B2B marketer in a scale-up',
]

// "Surprise me" used to just pick one of the three EXAMPLE_PROMPTS above,
// so real variety topped out at 3 possible seed personas. Instead, compose
// a fresh combination from much larger pools each click, so the AI gets a
// genuinely different, specific seed to build a "sophisticated" persona
// from rather than one of a handful of recycled starting points.
const SURPRISE_SENIORITIES = [
  'a senior', 'a mid-career', 'a newly-promoted', 'a veteran', 'a first-time',
]
const SURPRISE_ROLES = [
  'operations director', 'procurement manager', 'VP of finance', 'clinical research coordinator',
  'supply chain analyst', 'compliance officer', 'creative director', 'IT infrastructure lead',
  'people operations manager', 'commercial real estate broker', 'independent management consultant',
  'director of customer success', 'plant operations manager', 'nonprofit program director',
  'university admissions director', 'restaurant group general manager', 'insurance underwriter',
]
const SURPRISE_ORG_CONTEXTS = [
  'at a fast-growing mid-market company', 'at a century-old family-owned business',
  'at a private equity-backed rollup', 'at a regional healthcare system',
  'at a unionized manufacturing plant', 'running her own small consultancy',
  'at a public sector agency', 'at a Fortune 500 division', 'at a bootstrapped startup',
  'at a multinational nonprofit', 'at a franchise operation with a dozen locations',
]
const SURPRISE_TRAITS = [
  'known for being deeply skeptical of new tools until proven', 'juggling the role with primary caregiving duties',
  'recently burned by a bad vendor decision', 'under pressure to cut costs this quarter',
  'the most tech-forward person on an otherwise old-school team', 'quietly job-hunting',
  'new to the industry after a career change', 'managing a team through a recent reorg',
  'balancing the job with a side business', 'the primary decision-maker for tooling purchases',
]

function buildSurprisePrompt(): string {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  return `${pick(SURPRISE_SENIORITIES)} ${pick(SURPRISE_ROLES)} ${pick(SURPRISE_ORG_CONTEXTS)}, ${pick(SURPRISE_TRAITS)}.`
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_TRAITS: PersonaTraits = {
  age: 32,
  gender: 'female',
  location: '',
  job_title: '',
  industry: '',
  income: '50k_100k',
  education: 'bachelors',
  goals: [''],
  frustrations: [''],
  buying_behavior: '',
  tech_savviness: 3,
  risk_tolerance: 3,
  additional_context: '',
  motivations: [''],
  preferred_tools: [''],
  key_quote: '',
  ethnicity: '',
}

// ─── Options ──────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer not to say', label: 'Prefer not to say' },
]

const INCOME_OPTIONS = [
  { value: 'under_50k', label: 'Under $50,000' },
  { value: '50k_100k', label: '$50,000 – $100,000' },
  { value: '100k_200k', label: '$100,000 – $200,000' },
  { value: 'over_200k', label: 'Over $200,000' },
]

const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High school' },
  { value: 'bachelors', label: "Bachelor's degree" },
  { value: 'masters', label: "Master's degree" },
  { value: 'phd', label: 'PhD' },
]

const FUNNEL_STAGE_OPTIONS = [
  { value: 'awareness', label: 'Awareness — just discovering it' },
  { value: 'consideration', label: 'Consideration — comparing options' },
  { value: 'purchase', label: 'Purchase — about to decide' },
  { value: 'loyalty', label: 'Loyalty — experienced user' },
]

const FUNNEL_STAGES: readonly FunnelStage[] = ['awareness', 'consideration', 'purchase', 'loyalty']

// ─── Page-local field primitives ─────────────────────────────────────────────
// The shared components/ui Input/Select/etc. use an older, unrelated visual
// language (gray #E0E2E4 borders, #1C3D2E focus rings, non-uppercase labels)
// that doesn't match this page's design reference. Rebuilt locally here
// rather than changed globally, since components/ui is shared by every
// other page in the app.

const FIELD_BORDER = '1px solid #c3c8c14d'
const FIELD_BG = '#f6f3f2'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-widest" style={{ color: '#434843' }}>
      {children}
    </label>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] italic" style={{ color: '#434843' }}>{children}</p>
}

function FieldInput({ label, hint, className, style, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <input
        className={`w-full rounded-lg px-4 py-3 text-base outline-none transition-all focus:border-[#18281c] focus:ring-1 focus:ring-[#18281c]/15 ${className ?? ''}`}
        style={{ background: FIELD_BG, border: FIELD_BORDER, color: '#1c1b1b', ...style }}
        {...props}
      />
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}

function FieldSelect({ label, hint, options, className, style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <select
        className={`w-full cursor-pointer rounded-lg px-4 py-3 text-base outline-none transition-all focus:border-[#18281c] focus:ring-1 focus:ring-[#18281c]/15 ${className ?? ''}`}
        style={{ background: FIELD_BG, border: FIELD_BORDER, color: '#1c1b1b', ...style }}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}

function FieldTextarea({ label, hint, className, style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        className={`w-full resize-none rounded-xl px-4 py-3 text-base outline-none transition-all focus:border-[#18281c] focus:ring-1 focus:ring-[#18281c]/15 ${className ?? ''}`}
        style={{ background: FIELD_BG, border: FIELD_BORDER, color: '#1c1b1b', ...style }}
        {...props}
      />
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}

function TagField({ label, hint, tags, onChange }: { label: string; hint?: string; tags: string[]; onChange: (tags: string[]) => void }) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = e.currentTarget.value.trim()
      if (val && !tags.includes(val)) {
        onChange([...tags, val])
        e.currentTarget.value = ''
      }
    }
    if (e.key === 'Backspace' && e.currentTarget.value === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex min-h-[52px] flex-wrap items-center gap-1.5 rounded-lg p-2.5 focus-within:border-[#18281c] focus-within:ring-1 focus-within:ring-[#18281c]/15" style={{ background: FIELD_BG, border: FIELD_BORDER }}>
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ background: '#dee5da', color: '#18281c' }}>
            {tag}
            <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} style={{ color: '#18281c99', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </span>
        ))}
        <input
          type="text"
          className="min-w-[120px] flex-1 bg-transparent text-base outline-none"
          style={{ color: '#1c1b1b' }}
          placeholder={tags.length === 0 ? 'Add tag...' : ''}
          onKeyDown={handleKeyDown}
        />
      </div>
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}

function ListField({ label, hint, items, onChange, placeholder, max = 5 }: { label: string; hint?: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string; max?: number }) {
  const handleChange = (i: number, value: string) => { const next = [...items]; next[i] = value; onChange(next) }
  const handleAdd = () => { if (items.length < max) onChange([...items, '']) }
  const handleRemove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={e => handleChange(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-lg px-4 py-3 text-base outline-none transition-all focus:border-[#18281c] focus:ring-1 focus:ring-[#18281c]/15"
              style={{ background: FIELD_BG, border: FIELD_BORDER, color: '#1c1b1b' }}
            />
            <button type="button" onClick={() => handleRemove(i)} className="px-1 transition-colors" style={{ color: '#8d938e', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        ))}
      </div>
      {items.length < max && (
        <button type="button" onClick={handleAdd} className="w-fit text-xs font-semibold transition-colors" style={{ color: '#434843', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add another</button>
      )}
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}

function SliderField({ label, value, onChange, leftLabel, rightLabel }: { label: string; value: number; onChange: (v: number) => void; leftLabel?: string; rightLabel?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-sm font-semibold" style={{ color: '#18281c' }}>{value}</span>
      </div>
      <input type="range" min={1} max={5} step={1} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full" style={{ accentColor: '#18281c' }} />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-xs" style={{ color: '#434843' }}>
          <span>{leftLabel}</span><span>{rightLabel}</span>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PersonaBuilder() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  // Pre-select when arriving from within a workspace (e.g. its content
  // tabs) — an invitee shouldn't have to remember to switch this off
  // "Personal" themselves for content that's obviously meant to be shared.
  const preselectedWorkspaceId = searchParams.get('workspace_id') ?? 'personal'
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('awareness')
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([])
  const [workspaceId, setWorkspaceId] = useState<string>(preselectedWorkspaceId)
  const [traits, setTraits] = useState<PersonaTraits>(DEFAULT_TRAITS)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  const [generatingAvatar, setGeneratingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Harmless to call regardless of plan — returns an empty list for accounts
  // without any workspaces, in which case the picker below just never renders.
  useEffect(() => {
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(json => setWorkspaces(json.data ?? []))
      .catch(() => setWorkspaces([]))
  }, [])

  // ─── AI generation ──────────────────────────────────────────────────────────

  const runGenerate = async (description: string) => {
    if (!description.trim()) return
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: true, description }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      const s = json.data
      setName(s.name ?? '')
      setTags(s.tags ?? [])
      setFunnelStage(FUNNEL_STAGES.includes(s.funnel_stage) ? s.funnel_stage : 'awareness')
      setTraits({
        age: s.age ?? 30,
        gender: (s.gender as PersonaGender) ?? 'female',
        location: s.location ?? '',
        job_title: s.job_title ?? '',
        industry: s.industry ?? '',
        income: (s.income as PersonaIncome) ?? '50k_100k',
        education: (s.education as PersonaEducation) ?? 'bachelors',
        goals: s.goals ?? [''],
        frustrations: s.frustrations ?? [''],
        buying_behavior: s.buying_behavior ?? '',
        tech_savviness: s.tech_savviness ?? 3,
        risk_tolerance: s.risk_tolerance ?? 3,
        additional_context: s.additional_context ?? '',
        motivations: s.motivations ?? [''],
        preferred_tools: s.preferred_tools ?? [''],
        key_quote: s.key_quote ?? '',
        ethnicity: s.ethnicity ?? '',
      })
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate persona')
    } finally {
      setGenerating(false)
    }
  }

  const [surprising, setSurprising] = useState(false)
  const handleGenerate = () => runGenerate(aiPrompt)
  const handleSurpriseMe = async () => {
    const prompt = buildSurprisePrompt()
    setAiPrompt(prompt)
    setSurprising(true)
    try {
      await runGenerate(prompt)
    } finally {
      setSurprising(false)
    }
  }

  // ─── Avatar generation ───────────────────────────────────────────────────────

  const handleGenerateAvatar = async () => {
    setGeneratingAvatar(true)
    setError('')
    try {
      const res = await fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          age: traits.age,
          gender: traits.gender,
          job_title: traits.job_title,
          additional_context: traits.additional_context,
          ethnicity: traits.ethnicity,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setAvatarUrl(json.url)
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate avatar')
    } finally {
      setGeneratingAvatar(false)
    }
  }

  // ─── Step validation ─────────────────────────────────────────────────────────

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!name.trim()) return 'Please enter a name for this persona'
      if (!traits.location?.trim()) return 'Please enter a location'
    }
    if (s === 1) {
      if (!traits.job_title?.trim()) return 'Please enter a job title'
      if (!traits.industry?.trim()) return 'Please enter an industry'
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this persona')
      return
    }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tags, traits, funnel_stage: funnelStage, avatar_url: avatarUrl, project_id: projectId, workspace_id: workspaceId === 'personal' ? null : workspaceId }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.limit_reached) {
          setError(json.error + ' Go to Settings → Plans to upgrade.')
        } else {
          throw new Error(json.error)
        }
        setSaving(false)
        return
      }

      router.push(projectId ? `/projects/${projectId}` : '/personas')
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Failed to save persona')
      setSaving(false)
    }
  }

  const updateTrait = <K extends keyof PersonaTraits>(key: K, value: PersonaTraits[K]) => {
    setTraits(prev => ({ ...prev, [key]: value }))
  }

  const cardCopy = STEP_CARD_COPY[step]

  return (
    <div className="min-h-full px-6 pb-20 pt-12" style={{ background: '#fcf9f8', fontFamily: HOME_FONT_BODY }}>

      {/* Hero */}
      <section className="relative mb-4 overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <h1 className="mb-6 leading-tight" style={{ fontFamily: HOME_FONT_DISPLAY, fontSize: '40px', lineHeight: '48px', letterSpacing: '-.02em', fontWeight: 600, color: '#1c1b1b' }}>New Persona</h1>
          <p className="max-w-2xl text-base leading-relaxed" style={{ color: '#434843' }}>Build a realistic, research-backed persona with AI assistance.</p>
          <div className="mt-8 flex gap-4">
            <button type="button" onClick={() => router.push('/personas')} className="rounded-full border px-8 py-3 text-lg font-semibold transition-colors hover:bg-[#eae7e7]" style={{ borderColor: '#c3c8c1', color: '#1c1b1b', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Drafts
            </button>
            <button type="button" className="rounded-full px-8 py-3 text-lg font-semibold text-white shadow-xl transition-all hover:-translate-y-px" style={{ background: '#18281c', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Save Progress
            </button>
          </div>
        </div>
      </section>

      {/* Step nav */}
      <nav className="mb-8 flex gap-12 overflow-x-auto">
        {STEPS.map((s, i) => {
          const active = i === step
          const canJump = i <= step
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => canJump && setStep(i)}
              className={`group flex flex-shrink-0 items-center gap-4 border-b-2 pb-4 pr-8 text-left transition-opacity ${
                active ? 'border-[#18281c] opacity-100' : 'border-transparent opacity-40 hover:border-[#c3c8c1] hover:opacity-100'
              }`}
              style={{ background: 'none', cursor: canJump ? 'pointer' : 'default', fontFamily: 'inherit' }}
            >
              <span className="flex-shrink-0 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: active ? '#18281c' : '#1c1b1b' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold uppercase leading-tight tracking-widest" style={{ color: active ? '#18281c' : '#1c1b1b' }}>{s.label}</p>
                <p className="text-sm italic leading-tight" style={{ color: '#434843' }}>{s.sublabel}</p>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* ── Main form card ── */}
        <div className="rounded-xl border p-10 shadow-sm lg:col-span-8" style={{ background: 'white', borderColor: '#c3c8c14d' }}>
          <h2 className="mb-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: '#1c1b1b', fontWeight: 600 }}>{cardCopy.title}</h2>
          <p className="mb-10 italic" style={{ color: '#434843' }}>{cardCopy.subtitle}</p>

          {/* ── Step 0: Identity ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
              {/* Avatar column */}
              <div className="flex w-48 flex-shrink-0 flex-col gap-4">
                <FieldLabel>Avatar</FieldLabel>
                <div className="group relative aspect-square w-full overflow-hidden rounded-full border" style={{ background: '#f0eded', borderColor: '#c3c8c14d' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User size={64} strokeWidth={1.2} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 group-hover:scale-110" style={{ color: '#c3c8c1' }} />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-black/[.045] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {generatingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <Loader2 size={18} className="text-white animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAvatar}
                  disabled={generatingAvatar || !name}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
                  style={name && !generatingAvatar
                    ? { borderColor: '#c3c8c1', background: 'white', color: '#434843', cursor: 'pointer' }
                    : { borderColor: '#c3c8c14d', color: '#8d938e', cursor: 'not-allowed' }}
                >
                  <Sparkles size={12} />
                  {generatingAvatar ? 'Generating…' : avatarUrl ? 'Regenerate' : 'Generate with AI'}
                </button>
              </div>

              {/* Fields column */}
              <div className="flex-1 min-w-0 space-y-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <FieldInput
                    label="Full name *"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Maya Chen"
                  />
                  <FieldInput
                    label="Age"
                    type="number"
                    min={18}
                    max={80}
                    value={traits.age}
                    onChange={e => updateTrait('age', Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <FieldSelect
                    label="Gender"
                    value={traits.gender}
                    onChange={e => updateTrait('gender', e.target.value as PersonaGender)}
                    options={GENDER_OPTIONS}
                  />
                  <FieldSelect
                    label="Education"
                    value={traits.education}
                    onChange={e => updateTrait('education', e.target.value as PersonaEducation)}
                    options={EDUCATION_OPTIONS}
                  />
                </div>
                <FieldInput
                  label="Location *"
                  value={traits.location}
                  onChange={e => updateTrait('location', e.target.value)}
                  placeholder="e.g. Austin, TX"
                  maxLength={200}
                />
                <FieldInput
                  label="Ethnicity / heritage"
                  value={traits.ethnicity ?? ''}
                  onChange={e => updateTrait('ethnicity', e.target.value)}
                  placeholder="e.g. Chinese-American"
                  maxLength={100}
                />
                <TagField
                  label="Tags"
                  hint="Press Enter to add — e.g. 'bootstrapped', 'B2B', 'budget-conscious'"
                  tags={tags}
                  onChange={setTags}
                />
                <FieldSelect
                  label="Funnel stage"
                  value={funnelStage}
                  onChange={e => setFunnelStage(e.target.value as FunnelStage)}
                  options={FUNNEL_STAGE_OPTIONS}
                  hint="Where they sit in the buying journey — this shapes how they react (a new prospect vs. an experienced user). Filterable on the Personas page."
                />
                <FieldSelect
                  label="Workspace"
                  value={workspaceId}
                  onChange={e => setWorkspaceId(e.target.value)}
                  options={[{ value: 'personal', label: 'Personal (not shared)' }, ...workspaces.map(w => ({ value: w.id, label: w.name }))]}
                  hint="Share this persona with a workspace to make it visible and editable by every member of that workspace."
                />
              </div>
            </div>
          )}

          {/* ── Step 1: Professional ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <FieldInput
                  label="Job title *"
                  value={traits.job_title}
                  onChange={e => updateTrait('job_title', e.target.value)}
                  placeholder="e.g. Founder & CEO"
                />
                <FieldInput
                  label="Industry *"
                  value={traits.industry}
                  onChange={e => updateTrait('industry', e.target.value)}
                  placeholder="e.g. SaaS / B2B Software"
                />
              </div>
              <FieldSelect
                label="Annual income"
                value={traits.income}
                onChange={e => updateTrait('income', e.target.value as PersonaIncome)}
                options={INCOME_OPTIONS}
              />
              <ListField
                label="Goals"
                hint="What are they trying to achieve?"
                items={traits.goals}
                onChange={v => updateTrait('goals', v)}
                placeholder="e.g. Find product-market fit before runway runs out"
                max={5}
              />
              <ListField
                label="Frustrations"
                hint="What keeps them up at night?"
                items={traits.frustrations}
                onChange={v => updateTrait('frustrations', v)}
                placeholder="e.g. Traditional market research is too expensive and slow"
                max={5}
              />
              <FieldTextarea
                label="Buying behavior"
                value={traits.buying_behavior}
                onChange={e => updateTrait('buying_behavior', e.target.value)}
                placeholder="How do they research tools? What do they read, who do they trust, what makes them pull the trigger or walk away?"
                rows={3}
              />
              <ListField
                label="Preferred tools"
                hint="Products or tools they already rely on"
                items={traits.preferred_tools ?? ['']}
                onChange={v => updateTrait('preferred_tools', v)}
                placeholder="e.g. Figma, Notion, Slack"
                max={6}
              />
            </div>
          )}

          {/* ── Step 2: Psychology ───────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-8">
              <SliderField
                label="Tech savviness"
                value={traits.tech_savviness}
                onChange={v => updateTrait('tech_savviness', v as 1 | 2 | 3 | 4 | 5)}
                leftLabel="Not technical"
                rightLabel="Developer-level"
              />
              <SliderField
                label="Risk tolerance"
                value={traits.risk_tolerance}
                onChange={v => updateTrait('risk_tolerance', v as 1 | 2 | 3 | 4 | 5)}
                leftLabel="Very cautious"
                rightLabel="Early adopter"
              />
              <ListField
                label="Motivations"
                hint="What drives them, deep down?"
                items={traits.motivations ?? ['']}
                onChange={v => updateTrait('motivations', v)}
                placeholder="e.g. Making an impact through their work"
                max={5}
              />
              <FieldInput
                label="Key quote"
                value={traits.key_quote ?? ''}
                onChange={e => updateTrait('key_quote', e.target.value)}
                placeholder="A first-person sentence that captures how they see the world"
              />
              <FieldTextarea
                label="Additional context"
                value={traits.additional_context}
                onChange={e => updateTrait('additional_context', e.target.value)}
                placeholder="Anything else that makes this person feel real — their personality, a past experience, a strong opinion, a quirk in how they work."
                rows={5}
                hint="The more specific and human this is, the more credible their interview responses will be."
              />
            </div>
          )}

          {name && (
            <p className="text-xs mt-6 pt-5" style={{ color: '#9CA3AF', borderTop: '1px solid #F1F1F1' }}>* Required fields</p>
          )}

          <div className="mt-12 flex justify-end gap-4 border-t pt-8" style={{ borderColor: '#c3c8c133' }}>
            <button
              type="button"
              onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
              className="rounded-lg border px-8 py-2.5 text-lg font-semibold transition-all"
              style={{ borderColor: '#c3c8c1', color: '#434843', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={handleNext} className="flex items-center gap-2 rounded-lg bg-[#18281c] px-8 py-2.5 text-lg font-semibold text-white shadow-lg shadow-[#18281c]/10 transition-all active:scale-[.98]" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Save and continue <ChevronRight size={18} />
              </button>
            ) : (
              <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#18281c] px-8 py-2.5 text-lg font-semibold text-white shadow-lg shadow-[#18281c]/10 transition-all active:scale-[.98] disabled:opacity-60" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving…' : 'Save persona'}
              </button>
            )}
          </div>
        </div>

        {/* ── AI assistant panel ── */}
        <div className="rounded-xl p-8 shadow-sm lg:col-span-4" style={{ background: 'white', border: '1px solid #c3c8c14d' }}>
          <button
            onClick={() => setAiPanelOpen(o => !o)}
            className="w-full flex items-center gap-3 mb-1"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ background: '#dee5da' }}><Sparkles size={19} style={{ color: '#18281c' }} /></span>
            <span className="text-sm font-bold uppercase tracking-[.14em]" style={{ color: '#1c1b1b' }}>AI Assistant</span>
            <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: '#2d3e31', color: '#d4e8d5' }}>BETA</span>
            {aiPanelOpen ? <ChevronUp size={15} style={{ color: '#9CA3AF' }} className="flex-shrink-0" /> : <ChevronDown size={15} style={{ color: '#9CA3AF' }} className="flex-shrink-0" />}
          </button>

          {aiPanelOpen && (
            <>
              <p className="mb-6 mt-4 text-sm leading-relaxed" style={{ color: '#434843' }}>
                I can help you create a well-rounded persona. Start with a prompt or try an example below.
              </p>

              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: '#434843' }}>Describe your persona</label>
              <div className="relative mb-4">
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value.slice(0, 300))}
                  placeholder="e.g., A 28-year-old product designer who loves clean UI, works remotely, and cares about sustainability."
                  rows={4}
                  maxLength={300}
                  className="w-full resize-none rounded-xl border p-4 text-[16px] italic leading-6 outline-none transition-all placeholder:text-[#434843]/55 focus:border-[#18281c] focus:ring-1 focus:ring-[#18281c]/15"
                  style={{ background: '#f6f3f2', borderColor: '#c3c8c14d', color: '#1c1b1b' }}
                />
                <span className="absolute bottom-2 right-2.5 text-[10px]" style={{ color: '#9CA3AF' }}>{aiPrompt.length}/300</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerate}
                loading={generating}
                className="mb-6 w-full py-3 shadow-lg shadow-[#18281c]/10 active:scale-[.98]"
                style={{ background: '#18281c' }}
              >
                Generate
              </Button>

              <label className="mb-3 block pt-4 text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: '#434843' }}>Or try an example</label>
              <div className="mb-4 space-y-2">
                {EXAMPLE_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => { setAiPrompt(prompt); runGenerate(prompt) }}
                    disabled={generating}
                    className="group flex w-full items-center justify-between gap-2 rounded-xl border p-3.5 text-left text-sm transition-all disabled:opacity-60"
                    style={{ background: 'white', borderColor: '#c3c8c14d', color: '#1c1b1b', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {prompt}
                    <Sparkles size={16} className="flex-shrink-0 text-[#c3c8c1] transition-colors group-hover:text-[#18281c]" />
                  </button>
                ))}
              </div>
              <button
                onClick={handleSurpriseMe}
                disabled={generating}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-[11px] font-bold uppercase tracking-[.14em] transition-all disabled:opacity-60"
                style={{ background: 'white', borderColor: '#c3c8c1', color: '#434843', cursor: surprising ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {surprising ? (
                  <>
                    Generating…
                    <Loader2 size={12} className="animate-spin" style={{ color: '#1C3D2E' }} />
                  </>
                ) : (
                  <>
                    Surprise me
                    <Dices size={14} style={{ color: '#18281c' }} />
                  </>
                )}
              </button>

              <p className="mt-6 text-center text-[10px] italic leading-relaxed" style={{ color: '#43484399' }}>
                AI suggestions may be inaccurate. Please review.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-6 text-sm rounded-lg px-3 py-2" style={{ color: '#DB4437', background: '#FEF2F1', border: '1px solid #F8D7D3' }}>
          {error}
        </p>
      )}

      <footer className="mt-12 flex items-center border-t py-8" style={{ borderColor: '#c3c8c133' }}>
        <span className="mr-8 h-6 w-px" style={{ background: '#c3c8c155' }} />
        <button type="button" onClick={() => router.back()} className="text-[11px] font-bold uppercase tracking-[.16em] transition-opacity hover:opacity-70" style={{ color: '#ba1a1a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Discard draft
        </button>
      </footer>
    </div>
  )
}
