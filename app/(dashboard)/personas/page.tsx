import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/types'
import type { Plan, Persona } from '@/types'
import PersonasClient from './PersonasClient'

export default async function PersonasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: personas }, { data: profile }] = await Promise.all([
    supabase.from('personas').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('plan').eq('id', user!.id).single(),
  ])

  const plan = (profile?.plan ?? 'starter') as Plan
  const limit = PLAN_LIMITS[plan].personas
  const count = personas?.length ?? 0

  return (
    <PersonasClient
      initialPersonas={personas ?? []}
      plan={plan}
      limit={limit}
      count={count}
    />
  )
}
