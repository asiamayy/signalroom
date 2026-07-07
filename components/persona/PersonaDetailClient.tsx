'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles, Loader2, Quote, Database, Activity } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import type { Persona, Interview, Journey } from '@/types'

const TABS = ['Overview', 'Journeys', 'Insights', 'Quotes', 'Data', 'Activity'] as const
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
  const [tab, setTab] = useState<Tab>('Overview')
  const t = persona.traits

  const pills = [
    t?.location,
    t?.age ? `Age ${t.age}` : null,
    t?.income ? incomeMap[t.income] : null,
    t?.education ? educationMap[t.education] : null,
  ].filter(Boolean) as string[]

  return (
    <div style={{ background: '#F9F9F9', minHeight: '100%' }}>

      {/* ── Hero banner ── */}
      <div className="p-4 sm:p-6 pb-0">
        <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(115deg, #1C3D2E 0%, #6E8A7D 55%, #D1E2DB 100%)' }}>

          {/* Wave SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,80 C200,160 400,0 600,100 C750,170 850,60 800,80 L800,220 L0,220Z" fill="white"/>
            <path d="M0,130 C150,60 350,190 550,110 C700,50 800,140 800,100 L800,220 L0,220Z" fill="white" opacity="0.5"/>
          </svg>

          {/* Top right: Start interview + stat cards — desktop only, absolute positioned */}
          <div className="hidden md:flex absolute top-5 right-6 z-20 flex-col items-end gap-3">
            <Link
              href={`/interviews/new?persona_id=${persona.id}`}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: 'rgba(255,255,255,0.95)', color: '#1C3D2E', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Start Interview
            </Link>
            <div className="flex gap-2">
              <div className="text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="text-lg font-bold text-white leading-none">{interviews?.length ?? 0}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Interviews</div>
              </div>
              <div className="text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="text-lg font-bold text-white leading-none">
                  {interviews && interviews.length > 0
                    ? new Date(interviews[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Never'}
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Last active</div>
              </div>
            </div>
          </div>

          {/* Main hero content */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-7 md:pr-[260px]">
            <div className="flex-shrink-0" style={{ border: '3px solid rgba(255,255,255,0.4)', borderRadius: '50%', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
              <PersonaAvatar
                avatarUrl={persona.avatar_url}
                avatarInitials={persona.avatar_initials}
                avatarColor={persona.avatar_color}
                name={persona.name}
                size="xl"
              />
            </div>
            <div className="flex-1 min-w-0 w-full">
              <h1 className="font-serif text-2xl sm:text-3xl text-white tracking-tight mb-1" style={{ letterSpacing: '-0.5px' }}>
                {persona.name}
              </h1>
              <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {t?.job_title}{t?.industry ? ` · ${t.industry}` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {pills.map((val, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full font-medium text-white" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    {val}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: Start interview + stat cards inline below content */}
          <div className="md:hidden relative z-10 flex flex-col gap-3 px-5 pb-5">
            <Link
              href={`/interviews/new?persona_id=${persona.id}`}
              className="flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl w-full"
              style={{ background: 'rgba(255,255,255,0.95)', color: '#1C3D2E', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Start Interview
            </Link>
            <div className="flex gap-2">
              <div className="flex-1 text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="text-lg font-bold text-white leading-none">{interviews?.length ?? 0}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Interviews</div>
              </div>
              <div className="flex-1 text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="text-lg font-bold text-white leading-none">
                  {interviews && interviews.length > 0
                    ? new Date(interviews[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Never'}
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Last active</div>
              </div>
            </div>
          </div>

          {/* Score bars */}
          <div className="relative z-10 flex flex-wrap gap-6 sm:gap-10 px-5 sm:px-8 py-4 sm:py-5" style={{ background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Tech savviness</p>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className="w-5 h-1 rounded-full" style={{ background: n <= (t?.tech_savviness ?? 0) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }} />
                ))}
                <span className="text-xs font-semibold ml-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{t?.tech_savviness ?? 0}/5</span>
              </div>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Risk tolerance</p>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className="w-5 h-1 rounded-full" style={{ background: n <= (t?.risk_tolerance ?? 0) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }} />
                ))}
                <span className="text-xs font-semibold ml-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{t?.risk_tolerance ?? 0}/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 px-4 sm:px-6 mt-5 overflow-x-auto" style={{ borderBottom: '1px solid #E0E2E4' }}>
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

      {/* ── Tab content ── */}
      {tab === 'Overview' && <OverviewTab persona={persona} interviews={interviews} />}
      {tab === 'Journeys' && <JourneysTab persona={persona} />}
      {tab === 'Insights' && <PlaceholderTab icon={Sparkles} title="Insights" description="Cross-interview insights for this persona will appear here once available." />}
      {tab === 'Quotes' && <PlaceholderTab icon={Quote} title="Quotes" description="Notable quotes pulled from this persona's interviews will appear here." />}
      {tab === 'Data' && <PlaceholderTab icon={Database} title="Data" description="Structured data exports for this persona will appear here." />}
      {tab === 'Activity' && <PlaceholderTab icon={Activity} title="Activity" description="A timeline of activity for this persona will appear here." />}
    </div>
  )
}

// ─── Overview tab (existing real data, unchanged content) ───────────────────

function OverviewTab({ persona, interviews }: { persona: Persona; interviews: Interview[] }) {
  const t = persona.traits

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: '#3C4043' }}>Demographics</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Age', value: t?.age },
            { label: 'Gender', value: t?.gender },
            { label: 'Location', value: t?.location },
            { label: 'Education', value: t?.education ? educationMap[t.education] : null },
            { label: 'Income', value: t?.income ? incomeMap[t.income] : null },
            { label: 'Industry', value: t?.industry },
          ].filter(item => item.value).map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs mb-0.5 font-medium" style={{ color: '#9CA3AF' }}>{label}</dt>
              <dd className="text-sm font-medium" style={{ color: '#202124' }}>{value}</dd>
            </div>
          ))}
        </div>
      </div>

      {t?.goals?.filter(Boolean).length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#3C4043' }}>Goals</h2>
          <ul className="space-y-2.5">
            {t.goals.filter(Boolean).map((g: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#5F6368' }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: '#1C3D2E' }}>→</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {t?.frustrations?.filter(Boolean).length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#3C4043' }}>Frustrations</h2>
          <ul className="space-y-2.5">
            {t.frustrations.filter(Boolean).map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#5F6368' }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: '#DB4437' }}>→</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {t?.buying_behavior && (
        <div className="md:col-span-2 rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: '#3C4043' }}>Buying Behavior</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#5F6368' }}>{t.buying_behavior}</p>
        </div>
      )}

      <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: '#3C4043' }}>Interviews</h2>
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

      {t?.additional_context && (
        <div className="md:col-span-2 rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #E0E2E4' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: '#3C4043' }}>Additional Context</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#5F6368' }}>{t.additional_context}</p>
        </div>
      )}

    </div>
  )
}

// ─── Journeys tab ─────────────────────────────────────────────────────────────

function JourneysTab({ persona }: { persona: Persona }) {
  const [journeys, setJourneys] = useState<Journey[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/personas/${persona.id}/journeys`)
      .then(r => r.json())
      .then(json => {
        const data: Journey[] = json.data ?? []
        setJourneys(data)
        setActiveJourneyId(data[0]?.id ?? null)
      })
      .catch(() => setJourneys([]))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona.id])

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

      {loading ? (
        <p className="text-sm" style={{ color: '#5F6368' }}>Loading…</p>
      ) : !journeys || journeys.length === 0 ? (
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
    if (score < 3) return { bg: '#E8F3EF', text: '#1C3D2E' }
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
