import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

// Presence itself is ephemeral (Supabase Realtime), but this endpoint records
// the most recent time a member viewed a workspace so teammates retain useful
// context once that live session ends.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 })
  if (!membership) return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 })

  const admin = await createAdminClient()
  const { error } = await admin
    .from('workspace_members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('workspace_id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
