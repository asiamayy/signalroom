// Request-body validation for the API routes that feed client JSON into
// prompts or jsonb columns. Structural fields that prompt construction
// dereferences (traits.goals[0], traits.job_title.toLowerCase(), …) get safe
// defaults so a sparse payload can never 500 mid-interview; genuinely
// malformed payloads are rejected with a 400 instead of reaching Claude.

import { z } from 'zod'

// ─── Persona ─────────────────────────────────────────────────────────────────

// '' and NaN (which JSON-serializes to null) both mean "not set"
const optionalUuid = z.preprocess(v => (v === '' ? null : v), z.uuid().nullable().optional())

export const personaTraitsSchema = z.looseObject({
  age: z.number().int().min(1).max(120).nullable().optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer not to say']).default('prefer not to say'),
  location: z.string().max(200).default(''),
  job_title: z.string().max(200).default(''),
  industry: z.string().max(200).default(''),
  income: z.enum(['under_50k', '50k_100k', '100k_200k', 'over_200k']).optional(),
  education: z.enum(['high_school', 'bachelors', 'masters', 'phd']).optional(),
  goals: z.array(z.string().max(500)).max(20).default([]),
  frustrations: z.array(z.string().max(500)).max(20).default([]),
  buying_behavior: z.string().max(2000).default(''),
  tech_savviness: z.number().int().min(1).max(5).default(3),
  risk_tolerance: z.number().int().min(1).max(5).default(3),
  additional_context: z.string().max(2000).default(''),
  motivations: z.array(z.string().max(500)).max(20).optional(),
  preferred_tools: z.array(z.string().max(200)).max(20).optional(),
  key_quote: z.string().max(1000).optional(),
  ethnicity: z.string().max(100).optional(),
})

export const personaCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  traits: personaTraitsSchema,
  tags: z.array(z.string().max(60)).max(20).default([]),
  project_id: optionalUuid,
  avatar_url: z.string().max(2000).nullable().optional(),
})

export const personaGenerateSchema = z.object({
  generate: z.literal(true),
  description: z.string().trim().min(1, 'Description is required').max(2000),
})

// ─── Interview ───────────────────────────────────────────────────────────────

export const interviewCreateSchema = z.object({
  persona_id: z.uuid(),
  title: z.string().trim().min(1, 'Title is required').max(200),
  type: z.enum([
    'concept_testing',
    'pricing_discovery',
    'message_testing',
    'competitive_positioning',
    'feature_prioritization',
    'custom',
  ]),
  context: z.string().max(4000).default(''),
  devils_advocate: z.boolean().optional(),
  project_id: optionalUuid,
})

export const chatMessageSchema = z.object({
  message: z.string().max(4000).default(''),
  // Base64 payload — ~6MB cap keeps request bodies inside serverless limits
  image: z.string().max(6_000_000).nullable().optional(),
  imageMediaType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']).optional(),
}).refine(d => d.message.trim().length > 0 || !!d.image, {
  message: 'Send a message or an image',
})

// ─── Helper ──────────────────────────────────────────────────────────────────

export function parseBody<T extends z.ZodType>(
  schema: T,
  body: unknown
): { ok: true; data: z.output<T> } | { ok: false; error: string } {
  const result = schema.safeParse(body)
  if (result.success) {
    return { ok: true, data: result.data }
  }
  const first = result.error.issues[0]
  const path = first?.path?.length ? `${first.path.join('.')}: ` : ''
  return { ok: false, error: `Invalid request — ${path}${first?.message ?? 'malformed body'}` }
}
