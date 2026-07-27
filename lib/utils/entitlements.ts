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

// Personal interviews created since the start of the current calendar month
// (UTC) — counted from the interviews table itself, so it can't drift from
// reality. Scoped to workspace_id is null: a workspace member creating
// interviews inside someone else's Broadcast workspace operates under the
// OWNER's entitlement (and the 10-seat cap), not their own personal monthly
// quota, so workspace interviews never count against this.
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
    .is('workspace_id', null)
    .gte('created_at', monthStart.toISOString())

  return count ?? 0
}

// Distinct people across every workspace this owner has created — someone
// invited into 3 of the owner's workspaces still only costs 1 seat. Two
// simple queries (workspaces owned, then members of those) rather than a
// single embedded-join query, so the logic stays easy to verify by reading it.
export async function countWorkspaceSeats(
  supabase: SupabaseServerClient,
  ownerId: string
): Promise<number> {
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', ownerId)

  const workspaceIds = (workspaces ?? []).map(w => w.id)
  if (workspaceIds.length === 0) return 0

  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id')
    .in('workspace_id', workspaceIds)

  return new Set((members ?? []).map(m => m.user_id)).size
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
