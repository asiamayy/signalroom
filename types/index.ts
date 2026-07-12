// ─── User & Auth ────────────────────────────────────────────────────────────

export type Plan = 'free' | 'starter' | 'pro' | 'agency'

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
  briefing?: ExecutiveBriefing | null
  briefing_generated_at?: string | null
  created_at: string
  updated_at: string
}

// ─── Executive briefing (Home dashboard) ─────────────────────────────────────

export interface ExecutiveBriefing {
  summary: string
  observations: string[]
  recommended_next_step: string
}

// ─── Persona ─────────────────────────────────────────────────────────────────

export type PersonaGender = 'male' | 'female' | 'non-binary' | 'prefer not to say'
export type PersonaIncome = 'under_50k' | '50k_100k' | '100k_200k' | 'over_200k'
export type PersonaEducation = 'high_school' | 'bachelors' | 'masters' | 'phd'
export type FunnelStage = 'awareness' | 'consideration' | 'purchase' | 'loyalty'

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  purchase: 'Purchase',
  loyalty: 'Loyalty',
}

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
  motivations?: string[]
  preferred_tools?: string[]
  key_quote?: string
}

export interface Persona {
  id: string
  user_id: string
  project_id?: string | null
  name: string
  avatar_initials: string
  avatar_color: string
  avatar_url: string | null
  traits: PersonaTraits
  tags: string[]
  funnel_stage?: FunnelStage
  archived?: boolean
  archived_at?: string | null
  created_at: string
  updated_at: string
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  user_id: string
  name: string
  archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

// ─── Journey ──────────────────────────────────────────────────────────────────

export interface JourneyStep {
  id?: string
  step_order: number
  phase_name: string
  user_action: string
  internal_thoughts: string
  emotional_score: number // -5 to +5
  friction_point: string | null
}

export interface Journey {
  id: string
  user_id: string
  persona_id: string
  title: string
  created_at: string
  steps: JourneyStep[]
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
  project_id?: string | null
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

// ─── Signal ───────────────────────────────────────────────────────────────────
// AI-synthesized customer intelligence, derived from interview transcripts and
// reports. Not manually authored — see lib/anthropic/signal-engine.ts.

export type SignalType =
  | 'pain_point'
  | 'objection'
  | 'desired_outcome'
  | 'feature_request'
  | 'buying_trigger'
  | 'trend'
  | 'opportunity'
  | 'risk'

export const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  pain_point: 'Pain Point',
  objection: 'Objection',
  desired_outcome: 'Desired Outcome',
  feature_request: 'Feature Request',
  buying_trigger: 'Buying Trigger',
  trend: 'Trend',
  opportunity: 'Opportunity',
  risk: 'Risk',
}

export type SignalStatus = 'emerging' | 'growing' | 'validated'

export const SIGNAL_STATUS_LABELS: Record<SignalStatus, string> = {
  emerging: 'Emerging',
  growing: 'Growing',
  validated: 'Validated',
}

export interface SignalQuote {
  text: string
  persona_id: string | null
  interview_id: string | null
}

// One snapshot per time a signal is touched (created or merged into by a
// new interview) — see syncSignalsForInterview in the report route. Lets
// the UI and the briefing engine describe real movement ("mention count up
// 42% over 30 days") instead of a static point-in-time read.
export interface SignalHistoryEntry {
  date: string
  mentionCount: number
  confidenceScore: number
}

export type SignalImpact = 'low' | 'medium' | 'high'

export const SIGNAL_IMPACT_LABELS: Record<SignalImpact, string> = {
  low: 'Low impact',
  medium: 'Medium impact',
  high: 'High impact',
}

export interface Signal {
  id: string
  user_id: string
  project_id: string
  title: string
  type: SignalType
  summary: string
  confidence_score: number
  supporting_quotes: SignalQuote[]
  related_persona_ids: string[]
  related_interview_ids: string[]
  status: SignalStatus
  strategic_recommendation: string
  impact: SignalImpact | null
  history: SignalHistoryEntry[]
  created_at: string
  updated_at: string
}

// ─── Project files ──────────────────────────────────────────────────────────

export interface ProjectFile {
  id: string
  user_id: string
  project_id: string
  name: string
  storage_path: string
  file_type: string
  size_bytes: number
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
  audience_panel: boolean
  audience_panel_max: number
  team_seats: number
  white_label: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    personas: 1,
    interviews_per_month: 1,
    reports: false,
    templates: false,
    multi_persona: false,
    audience_panel: false,
    audience_panel_max: 0,
    team_seats: 1,
    white_label: false,
  },
  starter: {
    personas: 3,
    interviews_per_month: 10,
    reports: false,
    templates: false,
    multi_persona: false,
    audience_panel: false,
    audience_panel_max: 0,
    team_seats: 1,
    white_label: false,
  },
  pro: {
    personas: Infinity,
    interviews_per_month: Infinity,
    reports: true,
    templates: true,
    multi_persona: true,
    audience_panel: true,
    audience_panel_max: 5,
    team_seats: 1,
    white_label: false,
  },
  agency: {
    personas: Infinity,
    interviews_per_month: Infinity,
    reports: true,
    templates: true,
    multi_persona: true,
    audience_panel: true,
    audience_panel_max: 10,
    team_seats: 10,
    white_label: true,
  },
}

export const PLAN_PRICES: Record<Plan, number> = {
  free: 0,
  starter: 199,
  pro: 499,
  agency: 999,
}
