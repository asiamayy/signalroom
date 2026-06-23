import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { suggestPersonaTraits } from '@/lib/anthropic/persona-engine'
import { getInitials, getAvatarColor } from '@/lib/utils'
import type { PersonaFormData } from '@/types'

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

  // If AI suggestion requested, generate traits first
  if (body.generate && body.description) {
    try {
      const suggested = await suggestPersonaTraits(body.description)
      return NextResponse.json({ data: suggested })
    } catch (e) {
      return NextResponse.json({ error: 'Failed to generate persona' }, { status: 500 })
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
