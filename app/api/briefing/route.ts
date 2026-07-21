import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExecutiveBriefing } from '@/lib/anthropic/briefing-engine'
import { logError } from '@/lib/logger'
import { getTrendDirection, getMentionTrendPercent } from '@/lib/utils/signals'
import type { Signal } from '@/types'

// Regenerates and caches the executive briefing. Deliberately its own route,
// called async from the client after Home has already rendered with
// whatever was cached — a Claude call is too slow to block page navigation
// on (see Home's "takes a long time to load" report).
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Server-side staleness floor: the client only calls this when Home decides
  // the briefing is stale, but nothing stopped a direct loop from regenerating
  // (and paying for) a Claude call per request. If we generated one in the
  // last minute, hand back the cache.
  const { data: cachedProfile } = await supabase
    .from('profiles')
    .select('briefing, briefing_generated_at')
    .eq('id', user.id)
    .single()

  if (cachedProfile?.briefing && cachedProfile.briefing_generated_at) {
    const ageMs = Date.now() - new Date(cachedProfile.briefing_generated_at).getTime()
    if (ageMs < 60_000) {
      return NextResponse.json({ data: cachedProfile.briefing })
    }
  }

  const [{ data: signals }, { data: reports }] = await Promise.all([
    supabase.from('signals').select('*').eq('user_id', user.id).order('confidence_score', { ascending: false }),
    supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const allSignals: Signal[] = signals ?? []
  const signalTrends = allSignals.slice(0, 12).map(s => ({
    title: s.title,
    direction: getTrendDirection(s),
    mentionTrendPercent: getMentionTrendPercent(s),
  }))

  try {
    const briefing = await generateExecutiveBriefing(
      allSignals.slice(0, 12),
      (reports ?? []).slice(0, 8),
      signalTrends
    )

    await supabase.from('profiles').update({
      briefing,
      briefing_generated_at: new Date().toISOString(),
    }).eq('id', user.id)

    return NextResponse.json({ data: briefing })
  } catch (e: any) {
    logError('briefing.generate', e, { userId: user.id })
    return NextResponse.json({ error: e?.message ?? 'Failed to generate briefing' }, { status: 500 })
  }
}
