import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, getAvatarColor, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import type { Persona, Interview } from '@/types'

export default async function PersonaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single()

  if (!persona) notFound()

  const { data: interviews } = await supabase
    .from('interviews')
    .select('*')
    .eq('persona_id', id)
    .order('created_at', { ascending: false })

  const color = typeof persona.avatar_color === 'string'
    ? JSON.parse(persona.avatar_color)
    : persona.avatar_color

  const t = persona.traits

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link href="/personas" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-6 transition-colors">
        <ArrowLeft size={14} />
        All personas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium flex-shrink-0"
            style={{ background: color?.bg, color: color?.text }}
          >
            {persona.avatar_initials}
          </div>
          <div>
            <h1 className="text-2xl font-serif tracking-tight text-neutral-900">{persona.name}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {t?.job_title} · {t?.location} · Created {formatDate(persona.created_at)}
            </p>
            {persona.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {persona.tags.map((tag: string) => (
                  <span key={tag} className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <Link href={`/interviews/new?persona_id=${persona.id}`}>
          <button className="flex items-center gap-1.5 bg-neutral-900 text-white text-sm px-4 py-2 rounded-md hover:bg-neutral-700 transition-colors">
            <MessageSquare size={14} />
            Start interview
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: traits */}
        <div className="col-span-2 space-y-5">

          {/* Demographics */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">Demographics</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                ['Age', t?.age],
                ['Gender', t?.gender],
                ['Location', t?.location],
                ['Education', t?.education?.replace('_', "'s ")],
                ['Income', t?.income?.replace(/_/g, ' ').replace('50k 100k', '$50k–$100k').replace('100k 200k', '$100k–$200k').replace('over 200k', 'Over $200k').replace('under 50k', 'Under $50k')],
                ['Industry', t?.industry],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs text-neutral-400 mb-0.5">{label}</dt>
                  <dd className="text-sm text-neutral-900 font-medium capitalize">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Goals */}
          {t?.goals?.filter(Boolean).length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Goals</h2>
              <ul className="space-y-2">
                {t.goals.filter(Boolean).map((g: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="text-emerald-500 mt-0.5">↗</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Frustrations */}
          {t?.frustrations?.filter(Boolean).length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Frustrations</h2>
              <ul className="space-y-2">
                {t.frustrations.filter(Boolean).map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="text-red-400 mt-0.5">↘</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Buying behavior */}
          {t?.buying_behavior && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Buying behavior</h2>
              <p className="text-sm text-neutral-700 leading-relaxed">{t.buying_behavior}</p>
            </div>
          )}

          {/* Additional context */}
          {t?.additional_context && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Additional context</h2>
              <p className="text-sm text-neutral-700 leading-relaxed">{t.additional_context}</p>
            </div>
          )}
        </div>

        {/* Right: scores + interviews */}
        <div className="space-y-5">
          {/* Scores */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-500">Tech savviness</span>
                  <span className="font-medium text-neutral-900">{t?.tech_savviness}/5</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full">
                  <div className="h-1.5 bg-neutral-900 rounded-full transition-all" style={{ width: `${((t?.tech_savviness ?? 0) / 5) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-500">Risk tolerance</span>
                  <span className="font-medium text-neutral-900">{t?.risk_tolerance}/5</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full">
                  <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${((t?.risk_tolerance ?? 0) / 5) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Past interviews */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Interviews ({interviews?.length ?? 0})
            </h2>
            {(!interviews || interviews.length === 0) ? (
              <p className="text-xs text-neutral-400">No interviews yet</p>
            ) : (
              <div className="space-y-2">
                {interviews.map((iv: Interview) => (
                  <Link
                    key={iv.id}
                    href={`/interviews/${iv.id}`}
                    className="block text-xs text-neutral-700 hover:text-neutral-900 py-1.5 border-b border-neutral-50 last:border-0 transition-colors"
                  >
                    <span className="font-medium">{iv.title}</span>
                    <span className="text-neutral-400 ml-1">· {INTERVIEW_TYPE_LABELS[iv.type]}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
