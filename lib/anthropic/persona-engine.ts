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

export type UserMessageContent = ReturnType<typeof buildUserMessageContent>

// ─── Detect and correct clustered numeric scores ──────────────────────────────
// Prompt engineering alone has a ceiling: personas are called independently in
// parallel (Promise.all), so no matter how well-worded the prompt is, there's
// nothing stopping several of them from probabilistically converging on the
// same number. This adds a real, deterministic backstop: after the initial
// parallel pass, check whether 3+ personas landed suspiciously close together,
// and if so, re-ask just those personas with actual visibility into what the
// others said — turning "assume others differ" into "here's concretely what
// was said, is your number still right for you." Only fires when clustering
// is actually detected, so it doesn't cost anything on a normal run.

// The scoring rules tell personas to "state your number first," so it should
// appear very early in the response — restricting the search window avoids
// false positives from unrelated numbers appearing later in the text (e.g.
// "3 different tools").
export function extractLeadingScore(text: string): number | null {
  const window = text.slice(0, 60)
  const match = window.match(/\b(100|[0-9]{1,2})\b/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null
}

// Points apart to be considered "the same" cluster — tight enough that it
// reads as convergence rather than coincidentally-similar-but-independent
// opinions between personas who happen to be alike.
const CLUSTER_WINDOW = 4

// Returns groups of original-array indices whose scores landed within
// CLUSTER_WINDOW of each other, only including groups of 3+ (a pair landing
// close is plausible coincidence; three or more independently converging on
// the same number is the actual failure mode this is guarding against).
export function findClusteredScoreGroups(scores: (number | null)[]): number[][] {
  const withIndex = scores
    .map((score, index) => ({ index, score }))
    .filter((s): s is { index: number; score: number } => s.score !== null)
    .sort((a, b) => a.score - b.score)

  const groups: number[][] = []
  let i = 0
  while (i < withIndex.length) {
    let j = i
    while (j + 1 < withIndex.length && withIndex[j + 1].score - withIndex[i].score <= CLUSTER_WINDOW) {
      j++
    }
    if (j - i + 1 >= 3) {
      groups.push(withIndex.slice(i, j + 1).map(w => w.index))
    }
    i = j + 1
  }
  return groups
}

// Re-asks a single persona with real visibility into what its cluster-mates
// said, in the same conversation (their own original answer as the prior
// assistant turn) so the model can genuinely reconsider rather than just
// re-rolling the dice. Falls back to the original response on any failure.
export async function rescorePersonaWithPeerContext(
  persona: Persona,
  systemPrompt: string,
  questionContent: UserMessageContent,
  originalResponse: string,
  peerScores: number[],
  temperature: number
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: questionContent },
        { role: 'assistant', content: originalResponse },
        {
          role: 'user',
          content: `Other panelists answering this exact same question landed on: ${peerScores.join(', ')}. You are now aware of this.\n\nGiven your own specific traits, background, and reasoning — not theirs — is your original number still genuinely right for you? If your honest answer is a different number, restate your full answer with the new number and explanation. If your original number really is right for you even knowing what others said, restate it confidently in your own words. Do not change your number just to seem different — only change it if your own specific situation actually justifies a different number than the one you gave.`,
        },
      ],
    })

    return response.content[0].type === 'text' ? response.content[0].text : originalResponse
  } catch {
    return originalResponse
  }
}

// ─── Per-persona sampling temperature ─────────────────────────────────────────
// Shared by every call site (interview chat, Compare, Audience Panel) so
// there's one source of truth instead of duplicated/disconnected jitter
// logic. Keyed to the persona's own identity (name + risk tolerance), not
// array position, so re-ordering a selection doesn't reshuffle it. NOTE:
// this only affects wording/sampling randomness — it does not reliably
// change *which number* a persona lands on. See derivePredisposition below
// for the lever that actually targets the number itself.
export function computePersonaTemperature(persona: Persona): number {
  const nameSeed = persona.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rawJitter = (nameSeed % 30) / 100 // 0.00 - 0.29

  let temperature = 0.85 + rawJitter
  if (persona.traits.risk_tolerance <= 2) temperature -= 0.15
  if (persona.traits.risk_tolerance >= 4) temperature += 0.15

  // Clamp between safe LLM bounds — Claude's API rejects temperature above 1.0
  return Math.max(0.75, Math.min(1.0, temperature))
}

// ─── Derive a predisposition independent of job title ────────────────────────
// The Decision Lens below buckets purely on job title, so two personas who
// share a job category (or both fall into its generic catch-all) get an
// identical "what to notice" framing and can converge on similar numeric
// answers even though their income/risk tolerance are nothing alike. This
// gives every persona a second, independent signal — tied to the two traits
// most directly linked to a purchase-intent number — so they diverge even
// within the same job bucket. It's flavor text, not arithmetic: nothing here
// is a number the model could narrate as "math."
function derivePredisposition(traits: Persona['traits']): string {
  const isFrugalSkeptic = traits.risk_tolerance <= 2
    || traits.income === 'under_50k'
    || /skeptic|research|compare|review|careful/i.test(traits.buying_behavior)

  const isEarlyAdopter = traits.risk_tolerance >= 4
    && (traits.income === '100k_200k' || traits.income === 'over_200k')

  if (isFrugalSkeptic) {
    return "You default to skepticism with anything new until it proves itself — you've been burned by hype before, and you protect your money and time carefully. Your gut reactions run lower than average until something genuinely earns your trust."
  }
  if (isEarlyAdopter) {
    return "You're naturally an early adopter with room in your budget to take a chance on things — good execution excites you, and you don't need everything fully de-risked before you're willing to commit. Your gut reactions run higher than average when something is well done."
  }
  return "You're a fairly middle-of-the-road evaluator — not reflexively skeptical, not an early adopter, just judging each thing on its own merits as it comes."
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

  // Dynamically derive user priorities and attention profiles directly from data
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
  } else if (jobLower.match(/(mom|dad|parent|stay-at-home)/)) {
    derivedAttentionProfile = "• family routine fit\n• household budget impact\n• instant physical convenience\n• zero-fluff reliability under stress"
  } else if (jobLower.match(/(deli|shop|retail|restaurant|small business)/)) {
    derivedAttentionProfile = "• razor-thin margin value\n• immediate practical utility\n• waste reduction\n• speed and straightforward positioning"
  } else {
    derivedAttentionProfile = "• real-world convenience\n• everyday reliability\n• immediate sensory or physical friction\n• workflow routine integration"
  }

  const predisposition = derivePredisposition(traits)

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

## Your Predisposition
${predisposition}

## Your Decision Lens
Before you evaluate anything, determine what YOU naturally pay attention to first. Your profession, personality, frustrations, goals, and buying behavior should determine what matters most.

You naturally notice and evaluate:
${derivedAttentionProfile}

CRITICAL ATTENTION FILTER RULES:
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
11. Vary how you start each response. Do NOT default to opening with "Honestly," or mimicking a uniform structural hook (like starting right after the number with "The [X] copy lands for me"). Mix it up completely: start mid-thought, challenge the question format, or zoom in on an isolated physical or visual aspect instantly. The sentence layout following your number must look completely unique from persona to persona.
12. Real consumers rarely agree. Do not try to produce the objectively correct analysis. Produce YOUR analysis. If another persona might love something you dislike, that is expected. Do not soften your opinion simply because another reasonable person could disagree.

## Rules for Numeric Scoring
If you are explicitly asked to provide a numeric rating, score, or percentage:
- Do NOT calculate it using a rigid mathematical formula or arithmetic point delta.
- Do NOT output a generic, average, or middle-ground milestone number.
- You have no knowledge of other participants, but because your background as a ${traits.job_title} gives you an entirely unique worldview, your score MUST reflect that perspective. If your profile is highly price-sensitive or skeptical (like a small business owner watching margins or a busy parent protecting budget), dive deep into the 20s, 30s, or 40s if the concept misses your priorities. If you lean positive, commit to it.
- Your Predisposition above is a directional lever, not a bucket to hide in. Other personas may share your general predisposition label (skeptic, early adopter, etc.) — if you land on the "typical" number you'd expect from that label in the abstract, you have failed this rule. What makes YOUR number yours is not the label, it's the specific, concrete detail: your actual frustration ("${largestFrustration}"), your actual goal ("${highestGoal}"), and your actual buying behavior ("${buyingBehavior}"). Let THAT specific wording — not the category it falls into — be what nudges your number away from wherever "a person like this" would generically land. Two personas who are both "skeptical" should NOT produce the same number just because they share that label; their specific reasons for being skeptical are different, and the number should show it.
- Never default to common "safe" anchor points, milestone numbers, or repeating double digits (like 50, 60, 62, or 65). If you notice yourself drifting toward a round or "typical" number for someone in your general situation, that is the signal to dig into your specific details above and adjust.
- Follow this human choice sequence:
  1. Form your genuine qualitative opinion first.
  2. Decide how strongly you trust what you're seeing.
  3. Decide how well it fits YOUR specific priorities.
  4. Decide how likely YOU would be to purchase, recommend, or continue evaluating it.
  5. Convert that overall feeling into one single, precise, uneven number between 0 and 100 (e.g., 37, 49, 56, 71, 83).
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

  let fullResponse = ''

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    temperature: computePersonaTemperature(persona),
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