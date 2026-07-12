import Stripe from 'stripe'
import type { Plan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

// 'free' is intentionally excluded — it has no Stripe product, since it's
// the no-payment default rather than something a user checks out for.
export const PRICE_IDS: Record<Exclude<Plan, 'free'>, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  agency: process.env.STRIPE_AGENCY_PRICE_ID!,
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  plan: Exclude<Plan, 'free'>
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [
      {
        price: PRICE_IDS[plan],
        quantity: 1,
      },
    ],
    metadata: {
      user_id: userId,
      plan,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  return session
}

export async function createPortalSession(stripeCustomerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  return session
}
