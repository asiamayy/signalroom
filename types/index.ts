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
  brand_logo_url?: string | null
  brand_color?: string | null
  brand_palette?: string[] | null
  brand_favorites?: string[] | null
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
  ethnicity?: string
}

export interface Persona {
  id: string
  user_id: string
  project_id?: string | null
  workspace_id?: string | null
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
  workspace_id?: string | null
  name: string
  cover_image_url: string | null
  archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

// ─── Workspace (Broadcast team seats) ────────────────────────────────────────
// A workspace is a shared, isolated space an account owner creates (e.g. one
// per client) and invites specific people into — never a flat pool visible to
// everyone with a seat. Content (projects/personas/interviews/reports) with a
// null workspace_id is personal, exactly as it behaves without this feature;
// a non-null workspace_id makes it visible/editable by every member of that
// workspace. See supabase-migration-team-workspaces.sql for the RLS that
// enforces this.

export interface Workspace {
  id: string
  owner_id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
}

export type PersonaActivityAction =
  | 'persona_created'
  | 'stage_changed'
  | 'journey_created'
  | 'interview_started'
  | 'report_generated'
  | 'persona_archived'
  | 'persona_restored'
  | 'project_changed'

export interface PersonaActivity {
  id: string
  persona_id: string
  actor_id: string | null
  action: PersonaActivityAction
  detail: string | null
  created_at: string
}

export interface WorkspaceMember {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
  role: 'owner' | 'member'
  last_seen_at?: string | null
}

export interface WorkspaceInvite {
  id: string
  workspace_id: string
  invited_email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'revoked'
  created_at: string
  accepted_at?: string | null
}

export type WorkspaceActivityAction =
  | 'workspace_created'
  | 'workspace_renamed'
  | 'member_invited'
  | 'persona_created'
  | 'interview_started'
  | 'report_generated'

export interface WorkspaceActivity {
  id: string
  workspace_id: string
  actor_id: string | null
  action: WorkspaceActivityAction
  entity_type: string | null
  entity_id: string | null
  entity_label: string | null
  created_at: string
}

export interface WorkspaceSource {
  id: string
  workspace_id: string
  user_id: string | null
  name: string
  storage_path: string
  file_type: string
  size_bytes: number
  extracted_text: string
  created_at: string
}

export interface WorkspaceContext {
  workspace_id: string
  content: string
  updated_by: string | null
  updated_at: string
}

export interface WorkspaceCommentAuthor {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

export interface WorkspaceComment {
  id: string
  workspace_id: string
  report_id: string
  parent_id: string | null
  section_key: string
  content: string
  author_id: string | null
  mentioned_user_ids: string[]
  created_at: string
  updated_at: string
  author?: WorkspaceCommentAuthor | null
}

export type WorkspaceAutomationEvent = 'persona_created' | 'interview_started' | 'report_generated'
export type WorkspaceWebhookProvider = 'slack' | 'teams'

export interface WorkspaceAutomation {
  id: string
  workspace_id: string
  provider: WorkspaceWebhookProvider
  display_name: string
  events: WorkspaceAutomationEvent[]
  enabled: boolean
  created_at: string
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
  workspace_id?: string | null
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

export interface AIVerdict {
  summary: string
  validate_next: string
  follow_up_question: string
}

export interface Report {
  id: string
  user_id: string
  workspace_id?: string | null
  interview_id: string
  interview?: Interview
  executive_summary: string
  key_themes: ReportTheme[]
  recommendations: ReportRecommendation[]
  confidence_score: number
  ai_verdict: AIVerdict | null
  share_token?: string | null
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

// Which feature produced a signal. Defaults to 'interview' on every row
// that existed before Compare/Audience Panel/Concept Test could also
// produce them — see supabase-migration-persisted-runs.sql.
export type SignalSourceType = 'interview' | 'compare' | 'audience_panel' | 'concept_test'

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
  // Generic sibling to related_interview_ids for the 3 non-interview
  // sources — holds compare_runs/audience_panel_runs/concept_test_runs
  // ids. Interview-sourced signals leave this empty and keep using
  // related_interview_ids instead.
  related_run_ids: string[]
  source_type: SignalSourceType
  status: SignalStatus
  strategic_recommendation: string
  impact: SignalImpact | null
  history: SignalHistoryEntry[]
  created_at: string
  updated_at: string
}

// ─── Integrations (Slack / Notion — Signal & Broadcast plans only) ──────────
// Real-time push, not a scheduled digest — hooked into report/signal
// creation in app/api/interviews/[id]/report/route.ts. Account-level only:
// a workspace member's activity pushes through the WORKSPACE OWNER's
// connection, not their own (see lib/integrations/push.ts).

export type IntegrationProvider = 'slack' | 'notion'

export interface SlackIntegrationMetadata {
  channel_name: string
  channel_id: string
  team_id: string
}

export interface NotionIntegrationMetadata {
  workspace_id: string
  bot_id: string
  parent_page_id: string | null
  parent_page_title: string | null
}

// Client-facing shape only. Deliberately has no access_token field — the
// integrations table's access_token column must never be selected into any
// client-facing API response; routes only ever return this shape.
export interface IntegrationConnection {
  provider: IntegrationProvider
  display_name: string | null
  metadata: SlackIntegrationMetadata | NotionIntegrationMetadata
  created_at: string
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

// ─── Concept test (compare multiple concepts side by side) ──────────────────

// One concept the panel evaluates — a short label + description, plus an
// optional image (ad creative, packaging, mockup).
export interface ConceptInput {
  id: string
  label: string
  description: string
  image?: string | null // base64, no data: prefix
  imageMediaType?: string
}

// A single persona's take on one concept.
export interface ConceptReaction {
  persona_id: string
  persona_name: string
  avatar_initials: string
  avatar_color: any
  avatar_url: string | null
  job_title: string
  reaction: string
  score: number | null
}

// Aggregated result for one concept across the whole panel.
export interface ConceptResult {
  id: string
  label: string
  rank: number
  avg_score: number | null
  reactions: ConceptReaction[]
  strength: string
  weakness: string
  verdict: string
}

export interface ConceptTestResult {
  concepts: ConceptResult[] // ranked, best first
  winner_id: string | null
  overall_recommendation: string
  total_personas: number
  completed_in_seconds: number
}

// ─── Compare (2-4 personas answer one question) ─────────────────────────────

export interface CompareResult {
  persona_id: string
  persona_name: string
  avatar_initials: string
  avatar_color: any
  avatar_url: string | null
  job_title: string
  location: string
  response: string | null
  score: number | null
  error: string | null
}

// ─── Audience Panel (5+ personas, aggregated themes/sentiment) ──────────────

export interface PanelResponse {
  persona_id: string
  persona_name: string
  avatar_initials: string
  avatar_color: any
  avatar_url: string | null
  job_title: string
  location: string
  age: number | null
  industry: string
  response: string | null
  score: number | null
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  error: string | null
}

export interface PanelTheme {
  title: string
  count: number
  sentiment: string
  summary: string
}

export interface PanelSummary {
  overall_recommendation: string
  top_opportunity: string
  biggest_risk: string
  likelihood_of_purchase: number
  recommended_actions: string[]
  most_representative_quote: string
  most_representative_quote_persona: string
  biggest_objection_quote: string
  biggest_objection_quote_persona: string
  completed_in_seconds: number
}

export interface PanelResult {
  responses: PanelResponse[]
  themes: PanelTheme[]
  sentiment_distribution: Record<string, number>
  consensus_score: number
  total_personas: number
  question: string
  summary: PanelSummary
}

// ─── Persisted runs (Compare / Audience Panel / Concept Test) ───────────────
// Unlike interviews/reports, these three had no persistence at all until
// supabase-migration-persisted-runs.sql — a run is an immutable snapshot
// (input + full result), never edited after creation, which is why there's
// no updated_at here (matches the `reports` convention).

export interface CompareRun {
  id: string
  user_id: string
  project_id: string
  workspace_id?: string | null
  question: string
  context: string
  interview_type: InterviewType
  persona_ids: string[]
  result: CompareResult[]
  created_at: string
}

export interface AudiencePanelRun {
  id: string
  user_id: string
  project_id: string
  workspace_id?: string | null
  question: string
  persona_ids: string[]
  result: PanelResult
  created_at: string
}

export interface ConceptTestRun {
  id: string
  user_id: string
  project_id: string
  workspace_id?: string | null
  context: string
  interview_type: InterviewType
  persona_ids: string[]
  concepts: ConceptInput[] // labels/descriptions only — images are never persisted
  result: ConceptTestResult
  created_at: string
}

// ─── Creative Testing (visual asset reviewed by a persona panel) ───────────
// Unlike Compare/Audience Panel/Concept Test, this reasons about a SINGLE
// visual asset (packaging, ad, landing page) rather than comparing several —
// there's no winner or cross-concept score. Two independently-sourced layers
// combine into one result: real pixel-based saliency (computed client-side in
// lib/vision/saliency.ts, never touched by the LLM) tells you WHERE attention
// objectively lands; Claude identifies WHAT each of those regions actually is
// (headline, CTA, product shot, etc.); then the persona panel reacts to that
// real attention data from each person's own perspective. engagement_percentage
// is a per-persona read on THIS asset, not a comparative ranking score.

export interface CreativeZone {
  label: string // e.g. "Headline", "Call to action", "Product image", "Price", "Logo", "Background"
  x0: number // normalized 0-1 bounding box
  y0: number
  x1: number
  y1: number
  attention_pct: number // share of total saliency mass falling in this zone, 0-100
}

export interface CreativePersonaReaction {
  persona_id: string
  persona_name: string
  avatar_initials: string
  avatar_color: any
  avatar_url: string | null
  job_title: string
  notices: string[] // ordered, what they notice first/second/third, in their own words
  reaction: string | null // first-person, 3-5 sentences
  most_believable_claim: string | null
  most_confusing_element: string | null
  likely_trigger: string | null // what would make them act, or walk away
  engagement_percentage: number | null // 0-100, this persona's own read on this asset
  suggested_adjustment: string | null
  error: string | null
}

// Synthesized across the whole panel's reactions — genuinely computed by a
// second Claude call reading every persona's actual response, never a
// template. Optional on the type (not just at runtime) because older
// persisted runs from before this field existed won't have it.
export interface CreativeReviewSummary {
  overall_take: string
  where_personas_agree: string | null
  where_personas_diverge: string | null
  top_recommended_change: string
}

export interface CreativeReviewResult {
  zones: CreativeZone[]
  intended_focus: string
  reactions: CreativePersonaReaction[]
  total_personas: number
  completed_in_seconds: number
  summary?: CreativeReviewSummary
}

export interface CreativeReviewRun {
  id: string
  user_id: string
  project_id: string
  workspace_id?: string | null
  intended_focus: string
  persona_ids: string[]
  image_storage_path: string
  heatmap_storage_path: string | null
  result: CreativeReviewResult
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
  integrations_enabled: boolean
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
    integrations_enabled: false,
  },
  starter: {
    personas: 10,
    interviews_per_month: 10,
    reports: false,
    templates: false,
    multi_persona: false,
    audience_panel: false,
    audience_panel_max: 0,
    team_seats: 1,
    white_label: false,
    integrations_enabled: false,
  },
  pro: {
    personas: 50,
    interviews_per_month: 100,
    reports: true,
    templates: true,
    multi_persona: true,
    audience_panel: true,
    audience_panel_max: 5,
    team_seats: 1,
    white_label: false,
    integrations_enabled: true,
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
    integrations_enabled: true,
  },
}

export const PLAN_PRICES: Record<Plan, number> = {
  free: 0,
  starter: 199,
  pro: 499,
  agency: 999,
}
