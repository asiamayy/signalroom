// Server-side plan enforcement, shared by every AI-consuming API route.
// The client-side helpers in lib/utils/index.ts are advisory UI hints only —
// these are the checks that actually protect Anthropic/Fal spend.

import { PLAN_LIMITS } from '@/types'
import type { Plan, PlanLimits } from '@/types'
import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function getPlanForUser(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ plan: Plan; limits: PlanLimits }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  const plan = (profile?.plan ?? 'free') as Plan
  return { plan, limits: PLAN_LIMITS[plan] }
}

// Interviews created since the start of the current calendar month (UTC) —
// counted from the interviews table itself, so it can't drift from reality.
export async function countInterviewsThisMonth(
  supabase: SupabaseServerClient,
  userId: string
): Promise<number> {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const { count } = await supabase
    .from('interviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())

  return count ?? 0
}

// Lifetime usage counters (interviews_used / personas_used on profiles).
// Call only after the operation has succeeded; failures are logged, never
// surfaced — tracking must not break the feature it tracks.
export async function trackUsage(
  supabase: SupabaseServerClient,
  kind: 'interview' | 'persona'
): Promise<void> {
  const fn = kind === 'interview' ? 'increment_interviews_used' : 'increment_personas_used'
  const { error } = await supabase.rpc(fn)
  if (error) {
    console.error(`[entitlements] usage tracking failed (${fn}):`, error.message)
  }
}
