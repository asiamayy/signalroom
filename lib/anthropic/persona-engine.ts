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

// Whether a panel/compare question actually asks for a numeric score. When it
// does, we force a reliable labeled score line (SCORE_FORMAT_INSTRUCTION) and
// show the score ring; when it doesn't, personas answer normally with no
// number. Kept generous so ordinary phrasings ("give it a score from 1-100",
// "rate this", "on a scale of 1 to 10") are all caught.
export function questionRequestsScore(question: string): boolean {
  if (!question) return false
  return /\bscore\b|\brate\b|\brating\b|\bconfidence\b|\bout of\s+\d+\b|\bscale\b|\b\d{1,3}\s*(?:-|–|—|to)\s*\d{1,3}\b/i.test(question)
}

// Appended to the system prompt only when the question asks for a score. A
// rigid labeled first line makes the number reliably present and reliably
// parseable — the previous approach (regex-hunting for a bare number in the
// first 60 chars) silently failed whenever a persona opened with prose, which
// nulled out the score AND disabled the whole declustering pass that depends
// on those parsed scores.
export const SCORE_FORMAT_INSTRUCTION = `\n\nOUTPUT FORMAT — STRICT: The very first line of your reply must be exactly "Confidence: <N>", where <N> is your single Confidence Score from 0 to 100 as defined above (a direct translation of your own genuine reaction — never a generic or middle-of-the-road default). Follow it with one blank line, then your normal reply. Do not repeat the number anywhere else, and do not add any other text on that first line.`

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

// ─── Detect and correct near-identical response openings ──────────────────────
// Same ceiling as the numeric-score problem above, and the same fix: personas
// are generated independently in parallel, so nothing stops several of them
// from converging on the same generic "obvious observation" opening line even
// with an explicit instruction not to (rule 11 above). This is the backstop —
// after the initial pass, check whether 2+ personas opened with essentially
// the same wording, and if so, rewrite just those against the one we keep as
// the anchor. Only fires when a collision is actually detected.
function normalizeOpening(text: string): string {
  return stripScoreLine(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join(' ')
}

// Returns groups of original-array indices whose responses opened with the
// same normalized first ~8 words. Requires the normalized snippet to be long
// enough (12+ chars) to be a meaningful signal rather than a coincidental
// short match ("i think the").
export function findDuplicateOpeningGroups(responses: (string | null)[]): number[][] {
  const buckets = new Map<string, number[]>()
  responses.forEach((r, i) => {
    if (!r) return
    const key = normalizeOpening(r)
    if (key.length < 12) return
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(i)
  })
  return [...buckets.values()].filter(group => group.length >= 2)
}

// Re-asks a single persona whose opening collided with a peer's, in the same
// conversation (their own original answer as the prior assistant turn). Keeps
// their opinion, reasoning, and any stated number intact — only the opening
// phrasing/structure is asked to change, anchored against the actual peer
// text so the model has something concrete to diverge from (a vague "be more
// original" ask tends to just produce a different generic phrase). Falls back
// to the original response on any failure.
export async function rewriteResponseWithDistinctOpening(
  persona: Persona,
  systemPrompt: string,
  questionContent: UserMessageContent,
  originalResponse: string,
  peerOpening: string,
  temperature: number
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      temperature: Math.min(1.0, temperature + 0.15),
      system: systemPrompt,
      messages: [
        { role: 'user', content: questionContent },
        { role: 'assistant', content: originalResponse },
        {
          role: 'user',
          content: `Another panelist answering this exact same question opened their response with wording extremely close to yours: "${peerOpening}". Keep your same underlying opinion, reasoning, and number (if you stated one) completely unchanged — but rewrite it so the opening sentence is structurally and stylistically distinct from that phrasing. Don't just swap a synonym or two; change the sentence structure and the angle you lead with entirely. Do not mention other panelists in your answer — just answer as yourself.`,
        },
      ],
    })

    return response.content[0].type === 'text' ? response.content[0].text : originalResponse
  } catch (err) {
    console.error(`[persona-engine] rewriteResponseWithDistinctOpening failed for "${persona.name}":`, err)
    return originalResponse
  }
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

// Re-asks a single persona whose number converged with its cluster-mates, in
// the same conversation (their own original answer as the prior assistant
// turn). This is an HONEST nudge, not a forced spread: it does NOT assign a
// target number or band (an earlier version did, and personas correctly
// rejected it as fabricating research data — "assigning a number between
// 89–97 would contradict my reasoning"). Instead it simply prompts the
// persona to sanity-check whether it drifted toward a safe/consensus number
// out of habit, and to give its genuinely honest number — keeping it exactly
// the same if that number truly reflects its reasoning. Any resulting spread
// is real (someone was lazily anchoring), never manufactured. Deliberately
// does NOT reveal peers' actual numbers, which triggers averaging/conformity.
// Falls back to the original response on any failure.
export async function rescorePersonaHonestly(
  persona: Persona,
  systemPrompt: string,
  questionContent: UserMessageContent,
  originalResponse: string,
  temperature: number
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      temperature: Math.min(1.0, temperature + 0.05),
      system: systemPrompt,
      messages: [
        { role: 'user', content: questionContent },
        { role: 'assistant', content: originalResponse },
        {
          role: 'user',
          content: `Before this is final: take one honest look at the number you gave. People often reach for a "safe," round, or middle-of-the-road score out of habit rather than because it truly matches their reaction. Does your number genuinely reflect the specific reasoning you just gave, grounded in your own situation? If yes, keep it exactly as-is — do NOT change it just to be different, and do NOT invent a number to stand out; a repeated number that is honest is completely fine. If you realise you were anchoring on a generic number, give the number that actually fits your reaction instead. Either way, restate your answer in the same format and keep your reasoning and overall reaction unchanged. Do not mention this check, other panelists, or scoring in your reply — just answer as yourself.`,
        },
      ],
    })

    return response.content[0].type === 'text' ? response.content[0].text : originalResponse
  } catch (err) {
    console.error(`[persona-engine] rescorePersonaHonestly failed for "${persona.name}":`, err)
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