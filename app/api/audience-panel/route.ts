import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildUserMessageContent,
  questionRequestsScore,
  buildPanelSystemPrompt,
  parsePanelResponses,
} from '@/lib/anthropic/persona-engine'
import { quoteInText } from '@/lib/utils/quotes'
import Anthropic from '@anthropic-ai/sdk'
import { PLAN_LIMITS } from '@/types'
import type { Plan } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  // Real wall-clock start — "Time to Complete" in the UI reports measured
  // elapsed time, never an estimate.
  const startedAt = Date.now()

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

  // Everything past here does real LLM work — wrap it so any failure returns a
  // JSON error the client can show, instead of an unhandled 500 that arrives as
  // HTML and surfaces to the user as a blank "Something went wrong."
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

    // ONE joint call generates the whole panel. Because the model sees every
    // persona together it can make them genuinely distinct — different opening
    // angles, scores scattered across the range per each person's real traits —
    // which independent per-persona calls (each blind to the others) cannot do.
    // It's also far cheaper: one generation call instead of one per persona.
    const panelSystem = buildPanelSystemPrompt(personas, {
      wantsScore,
      wantsSentiment: true,
      interviewType: 'custom',
      context: '',
    })

    const generation = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: Math.min(8000, 700 + personas.length * 340),
      temperature: 1,
      system: panelSystem,
      messages: [{ role: 'user', content: questionContent }],
    })

    const rawPanel = generation.content[0].type === 'text' ? generation.content[0].text : ''
    const parsed = parsePanelResponses(rawPanel, personas, { wantsScore, wantsSentiment: true })

    const responses = personas.map((persona) => {
      const base = {
        persona_id: persona.id,
        persona_name: persona.name,
        avatar_initials: persona.avatar_initials,
        avatar_color: persona.avatar_color,
        avatar_url: persona.avatar_url,
        job_title: persona.traits?.job_title ?? '',
        location: persona.traits?.location ?? '',
        age: persona.traits?.age ?? null,
        industry: persona.traits?.industry ?? '',
      }
      const r = parsed.get(persona.id)
      if (!r) {
        return { ...base, response: null, sentiment: 'neutral' as const, score: null, error: 'No response generated' }
      }
      return { ...base, response: r.reply, sentiment: r.sentiment, score: r.score, error: null }
    })

    // Aggregate themes, executive summary, recommendations and quotes across
    // all responses. Replies are already clean prose (no score prefix).
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
  "biggest_objection_quote_persona": "name of persona who said it"
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
      completed_in_seconds: 0,
    }
    try {
      const raw = summaryResponse.content[0].type === 'text' ? summaryResponse.content[0].text : '{}'
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      summary = { ...summary, ...JSON.parse(cleaned) }
    } catch {
      // keep defaults
    }

    // Quotes labeled as verbatim must actually appear in the panel's responses;
    // the UI hides an empty quote card, so blanking a failed quote is safe.
    if (!quoteInText(summary.most_representative_quote, allText)) {
      summary.most_representative_quote = ''
      summary.most_representative_quote_persona = ''
    }
    if (!quoteInText(summary.biggest_objection_quote, allText)) {
      summary.biggest_objection_quote = ''
      summary.biggest_objection_quote_persona = ''
    }

    // Measured, not modeled — overrides anything the LLM might have invented
    summary.completed_in_seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000))

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
  } catch (e: any) {
    console.error('[audience-panel] request failed:', e)
    return NextResponse.json({ error: 'The panel failed to complete. Please try again.' }, { status: 500 })
  }
}
