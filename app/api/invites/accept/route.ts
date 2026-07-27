import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPlanForUser, countWorkspaceSeats } from '@/lib/utils/entitlements'
import { PLAN_LIMITS } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to accept an invite' }, { status: 401 })
  }

  const { token } = await request.json()
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 400 })
  }

  // A non-owner accepting an invite can't satisfy the owner-only
  // workspace_members insert policy themselves, so this whole flow uses the
  // admin client — the same "cross normal RLS boundaries safely" pattern the
  // report share_token lookup already uses in this codebase.
  const admin = await createAdminClient()

  const { data: invite } = await admin
    .from('workspace_invites')
    .select('id, workspace_id, invited_email, status')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'This invite is no longer valid' }, { status: 404 })
  }

  // Never silently link the wrong account — the invite was sent to a
  // specific address, and only that address may accept it.
  if (invite.invited_email.toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return NextResponse.json({
      error: 'This invite was sent to a different email address. Sign out and sign in with the invited address to accept it.',
    }, { status: 403 })
  }

  const { data: workspace } = await admin
    .from('workspaces')
    .select('id, owner_id')
    .eq('id', invite.workspace_id)
    .single()

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no longer exists' }, { status: 404 })
  }

  // Authoritative seat check, re-run at the actual moment a new distinct
  // member would be created — closes the race where several invites accept
  // near-simultaneously. Already being a member costs nothing (idempotent).
  const { data: existingMembership } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existingMembership) {
    const { plan: ownerPlan } = await getPlanForUser(admin, workspace.owner_id)
    const limit = PLAN_LIMITS[ownerPlan]?.team_seats ?? 1
    const currentSeats = await countWorkspaceSeats(admin, workspace.owner_id)
    const effectiveLimit = Math.max(limit, currentSeats)
    if (currentSeats >= effectiveLimit) {
      return NextResponse.json({
        error: 'This team has reached its seat limit. Ask the workspace owner to upgrade or remove a member.',
      }, { status: 403 })
    }

    const { error: insertError } = await admin
      .from('workspace_members')
      .insert({ workspace_id: workspace.id, user_id: user.id, role: 'member' })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  await admin
    .from('workspace_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({ data: { workspace_id: workspace.id } })
}
