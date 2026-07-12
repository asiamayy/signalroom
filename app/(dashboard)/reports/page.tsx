'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate, INTERVIEW_TYPE_LABELS, CARD_SHADOW } from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_BODY, HOME_FONT_DISPLAY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { FileText, ArrowRight, Trash2, Loader2 } from 'lucide-react'
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
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full">
      <section className="px-4 sm:px-10 pt-10 sm:pt-16 pb-10 sm:pb-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Intelligence Stream</span>
        </div>
        <h1 className="mb-4 leading-tight" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onSurface }}>
          Research <span className="italic" style={{ fontWeight: 400 }}>Insights</span>
        </h1>
        <p className="text-sm sm:text-base leading-relaxed max-w-xl" style={{ color: HOME_COLORS.onSurfaceVariant }}>
          Structured summaries, themes, and recommendations synthesized from every interview you&apos;ve run.
        </p>
      </section>

      <div className="px-4 sm:px-10 pb-20 max-w-3xl">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: HOME_COLORS.surfaceContainerLowest }} />)}
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="rounded-2xl p-12 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px dashed ${HOME_COLORS.outlineVariant}` }}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: HOME_COLORS.secondaryContainer }}>
              <FileText size={22} style={{ color: HOME_COLORS.primary }} />
            </div>
            <h3 className="text-lg mb-2" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>No reports yet</h3>
            <p className="text-sm mb-5" style={{ color: HOME_COLORS.onSurfaceVariant }}>
              Run an interview and click &ldquo;Get report&rdquo; to generate your first research report.
            </p>
            <Link href="/interviews/new" className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
              Start an interview
            </Link>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report: any) => {
              const score = report.confidence_score
              const scoreColor = score >= 75 ? HOME_COLORS.primary : score >= 50 ? '#B45309' : HOME_COLORS.error

              return (
                <div key={report.id} className="relative group">
                  <Link
                    href={`/reports/${report.id}`}
                    className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all hover:shadow-xl block"
                    style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}
                  >
                    <PersonaAvatar
                      avatarUrl={report.interview?.persona?.avatar_url}
                      avatarInitials={report.interview?.persona?.avatar_initials}
                      avatarColor={report.interview?.persona?.avatar_color}
                      name={report.interview?.persona?.name}
                      size="sm"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: HOME_COLORS.onSurface }}>
                        {report.interview?.title ?? 'Untitled interview'}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                        {report.interview?.persona?.name} · {INTERVIEW_TYPE_LABELS[report.interview?.type] ?? 'Interview'} · {formatDate(report.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 pr-8">
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: scoreColor }}>{score}%</p>
                        <p className="text-[11px] uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>confidence</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium" style={{ color: HOME_COLORS.onSurface }}>{report.key_themes?.length ?? 0}</p>
                        <p className="text-[11px] uppercase" style={{ color: HOME_COLORS.onSurfaceVariant }}>themes</p>
                      </div>
                      <ArrowRight size={15} style={{ color: HOME_COLORS.onSurfaceVariant }} className="transition-colors" />
                    </div>
                  </Link>

                  <button
                    onClick={(e) => handleDelete(e, report.id)}
                    disabled={deleting === report.id}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurfaceVariant, boxShadow: CARD_SHADOW }}
                    title="Delete report"
                  >
                    {deleting === report.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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
