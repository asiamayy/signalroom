import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: personaCount }, { count: interviewCount }, { data: integrations }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('personas').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    // Explicit columns, never select('*') — access_token must never reach a
    // client-facing response.
    supabase.from('integrations').select('provider, display_name, metadata, created_at').eq('user_id', user.id),
  ])

  return (
    <SettingsClient
      profile={profile}
      user={user}
      personaCount={personaCount ?? 0}
      interviewCount={interviewCount ?? 0}
      integrations={integrations ?? []}
    />
  )
}
