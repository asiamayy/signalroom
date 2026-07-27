import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectDetailClient } from './ProjectDetailClient'

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  // No user_id filter — RLS is the real gate. Without this fix a workspace
  // co-member could never open a shared project's detail page at all, since
  // it would only ever match projects THEY personally created.
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const [
    { data: allPersonas },
    { data: allInterviews },
    { data: signals },
    { data: files },
    { data: workspaces },
    { data: compareRuns },
    { data: audiencePanelRuns },
    { data: conceptTestRuns },
  ] = await Promise.all([
    supabase.from('personas').select('*').order('created_at', { ascending: false }),
    supabase.from('interviews').select('*, persona:personas(*)').order('created_at', { ascending: false }),
    supabase.from('signals').select('*').eq('project_id', id).order('confidence_score', { ascending: false }),
    supabase.from('project_files').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('workspaces').select('id, name').order('name'),
    supabase.from('compare_runs').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('audience_panel_runs').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('concept_test_runs').select('*').eq('project_id', id).order('created_at', { ascending: false }),
  ])

  const projectInterviewIds = (allInterviews ?? []).filter(iv => iv.project_id === id).map(iv => iv.id)

  const { data: reports } = projectInterviewIds.length > 0
    ? await supabase.from('reports').select('*, interview:interviews(*)').in('interview_id', projectInterviewIds)
    : { data: [] }

  return (
    <ProjectDetailClient
      project={project}
      allPersonas={allPersonas ?? []}
      allInterviews={allInterviews ?? []}
      signals={signals ?? []}
      reports={reports ?? []}
      files={files ?? []}
      workspaces={workspaces ?? []}
      compareRuns={compareRuns ?? []}
      audiencePanelRuns={audiencePanelRuns ?? []}
      conceptTestRuns={conceptTestRuns ?? []}
      initialTab={tab}
    />
  )
}
