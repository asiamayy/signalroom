'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
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

export default function PersonasClient({ initialPersonas, plan, limit, count }: PersonasClientProps) {
  const router = useRouter()
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas)
  const [deleting, setDeleting] = useState<string | null>(null)

  const atLimit = limit !== Infinity && personas.length >= limit
  const usageLabel = limit === Infinity ? null : `${personas.length} / ${limit} personas`

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

  return (
    <>
      <OnboardingModal />
      <div style={{ background: '#F4F6F8', minHeight: '100%' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div>
            <h1 className="font-serif text-2xl tracking-tight text-neutral-900">Personas</h1>
            <p className="text-sm text-neutral-400 mt-0.5">The people you want to interview</p>
          </div>
          <div className="flex items-center gap-3">
            {usageLabel && (
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', atLimit ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-500')}>
                {usageLabel}
              </span>
            )}
            {atLimit ? (
              <Link href="/settings" className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all" style={{ background: '#1A8C6A' }}>
                Upgrade to add more
              </Link>
            ) : (
              <Link href="/personas/new" className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all" style={{ background: '#1A8C6A' }}>
                <Plus size={15} />
                New persona
              </Link>
            )}
          </div>
        </div>

        {/* Limit warning */}
        {atLimit && (
          <div className="mx-7 mt-5 px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <p className="text-sm text-orange-800">You've used all {limit} personas on the <span className="font-semibold capitalize">{plan}</span> plan.</p>
            <Link href="/settings" className="text-sm font-semibold text-orange-900 underline ml-4 flex-shrink-0">Upgrade</Link>
          </div>
        )}

        {/* Empty state */}
        {personas.length === 0 && (
          <div className="mx-7 mt-7 flex items-center justify-center rounded-2xl py-16" style={{ background: 'white', border: '2px dashed rgba(0,0,0,0.1)' }}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                <Plus size={22} className="text-neutral-400" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-1">No personas yet</h3>
              <p className="text-sm text-neutral-400 mb-5">Create your first persona to start interviewing.</p>
              <Link href="/personas/new" className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-2.5 rounded-xl" style={{ background: '#1A8C6A' }}>
                <Plus size={14} /> Create a persona
              </Link>
            </div>
          </div>
        )}

        {/* Persona grid */}
        {personas.length > 0 && (
          <div className="px-7 py-6 grid grid-cols-3 gap-4">
            {personas.map((persona: Persona) => {
              const color = typeof persona.avatar_color === 'string'
                ? (() => { try { return JSON.parse(persona.avatar_color) } catch { return { bg: '#E1F5EE', text: '#0F6E56' } } })()
                : persona.avatar_color ?? { bg: '#E1F5EE', text: '#0F6E56' }

              return (
                <div key={persona.id} className="relative group">
                  <Link
                    href={`/personas/${persona.id}`}
                    className="block rounded-2xl overflow-hidden transition-all duration-200"
                    style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1.5px solid rgba(0,0,0,0.05)' }}
                  >
                    {/* Card top - centered photo */}
                    <div className="pt-6 px-5 pb-0 flex flex-col items-center text-center">
                      <PersonaAvatar
                        avatarUrl={persona.avatar_url}
                        avatarInitials={persona.avatar_initials}
                        avatarColor={persona.avatar_color}
                        name={persona.name}
                        size="lg"
                        className="mb-3 ring-2 ring-white shadow-md"
                      />
                      <h3 className="text-base font-bold text-neutral-900 mb-0.5">{persona.name}</h3>
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
                      {persona.traits?.additional_context && (
                        <p className="text-xs text-neutral-400 leading-relaxed mb-4 line-clamp-2 text-center">
                          {persona.traits.additional_context}
                        </p>
                      )}
                    </div>

                    {/* Footer buttons */}
                    <div className="px-4 pb-4 flex gap-2" style={{ borderTop: '1px solid #F3F4F6', paddingTop: '12px', marginTop: '4px' }}>
                      <Link
                        href={`/personas/${persona.id}`}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 text-center text-xs font-semibold py-2 rounded-xl transition-all"
                        style={{ background: 'white', border: '1px solid rgba(0,0,0,0.12)', color: '#374151' }}
                      >
                        View
                      </Link>
                      <Link
                        href={`/interviews/new?persona_id=${persona.id}`}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl text-white transition-all"
                        style={{ background: '#1A8C6A' }}
                      >
                        <MessageSquare size={11} />
                        Interview
                      </Link>
                    </div>
                  </Link>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, persona.id)}
                    disabled={deleting === persona.id}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-neutral-400 hover:text-red-500"
                    style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    title="Delete persona"
                  >
                    {deleting === persona.id
                      ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      : <Trash2 size={12} />
                    }
                  </button>
                </div>
              )
            })}

            {/* New persona card */}
            {!atLimit && (
              <Link
                href="/personas/new"
                className="flex items-center justify-center rounded-2xl transition-all duration-200 min-h-[280px]"
                style={{ background: 'white', border: '2px dashed rgba(0,0,0,0.1)', boxShadow: 'none' }}
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
      </div>
    </>
  )
}
