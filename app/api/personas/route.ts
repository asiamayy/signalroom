import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { suggestPersonaTraits } from '@/lib/anthropic/persona-engine'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { PLAN_LIMITS } from '@/types'
import type { PersonaFormData, Plan } from '@/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', user.id)
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

  const body = await request.json()

  // If AI suggestion requested, generate traits first — no limit check needed
  if (body.generate && body.description) {
    try {
      const suggested = await suggestPersonaTraits(body.description)
      return NextResponse.json({ data: suggested })
    } catch (e: any) {
      console.error('Persona generation error:', e?.message ?? e)
      return NextResponse.json({ error: e?.message ?? 'Failed to generate persona' }, { status: 500 })
    }
  }

  // Check plan limit before creating
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'starter') as Plan
  const limit = PLAN_LIMITS[plan].personas

  if (limit !== Infinity) {
    const { count } = await supabase
      .from('personas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= limit) {
      return NextResponse.json({
        error: `You've reached the ${limit} persona limit on the ${plan} plan. Upgrade to create more.`,
        limit_reached: true,
      }, { status: 403 })
    }
  }

  const formData = body as PersonaFormData
  const initials = getInitials(formData.name)
  const color = getAvatarColor(formData.name)

  const { data, error } = await supabase
    .from('personas')
    .insert({
      user_id: user.id,
      name: formData.name,
      avatar_initials: initials,
      avatar_color: JSON.stringify(color),
      avatar_url: body.avatar_url ?? null,
      traits: formData.traits,
      tags: formData.tags ?? [],
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, action } = await request.json()
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
