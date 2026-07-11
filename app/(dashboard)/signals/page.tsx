import { createClient } from '@/lib/supabase/server'
import { SignalsClient } from './SignalsClient'

export default async function SignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: signals }, { data: projects }, { data: personas }, { data: interviews }] = await Promise.all([
    supabase.from('signals').select('*').eq('user_id', user!.id).order('confidence_score', { ascending: false }),
    supabase.from('projects').select('id, name').eq('user_id', user!.id).eq('archived', false).order('name'),
    supabase.from('personas').select('id, name').eq('user_id', user!.id),
    supabase.from('interviews').select('id, title').eq('user_id', user!.id),
  ])

  return (
    <SignalsClient
      initialSignals={signals ?? []}
      projects={projects ?? []}
      personas={personas ?? []}
      interviews={interviews ?? []}
    />
  )
}
