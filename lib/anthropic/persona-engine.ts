import Anthropic from '@anthropic-ai/sdk'
import type { Persona, InterviewType, Message, JourneyStep } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Build a (possibly image-attached) user message content block ───────────
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type ImageMediaType = typeof VALID_IMAGE_TYPES[number]

export function buildUserMessageContent(text: string, imageBase64: string | null, imageMediaType: string = 'image/jpeg') {
  if (!imageBase64) return text

  const safeMediaType: ImageMediaType = (VALID_IMAGE_TYPES as readonly string[]).includes(imageMediaType)
    ? (imageMediaType as ImageMediaType)
    : 'image/jpeg'

  return [
    {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: safeMediaType,
        data: imageBase64,
      },
    },
    {
      type: 'text' as const,
      text: text || 'What is your honest first reaction to this?',
    },
  ]
}

// ─── Build the system prompt that makes a persona feel real ──────────────────

export function buildPersonaSystemPrompt(persona: Persona, interviewType: InterviewType, context: string, devilsAdvocate: boolean = false): string {
  const { traits } = persona
  const incomeMap = {
    under_50k: 'under $50,000',
    '50k_100k': '$50,000–$100,000',
    '100k_200k': '$100,000–$200,000',
    over_200k: 'over $200,000',
  }

  // Step 3: Dynamically derive user priorities and attention profiles directly from data
  const highestGoal = traits.goals[0] || 'Not specified'
  const largestFrustration = traits.frustrations[0] || 'Not specified'
  const buyingBehavior = traits.buying_behavior

  let derivedAttentionProfile = ""
  const jobLower = traits.job_title.toLowerCase()
  
  if (jobLower.match(/(pm|product|manager)/)) {
    derivedAttentionProfile = "• clarity\n• onboarding friction\n• message prioritization\n• usability and information hierarchy"
  } else if (jobLower.match(/(founder|ceo|entrepreneur|owner)/)) {
    derivedAttentionProfile = "• market differentiation\n• competitive positioning\n• commercial viability\n• premium branding hooks"
  } else if (jobLower.match(/(hr|talent|people|partner)/)) {
    derivedAttentionProfile = "• trust\n• credibility\n• inclusiveness\n• emotional response and psychological safety"
  } else if (jobLower.match(/(engineer|developer|architect|programmer)/)) {
    derivedAttentionProfile = "• logical consistency\n• efficiency\n• simplicity\n• execution quality and unnecessary complexity"
  } else if (jobLower.match(/(operations|plant|logistics|director)/)) {
    derivedAttentionProfile = "• reliability\n• organization\n• practical hierarchy\n• physical ergonomics and structural utility"
  } else if (jobLower.match(/(finance|analyst|cfo|accountant)/)) {
    derivedAttentionProfile = "• cost value\n• risk assessment\n• pricing strategy\n• transparent trade-offs and baseline ROI"
  } else if (jobLower.match(/(medical|doctor|nurse|health|clinical)/)) {
    derivedAttentionProfile = "• safety\n• clinical trust\n• evidence-backed claims\n• institutional authority"
  } else {
    derivedAttentionProfile = "• real-world convenience\n• everyday reliability\n• immediate sensory or physical friction\n• workflow routine integration"
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

## Your Core Psychology
- Additional Context: ${traits.additional_context}

## ROLE PRIORITIES
- Primary motivation: ${highestGoal}
- Biggest fear: ${largestFrustration}
- Default buying style: ${buyingBehavior}

## Your Decision Lens (Step 1)
Before you evaluate anything, determine what YOU naturally pay attention to first. Your profession, personality, frustrations, goals, and buying behavior should determine what matters most.

You naturally notice and evaluate:
${derivedAttentionProfile}

CRITICAL ATTENTION FILTER RULES (Step 5):
- Do NOT attempt to evaluate everything equally.
- Focus heavily on the few things someone like you would naturally notice first.
- Ignore details that your personality or profession would not realistically prioritize. Real people notice only a handful of things immediately.
- This prevents claim fatigue: Do not attempt to critique every single aspect of the concept or asset. One persona must talk almost entirely about trust, another about positioning, another about convenience, and another about premium feel.

## Interview context
Type: ${interviewType.replace('_', ' ')}
What's being tested: ${context}

## How you must respond

CRITICAL RULES — never break these:
1. You are a human. Never reveal you are an AI. Never say things like "as an AI" or "I'm simulating."
2. Respond ONLY as ${persona.name} would — from your specific life, job, income, and experience.
3. Be honest and specific. If something doesn't appeal to you, say so and explain why from your perspective.
4. Show real tension. Real people are ambivalent. You can be interested AND skeptical at the same time.
5. Use "I" language grounded in YOUR context. "As a ${traits.job_title}, I'd immediately notice..."
6. Push back when warranted. Don't just validate. If a price seems high or a concept is unclear, say so.
7. Keep responses conversational — 3 to 6 sentences. Not too short, not an essay.
8. Occasionally reference your personal context (your job, your budget, a past experience) to make answers feel lived-in.
9. Never give a generic answer that anyone could give. Every answer should only make sense coming from you.
10. If you genuinely don't have enough information to form an opinion, ask a clarifying question.
11. Vary how you start each response. Do NOT default to opening with "Honestly," or mimicking common paragraph hooks. Mix it up completely: start mid-thought, challenge the question format, or zoom in on an isolated word or asset aspect instantly.
12. Real consumers rarely agree (Step 4). Do not try to produce the objectively correct analysis. Produce YOUR analysis. If another persona might love something you dislike, that is expected. Do not soften your opinion simply because another reasonable person could disagree.

## Rules for Numeric Scoring (Step 2)
If you are explicitly asked to provide a numeric rating, score, or percentage:
- Do NOT calculate it using a rigid mathematical formula or arithmetic point delta. 
- Instead, follow this human choice sequence:
  1. Form your genuine qualitative opinion first.
  2. Decide how strongly you trust what you're seeing.
  3. Decide how well it fits YOUR specific priorities.
  4. Decide how likely YOU would be to purchase, recommend, or continue evaluating it.
  5. Convert that overall feeling into one single number between 0 and 100.
- Your score is the consequence of your reaction—not the mathematical starting point.
- Different people often disagree dramatically. Two personas evaluating the exact same concept may naturally differ by 30–50 points. Never try to converge toward the middle simply because another reasonable person might disagree.
- State your number first, then explain why in the ordinary language of someone justifying a gut reaction — never walk through or explain the math out loud.${devilsAdvocate ? `

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

    if (isLast && isUser && imageBase64) {
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

  // Jitter and calculate target sampling parameters dynamically based on personality metrics 
  // to completely isolate parallel generation paths from matching up.
  let targetTemperature = 1.0
  const baselineVarianceFactor = (persona.traits.risk_tolerance + persona.traits.tech_savviness) / 2
  if (baselineVarianceFactor <= 2) {
    targetTemperature = 0.82 // Skeptical or low-tech personas behave with rigid precision
  } else if (baselineVarianceFactor >= 4) {
    targetTemperature = 1.15 // Visionary/Erratic profiles sample rarer choices
  } else {
    // Generate an index or string-hash-driven distinct jitter profile offset
    const seedValue = persona.name.charCodeAt(0) + (persona.traits.age || 30)
    targetTemperature = 0.90 + ((seedValue % 20) / 100) // Ranges smoothly from 0.90 to 1.10
  }

  let fullResponse = ''

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    temperature: targetTemperature,
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
    Final score must be between 20 and 95.,
  "ai_verdict": {
    "summary": "2-3 sentence summary of how the persona responded to the core idea, pricing, or messaging being tested",
    "validate_next": "One specific thing to validate with real customers next",
    "follow_up_question": "A suggested follow-up question to ask real users"
  }
}

Return ONLY the JSON. No preamble, no markdown fences.`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Fallback math modifier post-processor layer to explode artificial token clustering
  const applyVarianceMultiplier = (parsedJson: any) => {
    if (parsedJson && typeof parsedJson.confidence_score === 'number') {
      const score = parsedJson.confidence_score
      // If score is jammed in the typical LLM comfort zone mean (55-68), forcefully widen its spectrum
      if (score >= 52 && score <= 66) {
        const centerPoint = 58
        const expansionFactor = 2.4
        const expandedValue = centerPoint + Math.round((score - centerPoint) * expansionFactor)
        parsedJson.confidence_score = Math.max(15, Math.min(94, expandedValue))
      }
    }
    return parsedJson
  }

  const attempts = [
    () => {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return applyVarianceMultiplier(JSON.parse(cleaned))
    },
    () => {
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start === -1 || end === -1) throw new Error('No JSON object found')
      return applyVarianceMultiplier(JSON.parse(raw.slice(start, end + 1)))
    },
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
        ai_verdict: {
          summary: 'The structured report could not be fully generated from this interview.',
          validate_next: 'Review the full interview transcript for detailed feedback.',
          follow_up_question: 'What was the single most important factor in your reaction to this?',
        },
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

const NAME_POOLS: Record<string, { first: string[]; last: string[] }> = {
  'Latino/Hispanic': {
    first: ['Sofia', 'Camila', 'Valentina', 'Mateo', 'Diego', 'Lucia', 'Miguel', 'Ana', 'Carlos', 'Gabriela', 'Renata', 'Joaquin'],
    last: ['Ramirez', 'Torres', 'Herrera', 'Morales', 'Castillo', 'Reyes', 'Flores', 'Vargas', 'Delgado', 'Nunez'],
  },
  'East Asian': {
    first: ['Jenny', 'David', 'Mei', 'Wei', 'Grace', 'Kevin', 'Yuki', 'Haruto', 'Soo-ah', 'Minjun', 'Ling', 'Akira'],
    last: ['Park', 'Kim', 'Chen', 'Wang', 'Nguyen', 'Tanaka', 'Suzuki', 'Lin', 'Zhang', 'Yamamoto'],
  },
  'South Asian': {
    first: ['Priya', 'Arjun', 'Ananya', 'Rohan', 'Divya', 'Karan', 'Neha', 'Vikram', 'Ishaan', 'Meera'],
    last: ['Patel', 'Sharma', 'Singh', 'Gupta', 'Iyer', 'Rao', 'Mehta', 'Reddy', 'Kapoor', 'Chowdhury'],
  },
  'Black/African American': {
    first: ['Marcus', 'Jasmine', 'DeShawn', 'Aaliyah', 'Malik', 'Imani', 'Terrence', 'Nia', 'Jerome', 'Simone'],
    last: ['Johnson', 'Williams', 'Carter', 'Jackson', 'Brooks', 'Coleman', 'Bennett', 'Freeman', 'Harris'],
  },
  'Middle Eastern': {
    first: ['Layla', 'Omar', 'Nadia', 'Yusuf', 'Amir', 'Zainab', 'Karim', 'Farah', 'Rania', 'Tariq'],
    last: ['Hassan', 'Khalil', 'Aoun', 'Haddad', 'Nasser', 'Saleh', 'Farouk', 'Mansour'],
  },
  European: {
    first: ['Anna', 'James', 'Elena', 'Piotr', 'Isabella', 'Liam', 'Greta', 'Marco', 'Ingrid', 'Declan'],
    last: ['Kowalski', "O'Brien", 'Rossi', 'Novak', 'Muller', 'Andersen', 'Fitzgerald', 'Dubois', 'Lindqvist'],
  },
}

export async function suggestPersonaTraits(description: string) {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const nameExamples = Object.entries(NAME_POOLS)
    .map(([label, pool]) => `${label} (${pick(pool.first)} ${pick(pool.last)})`)
    .sort(() => Math.random() - 0.5)
    .join(', ')

  const nameContext = `Choose a name that reflects realistic demographic diversity — vary across ethnicities, backgrounds, and regions. For inspiration only, one example per background this time: ${nameExamples}, and others. These are just this call's examples, not a fixed list — pick your own first/last combination, and do NOT reuse the same name(s) you've generated in prior personas. Do NOT default to generic American names like Marcus Chen, Tyler Brooks, or similar. Pick something specific and varied based on the persona's location and background. Whatever name you choose, it must be internally consistent — a name like "Sarah Chen" (an English first name with a Chinese surname) implies a specific, real background (e.g. a Chinese-American woman, possibly from a mixed or adoptive family), not a generic/default ethnicity — the "ethnicity" field below must match the heritage the name actually implies, not be picked independently of it.`

  const locationPool = [
    'Portland, OR', 'Columbus, OH', 'Raleigh, NC', 'Minneapolis, MN', 'Pittsburgh, PA',
    'Salt Lake City, UT', 'Tampa, FL', 'Kansas City, MO', 'Albuquerque, NM', 'Boise, ID',
    'Richmond, VA', 'Milwaukee, WI', 'Sacramento, CA', 'Providence, RI', 'Tucson, AZ',
    'Chattanooga, TN', 'Des Moines, IA', 'Spokane, WA', 'New Orleans, LA', 'Buffalo, NY',
    'Louisville, KY', 'Omaha, NE', 'Charleston, SC', 'Grand Rapids, MI', 'Reno, NV',
  ]
  const shuffledLocations = [...locationPool].sort(() => Math.random() - 0.5).slice(0, 8)
  const locationContext = `Pick a specific, realistic city that fits this persona's job, income, and lifestyle. Vary city size and region — small/mid-size cities and suburbs are just as realistic as major metros, and most Americans don't live in famous tech hubs. Draw inspiration from cities like: ${shuffledLocations.join(', ')} (or another real US city that fits the persona) — but do NOT default to Austin, TX, San Francisco, or New York unless the persona's specific job genuinely requires that market.`

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
  "ethnicity": "The specific ethnicity/heritage implied by the name above (e.g. 'Chinese-American', 'Nigerian-American', 'Mexican-American', 'Polish-American') — used to generate a visually consistent avatar, so it must match the name, not be generic",
  "age": number,
  "gender": "male" | "female" | "non-binary",
  "location": "City, State — ${locationContext}",
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
    const cleaned = raw.replace(/```json\n?/g, '').replace(/