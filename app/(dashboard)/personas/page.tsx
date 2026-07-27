import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/types'
import type { Plan, Persona } from '@/types'
import PersonasClient from './PersonasClient'

export default async function PersonasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // No user_id filter on personas/projects — RLS alone scopes these to
  // personal items plus any workspace-shared ones this user is a member of.
  const [{ data: personas }, { data: profile }, { data: projects }, { data: workspaces }] = await Promise.all([
    supabase.from('personas').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('plan').eq('id', user!.id).single(),
    supabase.from('projects').select('id, name').eq('archived', false).order('name'),
    supabase.from('workspaces').select('id, name').order('name'),
  ])

  const plan = (profile?.plan ?? 'free') as Plan
  const limit = PLAN_LIMITS[plan].personas
  // Only this user's own personal personas count toward their plan limit —
  // matches app/api/personas/route.ts's insert-time check.
  const totalCount = (personas ?? []).filter(p => p.user_id === user!.id && !p.workspace_id).length

  return (
    <PersonasClient
      initialPersonas={personas ?? []}
      plan={plan}
      limit={limit}
      count={totalCount}
      projects={projects ?? []}
      workspaces={workspaces ?? []}
    />
  )
}
