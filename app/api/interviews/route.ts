import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canRunInterview } from '@/lib/utils'
import { getPlanForUser, countInterviewsThisMonth, trackUsage } from '@/lib/utils/entitlements'
import { interviewCreateSchema, parseBody } from '@/lib/validation'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('project_id')

  let query = supabase
    .from('interviews')
    .select('*, persona:personas(*)')
    .eq('user_id', user.id)
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
    const { error } = await supabase
      .from('interviews')
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
  if (!id) return NextResponse.json({ error: 'Interview ID required' }, { status: 400 })

  const { error } = await supabase
    .from('interviews')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

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
  if (limits.interviews_per_month !== Infinity) {
    const usedThisMonth = await countInterviewsThisMonth(supabase, user.id)
    if (!canRunInterview(plan, usedThisMonth)) {
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

  return NextResponse.json({ data }, { status: 201 })
}
