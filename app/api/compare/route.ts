import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildPersonaSystemPrompt,
  buildUserMessageContent,
  computePersonaTemperature,
  extractLeadingScore,
  findClusteredScoreGroups,
  assignDiversificationBands,
  rescorePersonaWithBand,
  findDuplicateOpeningGroups,
  rewriteResponseWithDistinctOpening,
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

  const questionContent = buildUserMessageContent(question ?? '', image ?? null, imageMediaType)

  // Load all selected personas
  const { data: personas, error } = await supabase
    .from('personas')
    .select('*')
    .in('id', persona_ids)
    .eq('user_id', user.id)

  if (error || !personas?.length) {
    return NextResponse.json({ error: 'Personas not found' }, { status: 404 })
  }

  // Run all personas in parallel, each with its own persona-identity-based
  // temperature (not array position) — same helper interviews use, so all
  // three surfaces are consistent.
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
          temperature: computePersonaTemperature(persona),
          system: systemPrompt,
          messages: [{ role: 'user', content: questionContent }],
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

  // Detect clustered numeric scores (3+ personas landing within a few points
  // of each other) and re-ask just those personas with a non-overlapping
  // target band — centered on the cluster's own average and ordered by real
  // trait differences, not an arbitrary absolute scale — so the fix stays
  // "local" to what each persona already said instead of asking anyone to
  // flip their actual reaction. Only fires when clustering is actually
  // detected — a normal run pays no extra cost.
  const scores = results.map(r => r.response ? extractLeadingScore(r.response) : null)
  const clusterGroups = findClusteredScoreGroups(scores)

  if (clusterGroups.length > 0) {
    await Promise.all(
      clusterGroups.flatMap(group => {
        const bands = assignDiversificationBands(group, scores, personas)
        return bands.map(async ({ index: idx, min, max }) => {
          const persona = personas[idx]
          const original = results[idx]
          if (!original.response) return

          const systemPrompt = buildPersonaSystemPrompt(
            persona,
            interview_type ?? 'concept_testing',
            context ?? ''
          )

          const revised = await rescorePersonaWithBand(
            persona,
            systemPrompt,
            questionContent,
            original.response,
            { min, max },
            computePersonaTemperature(persona)
          )

          results[idx].response = revised
        })
      })
    )
  }

  // Detect personas whose responses opened with essentially the same wording
  // (e.g. multiple personas independently reaching for the same generic
  // observation) and rewrite all but one against that shared opening, so the
  // panel doesn't read as a single voice repeated across avatars.
  const openingGroups = findDuplicateOpeningGroups(results.map(r => r.response))

  if (openingGroups.length > 0) {
    await Promise.all(
      openingGroups.flatMap(group => {
        const [anchorIdx, ...restIdx] = group
        const peerOpening = results[anchorIdx].response!.slice(0, 120)
        return restIdx.map(async (idx) => {
          const persona = personas[idx]
          const original = results[idx]
          if (!original.response) return

          const systemPrompt = buildPersonaSystemPrompt(
            persona,
            interview_type ?? 'concept_testing',
            context ?? ''
          )

          const revised = await rewriteResponseWithDistinctOpening(
            persona,
            systemPrompt,
            questionContent,
            original.response,
            peerOpening,
            computePersonaTemperature(persona)
          )

          results[idx].response = revised
        })
      })
    )
  }

  const withScores = results.map(r => ({
    ...r,
    score: r.response ? extractLeadingScore(r.response) : null,
  }))

  return NextResponse.json({ data: withScores })
}
