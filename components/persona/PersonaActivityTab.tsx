'use client'

import { Activity, Archive, BarChart3, CircleDot, FileText, Flag, MessageSquare, Route } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { PersonaActivity } from '@/types'

const EVENT_DETAILS: Record<PersonaActivity['action'], { label: string; icon: typeof Activity }> = {
  persona_created: { label: 'Persona created', icon: CircleDot },
  stage_changed: { label: 'Funnel stage updated', icon: Flag },
  journey_created: { label: 'User journey created', icon: Route },
  interview_started: { label: 'Interview started', icon: MessageSquare },
  report_generated: { label: 'Insight report generated', icon: FileText },
  persona_archived: { label: 'Persona archived', icon: Archive },
  persona_restored: { label: 'Persona restored', icon: Archive },
  project_changed: { label: 'Project assignment updated', icon: BarChart3 },
}

export function PersonaActivityTab({ events, loading }: { events: PersonaActivity[] | null; loading: boolean }) {
  if (loading || events === null) {
    return <div className="p-4 sm:p-6"><div className="h-32 animate-pulse rounded-2xl" style={{ background: '#F1F3F2' }} /></div>
  }

  if (events.length === 0) {
    return <div className="p-4 sm:p-6"><div className="flex items-center justify-center rounded-2xl py-16" style={{ background: 'white', border: '1px dashed #E0E2E4' }}><div className="max-w-sm text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#E8F3EF' }}><Activity size={20} style={{ color: '#1C3D2E' }} /></div><p className="text-sm font-semibold" style={{ color: '#202124' }}>No activity yet</p><p className="mt-1 text-xs" style={{ color: '#5F6368' }}>Research activity for this persona will appear here as you create journeys, run interviews, and generate reports.</p></div></div></div>
  }

  return <div className="p-4 sm:p-6"><div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E0E2E4' }}><div className="mb-5"><h2 className="text-xl font-semibold" style={{ color: '#202124' }}>Activity</h2><p className="mt-1 text-sm" style={{ color: '#5F6368' }}>A history of work completed for this persona.</p></div><ol className="space-y-4">{events.map(event => { const meta = EVENT_DETAILS[event.action]; const Icon = meta.icon; return <li key={event.id} className="flex gap-3"><span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#E8F3EF', color: '#1C3D2E' }}><Icon size={15} /></span><div className="min-w-0 flex-1 border-b pb-4 last:border-0 last:pb-0" style={{ borderColor: '#EDEDED' }}><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-sm font-semibold" style={{ color: '#202124' }}>{meta.label}</p><time className="text-xs" style={{ color: '#9CA3AF' }} dateTime={event.created_at}>{formatRelativeTime(event.created_at)}</time></div>{event.detail && <p className="mt-1 text-xs" style={{ color: '#5F6368' }}>{event.detail}</p>}</div></li> })}</ol></div></div>
}
