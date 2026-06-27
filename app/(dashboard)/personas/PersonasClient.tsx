'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { OnboardingModal } from '@/components/ui/OnboardingModal'
import { cn } from '@/lib/utils'
import type { Persona, Plan } from '@/types'

interface PersonasClientProps {
  initialPersonas: Persona[]
  plan: Plan
  limit: number
  count: number
}

const SECTION_CARDS = [
  { title: 'Frustrations', color: '#1A8C6A', items: ['Traditional research takes weeks', 'Agency fees are too high', 'Hard to justify budget'] },
  { title: 'Motivations', color: '#1A8C6A', items: ['Prove ROI to leadership quickly', 'Move faster than the competition', 'Find tools that fit sprint cycles'] },
  { title: 'Buying Behavior', color: '#1A8C6A', items: ['Reads G2 reviews before buying', 'Always starts with a free trial', 'Cancels if no value in week 1', 'Needs ROI story for leadership'] },
  { title: 'Buying Behavior', color: '#1A8C6A', items: ['Research-heavy decision process', 'Procurement approval required', 'ROI-focused evaluation', 'Responds to case studies'] },
]

export default function PersonasClient({ initialPersonas, plan, limit, count }: PersonasClientProps) {
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Interview')

  const atLimit = limit !== Infinity && personas.length >= limit
  const tabs = ['Interview', 'Insights', 'Performance', 'Recommendations']

  const handleDelete = async (e: React.MouseEvent, personaId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this persona? This cannot be undone.')) return
    setDeleting(personaId)
    try {
      const res = await fetch('/api/personas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: personaId }),
      })
      if (res.ok) setPersonas(prev => prev.filter(p => p.id !== personaId))
    } finally {
      setDeleting(null)
    }
  }

  const filtered = personas.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.traits?.job_title ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <OnboardingModal />
      <div style={{ background: '#F4F6F8', minHeight: '100%' }}>

        {/* ── Topbar ── */}
        <div className="flex items-center justify-between px-6 py-3.5" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 max-w-xs flex-1" style={{ background: '#F3F4F6' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search AI personas"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm bg-transparent outline-none w-full text-neutral-800 placeholder:text-neutral-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {atLimit ? (
              <Link href="/settings" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: '#F3F4F6', color: '#374151', border: '1px solid rgba(0,0,0,0.1)' }}>
                Upgrade
              </Link>
            ) : (
              <Link href="/personas/new" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: 'white', color: '#374151', border: '1px solid rgba(0,0,0,0.12)' }}>
                <Plus size={13} />
                Create
              </Link>
            )}
            <Link href="/personas/new" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white" style={{ background: '#1A8C6A' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Generate
            </Link>
          </div>
        </div>

        {/* ── Horizontal tabs ── */}
        <div className="flex px-6" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3.5 text-sm font-medium transition-all"
              style={{
                color: activeTab === tab ? '#0D5C45' : '#9CA3AF',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: activeTab === tab ? '2px solid #1A8C6A' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: activeTab === tab ? '600' : '500',
                background: 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">

          {/* ── Empty state ── */}
          {personas.length === 0 && (
            <div className="flex items-center justify-center rounded-2xl py-16" style={{ background: 'white', border: '2px dashed rgba(0,0,0,0.1)' }}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                  <Plus size={20} className="text-neutral-400" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800 mb-1">No personas yet</h3>
                <p className="text-sm text-neutral-400 mb-5">Create your first persona to start interviewing.</p>
                <Link href="/personas/new" className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-2.5 rounded-xl" style={{ background: '#1A8C6A' }}>
                  <Plus size={14} /> Create a persona
                </Link>
              </div>
            </div>
          )}

          {/* ── Persona cards grid ── */}
          {filtered.length > 0 && (
            <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {filtered.map((persona: Persona) => (
                <div
                  key={persona.id}
                  className="relative group rounded-2xl overflow-hidden transition-all duration-200"
                  style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1.5px solid rgba(0,0,0,0.05)' }}
                >
                  {/* Three dot menu */}
                  <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(e, persona.id)}
                      disabled={deleting === persona.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors"
                      style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                      title="Delete"
                    >
                      {deleting === persona.id
                        ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      }
                    </button>
                  </div>

                  {/* Card body - centered */}
                  <div className="pt-6 px-5 pb-0 flex flex-col items-center text-center">
                    <PersonaAvatar
                      avatarUrl={persona.avatar_url}
                      avatarInitials={persona.avatar_initials}
                      avatarColor={persona.avatar_color}
                      name={persona.name}
                      size="lg"
                      className="mb-3 shadow-md"
                    />
                    <h3 className="text-base font-bold text-neutral-900 mb-0.5">{persona.name}</h3>
                    <p className="text-xs text-neutral-400 mb-3">
                      {persona.traits?.job_title ?? 'No role'}{persona.traits?.location ? ` · ${persona.traits.location}` : ''}
                    </p>

                    {/* Tags */}
                    {persona.tags && persona.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                        {persona.tags.slice(0, 2).map((tag: string, i: number) => (
                          <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1"
                            style={i === 0
                              ? { background: '#E8F5F1', color: '#0D5C45' }
                              : { background: '#F3F4F6', color: '#6B7280' }
                            }>
                            {i === 0 && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-xs text-neutral-400 leading-relaxed mb-4 line-clamp-3 text-center px-1">
                      {persona.traits?.additional_context ?? `${persona.traits?.job_title ?? 'A persona'} with defined goals and behaviors.`}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-4 flex gap-2" style={{ borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                    <Link
                      href={`/compare?persona_id=${persona.id}`}
                      className="flex-1 text-center text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1"
                      style={{ background: 'white', border: '1px solid rgba(0,0,0,0.12)', color: '#374151' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      Compare
                    </Link>
                    <Link
                      href={`/interviews/new?persona_id=${persona.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl text-white transition-all"
                      style={{ background: '#1A8C6A' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 8 19 8"/></svg>
                      Generate
                    </Link>
                  </div>
                </div>
              ))}

              {/* New persona card */}
              {!atLimit && (
                <Link
                  href="/personas/new"
                  className="flex items-center justify-center rounded-2xl transition-all duration-200 min-h-[300px]"
                  style={{ background: 'white', border: '2px dashed rgba(0,0,0,0.1)' }}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                      <Plus size={20} className="text-neutral-400" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-500">New persona</p>
                    <p className="text-xs text-neutral-400 mt-1">AI-assisted · 2 min</p>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* ── Section cards below ── */}
          {personas.length > 0 && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {SECTION_CARDS.map((section, i) => (
                <div key={i} className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-neutral-900">{section.title}</h3>
                    <button className="text-neutral-300">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-neutral-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1A8C6A" strokeWidth="2.5" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
