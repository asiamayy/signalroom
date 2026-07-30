import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { suggestPersonaTraits } from '@/lib/anthropic/persona-engine'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { getPlanForUser, trackUsage } from '@/lib/utils/entitlements'
import { personaCreateSchema, personaGenerateSchema, parseBody } from '@/lib/validation'
import { logError } from '@/lib/logger'
import { logWorkspaceActivity } from '@/lib/workspaces/activity'
import { getWorkspaceContext } from '@/lib/workspaces/context'
import { pushWorkspaceAutomation } from '@/lib/workspaces/automations'
import { PLAN_LIMITS } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const funnelStage = request.nextUrl.searchParams.get('funnel_stage')
  const projectId = request.nextUrl.searchParams.get('project_id')

  // No user_id filter — RLS alone scopes this to personal personas plus any
  // workspace-shared ones this user is a member of. An explicit filter here
  // would incorrectly hide co-members' workspace personas.
  let query = supabase
    .from('personas')
    .select('*')
    .order('created_at', { ascending: false })

  if (funnelStage) {
    query = query.eq('funnel_stage', funnelStage)
  }
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

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

  const body = await request.json()

  const { plan } = await getPlanForUser(supabase, user.id)

  // If AI suggestion requested, generate traits first — no limit check needed
  if (body.generate) {
    const parsed = parseBody(personaGenerateSchema, body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    try {
      const workspaceContext = await getWorkspaceContext(supabase, parsed.data.workspace_id)
      const suggested = await suggestPersonaTraits(parsed.data.description, workspaceContext)
      return NextResponse.json({ data: suggested })
    } catch (e: any) {
      logError('personas.generate', e, { userId: user.id })
      return NextResponse.json({ error: e?.message ?? 'Failed to generate persona' }, { status: 500 })
    }
  }

  const parsed = parseBody(personaCreateSchema, body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const formData = parsed.data

  // Personal plan limit only applies to personal (non-workspace) personas —
  // a workspace member creating inside a shared Broadcast workspace operates
  // under the OWNER's entitlement (and the 10-seat cap), not their own
  // individual plan, so the check is skipped entirely for workspace creates.
  // (RLS's insert `with check` still requires actual membership in the
  // target workspace regardless — this is a UX/business-logic gate on top,
  // not the security boundary.)
  if (!formData.workspace_id) {
    const limit = PLAN_LIMITS[plan].personas

    if (limit !== Infinity) {
      const { count } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('workspace_id', null)
      // All personal personas (active + archived) count toward the limit —
      // personas created inside a shared workspace never count here.

      // Grandfather: a user who already has more personas than the plan's
      // current cap (e.g. built up under a prior "unlimited" tier) is never
      // asked to delete anything or blocked from anything they could already
      // do. Their effective ceiling is whichever is higher — the plan's cap or
      // what they already have — so they can keep using everything they built,
      // just can't add indefinitely more until they drop back under the cap or
      // upgrade. New/smaller accounts are capped normally.
      const effectiveLimit = Math.max(limit, count ?? 0)

      if ((count ?? 0) >= effectiveLimit) {
        return NextResponse.json({
          error: `You've reached the ${limit} persona limit on the ${plan} plan. Upgrade to create more.`,
          limit_reached: true,
        }, { status: 403 })
      }
    }
  }

  const initials = getInitials(formData.name)
  const color = getAvatarColor(formData.name)

  const { data, error } = await supabase
    .from('personas')
    .insert({
      user_id: user.id,
      project_id: formData.project_id ?? null,
      workspace_id: formData.workspace_id ?? null,
      name: formData.name,
      avatar_initials: initials,
      avatar_color: JSON.stringify(color),
      avatar_url: formData.avatar_url ?? null,
      traits: formData.traits,
      tags: formData.tags,
      funnel_stage: formData.funnel_stage,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await trackUsage(supabase, 'persona')
  await logWorkspaceActivity(supabase, {
    workspaceId: formData.workspace_id,
    actorId: user.id,
    action: 'persona_created',
    entityType: 'persona',
    entityId: data.id,
    entityLabel: data.name,
  })
  after(() => pushWorkspaceAutomation({
    workspaceId: formData.workspace_id,
    event: 'persona_created',
    itemName: data.name,
  }))

  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, action, project_id, funnel_stage } = await request.json()
  if (!id || !action) return NextResponse.json({ error: 'ID and action required' }, { status: 400 })

  // No user_id filter on any of these — RLS is the real gate (personal owner,
  // or any co-member of the persona's workspace). An explicit filter here
  // would incorrectly block a workspace member from managing a persona a
  // co-member created, which is the entire point of shared edit access.

  if (action === 'set_stage') {
    const VALID_STAGES = ['awareness', 'consideration', 'purchase', 'loyalty']
    if (!VALID_STAGES.includes(funnel_stage)) {
      return NextResponse.json({ error: 'Invalid funnel stage' }, { status: 400 })
    }
    const { error } = await supabase
      .from('personas')
      .update({ funnel_stage })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'archive') {
    const { error } = await supabase
      .from('personas')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'restore') {
    const { error } = await supabase
      .from('personas')
      .update({ archived: false, archived_at: null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'set_project') {
    const { error } = await supabase
      .from('personas')
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

  if (!id) {
    return NextResponse.json({ error: 'Persona ID required' }, { status: 400 })
  }

  // No user_id filter — RLS is the real gate, same reasoning as PATCH above.
  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
