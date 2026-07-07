import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PersonaDetailClient } from '@/components/persona/PersonaDetailClient'

export default async function PersonaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single()

  if (!persona) notFound()

  const { data: interviews } = await supabase
    .from('interviews')
    .select('*')
    .eq('persona_id', id)
    .order('created_at', { ascending: false })

  return <PersonaDetailClient persona={persona} interviews={interviews ?? []} />
}
