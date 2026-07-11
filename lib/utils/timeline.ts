// Derived activity timeline — deliberately not backed by a dedicated
// activity-log table. Every write path would need to remember to insert
// into it, and it'd be easy for that to drift out of sync. Instead this
// just unions the created_at (and a couple of status-change) timestamps
// already on personas/interviews/reports/signals/files. The same function
// powers both a project's Timeline tab and Home's cross-project activity
// feed, so they can never disagree with each other.

import type { Persona, Interview, Report, Signal, ProjectFile } from '@/types'

export type TimelineEventType =
  | 'persona_created'
  | 'interview_completed'
  | 'interview_started'
  | 'report_generated'
  | 'signal_discovered'
  | 'file_uploaded'

export interface TimelineEvent {
  type: TimelineEventType
  timestamp: string
  title: string
  detail?: string
}

interface BuildTimelineInput {
  personas?: Persona[]
  interviews?: (Interview & { persona?: Persona | null })[]
  reports?: (Report & { interview?: Interview | null })[]
  signals?: Signal[]
  files?: ProjectFile[]
}

export function buildTimelineEvents({ personas = [], interviews = [], reports = [], signals = [], files = [] }: BuildTimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = []

  for (const p of personas) {
    events.push({ type: 'persona_created', timestamp: p.created_at, title: 'Persona created', detail: p.name })
  }

  for (const iv of interviews) {
    events.push({
      type: iv.status === 'completed' ? 'interview_completed' : 'interview_started',
      timestamp: iv.updated_at,
      title: iv.status === 'completed' ? 'Interview completed' : 'Interview started',
      detail: iv.title,
    })
  }

  for (const r of reports) {
    events.push({ type: 'report_generated', timestamp: r.created_at, title: 'Report generated', detail: r.interview?.title })
  }

  for (const s of signals) {
    events.push({ type: 'signal_discovered', timestamp: s.created_at, title: 'Signal discovered', detail: s.title })
  }

  for (const f of files) {
    events.push({ type: 'file_uploaded', timestamp: f.created_at, title: 'Research uploaded', detail: f.name })
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}
