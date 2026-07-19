import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePersonaJourney } from '@/lib/anthropic/persona-engine'
import type { JourneyStep } from '@/types'

// ─── List journeys (with steps) for a persona ────────────────────────────────
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

  const { data: journeys, error } = await supabase
    .from('journeys')
    .select('*, journey_steps(*)')
    .eq('persona_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const data = (journeys ?? []).map(j => ({
    id: j.id,
    user_id: j.user_id,
    persona_id: j.persona_id,
    title: j.title,
    created_at: j.created_at,
    steps: (j.journey_steps ?? []).sort((a: any, b: any) => a.step_order - b.step_order),
  }))

  return NextResponse.json({ data })
}

// ─── Generate a new journey via the LLM and persist it ───────────────────────
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
  const { title } = await request.json()

  // No silent generic fallback — a journey generated without a specific
  // scenario has nothing real to be grounded in, so the model just invents
  // one from whatever's in the persona's profile (unrelated to what's
  // actually being researched).
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Describe a specific scenario for this persona to experience before generating a journey.' }, { status: 400 })
  }

  const { data: persona, error: personaError } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (personaError || !persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }

  try {
    const generated = await generatePersonaJourney(persona, title.trim())

    const { data: journey, error: journeyError } = await supabase
      .from('journeys')
      .insert({ user_id: user.id, persona_id: id, title: generated.title })
      .select()
      .single()

    if (journeyError || !journey) {
      return NextResponse.json({ error: journeyError?.message ?? 'Failed to create journey' }, { status: 500 })
    }

    const stepsToInsert = generated.steps.map((s: JourneyStep) => ({
      journey_id: journey.id,
      step_order: s.step_order,
      phase_name: s.phase_name,
      user_action: s.user_action,
      internal_thoughts: s.internal_thoughts,
      emotional_score: s.emotional_score,
      friction_point: s.friction_point,
    }))

    const { data: steps, error: stepsError } = await supabase
      .from('journey_steps')
      .insert(stepsToInsert)
      .select()

    if (stepsError) {
      return NextResponse.json({ error: stepsError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        id: journey.id,
        user_id: journey.user_id,
        persona_id: journey.persona_id,
        title: journey.title,
        created_at: journey.created_at,
        steps: (steps ?? []).sort((a, b) => a.step_order - b.step_order),
      },
    }, { status: 201 })
  } catch (e: any) {
    console.error('Journey generation error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Failed to generate journey' }, { status: 500 })
  }
}
