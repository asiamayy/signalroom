'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
      if (res.ok) {
        setPersonas(prev => prev.filter(p => p.id !== personaId))
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <OnboardingModal />
      <div className="p-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif tracking-tight text-neutral-900">Personas</h1>
            <p className="text-sm text-neutral-500 mt-0.5">The people you want to interview</p>
          </div>
          <div className="flex items-center gap-3">
            {usageLabel && (
              <span className={cn(
                'text-xs px-2.5 py-1 rounded-full font-medium',
                atLimit
                  ? 'bg-red-50 text-red-600'
                  : 'bg-neutral-100 text-neutral-500'
              )}>
                {usageLabel}
              </span>
            )}
            {atLimit ? (
              <Link
                href="/settings"
                className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
              >
                Upgrade to add more
              </Link>
            ) : (
              <Link
                href="/personas/new"
                className="flex items-center gap-1.5 bg-neutral-900 text-white text-sm px-4 py-2 rounded-md hover:bg-neutral-700 transition-colors"
              >
                <Plus size={15} />
                New persona
              </Link>
            )}
          </div>
        </div>

        {/* Limit warning */}
        {atLimit && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-amber-800">
              You've used all {limit} personas on the <span className="font-medium capitalize">{plan}</span> plan. Delete one or upgrade to create more.
            </p>
            <Link href="/settings" className="text-sm font-medium text-amber-900 underline ml-4 flex-shrink-0">
              Upgrade
            </Link>
          </div>
        )}

        {/* Empty state */}
        {personas.length === 0 && (
          <div className="border border-dashed border-neutral-200 rounded-xl p-12 text-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-full mx-auto mb-4" />
            <h3 className="text-sm font-medium text-neutral-900 mb-1">No personas yet</h3>
            <p className="text-sm text-neutral-500 mb-4">Create your first persona to start interviewing.</p>
            <Link
              href="/personas/new"
              className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-sm px-4 py-2 rounded-md hover:bg-neutral-700 transition-colors"
            >
              <Plus size={14} />
              Create a persona
            </Link>
          </div>
        )}

        {/* Persona grid */}
        {personas.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {personas.map((persona: Persona) => (
              <div key={persona.id} className="relative group">
                <Link
                  href={`/personas/${persona.id}`}
                  className="block bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 hover:shadow-sm transition-all"
                >
                  <PersonaAvatar
                    avatarUrl={persona.avatar_url}
                    avatarInitials={persona.avatar_initials}
                    avatarColor={persona.avatar_color}
                    name={persona.name}
                    size="md"
                    className="mb-3"
                  />
                  <h3 className="text-sm font-medium text-neutral-900 mb-0.5">{persona.name}</h3>
                  <p className="text-xs text-neutral-500 mb-3">
                    {persona.traits?.job_title ?? 'No role set'}{persona.traits?.location ? ` · ${persona.traits.location}` : ''}
                  </p>
                  {persona.tags && persona.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {persona.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, persona.id)}
                  disabled={deleting === persona.id}
                  className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-red-300 hover:text-red-500 transition-all text-neutral-400 shadow-sm"
                  title="Delete persona"
                >
                  {deleting === persona.id
                    ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <Trash2 size={12} />
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
