import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPersonaSystemPrompt } from '@/lib/anthropic/persona-engine'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { persona_ids, question, context, interview_type } = await request.json()

  if (!persona_ids || persona_ids.length < 2) {
    return NextResponse.json({ error: 'Select at least 2 personas' }, { status: 400 })
  }

  if (!question?.trim()) {
    return NextResponse.json({ error: 'Enter a question to ask' }, { status: 400 })
  }

  // Load all selected personas
  const { data: personas, error } = await supabase
    .from('personas')
    .select('*')
    .in('id', persona_ids)
    .eq('user_id', user.id)

  if (error || !personas?.length) {
    return NextResponse.json({ error: 'Personas not found' }, { status: 404 })
  }

  // Run all personas in parallel
  const results = await Promise.all(
    personas.map(async (persona) => {
      try {
        const systemPrompt = buildPersonaSystemPrompt(
          persona,
          interview_type ?? 'concept_testing',
          context ?? ''
        )

        const response = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: systemPrompt,
          messages: [{ role: 'user', content: question }],
        })

        const text = response.content[0].type === 'text' ? response.content[0].text : ''

        return {
          persona_id: persona.id,
          persona_name: persona.name,
          avatar_initials: persona.avatar_initials,
          avatar_color: persona.avatar_color,
          avatar_url: persona.avatar_url,
          job_title: persona.traits?.job_title,
          location: persona.traits?.location,
          response: text,
          error: null,
        }
      } catch (e: any) {
        return {
          persona_id: persona.id,
          persona_name: persona.name,
          avatar_initials: persona.avatar_initials,
          avatar_color: persona.avatar_color,
          avatar_url: persona.avatar_url,
          job_title: persona.traits?.job_title,
          location: persona.traits?.location,
          response: null,
          error: e?.message ?? 'Failed to get response',
        }
      }
    })
  )

  return NextResponse.json({ data: results })
}
