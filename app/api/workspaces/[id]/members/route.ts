import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // get_workspace_member_profiles is security definer, scoped to 4 safe
  // columns (never profiles.*), and internally gated on the caller being a
  // live member of this workspace — returns zero rows otherwise, same
  // isolation guarantee as everywhere else.
  const { data, error } = await supabase.rpc('get_workspace_member_profiles', {
    p_workspace_id: id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { user_id } = await request.json()

  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  // RLS covers both cases naturally: the owner removing anyone, or a member
  // removing themselves ("leave workspace") — anything else matches zero
  // rows rather than needing an app-level role check.
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', id)
    .eq('user_id', user_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
