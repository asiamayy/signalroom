import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectDetailClient } from './ProjectDetailClient'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const [
    { data: allPersonas },
    { data: allInterviews },
    { data: signals },
    { data: files },
  ] = await Promise.all([
    supabase.from('personas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('interviews').select('*, persona:personas(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('signals').select('*').eq('project_id', id).order('confidence_score', { ascending: false }),
    supabase.from('project_files').select('*').eq('project_id', id).order('created_at', { ascending: false }),
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
    />
  )
}
