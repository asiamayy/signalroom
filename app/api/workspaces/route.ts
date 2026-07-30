import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanForUser } from '@/lib/utils/entitlements'
import { logWorkspaceActivity } from '@/lib/workspaces/activity'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS alone scopes this to workspaces the caller is a member of (owner or
  // invited) — no .eq() needed or even possible, since owner_id isn't the
  // caller for a workspace they were invited into.
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await getPlanForUser(supabase, user.id)
  if (plan !== 'agency') {
    return NextResponse.json({
      error: 'Team workspaces are available on the Broadcast plan.',
      limit_reached: true,
    }, { status: 403 })
  }

  const { name } = await request.json()
  const trimmedName = typeof name === 'string' ? name.trim().slice(0, 120) : ''

  if (!trimmedName) {
    return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 })
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({ owner_id: user.id, name: trimmedName })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // The owner is a workspace_members row too — this is what lets every RLS
  // policy downstream be one uniform "is this uid a member" check instead of
  // a separate owner-bypass branch. If this insert fails, roll back the
  // workspace itself rather than leave an ownerless workspace behind.
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: user.id, role: 'owner' })

  if (memberError) {
    await supabase.from('workspaces').delete().eq('id', workspace.id)
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  await logWorkspaceActivity(supabase, {
    workspaceId: workspace.id,
    actorId: user.id,
    action: 'workspace_created',
    entityType: 'workspace',
    entityId: workspace.id,
    entityLabel: workspace.name,
  })

  return NextResponse.json({ data: workspace }, { status: 201 })
}
