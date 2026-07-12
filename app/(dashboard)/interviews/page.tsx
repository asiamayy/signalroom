import { createClient } from '@/lib/supabase/server'
import { InterviewsClient } from './InterviewsClient'

export default async function InterviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: interviews },
    { data: personas },
    { data: signals },
    { data: reports },
    { data: projects },
  ] = await Promise.all([
    supabase.from('interviews').select('*, persona:personas(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('personas').select('*').eq('user_id', user.id).eq('archived', false).order('updated_at', { ascending: false }),
    supabase.from('signals').select('*').eq('user_id', user.id),
    supabase.from('reports').select('*').eq('user_id', user.id),
    supabase.from('projects').select('id, name').eq('user_id', user.id).eq('archived', false).order('name'),
  ])

  return (
    <InterviewsClient
      initialInterviews={interviews ?? []}
      allPersonas={personas ?? []}
      allSignals={signals ?? []}
      allReports={reports ?? []}
      allProjects={projects ?? []}
    />
  )
}
