'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, ChevronRight, ChevronDown, ChevronUp, User, Camera, Loader2, Check } from 'lucide-react'
import { Button, Input, Textarea, Select, Slider, TagInput, ListInput } from '@/components/ui'
import { Dropdown } from '@/components/ui/Dropdown'
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PersonaBuilder() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('awareness')
  const [traits, setTraits] = useState<PersonaTraits>(DEFAULT_TRAITS)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(true)
  const [generatingAvatar, setGeneratingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
        body: JSON.stringify({ name, tags, traits, funnel_stage: funnelStage, avatar_url: avatarUrl, project_id: projectId }),
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
    <div className="min-h-screen p-6 sm:p-8 max-w-6xl mx-auto" style={{ background: '#F9F9F9' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-editorial text-3xl" style={{ color: '#202124' }}>New Persona</h1>
        <p className="text-sm mt-1" style={{ color: '#5F6368' }}>Build a realistic, research-backed persona with AI assistance.</p>
      </div>

      {/* Step progress — circles with connecting lines */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => {
          const active = i === step
          const done = i < step
          return (
            <div key={s.id} className={i < STEPS.length - 1 ? 'flex items-center flex-1' : 'flex items-center'}>
              <button
                onClick={() => i <= step && setStep(i)}
                className="flex items-center gap-3 flex-shrink-0"
                style={{ background: 'none', border: 'none', cursor: i <= step ? 'pointer' : 'default', fontFamily: 'inherit' }}
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={active || done ? { background: '#1C3D2E', color: 'white' } : { background: '#F1F1F1', color: '#9CA3AF' }}
                >
                  {done ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold leading-tight" style={{ color: active ? '#202124' : done ? '#202124' : '#9CA3AF' }}>{s.label}</p>
                  <p className="text-xs leading-tight" style={{ color: '#9CA3AF' }}>{s.sublabel}</p>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-4" style={{ background: '#E0E2E4' }} />
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">

        {/* ── Main form card ── */}
        <div className="rounded-2xl p-6 lg:p-8" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
          <h2 className="heading-editorial text-2xl mb-1" style={{ color: '#202124' }}>{cardCopy.title}</h2>
          <p className="text-sm mb-6" style={{ color: '#5F6368' }}>{cardCopy.subtitle}</p>

          {/* ── Step 0: Identity ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-x-8 gap-y-6">
              {/* Avatar column */}
              <div className="flex flex-col items-center gap-3 lg:w-40 lg:items-start">
                <label className="block text-sm font-medium self-start" style={{ color: '#202124' }}>Avatar</label>
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F5F3EF' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User size={44} strokeWidth={1.5} style={{ color: '#6B7280' }} />
                  )}
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
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  style={name && !generatingAvatar
                    ? { border: '1px solid #E0E2E4', background: 'white', color: '#202124', cursor: 'pointer' }
                    : { border: '1px solid #E0E2E4', color: '#9CA3AF', cursor: 'not-allowed' }}
                >
                  <Sparkles size={12} />
                  {generatingAvatar ? 'Generating…' : avatarUrl ? 'Regenerate' : 'Generate with AI'}
                </button>
              </div>

              {/* Fields column */}
              <div className="flex-1 space-y-5 min-w-0">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Full name *"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Maya Chen"
                  />
                  <Input
                    label="Age"
                    type="number"
                    min={18}
                    max={80}
                    value={traits.age}
                    onChange={e => updateTrait('age', Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Gender"
                    value={traits.gender}
                    onChange={e => updateTrait('gender', e.target.value as PersonaGender)}
                    options={GENDER_OPTIONS}
                  />
                  <Select
                    label="Education"
                    value={traits.education}
                    onChange={e => updateTrait('education', e.target.value as PersonaEducation)}
                    options={EDUCATION_OPTIONS}
                  />
                </div>
                <Input
                  label="Location *"
                  value={traits.location}
                  onChange={e => updateTrait('location', e.target.value)}
                  placeholder="e.g. Austin, TX"
                  maxLength={200}
                />
                <Input
                  label="Ethnicity / heritage"
                  value={traits.ethnicity ?? ''}
                  onChange={e => updateTrait('ethnicity', e.target.value)}
                  placeholder="e.g. Chinese-American"
                  maxLength={100}
                />
                <TagInput
                  label="Tags"
                  hint="Press Enter to add — e.g. 'bootstrapped', 'B2B', 'budget-conscious'"
                  tags={tags}
                  onChange={setTags}
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#202124]">Funnel stage</label>
                  <Dropdown
                    size="md"
                    fullWidth
                    value={funnelStage}
                    onChange={v => setFunnelStage(v as FunnelStage)}
                    options={FUNNEL_STAGE_OPTIONS}
                  />
                  <p className="text-xs text-[#5F6368]">Where they sit in the buying journey — this shapes how they react (a new prospect vs. an experienced user). Filterable on the Personas page.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Professional ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Job title *"
                  value={traits.job_title}
                  onChange={e => updateTrait('job_title', e.target.value)}
                  placeholder="e.g. Founder & CEO"
                />
                <Input
                  label="Industry *"
                  value={traits.industry}
                  onChange={e => updateTrait('industry', e.target.value)}
                  placeholder="e.g. SaaS / B2B Software"
                />
              </div>
              <Select
                label="Annual income"
                value={traits.income}
                onChange={e => updateTrait('income', e.target.value as PersonaIncome)}
                options={INCOME_OPTIONS}
              />
              <ListInput
                label="Goals"
                hint="What are they trying to achieve?"
                items={traits.goals}
                onChange={v => updateTrait('goals', v)}
                placeholder="e.g. Find product-market fit before runway runs out"
                max={5}
              />
              <ListInput
                label="Frustrations"
                hint="What keeps them up at night?"
                items={traits.frustrations}
                onChange={v => updateTrait('frustrations', v)}
                placeholder="e.g. Traditional market research is too expensive and slow"
                max={5}
              />
              <Textarea
                label="Buying behavior"
                value={traits.buying_behavior}
                onChange={e => updateTrait('buying_behavior', e.target.value)}
                placeholder="How do they research tools? What do they read, who do they trust, what makes them pull the trigger or walk away?"
                rows={3}
              />
              <ListInput
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
            <div className="space-y-6">
              <Slider
                label="Tech savviness"
                value={traits.tech_savviness}
                onChange={v => updateTrait('tech_savviness', v as 1 | 2 | 3 | 4 | 5)}
                leftLabel="Not technical"
                rightLabel="Developer-level"
              />
              <Slider
                label="Risk tolerance"
                value={traits.risk_tolerance}
                onChange={v => updateTrait('risk_tolerance', v as 1 | 2 | 3 | 4 | 5)}
                leftLabel="Very cautious"
                rightLabel="Early adopter"
              />
              <ListInput
                label="Motivations"
                hint="What drives them, deep down?"
                items={traits.motivations ?? ['']}
                onChange={v => updateTrait('motivations', v)}
                placeholder="e.g. Making an impact through their work"
                max={5}
              />
              <Input
                label="Key quote"
                value={traits.key_quote ?? ''}
                onChange={e => updateTrait('key_quote', e.target.value)}
                placeholder="A first-person sentence that captures how they see the world"
              />
              <Textarea
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
        </div>

        {/* ── AI assistant panel ── */}
        <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
          <button
            onClick={() => setAiPanelOpen(o => !o)}
            className="w-full flex items-center justify-between mb-1"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: '#1C3D2E' }} />
              <span className="text-sm font-semibold" style={{ color: '#202124' }}>AI assistant</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#E8F3EF', color: '#1C3D2E' }}>Beta</span>
            </span>
            {aiPanelOpen ? <ChevronUp size={15} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={15} style={{ color: '#9CA3AF' }} />}
          </button>

          {aiPanelOpen && (
            <>
              <p className="text-xs leading-relaxed mt-2 mb-4" style={{ color: '#5F6368' }}>
                I can help you create a well-rounded persona. Start with a prompt or try an example below.
              </p>

              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#202124' }}>Describe your persona</label>
              <div className="relative mb-4">
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value.slice(0, 300))}
                  placeholder="e.g., A 28-year-old product designer who loves clean UI, works remotely, and cares about sustainability."
                  rows={4}
                  maxLength={300}
                  className="w-full text-sm px-3 py-2 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1C3D2E] focus:border-transparent resize-none"
                  style={{ background: 'white', border: '1px solid #E0E2E4', color: '#202124' }}
                />
                <span className="absolute bottom-2 right-2.5 text-[10px]" style={{ color: '#9CA3AF' }}>{aiPrompt.length}/300</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerate}
                loading={generating}
                className="w-full mb-5"
              >
                Generate
              </Button>

              <label className="block text-xs font-semibold mb-2" style={{ color: '#202124' }}>Or try an example</label>
              <div className="space-y-1.5 mb-3">
                {EXAMPLE_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => { setAiPrompt(prompt); runGenerate(prompt) }}
                    disabled={generating}
                    className="w-full flex items-center justify-between gap-2 text-left text-xs px-3 py-2.5 rounded-lg transition-colors"
                    style={{ background: 'white', border: '1px solid #E0E2E4', color: '#202124', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {prompt}
                    <Sparkles size={12} style={{ color: '#1C3D2E' }} className="flex-shrink-0" />
                  </button>
                ))}
              </div>
              <button
                onClick={handleSurpriseMe}
                disabled={generating}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors disabled:opacity-60"
                style={{ background: 'white', border: '1px solid #E0E2E4', color: '#202124', cursor: surprising ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {surprising ? (
                  <>
                    Generating…
                    <Loader2 size={12} className="animate-spin" style={{ color: '#1C3D2E' }} />
                  </>
                ) : (
                  <>
                    Surprise me
                    <Sparkles size={12} style={{ color: '#1C3D2E' }} />
                  </>
                )}
              </button>

              <p className="text-[11px] italic leading-relaxed mt-4" style={{ color: '#9CA3AF' }}>
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

      {/* Nav buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="secondary"
          onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext}>
            Save and continue
            <ChevronRight size={14} />
          </Button>
        ) : (
          <Button onClick={handleSave} loading={saving}>
            Save persona
          </Button>
        )}
      </div>
    </div>
  )
}
