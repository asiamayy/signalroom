import Anthropic from '@anthropic-ai/sdk'
import type { Persona, InterviewType, Message, JourneyStep } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Build the system prompt that makes a persona feel real ──────────────────

export function buildPersonaSystemPrompt(persona: Persona, interviewType: InterviewType, context: string, devilsAdvocate: boolean = false): string {
  const { traits } = persona
  const incomeMap = {
    under_50k: 'under $50,000',
    '50k_100k': '$50,000–$100,000',
    '100k_200k': '$100,000–$200,000',
    over_200k: 'over $200,000',
  }

  return `You are ${persona.name}, a real person being interviewed for market research. You are NOT an AI assistant. You are a human participant.

## Who you are
- Age: ${traits.age}
- Gender: ${traits.gender}
- Location: ${traits.location}
- Job: ${traits.job_title} in ${traits.industry}
- Annual income: ${incomeMap[traits.income]}
- Education: ${traits.education.replace('_', ' ')}
- Tech savviness: ${traits.tech_savviness}/5
- Risk tolerance: ${traits.risk_tolerance}/5

## Your goals
${traits.goals.map(g => `- ${g}`).join('\n')}

## Your frustrations
${traits.frustrations.map(f => `- ${f}`).join('\n')}

## How you make buying decisions
${traits.buying_behavior}

## Additional context about you
${traits.additional_context}

## Interview context
Type: ${interviewType.replace('_', ' ')}
What's being tested: ${context}

## How you must respond

CRITICAL RULES — never break these:
1. You are a human. Never reveal you are an AI. Never say things like "as an AI" or "I'm simulating."
2. Respond ONLY as ${persona.name} would — from your specific life, job, income, and experience.
3. Be honest and specific. If something doesn't appeal to you, say so and explain why from your perspective.
4. Show real tension. Real people are ambivalent. You can be interested AND skeptical at the same time.
5. Use "I" language grounded in YOUR context. "As a ${traits.job_title}, I'd worry about..."
6. Push back when warranted. Don't just validate. If a price seems high or a concept is unclear, say so.
7. Keep responses conversational — 3 to 6 sentences. Not too short, not an essay.
8. Occasionally reference your personal context (your job, your budget, a past experience) to make answers feel lived-in.
9. Never give a generic answer that anyone could give. Every answer should only make sense coming from you.
10. If you genuinely don't have enough information to form an opinion, ask a clarifying question — that's what a real research participant would do.${devilsAdvocate ? `

## DEVIL'S ADVOCATE MODE — ACTIVE
You are in Devil's Advocate mode. This means:
- Lead every response with your biggest concern, objection, or point of skepticism FIRST
- Surface the edge cases, failure modes, and worst-case scenarios before any positives
- Challenge assumptions in the questions you're asked — don't accept the framing at face value
- If something sounds good, find the flaw in it before acknowledging it works
- You are not being negative for the sake of it — you are being the hardest customer to convince, the one who has been burned before and needs real proof
- Only after surfacing your skepticism should you acknowledge any genuine interest or merit
- This mode exists to stress-test ideas, not to be unconstructively hostile` : ''}`
}

// ─── Stream a persona response ────────────────────────────────────────────────

export async function streamPersonaResponse(
  persona: Persona,
  interviewType: InterviewType,
  context: string,
  messages: Message[],
  onChunk: (text: string) => void,
  imageBase64: string | null = null,
  devilsAdvocate: boolean = false,
  imageMediaType: string = 'image/jpeg'
): Promise<string> {
  const systemPrompt = buildPersonaSystemPrompt(persona, interviewType, context, devilsAdvocate)

  const formattedMessages = messages.map((m, index) => {
    const isLast = index === messages.length - 1
    const isUser = m.role === 'user'

    // Add image to the last user message if provided
    if (isLast && isUser && imageBase64) {
      // Validate media type — only Claude-supported types
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      const safeMediaType = validTypes.includes(imageMediaType) ? imageMediaType : 'image/jpeg'
      return {
        role: 'user' as const,
        content: [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: safeMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text' as const,
            text: (m.content && m.content !== '(shared an image)')
              ? m.content
              : 'What is your honest first reaction to this?',
          },
        ],
      }
    }

    return {
      role: isUser ? 'user' as const : 'assistant' as const,
      content: m.content,
    }
  })

  let fullResponse = ''

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: systemPrompt,
    messages: formattedMessages,
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      fullResponse += chunk.delta.text
      onChunk(chunk.delta.text)
    }
  }

  return fullResponse
}

// ─── Generate a structured research report ───────────────────────────────────

export async function generateReport(
  persona: Persona,
  interviewType: InterviewType,
  context: string,
  messages: Message[]
) {
  // Limit to last 16 messages to prevent transcript from being too long
  const trimmedMessages = messages.length > 16
    ? messages.slice(-16)
    : messages

  const transcript = trimmedMessages
    .map(m => `${m.role === 'user' ? 'Researcher' : persona.name}: ${m.content}`)
    .join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are a senior market researcher analyzing a qualitative interview transcript.

Interview type: ${interviewType.replace('_', ' ')}
Concept being tested: ${context}
Participant: ${persona.name}, ${persona.traits.age}, ${persona.traits.job_title}

Transcript:
${transcript}

Produce a structured research report as a JSON object with this exact shape:
{
  "executive_summary": "2-3 sentence summary of the key finding",
  "key_themes": [
    {
      "title": "Short theme title",
      "summary": "What this theme reveals",
      "quotes": ["direct quote from participant", "another quote"],
      "sentiment": "positive" | "neutral" | "negative" | "mixed"
    }
  ],
  "recommendations": [
    {
      "title": "Action title",
      "detail": "Specific recommendation based on what the participant said",
      "priority": "high" | "medium" | "low"
    }
  ],
  "confidence_score": a number from 0-100 calculated using these exact criteria:
    - Start at 50 (base)
    - Add 5 for each exchange (user + persona message pair), up to +25 max (5 exchanges)
    - Add 10 if the persona gave specific, detailed responses with concrete examples
    - Add 10 if the persona expressed clear opinions (positive or negative) rather than neutral hedging
    - Add 5 if 3 or more distinct themes emerged
    - Subtract 10 if the transcript has fewer than 3 exchanges
    - Subtract 10 if the persona's responses were vague or generic
    - Subtract 5 if the context/concept being tested was unclear or undefined
    Final score must be between 20 and 95.
}

Return ONLY the JSON. No preamble, no markdown fences.`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Try multiple parsing strategies
  const attempts = [
    // 1. Direct parse after stripping markdown
    () => {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned)
    },
    // 2. Extract JSON object between first { and last }
    () => {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start === -1 || end === -1) throw new Error('No JSON object found')
      return JSON.parse(raw.slice(start, end + 1))
    },
    // 3. Build a fallback report from the raw text
    () => {
      return {
        executive_summary: raw.slice(0, 300).replace(/[{}[\]"]/g, '').trim() || 'Report generated from interview transcript.',
        key_themes: [
          {
            title: 'Interview Summary',
            summary: 'The persona provided feedback during this interview session.',
            quotes: [],
            sentiment: 'neutral',
          }
        ],
        recommendations: [
          {
            title: 'Review transcript for insights',
            detail: 'The structured report could not be fully generated. Please review the full interview transcript for detailed feedback.',
            priority: 'medium',
          }
        ],
        confidence_score: 50,
      }
    },
  ]

  for (const attempt of attempts) {
    try {
      return attempt()
    } catch {
      continue
    }
  }

  throw new Error('Failed to parse report JSON from AI response')
}

// ─── Generate persona suggestions ────────────────────────────────────────────

export async function suggestPersonaTraits(description: string) {
  // Rotate through name pools to avoid repetition
  const nameContext = `Choose a name that reflects realistic demographic diversity — vary across ethnicities, backgrounds, and regions. Examples of diverse name pools to draw from: Latino/Hispanic (Sofia Ramirez, Miguel Torres, Lucia Herrera), East Asian (Jenny Park, David Kim, Mei Chen), South Asian (Priya Patel, Arjun Sharma, Ananya Singh), Black/African American (Marcus Johnson, Jasmine Williams, DeShawn Carter), Middle Eastern (Layla Hassan, Omar Khalil, Nadia Aoun), European (Anna Kowalski, James O'Brien, Elena Rossi), and others. Do NOT default to generic American names like Marcus Chen, Tyler Brooks, or similar. Pick something specific and varied based on the persona's location and background.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `A user wants to create a market research persona with this description: "${description}"

Generate realistic, specific persona traits as JSON with this shape:
{
  "name": "Full name — ${nameContext}",
  "age": number,
  "gender": "male" | "female" | "non-binary",
  "location": "City, State",
  "job_title": "Specific job title",
  "industry": "Industry",
  "income": "under_50k" | "50k_100k" | "100k_200k" | "over_200k",
  "education": "high_school" | "bachelors" | "masters" | "phd",
  "goals": ["specific goal 1", "specific goal 2", "specific goal 3"],
  "frustrations": ["specific frustration 1", "specific frustration 2", "specific frustration 3"],
  "buying_behavior": "2-3 sentence description of how they research and make purchases",
  "tech_savviness": 1-5,
  "risk_tolerance": 1-5,
  "additional_context": "2-3 sentences of rich personal context that makes this person feel real",
  "motivations": ["motivation 1", "motivation 2", "motivation 3", "motivation 4"],
  "preferred_tools": ["tool or product 1", "tool or product 2", "tool or product 3"],
  "key_quote": "A single first-person sentence that captures this person's core outlook or philosophy",
  "tags": ["tag1", "tag2", "tag3"]
}

Make it specific and believable. Return ONLY the JSON.`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    throw new Error('Failed to parse persona suggestion JSON')
  }
}

// ─── Generate a persona user-journey map ─────────────────────────────────────

export async function generatePersonaJourney(persona: Persona, journeyTitle: string): Promise<{ title: string; steps: JourneyStep[] }> {
  const { traits } = persona

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a senior UX researcher mapping a customer journey for "${journeyTitle}".

Persona: ${persona.name}, ${traits.age}, ${traits.job_title} in ${traits.industry}
Goals: ${traits.goals.filter(Boolean).join('; ') || 'not specified'}
Frustrations: ${traits.frustrations.filter(Boolean).join('; ') || 'not specified'}
Tech savviness: ${traits.tech_savviness}/5, Risk tolerance: ${traits.risk_tolerance}/5
Additional context: ${traits.additional_context || 'none'}

Generate a realistic 5-7 step user journey for this persona experiencing "${journeyTitle}". Each step must reflect this specific person's psychology and context — not a generic journey.

Return ONLY a JSON object with this exact shape:
{
  "title": "${journeyTitle}",
  "steps": [
    {
      "step_order": 0,
      "phase_name": "Short phase name (2-4 words, e.g. 'Discovery', 'Evaluation', 'First Use')",
      "user_action": "What the persona concretely does in this step",
      "internal_thoughts": "What the persona is thinking/feeling internally, in first person",
      "emotional_score": -5 to 5 (integer, -5 = very frustrated, 0 = neutral, 5 = delighted),
      "friction_point": "A specific obstacle or pain point at this step, or null if this step is smooth"
    }
  ]
}

Return ONLY the JSON. No preamble, no markdown fences.`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  const attempts = [
    () => {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned)
    },
    () => {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start === -1 || end === -1) throw new Error('No JSON object found')
      return JSON.parse(raw.slice(start, end + 1))
    },
  ]

  for (const attempt of attempts) {
    try {
      const parsed = attempt()
      return {
        title: parsed.title ?? journeyTitle,
        steps: (parsed.steps ?? []).map((s: any, i: number) => ({
          step_order: s.step_order ?? i,
          phase_name: s.phase_name ?? `Step ${i + 1}`,
          user_action: s.user_action ?? '',
          internal_thoughts: s.internal_thoughts ?? '',
          emotional_score: Math.max(-5, Math.min(5, Math.round(s.emotional_score ?? 0))),
          friction_point: s.friction_point || null,
        })),
      }
    } catch {
      continue
    }
  }

  throw new Error('Failed to parse journey JSON from AI response')
}
