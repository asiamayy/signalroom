'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Check, LayoutGrid, List, ChevronDown, Eye } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { OnboardingModal } from '@/components/ui/OnboardingModal'
import { Modal } from '@/components/ui/Modal'
import { withViewTransition } from '@/lib/viewTransition'
import type { Persona, Plan } from '@/types'

interface PersonasClientProps {
  initialPersonas: Persona[]
  plan: Plan
  limit: number
  count: number
}

const FILTER_TABS = ['All Personas', 'Active', 'Archived'] as const
type FilterTab = typeof FILTER_TABS[number]

export default function PersonasClient({ initialPersonas, plan, limit, count }: PersonasClientProps) {
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [archiving, setArchiving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('All Personas')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('Recently updated')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [modalPersonaId, setModalPersonaId] = useState<string | null>(null)

  const active = personas.filter(p => !p.archived)
  const archived = personas.filter(p => p.archived)
  // Total personas (active + archived) counts toward limit
  const atLimit = limit !== Infinity && personas.length >= limit
  const modalPersona = personas.find(p => p.id === modalPersonaId) ?? null

  // "Show preview" always selects the card too (harmless if already selected)
  // so the modal's shared-element morph always starts from a selected card.
  const showPersonaPreview = (personaId: string) => {
    withViewTransition(() => {
      setSelectedId(personaId)
      setModalPersonaId(personaId)
    }, 'open')
  }
  const handleDelete = async (e: React.MouseEvent, personaId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Permanently delete this persona? This cannot be undone.')) return
    setDeleting(personaId)
    try {
      const res = await fetch('/api/personas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: personaId }),
      })
      if (res.ok) {
        setPersonas(prev => {
          const next = prev.filter(p => p.id !== personaId)
          setSelectedId(next.find(p => !p.archived)?.id ?? null)
          return next
        })
      }
    } finally {
      setDeleting(null)
    }
  }

  const handleArchive = async (e: React.MouseEvent, personaId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    setArchiving(personaId)
    try {
      const res = await fetch('/api/personas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: personaId, action: 'archive' }),
      })
      if (res.ok) {
        setPersonas(prev => prev.map(p => p.id === personaId ? { ...p, archived: true } : p))
        // Only clear selectedId if THIS persona was the selected one
        // If Marcus is selected and we archive Tyler, Marcus stays selected
        setSelectedId(prev => prev === personaId ? null : prev)
      }
    } finally {
      setArchiving(null)
    }
  }

  const handleRestore = async (personaId: string) => {
    try {
      const res = await fetch('/api/personas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: personaId, action: 'restore' }),
      })
      if (res.ok) {
        setPersonas(prev => prev.map(p => p.id === personaId ? { ...p, archived: false } : p))
      }
    } catch {}
  }

  const SORT_OPTIONS = ['Recently updated', 'Recently created', 'Alphabetical']
  const [showSortMenu, setShowSortMenu] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!showSortMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSortMenu])

  const sortPersonas = (list: Persona[]) => {
    if (sortBy === 'Recently updated') return [...list].sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime())
    if (sortBy === 'Recently created') return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (sortBy === 'Alphabetical') return [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }

  const baseFiltered = filterTab === 'Archived'
    ? personas.filter(p => p.archived)
    : personas.filter(p => !p.archived)

  const filtered = sortPersonas(baseFiltered.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.traits?.job_title ?? '').toLowerCase().includes(search.toLowerCase())
  ))

  // Select the first persona in the actual displayed (sorted) order, only on initial load
  useEffect(() => {
    if (selectedId === null && filtered.length > 0) {
      setSelectedId(filtered[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length])

  return (
    <>
      <OnboardingModal />
      <div style={{ background: '#F4F6F8', minHeight: '100%' }}>

        {/* ── Topbar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 w-full sm:max-w-xs flex-1" style={{ background: '#F3F4F6' }}>
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {atLimit ? (
              <Link href="/settings" className="flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl flex-1 sm:flex-none" style={{ background: '#E8F5F1', color: '#0D5C45', border: '1px solid #A7D9C8' }}>
                Upgrade plan
              </Link>
            ) : (
              <Link href="/personas/new" className="flex items-center justify-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl text-white flex-1 sm:flex-none" style={{ background: 'linear-gradient(135deg, #1A8C6A 0%, #2BAE86 100%)', boxShadow: '0 2px 8px rgba(26,140,106,0.3)' }}>
                <Plus size={14} />
                Create Persona
              </Link>
            )}
          </div>
        </div>

        {/* ── Filter tabs + sort/view controls ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 px-4 sm:px-6" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex overflow-x-auto">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setFilterTab(tab)
                  // Reset selection when switching tabs so no panel carries over
                  setSelectedId(null)
                }}
                className="px-4 py-3.5 text-sm transition-all flex-shrink-0"
                style={{
                  color: filterTab === tab ? '#0D5C45' : '#9CA3AF',
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  borderBottom: filterTab === tab ? '2px solid #1A8C6A' : '2px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: filterTab === tab ? 600 : 500,
                  background: 'none',
                }}
              >
                {tab} {tab === 'All Personas' ? `(${active.length})` : tab === 'Active' ? `(${active.length})` : `(${archived.length})`}
              </button>
            ))}
          </div>

          {/* Sort + view toggle */}
          <div className="flex items-center gap-3 py-2 flex-shrink-0">
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu(o => !o)}
                className="flex items-center gap-1.5 text-sm text-neutral-600 font-medium"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Sort by: {sortBy}
                <ChevronDown size={13} className="text-neutral-400" />
              </button>
              {showSortMenu && (
                <div className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-50" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.08)', minWidth: '180px' }}>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setShowSortMenu(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between"
                      style={{ background: sortBy === opt ? '#E8F5F1' : 'white', color: sortBy === opt ? '#0D5C45' : '#374151', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {opt}
                      {sortBy === opt && <Check size={13} style={{ color: '#1A8C6A' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="px-2.5 py-1.5 transition-colors"
                style={{ background: viewMode === 'grid' ? '#F3F4F6' : 'white', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? '#1A8C6A' : '#9CA3AF' }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="px-2.5 py-1.5 transition-colors"
                style={{ background: viewMode === 'list' ? '#F3F4F6' : 'white', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? '#1A8C6A' : '#9CA3AF', borderLeft: '1px solid rgba(0,0,0,0.1)' }}
              >
                <List size={15} />
              </button>
            </div>
          </div>
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
                <Link href="/personas/new" className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #1A8C6A 0%, #2BAE86 100%)', boxShadow: '0 2px 8px rgba(26,140,106,0.3)' }}>
                  <Plus size={14} /> Create Persona
                </Link>
              </div>
            </div>
          )}

          {/* ── Grid view ── */}
          {filtered.length > 0 && viewMode === 'grid' && filterTab !== 'Archived' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {filtered.map((persona: Persona) => {
                const isSelected = selectedId === persona.id
                return (
                  <div
                    key={persona.id}
                    className="relative group rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
                    onClick={(e) => {
                      // Don't change selection if clicking archive button area
                      const target = e.target as HTMLElement
                      if (target.closest('[data-archive-btn]')) return
                      setSelectedId(persona.id)
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                    style={{
                      background: 'white',
                      boxShadow: isSelected ? '0 0 0 2px #1A8C6A, 0 4px 16px rgba(26,140,106,0.12)' : '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
                      border: isSelected ? '1.5px solid #1A8C6A' : '1.5px solid rgba(0,0,0,0.05)',
                      transform: 'translateY(0)',
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                      viewTransitionName: modalPersonaId === persona.id ? undefined : `persona-card-${persona.id}`,
                    } as React.CSSProperties}
                  >
                    {/* Green checkmark when selected */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#1A8C6A' }}>
                        <Check size={12} color="white" strokeWidth={3} />
                      </div>
                    )}

                    {/* Archive button — always visible on mobile, hover-only on desktop */}
                    {!isSelected && (
                      <div
                        data-archive-btn="true"
                        className="absolute top-3 right-3 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleArchive(e, persona.id)}
                          disabled={archiving === persona.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-amber-500 transition-colors"
                          style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                          title="Archive persona"
                        >
                          {archiving === persona.id
                            ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                          }
                        </button>
                      </div>
                    )}

                    <div className="pt-6 px-5 pb-0 flex flex-col items-center text-center">
                      <PersonaAvatar
                        avatarUrl={persona.avatar_url}
                        avatarInitials={persona.avatar_initials}
                        avatarColor={persona.avatar_color}
                        name={persona.name}
                        size="lg"
                        className="mb-3 shadow-md"
                      />
                      <h3 className="text-base font-bold text-neutral-900 mb-0.5 flex items-center gap-1.5">
                        {persona.name}
                        {isSelected && <Check size={13} style={{ color: '#1A8C6A' }} strokeWidth={3} />}
                      </h3>
                      <p className="text-xs text-neutral-400 mb-3">
                        {persona.traits?.job_title ?? 'No role'}{persona.traits?.location ? ` · ${persona.traits.location}` : ''}
                      </p>
                      {persona.tags && persona.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                          {persona.tags.slice(0, 2).map((tag: string, i: number) => (
                            <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1"
                              style={i === 0 ? { background: '#E8F5F1', color: '#0D5C45' } : { background: '#F3F4F6', color: '#6B7280' }}>
                              {i === 0 && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-neutral-400 leading-relaxed mb-4 line-clamp-2 text-center px-1">
                        {persona.traits?.additional_context ?? `${persona.traits?.job_title ?? 'A persona'} with defined goals and behaviors.`}
                      </p>
                    </div>

                    <div className="px-4 pb-4 flex gap-2" style={{ borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                      <Link
                        href={`/personas/${persona.id}`}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 text-center text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1"
                        style={{ background: 'white', border: '1px solid rgba(0,0,0,0.12)', color: '#374151' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        View details
                      </Link>
                      <Link
                        href={`/interviews/new?persona_id=${persona.id}`}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl text-white"
                        style={{ background: 'linear-gradient(135deg, #1A8C6A 0%, #2BAE86 100%)', boxShadow: '0 2px 6px rgba(26,140,106,0.3)' }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Interview
                      </Link>
                    </div>

                    {/* Subtle "Show preview" link — always visible when selected, hover-reveal otherwise */}
                    <div className={isSelected ? 'px-4 pb-3 -mt-2 text-center' : 'px-4 pb-3 -mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity'}>
                      <button
                        onClick={e => { e.stopPropagation(); showPersonaPreview(persona.id) }}
                        className="text-xs transition-colors text-[#9CA3AF] hover:text-[#4B5563]"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Show preview →
                      </button>
                    </div>
                  </div>
                )
              })}

              {!atLimit && (
                <Link href="/personas/new" className="flex items-center justify-center rounded-2xl transition-all duration-200 min-h-[300px]" style={{ background: 'white', border: '2px dashed rgba(0,0,0,0.1)' }}>
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

          {/* ── List view ── */}
          {filtered.length > 0 && viewMode === 'list' && filterTab !== 'Archived' && (
            <div className="space-y-2 mb-4">
              {filtered.map((persona: Persona) => {
                const isSelected = selectedId === persona.id
                return (
                  <div key={persona.id}>
                    <div
                      className="flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer transition-all group"
                      onClick={() => setSelectedId(persona.id)}
                      style={{
                        background: 'white',
                        border: isSelected ? '1.5px solid #1A8C6A' : '1.5px solid rgba(0,0,0,0.05)',
                        boxShadow: isSelected ? '0 0 0 2px rgba(26,140,106,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                        viewTransitionName: modalPersonaId === persona.id ? undefined : `persona-card-${persona.id}`,
                      } as React.CSSProperties}
                    >
                      <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-neutral-900">{persona.name}</span>
                          {isSelected && <Check size={12} style={{ color: '#1A8C6A' }} strokeWidth={3} />}
                        </div>
                        <p className="text-xs text-neutral-400">{persona.traits?.job_title ?? 'No role'}{persona.traits?.location ? ` · ${persona.traits.location}` : ''}</p>
                      </div>
                      {persona.tags?.slice(0, 2).map((tag: string, i: number) => (
                        <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full font-medium hidden sm:block"
                          style={i === 0 ? { background: '#E8F5F1', color: '#0D5C45' } : { background: '#F3F4F6', color: '#6B7280' }}>
                          {tag}
                        </span>
                      ))}
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); showPersonaPreview(persona.id) }} className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors" style={{ background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.08)' }} title="Show preview">
                          <Eye size={13} />
                        </button>
                        <Link href={`/personas/${persona.id}`} onClick={e => e.stopPropagation()} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.12)', color: '#374151' }}>View</Link>
                        <Link href={`/interviews/new?persona_id=${persona.id}`} onClick={e => e.stopPropagation()} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: 'linear-gradient(135deg, #1A8C6A 0%, #2BAE86 100%)' }}>Interview</Link>
                        <button onClick={e => handleArchive(e, persona.id)} className="w-7 h-7 rounded-lg flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-amber-500" style={{ background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.08)' }} title="Archive">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Archived view — same cards layout with trash icon ── */}
          {filterTab === 'Archived' && (
            <>
              {archived.length === 0 ? (
                <div className="flex items-center justify-center rounded-2xl py-12 mb-4" style={{ background: 'white', border: '2px dashed rgba(0,0,0,0.1)' }}>
                  <div className="text-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="mx-auto mb-3"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    <p className="text-sm font-semibold text-neutral-500">No archived personas</p>
                    <p className="text-xs text-neutral-400 mt-1">Archived personas appear here and count toward your limit</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                  {archived.map((persona: Persona) => {
                    const isSelected = selectedId === persona.id
                    return (
                      <div
                        key={persona.id}
                        className="relative group rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
                        onClick={(e) => {
                          const target = e.target as HTMLElement
                          if (target.closest('[data-archive-btn]')) return
                          setSelectedId(persona.id)
                        }}
                        style={{
                          background: 'white',
                          opacity: 0.85,
                          boxShadow: isSelected ? '0 0 0 2px #1A8C6A, 0 4px 16px rgba(26,140,106,0.12)' : '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
                          border: isSelected ? '1.5px solid #1A8C6A' : '1.5px solid rgba(0,0,0,0.05)',
                          viewTransitionName: modalPersonaId === persona.id ? undefined : `persona-card-${persona.id}`,
                        } as React.CSSProperties}
                      >
                        {/* Checkmark when selected */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#1A8C6A' }}>
                            <Check size={12} color="white" strokeWidth={3} />
                          </div>
                        )}

                        <div className="pt-6 px-5 pb-0 flex flex-col items-center text-center">
                          <PersonaAvatar
                            avatarUrl={persona.avatar_url}
                            avatarInitials={persona.avatar_initials}
                            avatarColor={persona.avatar_color}
                            name={persona.name}
                            size="lg"
                            className="mb-3 shadow-md"
                          />
                          <h3 className="text-base font-bold text-neutral-700 mb-0.5 flex items-center gap-1.5">
                            {persona.name}
                            {isSelected && <Check size={13} style={{ color: '#1A8C6A' }} strokeWidth={3} />}
                          </h3>
                          <p className="text-xs text-neutral-400 mb-3">
                            {persona.traits?.job_title ?? 'No role'}{persona.traits?.location ? ` · ${persona.traits.location}` : ''}
                          </p>
                          {persona.tags && persona.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                              {persona.tags.slice(0, 2).map((tag: string, i: number) => (
                                <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                  style={i === 0 ? { background: '#E8F5F1', color: '#0D5C45' } : { background: '#F3F4F6', color: '#6B7280' }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-neutral-400 leading-relaxed mb-4 line-clamp-2 text-center px-1">
                            {persona.traits?.additional_context ?? `${persona.traits?.job_title ?? 'A persona'} with defined goals and behaviors.`}
                          </p>
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium mb-3" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>Archived</span>
                        </div>

                        {/* Footer with preview + restore + delete buttons */}
                        <div className="px-4 pb-4 flex gap-2" style={{ borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); showPersonaPreview(persona.id) }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0"
                            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.12)' }}
                            title="Show preview"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(persona.id) }}
                            className="flex-1 text-center text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1"
                            style={{ background: '#E8F5F1', color: '#0D5C45', border: '1px solid #A7D9C8' }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.54"/></svg>
                            Restore
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, persona.id)}
                            disabled={deleting === persona.id}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"
                            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.12)' }}
                            title="Delete permanently"
                          >
                            {deleting === persona.id
                              ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            }
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <Modal
        isOpen={!!modalPersonaId}
        onClose={() => withViewTransition(() => setModalPersonaId(null), 'close')}
        maxWidth={560}
        viewTransitionName={modalPersonaId ? `persona-card-${modalPersonaId}` : undefined}
      >
        {modalPersona && <PersonaModalBody key={modalPersona.id} persona={modalPersona} />}
      </Modal>
    </>
  )
}

// ─── Persona detail modal ───────────────────────────────────────────────────────

const PERSONA_MODAL_TABS = ['Overview', 'Goals', 'Frustrations', 'Buying', 'Notes'] as const
type PersonaModalTab = typeof PERSONA_MODAL_TABS[number]

function PersonaModalBody({ persona }: { persona: Persona }) {
  const [activeTab, setActiveTab] = useState<PersonaModalTab>('Overview')
  const t = persona.traits

  const incomeMap: Record<string, string> = {
    under_50k: 'Under $50k', '50k_100k': '$50k–$100k',
    '100k_200k': '$100k–$200k', over_200k: 'Over $200k',
  }
  const educationMap: Record<string, string> = {
    high_school: 'High School', bachelors: "Bachelor's",
    masters: "Master's", phd: 'PhD',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 pr-8">
        <PersonaAvatar
          avatarUrl={persona.avatar_url}
          avatarInitials={persona.avatar_initials}
          avatarColor={persona.avatar_color}
          name={persona.name}
          size="xl"
          className="flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-neutral-900 mb-0.5">{persona.name}</h2>
          <p className="text-sm text-neutral-500">{t?.job_title}{t?.location ? ` · ${t.location}` : ''}</p>
          {t?.industry && (
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              {t.industry}
            </p>
          )}
        </div>
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <ScoreBar label="Tech Savviness" value={t?.tech_savviness ?? 0} />
        <ScoreBar label="Risk Tolerance" value={t?.risk_tolerance ?? 0} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        {PERSONA_MODAL_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-2 text-xs font-semibold transition-colors flex-shrink-0"
            style={{
              color: activeTab === tab ? '#0D5C45' : '#9CA3AF',
              borderBottom: activeTab === tab ? '2px solid #1A8C6A' : '2px solid transparent',
              background: 'none', border: 'none', borderBottomWidth: '2px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[110px] mb-6">
        {activeTab === 'Overview' && (
          <div className="space-y-2">
            {([
              ['Age', t?.age],
              ['Income', t?.income ? incomeMap[t.income] : null],
              ['Education', t?.education ? educationMap[t.education] : null],
            ] as [string, string | number | null | undefined][]).filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-neutral-400">{label}</span>
                <span className="text-neutral-700 font-medium">{value}</span>
              </div>
            ))}
            {persona.tags && persona.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {persona.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#F3F4F6', color: '#6B7280' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'Goals' && (
          <ul className="space-y-2">
            {(t?.goals ?? []).filter(Boolean).map((g, i) => (
              <li key={i} className="text-sm text-neutral-700 leading-relaxed flex gap-2">
                <span style={{ color: '#1A8C6A' }}>•</span>{g}
              </li>
            ))}
            {(t?.goals ?? []).filter(Boolean).length === 0 && <p className="text-sm text-neutral-400">No goals defined.</p>}
          </ul>
        )}
        {activeTab === 'Frustrations' && (
          <ul className="space-y-2">
            {(t?.frustrations ?? []).filter(Boolean).map((f, i) => (
              <li key={i} className="text-sm text-neutral-700 leading-relaxed flex gap-2">
                <span style={{ color: '#EF4444' }}>•</span>{f}
              </li>
            ))}
            {(t?.frustrations ?? []).filter(Boolean).length === 0 && <p className="text-sm text-neutral-400">No frustrations defined.</p>}
          </ul>
        )}
        {activeTab === 'Buying' && (
          <p className="text-sm text-neutral-700 leading-relaxed">{t?.buying_behavior || 'No buying behavior defined.'}</p>
        )}
        {activeTab === 'Notes' && (
          <p className="text-sm text-neutral-700 leading-relaxed">{t?.additional_context || 'No additional notes.'}</p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <Link
          href={`/personas/${persona.id}`}
          className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl"
          style={{ background: 'white', border: '1px solid rgba(0,0,0,0.12)', color: '#374151' }}
        >
          View full profile
        </Link>
        <Link
          href={`/interviews/new?persona_id=${persona.id}`}
          className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg, #1A8C6A 0%, #2BAE86 100%)' }}
        >
          Interview this persona
        </Link>
      </div>
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-500">{label}</span>
        <span className="text-neutral-700 font-medium">{value}/5</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#1A9B76' }} />
      </div>
    </div>
  )
}
