import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPlanForUser, countWorkspaceSeats } from '@/lib/utils/entitlements'
import { sendEmail } from '@/lib/email'
import { PLAN_LIMITS } from '@/types'

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

  // RLS restricts this to the workspace owner.
  const { data, error } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('workspace_id', id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { plan } = await getPlanForUser(supabase, user.id)
  if (plan !== 'agency') {
    return NextResponse.json({ error: 'Team workspaces are available on the Broadcast plan.' }, { status: 403 })
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, owner_id')
    .eq('id', id)
    .single()

  if (!workspace || workspace.owner_id !== user.id) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const { email } = await request.json()
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  // Seat check: an already-existing member of ANY of the owner's workspaces
  // never consumes a new seat (they might just be getting added to a second
  // workspace). Grandfather idiom (max of the plan limit and current usage)
  // matches how personas/interviews limits are enforced elsewhere in this app.
  //
  // profiles' RLS is auth.uid() = id only, so the regular client can never
  // look up someone else's profile by email — this lookup is a legitimate
  // owner-side operation (checking whether an invitee is already on the
  // team), so it uses the admin client, same as the invite-accept flow does.
  const admin = await createAdminClient()
  const { data: existingMemberProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  let alreadyMember = false
  if (existingMemberProfile) {
    const { data: ownerWorkspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id)
    const ownerWorkspaceIds = (ownerWorkspaces ?? []).map(w => w.id)
    if (ownerWorkspaceIds.length > 0) {
      const { count } = await admin
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .in('workspace_id', ownerWorkspaceIds)
        .eq('user_id', existingMemberProfile.id)
      alreadyMember = (count ?? 0) > 0
    }
  }

  if (!alreadyMember) {
    const limit = PLAN_LIMITS.agency.team_seats
    const currentSeats = await countWorkspaceSeats(supabase, user.id)
    const effectiveLimit = Math.max(limit, currentSeats)
    if (currentSeats >= effectiveLimit) {
      return NextResponse.json({
        error: `You've reached the ${limit}-seat limit on the Broadcast plan.`,
        limit_reached: true,
      }, { status: 403 })
    }
  }

  const { data: invite, error } = await supabase
    .from('workspace_invites')
    .insert({ workspace_id: id, invited_email: normalizedEmail, invited_by: user.id })
    .select()
    .single()

  if (error) {
    // Unique partial index on (workspace_id, invited_email) where pending
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This person already has a pending invite to this workspace' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`
  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: `You've been invited to ${workspace.name} on SignalRoom`,
    htmlContent: `<p>You've been invited to join <strong>${workspace.name}</strong> on SignalRoom.</p><p><a href="${inviteUrl}">Accept invite</a></p>`,
  })

  if (!emailResult.ok) {
    // The invite row exists and is valid even if the email failed to send —
    // don't fail the whole request, just surface it so the owner can share
    // the link manually or retry.
    return NextResponse.json({ data: invite, email_error: emailResult.error }, { status: 201 })
  }

  return NextResponse.json({ data: invite }, { status: 201 })
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
  const { invite_id } = await request.json()

  if (!invite_id) {
    return NextResponse.json({ error: 'invite_id is required' }, { status: 400 })
  }

  // RLS restricts this to the workspace owner.
  const { error } = await supabase
    .from('workspace_invites')
    .update({ status: 'revoked' })
    .eq('id', invite_id)
    .eq('workspace_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
