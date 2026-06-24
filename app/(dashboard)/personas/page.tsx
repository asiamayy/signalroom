import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
import type { Persona } from '@/types'

export default async function PersonasPage() {
  const supabase = await createClient()
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif tracking-tight text-neutral-900">Personas</h1>
          <p className="text-sm text-neutral-500 mt-0.5">The people you want to interview</p>
        </div>
        <Link
          href="/personas/new"
          className="flex items-center gap-1.5 bg-neutral-900 text-white text-sm px-4 py-2 rounded-md hover:bg-neutral-700 transition-colors"
        >
          <Plus size={15} />
          New persona
        </Link>
      </div>

      {/* Empty state */}
      {(!personas || personas.length === 0) && (
        <div className="border border-dashed border-neutral-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-content mx-auto mb-4" />
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
      {personas && personas.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {personas.map((persona: Persona) => {
            const color = typeof persona.avatar_color === 'string'
              ? JSON.parse(persona.avatar_color)
              : persona.avatar_color

            return (
              <Link
                key={persona.id}
                href={`/personas/${persona.id}`}
                className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 hover:shadow-sm transition-all"
              >
                {/* Avatar */}
                {persona.avatar_url ? (
                  <img
                    src={persona.avatar_url}
                    alt={persona.name}
                    className="w-10 h-10 rounded-full object-cover mb-3"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-3"
                    style={{ background: color?.bg ?? '#E1F5EE', color: color?.text ?? '#0F6E56' }}
                  >
                    {persona.avatar_initials}
                  </div>
                )}

                <h3 className="text-sm font-medium text-neutral-900 mb-0.5">{persona.name}</h3>
                <p className="text-xs text-neutral-500 mb-3">
                  {persona.traits?.job_title ?? 'No role set'} · {persona.traits?.location ?? ''}
                </p>

                {/* Tags */}
                {persona.tags && persona.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {persona.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
