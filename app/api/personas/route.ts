import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { suggestPersonaTraits } from '@/lib/anthropic/persona-engine'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { getPlanForUser, trackUsage } from '@/lib/utils/entitlements'
import { personaCreateSchema, personaGenerateSchema, parseBody } from '@/lib/validation'
import { logError } from '@/lib/logger'
import { PLAN_LIMITS } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const funnelStage = request.nextUrl.searchParams.get('funnel_stage')
  const projectId = request.nextUrl.searchParams.get('project_id')

  let query = supabase
    .from('personas')
    .select('*')
    .eq('user_id', user.id)
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
      const suggested = await suggestPersonaTraits(parsed.data.description)
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

  // Check plan limit before creating
  const limit = PLAN_LIMITS[plan].personas

  if (limit !== Infinity) {
    const { count } = await supabase
      .from('personas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    // All personas (active + archived) count toward limit

    if ((count ?? 0) >= limit) {
      return NextResponse.json({
        error: `You've reached the ${limit} persona limit on the ${plan} plan. Upgrade to create more.`,
        limit_reached: true,
      }, { status: 403 })
    }
  }

  const formData = parsed.data
  const initials = getInitials(formData.name)
  const color = getAvatarColor(formData.name)

  const { data, error } = await supabase
    .from('personas')
    .insert({
      user_id: user.id,
      project_id: formData.project_id ?? null,
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

  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, action, project_id } = await request.json()
  if (!id || !action) return NextResponse.json({ error: 'ID and action required' }, { status: 400 })

  if (action === 'archive') {
    const { error } = await supabase
      .from('personas')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'restore') {
    const { error } = await supabase
      .from('personas')
      .update({ archived: false, archived_at: null })
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'set_project') {
    const { error } = await supabase
      .from('personas')
      .update({ project_id: project_id ?? null })
      .eq('id', id)
      .eq('user_id', user.id)
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

  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
