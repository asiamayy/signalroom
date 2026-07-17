import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPersonaSystemPrompt, buildUserMessageContent } from '@/lib/anthropic/persona-engine'
import Anthropic from '@anthropic-ai/sdk'
import { PLAN_LIMITS } from '@/types'
import type { Plan } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check plan — Audience Panel is pro and agency only
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as Plan
  const limits = PLAN_LIMITS[plan]

  if (!limits.audience_panel) {
    return NextResponse.json({ error: 'Upgrade to Signal or Broadcast to use Audience Panel' }, { status: 403 })
  }

  const { persona_ids, question, image, imageMediaType } = await request.json()

  if (!persona_ids || persona_ids.length < 5) {
    return NextResponse.json({ error: 'Select at least 5 personas' }, { status: 400 })
  }

  if (persona_ids.length > limits.audience_panel_max) {
    return NextResponse.json({ error: `Your plan supports up to ${limits.audience_panel_max} personas` }, { status: 400 })
  }

  if (!question?.trim() && !image) {
    return NextResponse.json({ error: 'Enter a question to ask your audience' }, { status: 400 })
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

  // Run all personas in parallel — single question, single response each
  const responses = await Promise.all(
    personas.map(async (persona) => {
      try {
        const systemPrompt = buildPersonaSystemPrompt(persona, 'custom', '')

        const response = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: systemPrompt + `\n\nIMPORTANT: This is a quick audience panel response. Keep your answer focused and under 150 words. Be direct about your opinion.`,
          messages: [{ role: 'user', content: questionContent }],
        })

        const text = response.content[0].type === 'text' ? response.content[0].text : ''

        // Extract sentiment from response
        const sentimentResponse = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Classify the overall sentiment of this response as exactly one of: "positive", "neutral", "negative", "mixed". Return ONLY the single word, nothing else.\n\nResponse: ${text}`
          }]
        })

        const sentimentRaw = sentimentResponse.content[0].type === 'text'
          ? sentimentResponse.content[0].text.trim().toLowerCase()
          : 'neutral'

        const sentiment = ['positive', 'neutral', 'negative', 'mixed'].includes(sentimentRaw)
          ? sentimentRaw as 'positive' | 'neutral' | 'negative' | 'mixed'
          : 'neutral'

        return {
          persona_id: persona.id,
          persona_name: persona.name,
          avatar_initials: persona.avatar_initials,
          avatar_color: persona.avatar_color,
          avatar_url: persona.avatar_url,
          job_title: persona.traits?.job_title ?? '',
          location: persona.traits?.location ?? '',
          age: persona.traits?.age ?? null,
          industry: persona.traits?.industry ?? '',
          response: text,
          sentiment,
          error: null,
        }
      } catch (e: any) {
        return {
          persona_id: persona.id,
          persona_name: persona.name,
          avatar_initials: persona.avatar_initials,
          avatar_color: persona.avatar_color,
          avatar_url: persona.avatar_url,
          job_title: persona.traits?.job_title ?? '',
          location: persona.traits?.location ?? '',
          age: persona.traits?.age ?? null,
          industry: persona.traits?.industry ?? '',
          response: null,
          sentiment: 'neutral' as const,
          error: e?.message ?? 'Failed to get response',
        }
      }
    })
  )

  // Aggregate themes, executive summary, recommendations and quotes across all responses
  const allText = responses
    .filter(r => r.response)
    .map(r => `${r.persona_name} (${r.job_title}): ${r.response}`)
    .join('\n\n')

  // Run theme extraction and executive summary in parallel
  const [themeResponse, summaryResponse] = await Promise.all([
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are analyzing responses from ${responses.length} different customer personas who were asked: "${question?.trim() || 'to react to a shared image'}"

Here are their responses:
${allText}

Extract 3-5 key themes across all responses. For each theme return:
- title: short theme name (3-5 words)
- count: how many personas expressed this theme (number)
- sentiment: overall sentiment of this theme ("positive", "neutral", "negative", "mixed")
- summary: one sentence summary

Return ONLY a JSON array, no preamble, no markdown:
[{"title":"...","count":0,"sentiment":"...","summary":"..."}]`
      }]
    }),
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a senior market researcher analyzing responses from ${responses.length} customer personas who were asked: "${question?.trim() || 'to react to a shared image'}"

Responses:
${allText}

Return a JSON object with these exact fields:
{
  "overall_recommendation": "2-3 sentence executive summary of what decision to make based on these responses",
  "top_opportunity": "The single biggest opportunity revealed by these responses in one sentence",
  "biggest_risk": "The single biggest concern or objection revealed in one sentence",
  "likelihood_of_purchase": 0-100,
  "recommended_actions": ["action 1", "action 2", "action 3", "action 4"],
  "most_representative_quote": "the single most representative quote from all responses verbatim",
  "most_representative_quote_persona": "name of persona who said it",
  "biggest_objection_quote": "the single biggest objection raised verbatim",
  "biggest_objection_quote_persona": "name of persona who said it",
  "completed_in_seconds": ${responses.length * 3}
}

Return ONLY the JSON, no preamble, no markdown.`
      }]
    })
  ])

  let themes: { title: string; count: number; sentiment: string; summary: string }[] = []
  try {
    const raw = themeResponse.content[0].type === 'text' ? themeResponse.content[0].text : '[]'
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    themes = JSON.parse(cleaned)
  } catch {
    themes = []
  }

  let summary = {
    overall_recommendation: '',
    top_opportunity: '',
    biggest_risk: '',
    likelihood_of_purchase: 0,
    recommended_actions: [] as string[],
    most_representative_quote: '',
    most_representative_quote_persona: '',
    biggest_objection_quote: '',
    biggest_objection_quote_persona: '',
    completed_in_seconds: responses.length * 3,
  }
  try {
    const raw = summaryResponse.content[0].type === 'text' ? summaryResponse.content[0].text : '{}'
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    summary = { ...summary, ...JSON.parse(cleaned) }
  } catch {
    // keep defaults
  }

  // Compute sentiment distribution
  const sentimentCounts = responses.reduce((acc, r) => {
    acc[r.sentiment] = (acc[r.sentiment] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Compute consensus score (% who share the majority sentiment)
  const maxSentimentCount = Math.max(...Object.values(sentimentCounts))
  const consensusScore = Math.round((maxSentimentCount / responses.length) * 100)

  return NextResponse.json({
    data: {
      responses,
      themes,
      sentiment_distribution: sentimentCounts,
      consensus_score: consensusScore,
      total_personas: responses.length,
      question,
      summary,
    }
  })
}
