import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type { Plan } from '@/types'
import Stripe from 'stripe'

const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_STARTER_PRICE_ID!]: 'starter',
  [process.env.STRIPE_PRO_PRICE_ID!]: 'pro',
  [process.env.STRIPE_AGENCY_PRICE_ID!]: 'agency',
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan as Plan

      if (userId && plan) {
        await supabase
          .from('profiles')
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0]?.price.id
      const plan = PRICE_TO_PLAN[priceId]

      // An unrecognized price must never silently downgrade a paying
      // customer — it usually means a rotated price ID or a missing env var
      // at deploy, not an actual plan change. Log loudly and leave the plan
      // alone so a human can reconcile.
      if (!plan) {
        console.error(
          `[stripe-webhook] Unknown price ${priceId} on subscription ${subscription.id} — plan NOT changed. Check STRIPE_*_PRICE_ID env vars.`
        )
        break
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ plan })
          .eq('id', profile.id)
      }
      break
    }

    case 'invoice.payment_failed': {
      // No dunning flow yet — Stripe retries per its own schedule and fires
      // customer.subscription.deleted if it gives up (handled below, which
      // downgrades). Log so failed renewals are at least visible instead of
      // customers silently keeping full access.
      const invoice = event.data.object as Stripe.Invoice
      console.error(
        `[stripe-webhook] Payment failed for customer ${invoice.customer} (invoice ${invoice.id}, attempt ${invoice.attempt_count}).`
      )
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ plan: 'free', stripe_subscription_id: null })
          .eq('id', profile.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
