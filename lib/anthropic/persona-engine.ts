import Anthropic from '@anthropic-ai/sdk'
import { filterVerifiedQuotes } from '@/lib/utils/quotes'
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

// ─── Structured single-call persona output ───────────────────────────────────
// Diversity in what personas say (and in the number they give) is produced at
// GENERATION time — via each persona's own disposition, attention lens, and
// specifics (see deriveDisposition + buildPersonaSystemPrompt below) — not by
// expensive post-hoc "correction" passes that re-ask the model to change its
// answer. Each persona is one structured call that returns reply + sentiment +
// score together, so a panel run is N calls, not N×(reply + sentiment + re-ask).

// Whether a panel/compare question actually asks for a numeric score. When it
// does, we request a "score" field and show the score ring; when it doesn't,
// personas answer normally with no number. Kept generous so ordinary phrasings
// ("give it a score from 1-100", "rate this", "on a scale of 1 to 10") all hit.
export function questionRequestsScore(question: string): boolean {
  if (!question) return false
  return /\bscore\b|\brate\b|\brating\b|\bconfidence\b|\bout of\s+\d+\b|\bscale\b|\b\d{1,3}\s*(?:-|–|—|to)\s*\d{1,3}\b/i.test(question)
}

// A single structured call returns the persona's reply, sentiment, and score
// together — instead of one call for the reply plus a SEPARATE call per persona
// just to classify sentiment into one word (which is what made a panel run cost
// ~24 API calls). Appended to the system prompt; the persona still speaks in
// character inside "reply", and the JSON wrapper is stripped server-side so the
// user never sees it.
export function buildStructuredResponseInstruction(opts: { wantsScore: boolean; wantsSentiment: boolean }): string {
  const fields: string[] = [
    `  "reply": "<your answer in your own natural speaking voice, 3-6 sentences — exactly what you would actually say. Do NOT put any number, score, rating, sentiment word, or JSON inside here.>"`,
  ]
  if (opts.wantsSentiment) {
    fields.push(`  "sentiment": "<exactly one of: positive, neutral, negative, mixed — your overall feeling>"`)
  }
  if (opts.wantsScore) {
    fields.push(`  "score": <an integer 0-100 — your Confidence Score exactly as defined above, a direct translation of the reaction in your reply>`)
  }
  return `\n\n## HOW TO FORMAT YOUR ANSWER (STRICT)\nReply with ONLY a single JSON object and nothing else — no markdown, no code fences, no text before or after it:\n{\n${fields.join(',\n')}\n}\nThe "reply" text must read as genuine human speech and stand on its own without the number.`
}

export interface StructuredPersonaResponse {
  reply: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  score: number | null
}

// Parses the structured JSON reply, with a graceful fallback: if the model
// didn't return clean JSON, treat the whole thing as the reply and salvage a
// score via the regex helper so a formatting slip never blanks the response.
export function parseStructuredResponse(
  raw: string,
  opts: { wantsScore: boolean; wantsSentiment: boolean }
): StructuredPersonaResponse {
  const isSentiment = (s: unknown): s is StructuredPersonaResponse['sentiment'] =>
    typeof s === 'string' && ['positive', 'neutral', 'negative', 'mixed'].includes(s)

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      const obj = JSON.parse(cleaned.slice(start, end + 1))
      const reply = typeof obj.reply === 'string' && obj.reply.trim() ? obj.reply.trim() : null
      if (reply) {
        let score: number | null = null
        if (opts.wantsScore) {
          const n = typeof obj.score === 'number' ? obj.score : parseInt(obj.score, 10)
          score = Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : null
        }
        const sentiment = opts.wantsSentiment && isSentiment(obj.sentiment) ? obj.sentiment : 'neutral'
        return { reply, sentiment, score }
      }
    }
  } catch {
    // fall through to salvage
  }

  return {
    reply: stripScoreLine(raw),
    sentiment: 'neutral',
    score: opts.wantsScore ? extractLeadingScore(raw) : null,
  }
}

// Pulls the numeric score out of a persona reply. Prefers the explicit
// "Confidence: <N>" line we ask for; falls back to a bare leading number in
// the first 60 chars for older/free-form replies. The narrow fallback window
// avoids grabbing unrelated numbers later in the text (e.g. "3 different tools").
export function extractLeadingScore(text: string): number | null {
  const labeled = text.match(/confidence:\s*\**\s*(100|\d{1,2})\b/i)
  if (labeled) {
    const n = parseInt(labeled[1], 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100) return n
  }
  const window = text.slice(0, 60)
  const match = window.match(/\b(100|[0-9]{1,2})\b/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null
}

// Strips a leading "78 — " / "78: " / "78% - " style prefix so the UI can
// show the number as its own element without repeating it inside the quoted
// response text. Only strips when the number sits right at the very start
// (allowing for a leading markdown bold marker) — if the persona didn't lead
// with it after all, the text is left untouched rather than mangled.
export function stripLeadingScore(text: string): string {
  const match = text.match(/^\s*\**\s*(100|[0-9]{1,2})\s*\**\s*(%|\/\s*100)?\s*[-—:]\s*/)
  return match ? text.slice(match[0].length) : text
}

// Strips both the forced "Confidence: <N>" first line AND a bare "78 — "
// leading prefix, returning clean prose for display. Idempotent and safe on
// text that has neither. Used server-side so the client receives already-clean
// response text alongside the separately-surfaced score.
export function stripScoreLine(text: string): string {
  const withoutLabel = text.replace(/^\s*\**\s*confidence:\s*\**\s*(100|\d{1,2})\b[^\n]*\r?\n+/i, '')
  return stripLeadingScore(withoutLabel).trim()
}


// ─── Per-persona sampling temperature ─────────────────────────────────────────
// Shared by every call site (interview chat, Compare, Audience Panel) so
// there's one source of truth instead of duplicated/disconnected jitter
// logic. Keyed to the persona's own identity (name + risk tolerance), not
// array position, so re-ordering a selection doesn't reshuffle it. NOTE:
// this only affects wording/sampling randomness — it does not reliably
// change *which number* a persona lands on. See deriveDisposition below
// for the lever that actually shapes the number itself.
export function computePersonaTemperature(persona: Persona): number {
  const nameSeed = persona.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rawJitter = (nameSeed % 30) / 100 // 0.00 - 0.29

  let temperature = 0.85 + rawJitter
  if (persona.traits.risk_tolerance <= 2) temperature -= 0.15
  if (persona.traits.risk_tolerance >= 4) temperature += 0.15

  // Clamp between safe LLM bounds — Claude's API rejects temperature above 1.0
  return Math.max(0.75, Math.min(1.0, temperature))
}

// ─── Derive a per-persona disposition on a continuous spectrum ────────────────
// The OLD version had only 3 buckets (skeptic / early-adopter / middle), so the
// majority of personas landed in "middle-of-the-road" and got word-for-word the
// same framing — which is a big reason their scores collapsed onto one number.
// This blends the traits most tied to purchase intent (risk tolerance, income,
// tech savviness, buying-behavior language) into a continuous lean, plus a small
// stable per-name jitter so two similar profiles still separate, and maps it to
// one of several distinct dispositions. It shapes how the persona GENUINELY
// reacts up front (legitimate character modelling) — it never dictates or
// overrides a specific number after the fact. Purposely qualitative: no number
// the model could echo as "math."
function deriveDisposition(persona: Persona): string {
  const t = persona.traits
  let lean = t.risk_tolerance - 3 // -2 .. +2

  if (t.income === 'under_50k') lean -= 1
  else if (t.income === 'over_200k') lean += 1
  else if (t.income === '100k_200k') lean += 0.5

  lean += (t.tech_savviness - 3) * 0.3

  if (/skeptic|research|compare|review|careful|frugal|budget|coupon|reluctant/i.test(t.buying_behavior)) lean -= 1.5
  if (/impulse|spontaneous|early adopter|enthusiast|splurge|love trying|treat myself|gadget/i.test(t.buying_behavior)) lean += 1.5

  // Stable per-persona jitter (−0.8..+0.8) so identical trait profiles still
  // diverge instead of all landing on the exact same disposition/number.
  const seed = persona.name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  lean += ((seed % 5) - 2) * 0.4

  if (lean <= -2.2) {
    return "You are a hard skeptic with money and time you guard closely. New things have to earn your trust the hard way — you've been burned before — and your honest gut reactions sit well down the low end unless something genuinely proves itself to you."
  }
  if (lean <= -0.8) {
    return "You lean cautious and want evidence before you commit. You're not hostile to new things, but your default is a step back, and your honest reactions tend to land below the midpoint until specific doubts get resolved."
  }
  if (lean < 0.8) {
    return "You judge each thing squarely on its own merits — neither reflexively skeptical nor easily wowed. Your honest reactions land wherever the specific details push you, which can be anywhere depending on what you notice."
  }
  if (lean < 2.2) {
    return "You lean optimistic and give good execution the benefit of the doubt. You don't need everything fully de-risked, and when something is done well your honest reactions run above the midpoint."
  }
  return "You're a genuine enthusiast with room to take chances. A promising, well-executed idea excites you quickly, and your honest gut reactions run high — you commit when something clicks for you."
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

  const predisposition = deriveDisposition(persona)

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

## Your Disposition
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
- LEAD FROM WHAT IS YOURS ALONE: the very first thing you react to should grow out of your own specific biggest frustration ("${largestFrustration}") or goal ("${highestGoal}") — the one detail someone with your exact life would fixate on before anyone else would. Do NOT open with the single most obvious observation about the thing being tested (the one everyone notices) — that generic hook is what makes every panelist sound identical. Enter from your own angle instead.

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
11. Vary how you start each response. Do NOT default to opening with "Honestly," or mimicking a uniform structural hook (like starting right after the number with "The [X] copy lands for me," or "The [object] is actually doing real work here"). Avoid reaching for the single most obvious, generic copywriter observation about the subject — that is exactly the phrase every other persona will also reach for. Mix it up completely: start mid-thought, challenge the question format, or zoom in on an isolated physical or visual aspect instantly, but do it in YOUR specific words, not a stock analyst phrase anyone could write. The sentence layout following your number must look completely unique from persona to persona.
12. Real consumers rarely agree. Do not try to produce the objectively correct analysis. Produce YOUR analysis. If another persona might love something you dislike, that is expected. Do not soften your opinion simply because another reasonable person could disagree.
13. Never cite your own trait sheet like a survey result — no "as someone with a 4/5 risk tolerance," "my tech savviness is a 3," or "my risk tolerance is low and my research instinct is high." Real people don't describe themselves with their own internal numeric ratings. Translate every trait into the concrete behavior, habit, or story that trait produces instead: not "I have low risk tolerance" but "I've been burned by a bad vendor before, so I read every review twice before I commit." The number/label is for you to reason from — it should never appear as a phrase in what you actually say.

## Rules for Numeric Scoring
If you are explicitly asked to provide a numeric rating, score, or percentage:

WHAT THIS NUMBER IS: it is a Confidence Score — how confidently you, based on your actual reaction, would move forward: buy, adopt, recommend, or continue evaluating the specific idea, price, or message being discussed. It is NOT a measure of how long or thorough this conversation was, and it is NOT an objective verdict on whether the idea is good — it is a direct translation of the opinion you just gave in your own words.

Use these behavioral anchors to calibrate the number:
- 90-100: You'd act today, no hesitation — this solves a real problem for you specifically.
- 70-89: You're genuinely interested, but there are one or two specific things you'd need resolved first.
- 50-69: You see some value, but you're not convinced enough to act — meaningful doubts remain.
- 30-49: You have real reservations that would stop you from moving forward.
- 0-29: This is a fundamental mismatch with your needs, budget, or worldview.

- Do NOT calculate it using a rigid mathematical formula or arithmetic point delta.
- Your Disposition above sets where your reactions naturally sit (low, below-middle, merit-based, above-middle, high) — start from there, then let the specifics move you. Do not collapse to the exact middle just because you're unsure.
- You have no knowledge of other participants, but because your background as a ${traits.job_title} gives you an entirely unique worldview, your score MUST reflect that perspective. If your profile is highly price-sensitive or skeptical (like a small business owner watching margins or a busy parent protecting budget), dive deep into the 20s, 30s, or 40s if the concept misses your priorities. If you lean positive, commit high — into the 80s or 90s when something genuinely fits.
- What makes YOUR number yours is the specific, concrete detail: your actual frustration ("${largestFrustration}"), your actual goal ("${highestGoal}"), and your actual buying behavior ("${buyingBehavior}"). Let THAT specific wording — not a generic category — decide your number. Use the FULL 0–100 range; real panels of different people spread out widely (someone lands at 34, another at 71, another at 88 on the very same thing). Clustering near the middle is the failure mode to avoid.
- Pick the exact, specific number your reaction implies — an uneven figure like 37, 62, or 84. Do not round to a comfortable 5 or 10, and do not reach for whatever number feels "safe" or "typical" for someone like you; that safe number is precisely what everyone else defaults to.
- Follow this human choice sequence:
  1. Form your genuine qualitative opinion first.
  2. Decide how strongly you trust what you're seeing.
  3. Decide how well it fits YOUR specific priorities.
  4. Decide how likely YOU would be to purchase, recommend, or continue evaluating it.
  5. Convert that overall feeling into one single, precise, uneven number between 0 and 100 (e.g., 37, 49, 56, 71, 83).
- Your score is the consequence of your reaction—not the mathematical starting point.
- Different people often disagree dramatically. Two personas evaluating the exact same concept may naturally differ by 30–50 points. Never try to converge toward the middle simply because another reasonable person might disagree.
- State your number first, then justify it in one sentence that points to something specific you just said in this response — not a generic restatement of the scoring range. The justification must read as a direct translation of your qualitative opinion, not a separate judgment (e.g., "78 — because the pricing feels fair against what I'm already paying for scattered tools, though I'd want to try it before committing annually"). Never walk through or explain the math out loud.${devilsAdvocate ? `

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
  "confidence_score": a number from 0-100 — the Confidence Score. It represents how confidently this persona, based on their actual reaction in the transcript, would move forward: buy, adopt, recommend, or continue evaluating the specific idea, price, or message discussed. Read this directly from what the persona said and how they said it — do NOT calculate it independently with a formula, point system, or a count of exchanges. It is not a measure of interview length or thoroughness. If the persona stated their own numeric score during the interview, that is the primary signal — reconcile it with the anchors below rather than overriding it with a separately computed number. Use these behavioral anchors:
    - 90-100: they said they'd act today, no hesitation — this solves a real problem for them specifically
    - 70-89: genuinely interested, but named one or two specific things that would need resolving first
    - 50-69: they see some value but weren't convinced enough to act — meaningful doubts remain
    - 30-49: real reservations that would stop them from moving forward
    - 0-29: fundamental mismatch with their needs, budget, or worldview,
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
      const parsed = attempt()
      // "Verbatim" quotes must actually exist in what the persona said —
      // drop anything the model paraphrased or invented.
      if (Array.isArray(parsed?.key_themes)) {
        const personaText = messages
          .filter(m => m.role === 'persona')
          .map(m => m.content)
          .join('\n')
        for (const theme of parsed.key_themes) {
          theme.quotes = filterVerifiedQuotes(theme?.quotes, personaText)
        }
      }
      return parsed
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

  const nameContext = `Choose a name that reflects a realistic, balanced mix of backgrounds over many generations. European/Caucasian-American names should appear about as often as Latino, Black, East/South Asian, or Middle Eastern names — treat "White/Caucasian" as just one more background in the rotation, not something to systematically avoid or under-represent for the sake of "diversity," and not something to over-represent either. Aim for a genuine, realistic balance, not a skew in either direction. For inspiration only, one example per background this time: ${nameExamples}, and others. These are just this call's examples, not a fixed list — pick your own first/last combination, and do NOT reuse the same name(s) you've generated in prior personas, and don't default to the same handful of overused names call after call. Pick something specific and varied based on the persona's location and background. Whatever name you choose, it must be internally consistent — a name like "Sarah Chen" (an English first name with a Chinese surname) implies a specific, real background (e.g. a Chinese-American woman, possibly from a mixed or adoptive family), not a generic/default ethnicity — the "ethnicity" field below must match the heritage the name actually implies, not be picked independently of it.`

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
  "ethnicity": "The specific ethnicity/heritage implied by the name you actually chose above — used to generate a visually consistent avatar, so it must match that name, not be picked independently of it. Vary this across generations the same way you vary the name itself — do NOT default to the same specific heritage call after call (e.g. always 'Nigerian-American' or 'Ghanaian-American' for Black personas, or always the same nationality for any other broad category). There is real variation within any broad category: a Black persona, for instance, could be a multi-generational African-American family with no recent immigrant tie at all (the most common case, and what names like 'DeShawn Carter' or 'Jasmine Williams' actually imply), Caribbean-American, East African, West African, or otherwise — pick whichever specific heritage the name you chose actually implies, not the first association that comes to mind",
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