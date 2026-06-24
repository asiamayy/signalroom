'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ChevronRight, ChevronLeft, User, Briefcase, Brain, Check, Camera, Loader2 } from 'lucide-react'
import { Button, Input, Textarea, Select, Slider, TagInput, ListInput, Card } from '@/components/ui'
import { cn, getAvatarColor, getInitials } from '@/lib/utils'
import type { PersonaTraits, PersonaGender, PersonaIncome, PersonaEducation } from '@/types'

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'psychology', label: 'Psychology', icon: Brain },
]

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PersonaBuilder() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [traits, setTraits] = useState<PersonaTraits>(DEFAULT_TRAITS)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatingAvatar, setGeneratingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const avatarColor = getAvatarColor(name || 'A')
  const initials = name ? getInitials(name) : '?'

  // ─── AI generation ──────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: true, description: aiPrompt }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      const s = json.data
      setName(s.name ?? '')
      setTags(s.tags ?? [])
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
      })
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate persona')
    } finally {
      setGenerating(false)
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

  // ─── Save ────────────────────────────────────────────────────────────────────

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
        body: JSON.stringify({ name, tags, traits, avatar_url: avatarUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      router.push('/personas')
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Failed to save persona')
      setSaving(false)
    }
  }

  const updateTrait = <K extends keyof PersonaTraits>(key: K, value: PersonaTraits[K]) => {
    setTraits(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif tracking-tight text-neutral-900">New persona</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Define who you want to interview</p>
      </div>

      {/* AI quick-start */}
      <Card className="p-4 mb-6 border-emerald-100 bg-emerald-50/40">
        <div className="flex items-start gap-3">
          <Sparkles size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-900 mb-2">Generate with AI</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. 35-year-old startup founder in NYC, bootstrapped, technical"
                className="flex-1 text-sm px-3 py-2 bg-white border border-emerald-200 rounded-md placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerate}
                loading={generating}
                className="bg-emerald-700 hover:bg-emerald-800 whitespace-nowrap"
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-emerald-700 mt-1.5">Describe your target customer and AI will fill in the details</p>
          </div>
        </div>
      </Card>

      {/* Step progress */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const active = i === step
          const done = i < step
          return (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => i <= step && setStep(i)}
                className={cn(
                  'flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition-colors',
                  active ? 'text-neutral-900 font-medium' : done ? 'text-neutral-500 hover:text-neutral-700 cursor-pointer' : 'text-neutral-400 cursor-default'
                )}
              >
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                  active ? 'bg-neutral-900 text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-400'
                )}>
                  {done ? <Check size={10} /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className="text-neutral-300 mx-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Preview avatar */}
      <div className="flex items-center gap-3 mb-6 p-3 bg-neutral-50 border border-neutral-100 rounded-lg">
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ background: avatarColor.bg, color: avatarColor.text }}
            >
              {initials}
            </div>
          )}
          {generatingAvatar && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Loader2 size={14} className="text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900">{name || 'Unnamed persona'}</p>
          <p className="text-xs text-neutral-500">
            {traits.job_title ? `${traits.job_title}${traits.location ? ` · ${traits.location}` : ''}` : 'Fill in details below'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateAvatar}
          disabled={generatingAvatar || !name}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors flex-shrink-0',
            name && !generatingAvatar
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-neutral-200 text-neutral-400 cursor-not-allowed'
          )}
        >
          <Camera size={12} />
          {generatingAvatar ? 'Generating...' : avatarUrl ? 'Regenerate' : 'Generate avatar'}
        </button>
      </div>

      {/* ── Step 0: Identity ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <Input
            label="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Maya Chen"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Age"
              type="number"
              min={18}
              max={80}
              value={traits.age}
              onChange={e => updateTrait('age', Number(e.target.value))}
            />
            <Select
              label="Gender"
              value={traits.gender}
              onChange={e => updateTrait('gender', e.target.value as PersonaGender)}
              options={GENDER_OPTIONS}
            />
          </div>
          <Input
            label="Location"
            value={traits.location}
            onChange={e => updateTrait('location', e.target.value)}
            placeholder="e.g. Austin, TX"
          />
          <Select
            label="Education"
            value={traits.education}
            onChange={e => updateTrait('education', e.target.value as PersonaEducation)}
            options={EDUCATION_OPTIONS}
          />
          <TagInput
            label="Tags"
            hint="Press Enter to add — e.g. 'bootstrapped', 'B2B', 'budget-conscious'"
            tags={tags}
            onChange={setTags}
          />
        </div>
      )}

      {/* ── Step 1: Professional ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <Input
            label="Job title"
            value={traits.job_title}
            onChange={e => updateTrait('job_title', e.target.value)}
            placeholder="e.g. Founder & CEO"
          />
          <Input
            label="Industry"
            value={traits.industry}
            onChange={e => updateTrait('industry', e.target.value)}
            placeholder="e.g. SaaS / B2B Software"
          />
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
        </div>
      )}

      {/* ── Step 2: Psychology ───────────────────────────────────────────── */}
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

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Nav buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-neutral-100">
        <Button
          variant="secondary"
          onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
        >
          <ChevronLeft size={14} />
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)}>
            Continue
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
