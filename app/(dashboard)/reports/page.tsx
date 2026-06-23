import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import { FileText, ArrowRight } from 'lucide-react'
import type { Report } from '@/types'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reports } = await supabase
    .from('reports')
    .select(`
      *,
      interview:interviews(
        id, title, type,
        persona:personas(name, avatar_initials, avatar_color)
      )
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif tracking-tight text-neutral-900">Reports</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Structured insights from your interviews</p>
      </div>

      {(!reports || reports.length === 0) && (
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

      {reports && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report: any) => {
            const color = report.interview?.persona?.avatar_color
              ? (typeof report.interview.persona.avatar_color === 'string'
                  ? JSON.parse(report.interview.persona.avatar_color)
                  : report.interview.persona.avatar_color)
              : { bg: '#E1F5EE', text: '#0F6E56' }

            const score = report.confidence_score
            const scoreColor = score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'

            return (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="flex items-center gap-4 bg-white border border-neutral-200 rounded-xl px-5 py-4 hover:border-neutral-300 hover:shadow-sm transition-all group"
              >
                {/* Persona avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{ background: color.bg, color: color.text }}
                >
                  {report.interview?.persona?.avatar_initials ?? '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-neutral-900 truncate">
                    {report.interview?.title ?? 'Untitled interview'}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {report.interview?.persona?.name} · {INTERVIEW_TYPE_LABELS[report.interview?.type] ?? 'Interview'} · {formatDate(report.created_at)}
                  </p>
                </div>

                {/* Confidence score */}
                <div className="flex items-center gap-4 flex-shrink-0">
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
            )
          })}
        </div>
      )}
    </div>
  )
}
