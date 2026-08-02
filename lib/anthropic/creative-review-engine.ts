import Anthropic from '@anthropic-ai/sdk'
import { buildUserMessageContent, panelRosterEntry, extractJsonObjects } from '@/lib/anthropic/persona-engine'
import type { Persona, CreativeZone, CreativePersonaReaction, CreativeReviewSummary, CreativeDiagnostic, CreativeDiagnosticDimension } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Step 1: identify what's actually IN the image ───────────────────────────
// Separate from the persona panel call on purpose — this is a one-time,
// persona-independent read of the asset's layout, and needs to run FIRST so
// its output (zone boxes) can be combined with the real, independently-
// computed saliency grid (lib/vision/saliency.ts) into attention percentages
// before the panel ever sees them. Claude never sees or influences the raw
// saliency numbers — it only names and locates what's there.

const ZONE_VOCABULARY = ['Headline / claim', 'Call to action', 'Product / hero image', 'Price', 'Logo / brand', 'Background', 'Other focal element']

export interface DetectedZone {
  label: string
  x0: number
  y0: number
  x1: number
  y1: number
}

export async function detectCreativeZones(imageBase64: string, imageMediaType: string): Promise<DetectedZone[]> {
  const prompt = `You are a design analyst locating the distinct visual elements in this creative asset (packaging, ad, landing page, or concept image).

Identify up to 6 elements that are ACTUALLY present, using ONLY labels from this vocabulary where they genuinely apply: ${ZONE_VOCABULARY.join(', ')}. Skip any that don't apply to this specific image — don't invent a "Call to action" if there isn't one, for example.

For each element, give its approximate bounding box as a fraction of the image (0.0 = left/top edge, 1.0 = right/bottom edge). Boxes may overlap slightly if elements are close together, but each should tightly bound just that element.

Return ONLY a JSON array, no markdown, no preamble:
[{"label": "<one of the vocabulary above>", "x0": 0.0, "y0": 0.0, "x1": 1.0, "y1": 1.0}]`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: buildUserMessageContent(prompt, imageBase64, imageMediaType),
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = cleaned.indexOf('[')
    const end = cleaned.lastIndexOf(']')
    if (start === -1 || end === -1) return []
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((z: any) => typeof z?.label === 'string' && ZONE_VOCABULARY.includes(z.label))
      .map((z: any) => ({
        label: z.label,
        x0: clamp01(z.x0),
        y0: clamp01(z.y0),
        x1: Math.max(clamp01(z.x1), clamp01(z.x0)),
        y1: Math.max(clamp01(z.y1), clamp01(z.y0)),
      }))
      .slice(0, 6)
  } catch {
    return []
  }
}

function clamp01(n: unknown): number {
  const v = typeof n === 'number' ? n : parseFloat(String(n))
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0
}

// ─── Step 2: the persona panel reacts to the real attention data ────────────
// Same joint-call pattern as buildPanelSystemPrompt in persona-engine.ts (one
// coordinated call so personas can genuinely differ), extended with the
// measured zone-attention percentages as grounding context. This is a
// single asset, not a comparison — there is no cross-persona ranking or
// concept-vs-concept score, only each person's own engagement read.

export function buildCreativePanelSystemPrompt(
  personas: Persona[],
  opts: { zones: CreativeZone[]; intendedFocus: string }
): string {
  const roster = personas.map(panelRosterEntry).join('\n\n')
  const zoneLines = opts.zones.length
    ? opts.zones.map(z => `  - ${z.label}: ${z.attention_pct}% of measured visual attention`).join('\n')
    : '  (no distinct elements were detected — react to the image as a whole)'

  return `You are simulating a visual creative-review panel: ${personas.length} DIFFERENT real people, each independently reacting to ONE shared visual asset (packaging, ad, landing page, or concept). You are not an AI assistant and you never break character for any of them.

## Objective visual attention data (measured from the actual image, not a guess)
${zoneLines}
${opts.intendedFocus ? `\n## What the creator intended attention to land on\n"${opts.intendedFocus}"` : ''}

## THE PANEL (each is a distinct real person)
${roster}

## HARD RULES
1. This is a VISUAL CREATIVE TEST. React ONLY to what is visible in the asset: image, copy, hierarchy, color, contrast, packaging form as shown, composition, brand cues, clarity, credibility, and attention. Do NOT discuss unshown product features, portability, storage, price, shipping, product usability, purchase logistics, or whether the physical product would fit a person's lifestyle. For example, do not say a bottle should be compact or easy to transport unless that exact visual claim appears in the asset.
2. Voice EACH person as a real human, first person. Their persona may shape how they interpret a visible visual cue, but it must never introduce an off-image need, preference, or product judgment. Never cite a trait or rating as a label.
3. Their attention is shaped by, but not identical to, the measured data above. Let each person's "notices" list name visible elements only, referencing the measured data only where it genuinely explains their reaction.
4. They are genuinely DIFFERENT people — what they notice first, what they trust, and what confuses them visually should differ meaningfully between them. Real viewers rarely agree.
5. NO TWO PEOPLE MAY OPEN THE SAME WAY. Each person's reaction must enter from THAT person's own visual angle.
6. Keep each reaction conversational — 3 to 5 sentences.
7. ENGAGEMENT — for each person, give an Engagement Percentage from 0 to 100: how likely THEY are to keep looking at, understand, and trust this creative rather than tune it out. This is NOT purchase intent and is NOT a judgment of the product itself. Anchors: 90-100 = visually compelling and immediately clear; 70-89 = engaging with a specific visual reservation; 50-69 = understandable but not very compelling; 30-49 = visually easy to skip; 0-29 = actively dismissive. Scatter widely across the panel — do not cluster.
8. If nothing in the asset is confusing or no claim reads as believable to that person, use null rather than inventing one.

## OUTPUT — STRICT
Reply with ONLY a JSON array, one object per person, in the SAME ORDER as the panel above, each using that person's exact id. No markdown, no code fences, no text before or after the array:
[
  {
    "persona_id": "<the id from the panel above>",
    "notices": ["<what they notice first, in their own words>", "<second>", "<third, optional>"],
    "reaction": "<this person's honest first-person reaction, 3-5 sentences>",
    "most_believable_claim": "<short phrase, or null>",
    "most_confusing_element": "<short phrase, or null>",
    "likely_trigger": "<short phrase — what would make them act, or walk away>",
    "engagement_percentage": <integer 0-100>,
    "suggested_adjustment": "<short, concrete suggestion from this person's perspective>"
  }
]`
}

export interface CreativePanelCell {
  notices: string[]
  reaction: string
  most_believable_claim: string | null
  most_confusing_element: string | null
  likely_trigger: string | null
  engagement_percentage: number | null
  suggested_adjustment: string | null
}

// Lenient parse, same two-stage strategy as parsePanelResponses: try the
// whole array first, then salvage individual objects so one malformed entry
// or a truncated tail never sinks the whole panel.
export function parseCreativePanelResponses(raw: string, personas: Persona[]): Map<string, CreativePanelCell> {
  const result = new Map<string, CreativePanelCell>()

  const take = (obj: any, i: number) => {
    const id = typeof obj?.persona_id === 'string' && personas.some(p => p.id === obj.persona_id)
      ? obj.persona_id
      : personas[i]?.id
    if (!id || result.has(id)) return

    const reaction = typeof obj?.reaction === 'string' && obj.reaction.trim() ? obj.reaction.trim() : null
    if (!reaction) return

    const notices = Array.isArray(obj?.notices)
      ? obj.notices.filter((n: unknown) => typeof n === 'string' && n.trim()).slice(0, 4)
      : []

    let engagement: number | null = null
    const n = typeof obj?.engagement_percentage === 'number' ? obj.engagement_percentage : parseInt(obj?.engagement_percentage, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100) engagement = Math.round(n)

    result.set(id, {
      notices,
      reaction,
      most_believable_claim: typeof obj?.most_believable_claim === 'string' && obj.most_believable_claim.trim() ? obj.most_believable_claim.trim() : null,
      most_confusing_element: typeof obj?.most_confusing_element === 'string' && obj.most_confusing_element.trim() ? obj.most_confusing_element.trim() : null,
      likely_trigger: typeof obj?.likely_trigger === 'string' && obj.likely_trigger.trim() ? obj.likely_trigger.trim() : null,
      engagement_percentage: engagement,
      suggested_adjustment: typeof obj?.suggested_adjustment === 'string' && obj.suggested_adjustment.trim() ? obj.suggested_adjustment.trim() : null,
    })
  }

  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const start = cleaned.indexOf('[')
    const end = cleaned.lastIndexOf(']')
    if (start !== -1 && end !== -1 && end > start) {
      const arr = JSON.parse(cleaned.slice(start, end + 1))
      if (Array.isArray(arr)) arr.forEach(take)
    }
  } catch {
    // fall through to per-object salvage
  }

  if (result.size < personas.length) {
    extractJsonObjects(cleaned).forEach((objStr, i) => {
      try { take(JSON.parse(objStr), i) } catch { /* skip this object */ }
    })
  }

  return result
}

// ─── Step 3: synthesize across the whole panel ───────────────────────────────
// A grid of individual reactions makes you read every card to find the
// takeaway — this reads all of them at once and gives a genuine synthesis,
// same reasoning as Audience Panel's executive summary. Only ever built from
// the reactions actually generated above; never a template filled with
// placeholder-sounding text.

const DEFAULT_CREATIVE_SUMMARY: CreativeReviewSummary = {
  overall_take: '',
  where_personas_agree: null,
  where_personas_diverge: null,
  top_recommended_change: '',
  diagnostics: [],
}

export async function generateCreativeReviewSummary(
  zones: CreativeZone[],
  reactions: CreativePersonaReaction[],
  imageBase64: string,
  imageMediaType: string
): Promise<CreativeReviewSummary> {
  const usable = reactions.filter(r => r.reaction)
  if (usable.length === 0) return DEFAULT_CREATIVE_SUMMARY

  const zoneLines = zones.length
    ? zones.map(z => `- ${z.label}: ${z.attention_pct}% of measured visual attention`).join('\n')
    : '(no distinct elements were detected)'

  const reactionLines = usable
    .map(r => `- ${r.persona_name} (${r.job_title}), engagement ${r.engagement_percentage ?? 'n/a'}%: "${r.reaction}"${r.most_confusing_element ? ` [confused by: ${r.most_confusing_element}]` : ''}${r.suggested_adjustment ? ` [suggests: ${r.suggested_adjustment}]` : ''}`)
    .join('\n')

  const prompt = `You are a senior researcher synthesizing a persona panel's reactions to ONE visual asset (packaging, ad, or landing page). This is a visual creative test: keep every conclusion and recommendation strictly about visible imagery, copy, hierarchy, brand cues, clarity, credibility, or attention. Never introduce off-image product features, usability, portability, purchase logistics, or lifestyle fit.

## Measured visual attention
${zoneLines}

## Panel reactions
${reactionLines}

## Creative performance diagnostics
Also assess the asset itself across these five creative-performance dimensions. Attention is about whether the hierarchy guides focus to the most important visible element; Emotion is about the visible asset's emotional intensity and likely positive or negative tone; Comprehension is about whether the visible message can be understood quickly; Memory is about whether the visual, copy, and branding offer distinctive recall cues; Persuasion is about whether the visible creative gives someone a clear reason to take the next step.

These are AI-guided visual readouts, not lab-validated measurements. Use the uploaded image plus the actual panel reactions. Score each dimension from 0 to 100, give one concrete visible finding, and one practical visual or copy refinement. Do not infer product performance, purchase intent, ROI, or any off-image attribute.

Write a short, honest synthesis grounded ONLY in what these specific people actually said above — never invent a reaction no one gave. Return ONLY a JSON object, no markdown, no preamble:
{
  "overall_take": "<2-3 sentence synthesis of how the panel responded overall>",
  "where_personas_agree": "<1 sentence on a point of real agreement across multiple people, or null if there isn't one>",
  "where_personas_diverge": "<1 sentence on where people genuinely disagreed or reacted differently, or null if they didn't>",
  "top_recommended_change": "<the single most impactful visual or copy change to make, based on what multiple people actually raised>",
  "diagnostics": [
    { "dimension": "attention", "score": 0, "finding": "<specific visible finding>", "recommendation": "<specific refinement>" },
    { "dimension": "emotion", "score": 0, "finding": "<specific visible finding>", "recommendation": "<specific refinement>" },
    { "dimension": "comprehension", "score": 0, "finding": "<specific visible finding>", "recommendation": "<specific refinement>" },
    { "dimension": "memory", "score": 0, "finding": "<specific visible finding>", "recommendation": "<specific refinement>" },
    { "dimension": "persuasion", "score": 0, "finding": "<specific visible finding>", "recommendation": "<specific refinement>" }
  ]
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1300,
    messages: [{ role: 'user', content: buildUserMessageContent(prompt, imageBase64, imageMediaType) }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) return DEFAULT_CREATIVE_SUMMARY
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    const validDimensions: CreativeDiagnosticDimension[] = ['attention', 'emotion', 'comprehension', 'memory', 'persuasion']
    const rawDiagnostics: unknown[] = Array.isArray(parsed?.diagnostics) ? parsed.diagnostics : []
    const diagnostics: CreativeDiagnostic[] = rawDiagnostics.reduce<CreativeDiagnostic[]>((items, item) => {
      if (!item || typeof item !== 'object') return items
      const value = item as Record<string, unknown>
      const dimension = typeof value.dimension === 'string' ? value.dimension as CreativeDiagnosticDimension : null
      if (!dimension || !validDimensions.includes(dimension)) return items
      const score = typeof value.score === 'number' ? value.score : parseFloat(String(value.score))
      if (!Number.isFinite(score) || typeof value.finding !== 'string' || typeof value.recommendation !== 'string') return items
      items.push({
        dimension,
        score: Math.max(0, Math.min(100, Math.round(score))),
        finding: value.finding.trim(),
        recommendation: value.recommendation.trim(),
      })
      return items
    }, [])
    return {
      overall_take: typeof parsed?.overall_take === 'string' ? parsed.overall_take.trim() : '',
      where_personas_agree: typeof parsed?.where_personas_agree === 'string' && parsed.where_personas_agree.trim() ? parsed.where_personas_agree.trim() : null,
      where_personas_diverge: typeof parsed?.where_personas_diverge === 'string' && parsed.where_personas_diverge.trim() ? parsed.where_personas_diverge.trim() : null,
      top_recommended_change: typeof parsed?.top_recommended_change === 'string' ? parsed.top_recommended_change.trim() : '',
      diagnostics: validDimensions.flatMap(dimension => diagnostics.find(item => item.dimension === dimension) ?? []),
    }
  } catch {
    return DEFAULT_CREATIVE_SUMMARY
  }
}
