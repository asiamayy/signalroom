import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildPersonaSystemPrompt,
  buildUserMessageContent,
  computePersonaTemperature,
  questionRequestsScore,
  buildStructuredResponseInstruction,
  parseStructuredResponse,
} from '@/lib/anthropic/persona-engine'
import { getPlanForUser } from '@/lib/utils/entitlements'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { persona_ids, question, context, interview_type, image, imageMediaType } = await request.json()

  if (!persona_ids || persona_ids.length < 2) {
    return NextResponse.json({ error: 'Select at least 2 personas' }, { status: 400 })
  }

  // Compare is a multi-persona surface — pro and agency only
  const { limits } = await getPlanForUser(supabase, user.id)
  if (!limits.multi_persona) {
    return NextResponse.json({
      error: 'Comparing multiple personas is available on the Signal plan and above.',
      limit_reached: true,
    }, { status: 403 })
  }

  if (!question?.trim() && !image) {
    return NextResponse.json({ error: 'Enter a question to ask' }, { status: 400 })
  }

  // Everything past here does real LLM work — wrap it so any failure returns a
  // JSON error the client can show, instead of an unhandled 500 as HTML.
  try {
    const questionContent = buildUserMessageContent(question ?? '', image ?? null, imageMediaType)

    const wantsScore = questionRequestsScore(question ?? '')

    // Load all selected personas
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .in('id', persona_ids)
      .eq('user_id', user.id)

    if (error || !personas?.length) {
      return NextResponse.json({ error: 'Personas not found' }, { status: 404 })
    }

    // ONE structured call per persona returns reply + score together. Diversity
    // in the number and wording comes from each persona's disposition/lens in
    // the system prompt — not from post-hoc re-ask passes.
    const results = await Promise.all(
      personas.map(async (persona) => {
        const base = {
          persona_id: persona.id,
          persona_name: persona.name,
          avatar_initials: persona.avatar_initials,
          avatar_color: persona.avatar_color,
          avatar_url: persona.avatar_url,
          job_title: persona.traits?.job_title,
          location: persona.traits?.location,
        }
        try {
          const systemPrompt =
            buildPersonaSystemPrompt(persona, interview_type ?? 'concept_testing', context ?? '')
            + buildStructuredResponseInstruction({ wantsScore, wantsSentiment: false })

          const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 700,
            temperature: computePersonaTemperature(persona),
            system: systemPrompt,
            messages: [{ role: 'user', content: questionContent }],
          })

          const raw = response.content[0].type === 'text' ? response.content[0].text : ''
          const parsed = parseStructuredResponse(raw, { wantsScore, wantsSentiment: false })

          return {
            ...base,
            response: parsed.reply,
            score: parsed.score,
            error: null,
          }
        } catch (e: any) {
          return {
            ...base,
            response: null,
            score: null,
            error: e?.message ?? 'Failed to get response',
          }
        }
      })
    )

    return NextResponse.json({ data: results })
  } catch (e: any) {
    console.error('[compare] request failed:', e)
    return NextResponse.json({ error: 'The comparison failed to complete. Please try again.' }, { status: 500 })
  }
}
