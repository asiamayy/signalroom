'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, Sparkles, Loader2, Quote, Database, Activity, Share2, MoreHorizontal,
  BadgeCheck, Briefcase, MapPin, User, Target, AlertTriangle, ShoppingCart, Tag as TagIcon,
  Bookmark, Archive, Trash2, Check,
} from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import type { Persona, Interview, Journey } from '@/types'

const TABS = ['Overview', 'Insights', 'Journeys', 'Quotes', 'Data', 'Activity'] as const
type Tab = typeof TABS[number]

const incomeMap: Record<string, string> = {
  under_50k: 'Under $50k',
  '50k_100k': '$50k–$100k',
  '100k_200k': '$100k–$200k',
  over_200k: 'Over $200k',
}

const educationMap: Record<string, string> = {
  high_school: 'High School',
  bachelors: "Bachelor's",
  masters: "Master's",
  phd: 'PhD',
}

interface PersonaDetailClientProps {
  persona: Persona
  interviews: Interview[]
}

export function PersonaDetailClient({ persona, interviews }: PersonaDetailClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Overview')
  const [journeys, setJourneys] = useState<Journey[] | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const t = persona.traits

  useEffect(() => {
    fetch(`/api/personas/${persona.id}/journeys`)
      .then(r => r.json())
      .then(json => setJourneys(json.data ?? []))
      .catch(() => setJourneys([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona.id])

  useEffect(() => {
    if (!showMoreMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setShowMoreMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMoreMenu])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      const res = await fetch('/api/personas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: persona.id, action: 'archive' }),
      })
      if (res.ok) { router.push('/personas'); router.refresh() }
    } finally {
      setArchiving(false)
      setShowMoreMenu(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Permanently delete this persona? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch('/api/personas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: persona.id }),
      })
      if (res.ok) { router.push('/personas'); router.refresh() }
    } finally {
      setDeleting(false)
      setShowMoreMenu(false)
    }
  }

  const pills = persona.tags ?? []

  return (
    <div style={{ background: '#F9F9F9', minHeight: '100%' }}>

      {/* ── Breadcrumb + top actions ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 sm:px-6 pt-5 pb-3">
        <div className="flex items-center gap-1.5 text-sm min-w-0" style={{ color: '#9CA3AF' }}>
          <Link href="/personas" className="hover:underline" style={{ color: '#9CA3AF' }}>Personas</Link>
          <ChevronRight size={13} />
          <Link href="/personas" className="hover:underline" style={{ color: '#9CA3AF' }}>All personas</Link>
          <ChevronRight size={13} />
          <span className="truncate" style={{ color: '#202124' }}>{persona.name}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleShare}
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{ background: 'white', border: '1px solid #E0E2E4', color: '#202124', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {copied ? 'Copied!' : 'Share'}
          </button>

          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(o => !o)}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: 'white', border: '1px solid #E0E2E4', color: '#5F6368', cursor: 'pointer' }}
            >
              <MoreHorizontal size={16} />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.08)', minWidth: '180px' }}>
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#202124' }}
                >
                  <Archive size={14} />
                  {archiving ? 'Archiving…' : 'Archive persona'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#DB4437' }}
                >
                  <Trash2 size={14} />
                  {deleting ? 'Deleting…' : 'Delete persona'}
                </button>
              </div>
            )}
          </div>

          <Link
            href={`/interviews/new?persona_id=${persona.id}`}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ background: '#1C3D2E' }}
          >
            Start Interview
          </Link>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="px-4 sm:px-6 pb-2">
        <div className="rounded-2xl overflow-hidden relative p-5 sm:p-7" style={{ background: 'linear-gradient(135deg, #F3F5F1 0%, #EAEFE9 100%)', border: '1px solid #E5E9E4' }}>

          {/* Soft abstract blobs */}
          <div className="absolute rounded-full pointer-events-none" style={{ width: 260, height: 260, right: -60, top: -80, background: 'radial-gradient(circle, rgba(110,138,125,0.18) 0%, rgba(110,138,125,0) 70%)' }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: 200, height: 200, right: 120, bottom: -80, background: 'radial-gradient(circle, rgba(28,61,46,0.10) 0%, rgba(28,61,46,0) 70%)' }} />

          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-5 sm:gap-6 md:pr-64">
            <div className="relative flex-shrink-0">
              <PersonaAvatar
                avatarUrl={persona.avatar_url}
                avatarInitials={persona.avatar_initials}
                avatarColor={persona.avatar_color}
                name={persona.name}
                size="xl"
                className="shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#1C3D2E', border: '2px solid #F3F5F1' }}>
                <Check size={11} color="white" strokeWidth={3} />
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="font-serif text-2xl sm:text-3xl tracking-tight" style={{ color: '#202124' }}>{persona.name}</h1>
                <BadgeCheck size={20} style={{ color: '#1C3D2E' }} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-3" style={{ color: '#5F6368' }}>
                {t?.job_title && <span className="flex items-center gap-1.5"><Briefcase size={13} />{t.job_title}</span>}
                {t?.location && <span className="flex items-center gap-1.5"><MapPin size={13} />{t.location}</span>}
                {t?.age && <span className="flex items-center gap-1.5"><User size={13} />{t.age} years</span>}
              </div>
              {pills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pills.map(tag => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'white', color: '#4B5563', border: '1px solid #E0E2E4' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stat box — desktop, top-right */}
          <div className="hidden md:block absolute top-6 right-6 z-20 rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E0E2E4', minWidth: '220px' }}>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xl font-bold leading-none" style={{ color: '#202124' }}>{interviews?.length ?? 0}</div>
                <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Interviews</div>
              </div>
              <div>
                <div className="text-xl font-bold leading-none" style={{ color: '#202124' }}>{journeys?.length ?? 0}</div>
                <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Journeys</div>
              </div>
            </div>
            <p className="text-[11px] pt-3" style={{ color: '#9CA3AF', borderTop: '1px solid #F1F1F1' }}>
              Last updated {new Date(persona.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Stat row — mobile */}
          <div className="md:hidden relative z-10 flex gap-3 mt-5">
            <div className="flex-1 text-center rounded-xl p-3" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
              <div className="text-lg font-bold leading-none" style={{ color: '#202124' }}>{interviews?.length ?? 0}</div>
              <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Interviews</div>
            </div>
            <div className="flex-1 text-center rounded-xl p-3" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
              <div className="text-lg font-bold leading-none" style={{ color: '#202124' }}>{journeys?.length ?? 0}</div>
              <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Journeys</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs + Save persona ── */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 overflow-x-auto" style={{ borderBottom: '1px solid #E0E2E4' }}>
        <div className="flex gap-1">
          {TABS.map(tabName => (
            <button
              key={tabName}
              onClick={() => setTab(tabName)}
              className="px-4 py-2.5 text-sm font-semibold transition-colors flex-shrink-0"
              style={{
                color: tab === tabName ? '#1C3D2E' : '#757575',
                borderBottom: tab === tabName ? '2px solid #1C3D2E' : '2px solid transparent',
                background: 'none', border: 'none', borderBottomWidth: '2px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {tabName}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSaved(s => !s)}
          className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex-shrink-0 my-2"
          style={{ background: 'white', border: '1px solid #E0E2E4', color: saved ? '#1C3D2E' : '#5F6368', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Bookmark size={13} fill={saved ? '#1C3D2E' : 'none'} />
          {saved ? 'Saved' : 'Save persona'}
        </button>
      </div>

      {/* ── Tab content ── */}
      {tab === 'Overview' && <OverviewTab persona={persona} interviews={interviews} />}
      {tab === 'Journeys' && <JourneysTab persona={persona} journeys={journeys} setJourneys={setJourneys} />}
      {tab === 'Insights' && <PlaceholderTab icon={Sparkles} title="Insights" description="Cross-interview insights for this persona will appear here once available." />}
      {tab === 'Quotes' && <PlaceholderTab icon={Quote} title="Quotes" description="Notable quotes pulled from this persona's interviews will appear here." />}
      {tab === 'Data' && <PlaceholderTab icon={Database} title="Data" description="Structured data exports for this persona will appear here." />}
      {tab === 'Activity' && <PlaceholderTab icon={Activity} title="Activity" description="A timeline of activity for this persona will appear here." />}
    </div>
  )
}

// ─── Overview tab (existing real data, unchanged content) ───────────────────

function CardHeader({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={15} style={{ color: '#1C3D2E' }} />
      <h2 className="text-sm font-bold" style={{ color: '#3C4043' }}>{title}</h2>
    </div>
  )
}

function OverviewTab({ persona, interviews }: { persona: Persona; interviews: Interview[] }) {
  const t = persona.traits

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {t?.additional_context && (
        <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
          <CardHeader icon={User} title="About" />
          <p className="text-sm leading-relaxed" style={{ color: '#5F6368' }}>{t.additional_context}</p>
        </div>
      )}

      {t?.goals?.filter(Boolean).length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
          <CardHeader icon={Target} title="Goals" />
          <ul className="space-y-2.5">
            {t.goals.filter(Boolean).map((g: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#5F6368' }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: '#1C3D2E' }}>✓</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {t?.frustrations?.filter(Boolean).length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
          <CardHeader icon={AlertTriangle} title="Frustrations" />
          <ul className="space-y-2.5">
            {t.frustrations.filter(Boolean).map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#5F6368' }}>
                <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#DB4437' }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
        <CardHeader icon={MapPin} title="Demographics" />
        <div className="space-y-2.5">
          {[
            { label: 'Age', value: t?.age },
            { label: 'Location', value: t?.location },
            { label: 'Gender', value: t?.gender },
            { label: 'Education', value: t?.education ? educationMap[t.education] : null },
            { label: 'Income', value: t?.income ? incomeMap[t.income] : null },
            { label: 'Industry', value: t?.industry },
            { label: 'Tech savviness', value: t?.tech_savviness ? `${t.tech_savviness}/5` : null },
            { label: 'Risk tolerance', value: t?.risk_tolerance ? `${t.risk_tolerance}/5` : null },
          ].filter(item => item.value).map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <dt style={{ color: '#9CA3AF' }}>{label}</dt>
              <dd className="font-medium" style={{ color: '#202124' }}>{value}</dd>
            </div>
          ))}
        </div>
      </div>

      {t?.buying_behavior && (
        <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
          <CardHeader icon={ShoppingCart} title="Buying Behavior" />
          <p className="text-sm leading-relaxed" style={{ color: '#5F6368' }}>{t.buying_behavior}</p>
        </div>
      )}

      <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase size={15} style={{ color: '#1C3D2E' }} />
            <h2 className="text-sm font-bold" style={{ color: '#3C4043' }}>Interviews</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#E8F3EF', color: '#1C3D2E' }}>
            {interviews?.length ?? 0}
          </span>
        </div>
        {(!interviews || interviews.length === 0) ? (
          <div className="text-center py-4">
            <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>No interviews yet</p>
            <Link href={`/interviews/new?persona_id=${persona.id}`} className="text-xs font-semibold" style={{ color: '#1C3D2E' }}>
              Start first interview →
            </Link>
          </div>
        ) : (
          <div className="space-y-0.5">
            {interviews.map((iv: Interview) => (
              <Link key={iv.id} href={`/interviews/${iv.id}`} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors group">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#202124' }}>{iv.title}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{INTERVIEW_TYPE_LABELS[iv.type]}</p>
                </div>
                <ChevronRight size={12} className="text-neutral-300 group-hover:text-neutral-500 flex-shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {persona.tags && persona.tags.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
          <CardHeader icon={TagIcon} title="Tags" />
          <div className="flex flex-wrap gap-1.5">
            {persona.tags.map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#F1F1F1', color: '#4B5563' }}>{tag}</span>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Journeys tab ─────────────────────────────────────────────────────────────

function JourneysTab({ persona, journeys, setJourneys }: { persona: Persona; journeys: Journey[] | null; setJourneys: (fn: (prev: Journey[] | null) => Journey[] | null) => void }) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null)

  useEffect(() => {
    if (journeys && journeys.length > 0 && !activeJourneyId) setActiveJourneyId(journeys[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeys])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/personas/${persona.id}/journeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${persona.name}'s user journey` }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setJourneys(prev => [json.data, ...(prev ?? [])])
      setActiveJourneyId(json.data.id)
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate journey')
    } finally {
      setGenerating(false)
    }
  }

  const activeJourney = journeys?.find(j => j.id === activeJourneyId) ?? null

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-xl" style={{ color: '#202124' }}>User journeys</h2>
          <p className="text-sm mt-0.5" style={{ color: '#5F6368' }}>AI-generated step-by-step timelines of this persona's experience.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg text-white disabled:opacity-60"
          style={{ background: '#1C3D2E', border: 'none', cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Generating…' : 'Generate journey'}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm rounded-lg px-3 py-2" style={{ color: '#DB4437', background: '#FEF2F1', border: '1px solid #F8D7D3' }}>
          {error}
        </p>
      )}

      {journeys === null ? (
        <p className="text-sm" style={{ color: '#5F6368' }}>Loading…</p>
      ) : journeys.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl py-16" style={{ background: 'white', border: '1px dashed #E0E2E4' }}>
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#E8F3EF' }}>
              <Sparkles size={20} style={{ color: '#1C3D2E' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#202124' }}>No journeys yet</p>
            <p className="text-xs mt-1" style={{ color: '#5F6368' }}>Generate an AI-driven user journey to see this persona's phases, actions, thoughts, and friction points mapped out step by step.</p>
          </div>
        </div>
      ) : (
        <>
          {journeys.length > 1 && (
            <div className="flex gap-2 mb-5 overflow-x-auto">
              {journeys.map(j => (
                <button
                  key={j.id}
                  onClick={() => setActiveJourneyId(j.id)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors"
                  style={activeJourneyId === j.id
                    ? { background: '#1C3D2E', color: 'white', border: '1px solid #1C3D2E' }
                    : { background: 'white', color: '#5F6368', border: '1px solid #E0E2E4' }}
                >
                  {j.title}
                </button>
              ))}
            </div>
          )}
          {activeJourney && <JourneyTimeline journey={activeJourney} />}
        </>
      )}
    </div>
  )
}

function JourneyTimeline({ journey }: { journey: Journey }) {
  const scoreColor = (score: number) => {
    if (score <= -3) return { bg: '#FEF2F1', text: '#DB4437' }
    if (score < 0) return { bg: '#FDF6E3', text: '#B45309' }
    if (score === 0) return { bg: '#F3F4F6', text: '#5F6368' }
    return { bg: '#E8F3EF', text: '#1C3D2E' }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {journey.steps.map((step, i) => {
        const colors = scoreColor(step.emotional_score)
        return (
          <div key={step.id ?? i} className="flex items-start flex-shrink-0" style={{ width: 260 }}>
            <div className="w-full">
              {/* Phase marker */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#1C3D2E' }}>
                  {i + 1}
                </div>
                {i < journey.steps.length - 1 && (
                  <div className="h-px flex-1" style={{ background: '#E0E2E4' }} />
                )}
              </div>

              <div className="rounded-2xl p-4 h-full" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#757575' }}>{step.phase_name}</p>

                <p className="text-sm font-medium mb-2" style={{ color: '#202124' }}>{step.user_action}</p>
                <p className="text-xs italic leading-relaxed mb-3" style={{ color: '#5F6368' }}>&ldquo;{step.internal_thoughts}&rdquo;</p>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.text }}>
                    {step.emotional_score > 0 ? `+${step.emotional_score}` : step.emotional_score}
                  </span>
                  <span className="text-[10px]" style={{ color: '#9CA3AF' }}>emotional score</span>
                </div>

                {step.friction_point && (
                  <div className="rounded-lg px-3 py-2" style={{ background: '#FEF2F1', border: '1px solid #F8D7D3' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#DB4437' }}>Friction point</p>
                    <p className="text-xs leading-snug" style={{ color: '#B4392E' }}>{step.friction_point}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Placeholder tabs ─────────────────────────────────────────────────────────

function PlaceholderTab({ icon: Icon, title, description }: { icon: typeof Sparkles; title: string; description: string }) {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-center rounded-2xl py-16" style={{ background: 'white', border: '1px dashed #E0E2E4' }}>
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#E8F3EF' }}>
            <Icon size={20} style={{ color: '#1C3D2E' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: '#202124' }}>{title}</p>
          <p className="text-xs mt-1" style={{ color: '#5F6368' }}>{description}</p>
        </div>
      </div>
    </div>
  )
}
