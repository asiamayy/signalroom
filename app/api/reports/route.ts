import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // No user_id filter — RLS alone scopes this to personal reports plus any
  // workspace-shared ones this user is a member of.
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      interview:interviews(
        id,
        title,
        type,
        context,
        persona:personas(name, avatar_initials, avatar_color)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Report ID required' }, { status: 400 })

  // No user_id filter — RLS is the real gate, same reasoning as GET above.
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
