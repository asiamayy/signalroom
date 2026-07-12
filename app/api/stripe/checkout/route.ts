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

  if (plan === 'free') {
    return NextResponse.json({ error: 'The free plan has no checkout — cancel your subscription from the billing portal to downgrade to it.' }, { status: 400 })
  }

  // Fail with a clear, actionable message instead of letting Stripe reject a
  // malformed request (e.g. success_url built from an unset env var) with a
  // cryptic error, or silently sending an undefined price id.
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json({ error: 'Server misconfiguration: NEXT_PUBLIC_APP_URL is not set, so Stripe cannot build a valid success/cancel URL.' }, { status: 500 })
  }
  const priceEnvVar = { starter: 'STRIPE_STARTER_PRICE_ID', pro: 'STRIPE_PRO_PRICE_ID', agency: 'STRIPE_AGENCY_PRICE_ID' }[plan]
  if (!process.env[priceEnvVar]) {
    return NextResponse.json({ error: `Server misconfiguration: ${priceEnvVar} is not set.` }, { status: 500 })
  }

  try {
    const session = await createCheckoutSession(user.id, user.email!, plan)
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Stripe checkout error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Failed to create checkout session' }, { status: 500 })
  }
}
