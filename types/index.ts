// ─── User & Auth ────────────────────────────────────────────────────────────

export type Plan = 'starter' | 'pro' | 'agency'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  interviews_used: number
  personas_used: number
  created_at: string
  updated_at: string
}

// ─── Persona ─────────────────────────────────────────────────────────────────

export type PersonaGender = 'male' | 'female' | 'non-binary' | 'prefer not to say'
export type PersonaIncome = 'under_50k' | '50k_100k' | '100k_200k' | 'over_200k'
export type PersonaEducation = 'high_school' | 'bachelors' | 'masters' | 'phd'

export interface PersonaTraits {
  age: number
  gender: PersonaGender
  location: string
  job_title: string
  industry: string
  income: PersonaIncome
  education: PersonaEducation
  goals: string[]
  frustrations: string[]
  buying_behavior: string
  tech_savviness: 1 | 2 | 3 | 4 | 5
  risk_tolerance: 1 | 2 | 3 | 4 | 5
  additional_context: string
}

export interface Persona {
  id: string
  user_id: string
  name: string
  avatar_initials: string
  avatar_color: string
  avatar_url: string | null
  traits: PersonaTraits
  tags: string[]
  archived?: boolean
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export type PersonaFormData = Omit<Persona, 'id' | 'user_id' | 'created_at' | 'updated_at'>

// ─── Interview ────────────────────────────────────────────────────────────────

export type InterviewType =
  | 'concept_testing'
  | 'pricing_discovery'
  | 'message_testing'
  | 'competitive_positioning'
  | 'feature_prioritization'
  | 'custom'

export type InterviewStatus = 'draft' | 'active' | 'completed'

export interface Message {
  id: string
  role: 'user' | 'persona'
  content: string
  image_url?: string | null
  timestamp: string
}

export interface Interview {
  id: string
  user_id: string
  persona_id: string
  persona?: Persona
  title: string
  type: InterviewType
  status: InterviewStatus
  context: string
  messages: Message[]
  report_id: string | null
  created_at: string
  updated_at: string
}

export type InterviewFormData = {
  persona_id: string
  title: string
  type: InterviewType
  context: string
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface ReportTheme {
  title: string
  summary: string
  quotes: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
}

export interface ReportRecommendation {
  title: string
  detail: string
  priority: 'high' | 'medium' | 'low'
}

export interface Report {
  id: string
  user_id: string
  interview_id: string
  interview?: Interview
  executive_summary: string
  key_themes: ReportTheme[]
  recommendations: ReportRecommendation[]
  confidence_score: number
  created_at: string
}

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface StreamChunk {
  type: 'text' | 'done' | 'error'
  content: string
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export interface PlanLimits {
  personas: number
  interviews_per_month: number
  reports: boolean
  templates: boolean
  multi_persona: boolean
  team_seats: number
  white_label: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  starter: {
    personas: 3,
    interviews_per_month: 10,
    reports: false,
    templates: false,
    multi_persona: false,
    team_seats: 1,
    white_label: false,
  },
  pro: {
    personas: Infinity,
    interviews_per_month: Infinity,
    reports: true,
    templates: true,
    multi_persona: true,
    team_seats: 1,
    white_label: false,
  },
  agency: {
    personas: Infinity,
    interviews_per_month: Infinity,
    reports: true,
    templates: true,
    multi_persona: true,
    team_seats: 10,
    white_label: true,
  },
}

export const PLAN_PRICES: Record<Plan, number> = {
  starter: 49,
  pro: 99,
  agency: 249,
}
