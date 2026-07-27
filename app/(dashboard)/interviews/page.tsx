import { createClient } from '@/lib/supabase/server'
import { InterviewsClient } from './InterviewsClient'

export default async function InterviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // No user_id filter on interviews/personas/reports/projects — RLS alone
  // scopes these to personal items plus any workspace-shared ones this user
  // is a member of. signals stays user_id-only (deliberately deferred —
  // under-shares rather than over-exposes, see supabase-migration-team-workspaces.sql).
  const [
    { data: interviews },
    { data: personas },
    { data: signals },
    { data: reports },
    { data: projects },
    { data: workspaces },
  ] = await Promise.all([
    supabase.from('interviews').select('*, persona:personas(*)').order('created_at', { ascending: false }),
    supabase.from('personas').select('*').eq('archived', false).order('updated_at', { ascending: false }),
    supabase.from('signals').select('*').eq('user_id', user.id),
    supabase.from('reports').select('*'),
    supabase.from('projects').select('id, name').eq('archived', false).order('name'),
    supabase.from('workspaces').select('id, name').order('name'),
  ])

  return (
    <InterviewsClient
      initialInterviews={interviews ?? []}
      allPersonas={personas ?? []}
      allSignals={signals ?? []}
      allReports={reports ?? []}
      allProjects={projects ?? []}
      allWorkspaces={workspaces ?? []}
    />
  )
}
