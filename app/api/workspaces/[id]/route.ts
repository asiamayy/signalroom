import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logWorkspaceActivity } from '@/lib/workspaces/activity'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { name, description } = await request.json()
  const update: { name?: string; description?: string | null } = {}
  if (typeof name === 'string') {
    const trimmedName = name.trim().slice(0, 120)
    if (!trimmedName) return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 })
    update.name = trimmedName
  }
  if (typeof description === 'string') update.description = description.trim().slice(0, 360) || null
  if (!Object.keys(update).length) return NextResponse.json({ error: 'No workspace updates supplied' }, { status: 400 })

  // RLS restricts updates to the workspace owner — a non-owner member's
  // request simply matches zero rows rather than needing an app-level check.
  const { data, error } = await supabase
    .from('workspaces')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logWorkspaceActivity(supabase, {
    workspaceId: id,
    actorId: user.id,
    action: 'workspace_renamed',
    entityType: 'workspace',
    entityId: id,
    entityLabel: data.name,
  })

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

  // Cascades workspace_members/workspace_invites; SET NULLs every
  // project/persona/interview/report's workspace_id — nothing is deleted,
  // content just reverts to personal, owned by whoever created it (same
  // behavior as deleting a project today). RLS restricts this to the owner.
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
