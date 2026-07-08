'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import { FileText, ArrowRight, Trash2 } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { createClient } from '@/lib/supabase/client'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('reports')
        .select(`
          *,
          interview:interviews(
            id, title, type,
            persona:personas(name, avatar_initials, avatar_color, avatar_url)
          )
        `)
        .order('created_at', { ascending: false })
      setReports(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this report? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) setReports(prev => prev.filter(r => r.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="heading-editorial text-2xl text-neutral-900">Reports</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Structured insights from your interviews</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse bg-white border border-neutral-200" />)}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="border border-dashed border-neutral-200 rounded-xl p-12 text-center">
          <FileText size={24} className="text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-neutral-900 mb-1">No reports yet</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Run an interview and click "Get report" to generate your first research report.
          </p>
          <Link
            href="/interviews/new"
            className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-sm px-4 py-2 rounded-md hover:bg-neutral-700 transition-colors"
          >
            Start an interview
          </Link>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report: any) => {
            const score = report.confidence_score
            const scoreColor = score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'

            return (
              <div key={report.id} className="relative group">
                <Link
                  href={`/reports/${report.id}`}
                  className="flex items-center gap-4 bg-white border border-neutral-200 rounded-xl px-5 py-4 hover:border-neutral-300 hover:shadow-sm transition-all group block"
                >
                  <PersonaAvatar
                    avatarUrl={report.interview?.persona?.avatar_url}
                    avatarInitials={report.interview?.persona?.avatar_initials}
                    avatarColor={report.interview?.persona?.avatar_color}
                    name={report.interview?.persona?.name}
                    size="sm"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-neutral-900 truncate">
                      {report.interview?.title ?? 'Untitled interview'}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {report.interview?.persona?.name} · {INTERVIEW_TYPE_LABELS[report.interview?.type] ?? 'Interview'} · {formatDate(report.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 pr-8">
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${scoreColor}`}>{score}%</p>
                      <p className="text-[11px] text-neutral-400">confidence</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-neutral-700">{report.key_themes?.length ?? 0}</p>
                      <p className="text-[11px] text-neutral-400">themes</p>
                    </div>
                    <ArrowRight size={15} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                  </div>
                </Link>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, report.id)}
                  disabled={deleting === report.id}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all text-neutral-400 hover:text-red-500"
                  style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                  title="Delete report"
                >
                  {deleting === report.id
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
  )
}
