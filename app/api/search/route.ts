import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SIGNAL_TYPE_LABELS } from '@/types'
import type { SignalType } from '@/types'

const LIMIT = 5

interface SearchResultItem {
  id: string
  label: string
  sublabel: string | null
  href: string
}

// Global "jump to anything" search — the header search bar used to only
// filter whatever list happened to be on the current page (still does, via
// the shared search-context) with no way to actually get anywhere from it.
// This adds real cross-entity results. Every query goes through the regular
// (non-admin) client, so RLS scopes results to what the caller can already
// see — personal content plus anything shared via a workspace they belong
// to — exactly like every other read in the app.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ data: null })
  }

  const pattern = `%${q}%`

  const [personasRes, projectsRes, interviewsRes, reportsRes, signalsRes] = await Promise.all([
    supabase.from('personas').select('id, name, traits').eq('archived', false).ilike('name', pattern).limit(LIMIT),
    supabase.from('projects').select('id, name').eq('archived', false).ilike('name', pattern).limit(LIMIT),
    supabase.from('interviews').select('id, title, status').ilike('title', pattern).limit(LIMIT),
    supabase.from('reports').select('id, executive_summary, interview:interviews(title)').ilike('executive_summary', pattern).limit(LIMIT),
    supabase.from('signals').select('id, title, type, project_id').ilike('title', pattern).limit(LIMIT),
  ])

  const personas: SearchResultItem[] = (personasRes.data ?? []).map(p => ({
    id: p.id,
    label: p.name,
    sublabel: p.traits?.job_title ?? null,
    href: `/personas/${p.id}`,
  }))

  const projects: SearchResultItem[] = (projectsRes.data ?? []).map(p => ({
    id: p.id,
    label: p.name,
    sublabel: null,
    href: `/projects/${p.id}`,
  }))

  const interviews: SearchResultItem[] = (interviewsRes.data ?? []).map(i => ({
    id: i.id,
    label: i.title,
    sublabel: i.status,
    href: `/interviews/${i.id}`,
  }))

  const reports: SearchResultItem[] = (reportsRes.data ?? []).map(r => ({
    id: r.id,
    label: (r.interview as unknown as { title: string } | null)?.title ?? 'Report',
    sublabel: r.executive_summary?.slice(0, 80) ?? null,
    href: `/reports/${r.id}`,
  }))

  const signals: SearchResultItem[] = (signalsRes.data ?? []).map(s => ({
    id: s.id,
    label: s.title,
    sublabel: SIGNAL_TYPE_LABELS[s.type as SignalType] ?? null,
    href: `/projects/${s.project_id}?tab=Signals`,
  }))

  return NextResponse.json({ data: { personas, projects, interviews, reports, signals } })
}
