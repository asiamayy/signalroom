import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import type { Plan } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await request.json() as { plan: Plan }

  try {
    const session = await createCheckoutSession(user.id, user.email!, plan)
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Stripe checkout error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Failed to create checkout session' }, { status: 500 })
  }
}
