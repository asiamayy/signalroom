import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type DraftPayload = {
  name?: unknown
  tags?: unknown
  traits?: unknown
  funnel_stage?: unknown
  avatar_url?: unknown
  project_id?: unknown
  workspace_id?: unknown
}

function isDraftPayload(value: unknown): value is DraftPayload {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('persona_drafts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...payload } = body
  if (!isDraftPayload(payload)) return NextResponse.json({ error: 'Invalid draft' }, { status: 400 })

  const name = typeof payload.name === 'string' ? payload.name.slice(0, 160) : ''
  const values = {
    name,
    project_id: typeof payload.project_id === 'string' ? payload.project_id : null,
    workspace_id: typeof payload.workspace_id === 'string' ? payload.workspace_id : null,
    payload,
  }

  if (typeof id === 'string') {
    const { data, error } = await supabase
      .from('persona_drafts')
      .update(values)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  const { data, error } = await supabase
    .from('persona_drafts')
    .insert({ user_id: user.id, ...values })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (typeof id !== 'string') return NextResponse.json({ error: 'Draft ID required' }, { status: 400 })

  const { error } = await supabase
    .from('persona_drafts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
