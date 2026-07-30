import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanForUser, countInterviewsThisMonth, trackUsage } from '@/lib/utils/entitlements'
import { interviewCreateSchema, parseBody } from '@/lib/validation'
import { logWorkspaceActivity } from '@/lib/workspaces/activity'
import { pushWorkspaceAutomation } from '@/lib/workspaces/automations'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('project_id')

  // No user_id filter — RLS alone scopes this to personal interviews plus any
  // workspace-shared ones this user is a member of.
  let query = supabase
    .from('interviews')
    .select('*, persona:personas(*)')
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, action, project_id } = await request.json()
  if (!id || !action) return NextResponse.json({ error: 'ID and action required' }, { status: 400 })

  if (action === 'set_project') {
    // No user_id filter — RLS is the real gate (personal owner, or any
    // co-member of the interview's workspace).
    const { error } = await supabase
      .from('interviews')
      .update({ project_id: project_id ?? null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Interview ID required' }, { status: 400 })

  // No user_id filter — RLS is the real gate, same reasoning as PATCH above.
  const { error } = await supabase
    .from('interviews')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = parseBody(interviewCreateSchema, await request.json())
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const body = parsed.data

  const { plan, limits } = await getPlanForUser(supabase, user.id)

  // Monthly interview cap only applies to personal interviews — a workspace
  // member creating inside a shared Broadcast workspace operates under the
  // OWNER's entitlement (and the 10-seat cap), not their own individual plan,
  // so the check is skipped entirely for workspace creates (same pattern as
  // the persona limit in app/api/personas/route.ts).
  if (!body.workspace_id && limits.interviews_per_month !== Infinity) {
    const usedThisMonth = await countInterviewsThisMonth(supabase, user.id)

    // Grandfather: a user who already ran more interviews this month than the
    // plan's current monthly cap (e.g. before a lower cap took effect) is
    // never blocked from anything they could already do this month — their
    // effective ceiling is whichever is higher, the plan's cap or what
    // they've already used. Self-resolving: the count resets next calendar
    // month, so this only ever applies for the remainder of the current one.
    const effectiveLimit = Math.max(limits.interviews_per_month, usedThisMonth)

    if (usedThisMonth >= effectiveLimit) {
      return NextResponse.json({
        error: `You've reached the ${limits.interviews_per_month} interview${limits.interviews_per_month === 1 ? '' : 's'}/month limit on the ${plan} plan. Upgrade to run more.`,
        limit_reached: true,
      }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from('interviews')
    .insert({
      user_id: user.id,
      project_id: body.project_id ?? null,
      workspace_id: body.workspace_id ?? null,
      persona_id: body.persona_id,
      title: body.title,
      type: body.type,
      context: body.context,
      status: 'active',
      messages: [],
      devils_advocate: body.devils_advocate ?? false,
    })
    .select('*, persona:personas(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await trackUsage(supabase, 'interview')
  await logWorkspaceActivity(supabase, {
    workspaceId: body.workspace_id,
    actorId: user.id,
    action: 'interview_started',
    entityType: 'interview',
    entityId: data.id,
    entityLabel: data.title,
  })
  after(() => pushWorkspaceAutomation({
    workspaceId: body.workspace_id,
    event: 'interview_started',
    itemName: data.title,
  }))

  return NextResponse.json({ data }, { status: 201 })
}
