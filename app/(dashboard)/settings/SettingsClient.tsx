'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Zap, Users, Building2, ExternalLink, LogOut, AlertCircle } from 'lucide-react'
import { cn, CARD_SHADOW } from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { createClient } from '@/lib/supabase/client'
import type { Plan } from '@/types'
import { PLAN_LIMITS } from '@/types'

// ─── Plan definitions ─────────────────────────────────────────────────────────
// Names inspired by momentum/signal theme — not Sprint/Grow/Scale from Zibble

const PLANS: {
  id: Plan
  name: string
  tagline: string
  price: number
  icon: React.ElementType
  features: string[]
  highlight?: boolean
}[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try it before you commit',
    price: 0,
    icon: Sparkles,
    features: [
      '1 persona',
      '1 interview per month',
      'No credit card required',
    ],
  },
  {
    id: 'starter',
    name: 'Pulse',
    tagline: 'For solo founders getting started',
    price: 199,
    icon: Zap,
    features: [
      '3 personas',
      '10 interviews per month',
      'Basic research reports',
      'Core interview templates',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Signal',
    tagline: 'For teams validating fast',
    price: 499,
    icon: Users,
    highlight: true,
    features: [
      'Unlimited personas',
      'Unlimited interviews',
      'Full research reports',
      'All interview templates',
      'Multi-persona testing',
      'Priority support',
    ],
  },
  {
    id: 'agency',
    name: 'Broadcast',
    tagline: 'For agencies and growing teams',
    price: 1999,
    icon: Building2,
    features: [
      'Everything in Signal',
      'Up to 10 team seats',
      'White-label reports',
      'Dedicated onboarding',
      'Custom templates',
      'SLA support',
    ],
  },
]

interface SettingsClientProps {
  profile: any
  user: any
  personaCount: number
  interviewCount: number
}

export default function SettingsClient({ profile, user, personaCount, interviewCount }: SettingsClientProps) {
  const router = useRouter()
  const [upgrading, setUpgrading] = useState<Plan | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [billingError, setBillingError] = useState('')

  const currentPlan = profile?.plan ?? 'free'
  const currentPlanData = PLANS.find(p => p.id === currentPlan)
  const personaLimit = PLAN_LIMITS[currentPlan as Plan].personas
  const interviewLimit = PLAN_LIMITS[currentPlan as Plan].interviews_per_month

  // Every path resets the loading state and surfaces an error — previously
  // a non-2xx response (e.g. Stripe rejecting a placeholder API key) left
  // the button stuck on "Redirecting..." forever with no explanation.
  const handleUpgrade = async (plan: Plan) => {
    if (plan === currentPlan) return
    setBillingError('')
    setUpgrading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      if (json.url) { window.location.href = json.url; return }
      setBillingError(json.error ?? 'Failed to start checkout — please try again.')
    } catch {
      setBillingError('Failed to start checkout — please try again.')
    } finally {
      setUpgrading(null)
    }
  }

  const handleManageBilling = async () => {
    setBillingError('')
    setOpeningPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) { window.location.href = json.url; return }
      setBillingError(json.error ?? 'Failed to open billing portal — please try again.')
    } catch {
      setBillingError('Failed to open billing portal — please try again.')
    } finally {
      setOpeningPortal(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full">
      <div className="px-4 sm:px-10 py-10 sm:py-14 max-w-5xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Account</span>
        </div>
        <h1 className="mb-2" style={{ ...DISPLAY_LG_STYLE, fontSize: '32px', lineHeight: '40px', color: HOME_COLORS.onSurface }}>Settings</h1>
        <p className="text-sm mb-10" style={{ color: HOME_COLORS.onSurfaceVariant }}>Manage your account and billing</p>

        {billingError && (
          <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-8" style={{ background: '#FFDAD6', color: HOME_COLORS.error }}>
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{billingError}</p>
          </div>
        )}

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>Account</h2>
          <div className="rounded-2xl p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{profile?.full_name ?? 'Your account'}</p>
                <p className="text-sm mt-0.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-1.5 text-sm transition-colors hover:text-red-600"
                style={{ color: HOME_COLORS.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <LogOut size={14} />
                {signingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </section>

        {/* ── Usage ────────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>Usage</h2>
          <div className="rounded-2xl p-5 space-y-4" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
            {/* Personas */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: HOME_COLORS.onSurfaceVariant }}>Personas</span>
                <span className="font-semibold" style={{ color: HOME_COLORS.onSurface }}>
                  {personaCount} / {personaLimit === Infinity ? '∞' : personaLimit}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: HOME_COLORS.surfaceContainer }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    background: personaLimit !== Infinity && personaCount >= personaLimit ? HOME_COLORS.error : HOME_COLORS.primary,
                    width: personaLimit === Infinity ? '10%' : `${Math.min(100, (personaCount / personaLimit) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Interviews */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: HOME_COLORS.onSurfaceVariant }}>Interviews</span>
                <span className="font-semibold" style={{ color: HOME_COLORS.onSurface }}>
                  {interviewCount} / {interviewLimit === Infinity ? '∞' : interviewLimit}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: HOME_COLORS.surfaceContainer }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ background: HOME_COLORS.primary, width: interviewLimit === Infinity ? '10%' : `${Math.min(100, (interviewCount / interviewLimit) * 100)}%` }}
                />
              </div>
            </div>

            {personaLimit !== Infinity && personaCount >= personaLimit && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ color: HOME_COLORS.error, background: '#FFDAD6' }}>
                You've reached your persona limit. Upgrade to create more.
              </p>
            )}
          </div>
        </section>

        {/* ── Current plan ─────────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>Current plan</h2>
          <div className="rounded-2xl p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {currentPlanData && (
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: HOME_COLORS.secondaryContainer }}>
                    <currentPlanData.icon size={16} style={{ color: HOME_COLORS.primary }} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>
                    {currentPlanData?.name ?? 'Free'} plan
                  </p>
                  <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                    {currentPlanData && currentPlanData.price === 0 ? 'No cost' : `$${currentPlanData?.price ?? 0}/month`}
                  </p>
                </div>
              </div>
              {profile?.stripe_subscription_id && (
                <button
                  onClick={handleManageBilling}
                  disabled={openingPortal}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors hover:bg-black/[0.03]"
                  style={{ color: HOME_COLORS.onSurfaceVariant, border: `1px solid ${HOME_COLORS.outlineVariant}66`, background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <ExternalLink size={13} />
                  {openingPortal ? 'Opening...' : 'Manage billing'}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Plans ────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(plan => {
              const isCurrent = plan.id === currentPlan
              const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan)
              const isLoading = upgrading === plan.id
              const Icon = plan.icon

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl p-6 flex flex-col"
                  style={{
                    background: HOME_COLORS.surfaceContainerLowest,
                    boxShadow: CARD_SHADOW,
                    border: isCurrent
                      ? `1.5px solid ${HOME_COLORS.primary}`
                      : plan.highlight
                      ? `1.5px solid ${HOME_COLORS.primary}66`
                      : `1.5px solid ${HOME_COLORS.outlineVariant}33`,
                  }}
                >
                  {/* Badge */}
                  {plan.highlight && !isCurrent && (
                    <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}>
                      Most popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
                      Current plan
                    </span>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={15} style={{ color: HOME_COLORS.onSurfaceVariant }} />
                    <h3 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{plan.name}</h3>
                  </div>
                  <p className="text-xs mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>{plan.tagline}</p>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>Free</span>
                    ) : (
                      <>
                        <span className="text-3xl leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>${plan.price}</span>
                        <span className="text-xs ml-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>/month</span>
                      </>
                    )}
                  </div>

                  <hr className="mb-4" style={{ border: 'none', borderTop: `1px solid ${HOME_COLORS.outlineVariant}33` }} />

                  {/* Features */}
                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                        <Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: HOME_COLORS.primary }} strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA — the Free plan has no Stripe checkout, so downgrading to
                      it means canceling the active subscription via the billing
                      portal instead (the webhook then drops plan back to 'free') */}
                  <button
                    onClick={() => {
                      if (isCurrent) return
                      if (plan.id === 'free') handleManageBilling()
                      else handleUpgrade(plan.id)
                    }}
                    disabled={isCurrent || isLoading || (plan.id === 'free' && openingPortal)}
                    className={cn(
                      'w-full text-sm py-2.5 rounded-full font-semibold transition-colors',
                      isCurrent ? 'cursor-default' : 'cursor-pointer'
                    )}
                    style={
                      isCurrent
                        ? { background: HOME_COLORS.surfaceContainer, color: HOME_COLORS.onSurfaceVariant, border: 'none' }
                        : isUpgrade
                        ? { background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none' }
                        : { background: 'none', color: HOME_COLORS.onSurfaceVariant, border: `1px solid ${HOME_COLORS.outlineVariant}66` }
                    }
                  >
                    {plan.id === 'free' && !isCurrent
                      ? (openingPortal ? 'Opening...' : 'Cancel to downgrade')
                      : isLoading ? 'Redirecting...'
                      : isCurrent ? 'Current plan'
                      : isUpgrade ? `Upgrade to ${plan.name}`
                      : `Switch to ${plan.name}`}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-xs mt-4 text-center" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Cancel anytime. Billed monthly.
          </p>
        </section>
      </div>
    </div>
  )
}
