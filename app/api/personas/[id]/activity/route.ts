import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: persona } = await supabase.from('personas').select('id').eq('id', id).single()
  if (!persona) return NextResponse.json({ error: 'Persona not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('persona_activity')
    .select('id, persona_id, actor_id, action, detail, created_at')
    .eq('persona_id', id)
    .order('created_at', { ascending: false })

  // The feed is additive. Until an existing deployment runs the migration,
  // leave the tab empty rather than showing a database error to the user.
  if (error) return NextResponse.json({ data: [] })
  return NextResponse.json({ data: data ?? [] })
}
