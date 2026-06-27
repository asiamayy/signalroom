import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/types'
import type { Plan, Persona } from '@/types'
import PersonasClient from './PersonasClient'

export default async function PersonasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: personas }, { data: profile }] = await Promise.all([
    supabase.from('personas').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('plan').eq('id', user!.id).single(),
  ])

  const plan = (profile?.plan ?? 'starter') as Plan
  const limit = PLAN_LIMITS[plan].personas
  // All personas (active + archived) count toward limit
  const totalCount = (personas ?? []).length

  return (
    <PersonasClient
      initialPersonas={personas ?? []}
      plan={plan}
      limit={limit}
      count={totalCount}
    />
  )
}
