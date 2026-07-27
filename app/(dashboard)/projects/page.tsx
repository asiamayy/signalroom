import { createClient } from '@/lib/supabase/server'
import { ProjectsClient, type ProjectRollup } from './ProjectsClient'
import type { Signal } from '@/types'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // No user_id filter on projects/interviews/reports — RLS alone scopes these
  // to personal items plus any workspace-shared ones this user is a member
  // of. signals stays user_id-only (deliberately deferred).
  const [
    { data: projects },
    { data: interviews },
    { data: signals },
    { data: reports },
  ] = await Promise.all([
    supabase.from('projects').select('*').order('updated_at', { ascending: false }),
    supabase.from('interviews').select('id, project_id'),
    supabase.from('signals').select('*').eq('user_id', user.id),
    supabase.from('reports').select('id, interview_id'),
  ])

  const allProjects = projects ?? []
  const allInterviews = interviews ?? []
  const allSignals: Signal[] = signals ?? []
  const allReports = reports ?? []

  // Reports don't carry project_id directly — derive it through their interview.
  const interviewProjectMap = new Map(allInterviews.map(iv => [iv.id, iv.project_id]))

  const rollups: ProjectRollup[] = allProjects.map(project => {
    const projectSignals = allSignals.filter(s => s.project_id === project.id)
    const interviewCount = allInterviews.filter(iv => iv.project_id === project.id).length
    const reportCount = allReports.filter(r => interviewProjectMap.get(r.interview_id) === project.id).length
    const avgConfidence = projectSignals.length > 0
      ? Math.round(projectSignals.reduce((sum, s) => sum + s.confidence_score, 0) / projectSignals.length)
      : 0
    const topSignal = [...projectSignals].sort((a, b) => b.confidence_score - a.confidence_score)[0] ?? null

    return {
      project,
      interviewCount,
      signalCount: projectSignals.length,
      reportCount,
      avgConfidence,
      topSignalSummary: topSignal?.summary ?? null,
    }
  })

  return <ProjectsClient initialRollups={rollups} />
}
