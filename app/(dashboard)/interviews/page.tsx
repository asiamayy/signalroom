import Link from 'next/link'
import { Plus, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import type { Interview } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-neutral-100 text-neutral-600',
  draft: 'bg-amber-50 text-amber-700',
}

export default async function InterviewsPage() {
  const supabase = await createClient()
  const { data: interviews } = await supabase
    .from('interviews')
    .select('*, persona:personas(name, avatar_initials, avatar_color)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif tracking-tight text-neutral-900">Interviews</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Conversations with your personas</p>
        </div>
        <Link
          href="/interviews/new"
          className="flex items-center gap-1.5 bg-neutral-900 text-white text-sm px-4 py-2 rounded-md hover:bg-neutral-700 transition-colors"
        >
          <Plus size={15} />
          New interview
        </Link>
      </div>

      {(!interviews || interviews.length === 0) && (
        <div className="border border-dashed border-neutral-200 rounded-xl p-12 text-center">
          <MessageSquare size={24} className="text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-neutral-900 mb-1">No interviews yet</h3>
          <p className="text-sm text-neutral-500 mb-4">Start by creating a persona, then open an interview.</p>
          <Link
            href="/interviews/new"
            className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-sm px-4 py-2 rounded-md"
          >
            <Plus size={14} />
            Start an interview
          </Link>
        </div>
      )}

      {interviews && interviews.length > 0 && (
        <div className="space-y-3">
          {interviews.map((interview: Interview & { persona: any }) => {
            const color = interview.persona?.avatar_color
              ? (typeof interview.persona.avatar_color === 'string'
                  ? JSON.parse(interview.persona.avatar_color)
                  : interview.persona.avatar_color)
              : { bg: '#E1F5EE', text: '#0F6E56' }

            return (
              <Link
                key={interview.id}
                href={`/interviews/${interview.id}`}
                className="flex items-center gap-4 bg-white border border-neutral-200 rounded-xl px-5 py-4 hover:border-neutral-300 hover:shadow-sm transition-all"
              >
                {/* Persona avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{ background: color?.bg, color: color?.text }}
                >
                  {interview.persona?.avatar_initials ?? '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-neutral-900 truncate">{interview.title}</h3>
                  <p className="text-xs text-neutral-500">
                    {interview.persona?.name ?? 'Unknown persona'} · {INTERVIEW_TYPE_LABELS[interview.type]}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[interview.status]}`}>
                    {interview.status}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatRelativeTime(interview.updated_at)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
