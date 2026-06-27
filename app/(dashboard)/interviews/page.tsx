'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { formatRelativeTime, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { createClient } from '@/lib/supabase/client'
import type { Interview } from '@/types'

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: '#E8F5F1', color: '#0D5C45' },
  completed: { bg: '#F3F4F6', color: '#6B7280' },
  draft: { bg: '#FFFBEB', color: '#92400E' },
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<(Interview & { persona: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('interviews')
        .select('*, persona:personas(name, avatar_initials, avatar_color, avatar_url)')
        .order('created_at', { ascending: false })
      setInterviews(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this interview? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/interviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) setInterviews(prev => prev.filter(iv => iv.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ background: '#F4F6F8', minHeight: '100%' }}>
      <div className="flex items-center justify-between px-7 py-5" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-neutral-900">Interviews</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Conversations with your personas</p>
        </div>
        <Link href="/interviews/new" className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: '#1A8C6A' }}>
          <Plus size={15} />
          New interview
        </Link>
      </div>

      <div className="px-7 py-6">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'white' }} />)}
          </div>
        )}

        {!loading && interviews.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl py-16" style={{ background: 'white', border: '2px dashed rgba(0,0,0,0.1)' }}>
            <div className="text-center">
              <MessageSquare size={24} className="text-neutral-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-neutral-800 mb-1">No interviews yet</h3>
              <p className="text-sm text-neutral-400 mb-5">Create a persona, then start an interview.</p>
              <Link href="/interviews/new" className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-2.5 rounded-xl" style={{ background: '#1A8C6A' }}>
                <Plus size={14} /> Start an interview
              </Link>
            </div>
          </div>
        )}

        {!loading && interviews.length > 0 && (
          <div className="space-y-3">
            {interviews.map((interview) => {
              const statusStyle = STATUS_STYLES[interview.status] ?? STATUS_STYLES.completed
              return (
                <div key={interview.id} className="relative group">
                  <Link
                    href={`/interviews/${interview.id}`}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all block"
                    style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    <PersonaAvatar
                      avatarUrl={interview.persona?.avatar_url}
                      avatarInitials={interview.persona?.avatar_initials}
                      avatarColor={interview.persona?.avatar_color}
                      name={interview.persona?.name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 truncate">{interview.title}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {interview.persona?.name ?? 'Unknown'} · {INTERVIEW_TYPE_LABELS[interview.type]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 pr-8">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={statusStyle}>
                        {interview.status}
                      </span>
                      <span className="text-xs text-neutral-400">{formatRelativeTime(interview.updated_at)}</span>
                    </div>
                  </Link>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, interview.id)}
                    disabled={deleting === interview.id}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-neutral-400 hover:text-red-500"
                    style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    title="Delete interview"
                  >
                    {deleting === interview.id
                      ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
