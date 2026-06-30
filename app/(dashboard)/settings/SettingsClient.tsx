'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, Users, Building2, ExternalLink, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    id: 'starter',
    name: 'Pulse',
    tagline: 'For solo founders getting started',
    price: 49,
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
    price: 99,
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
    price: 249,
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

  const currentPlan = profile?.plan ?? 'starter'
  const currentPlanData = PLANS.find(p => p.id === currentPlan)
  const personaLimit = PLAN_LIMITS[currentPlan as Plan].personas
  const interviewLimit = PLAN_LIMITS[currentPlan as Plan].interviews_per_month

  const handleUpgrade = async (plan: Plan) => {
    if (plan === currentPlan) return
    setUpgrading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } catch {
      setUpgrading(null)
    }
  }

  const handleManageBilling = async () => {
    setOpeningPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
    } catch {
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
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif tracking-tight text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your account and billing</p>
      </div>

      {/* ── Account ──────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Account</h2>
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">{profile?.full_name ?? 'Your account'}</p>
              <p className="text-sm text-neutral-500 mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={14} />
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Usage ────────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Usage</h2>
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          {/* Personas */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-neutral-700">Personas</span>
              <span className="font-medium text-neutral-900">
                {personaCount} / {personaLimit === Infinity ? '∞' : personaLimit}
              </span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn('h-1.5 rounded-full transition-all', personaLimit !== Infinity && personaCount >= personaLimit ? 'bg-red-400' : 'bg-emerald-400')}
                style={{ width: personaLimit === Infinity ? '10%' : `${Math.min(100, (personaCount / personaLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Interviews */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-neutral-700">Interviews</span>
              <span className="font-medium text-neutral-900">
                {interviewCount} / {interviewLimit === Infinity ? '∞' : interviewLimit}
              </span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-emerald-400 rounded-full transition-all"
                style={{ width: interviewLimit === Infinity ? '10%' : `${Math.min(100, (interviewCount / interviewLimit) * 100)}%` }}
              />
            </div>
          </div>

          {personaLimit !== Infinity && personaCount >= personaLimit && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              You've reached your persona limit. Upgrade to create more.
            </p>
          )}
        </div>
      </section>

      {/* ── Current plan ─────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Current plan</h2>
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentPlanData && (
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <currentPlanData.icon size={16} className="text-emerald-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {currentPlanData?.name ?? 'Pulse'} plan
                </p>
                <p className="text-xs text-neutral-500">${currentPlanData?.price ?? 49}/month</p>
              </div>
            </div>
            {profile?.stripe_subscription_id && (
              <button
                onClick={handleManageBilling}
                disabled={openingPortal}
                className="flex items-center gap-1.5 text-sm text-neutral-500 border border-neutral-200 px-3 py-1.5 rounded-lg hover:border-neutral-300 hover:text-neutral-900 transition-colors"
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
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan
            const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan)
            const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentPlan)
            const isLoading = upgrading === plan.id
            const Icon = plan.icon

            return (
              <div
                key={plan.id}
                className={cn(
                  'bg-white rounded-xl p-5 flex flex-col',
                  plan.highlight && !isCurrent
                    ? 'border-2 border-emerald-400'
                    : 'border border-neutral-200',
                  isCurrent && 'border-neutral-900'
                )}
              >
                {/* Badge */}
                {plan.highlight && !isCurrent && (
                  <span className="self-start text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full mb-3">
                    Most popular
                  </span>
                )}
                {isCurrent && (
                  <span className="self-start text-[11px] font-medium bg-neutral-900 text-white px-2 py-0.5 rounded-full mb-3">
                    Current plan
                  </span>
                )}

                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={15} className="text-neutral-500" />
                  <h3 className="text-sm font-semibold text-neutral-900">{plan.name}</h3>
                </div>
                <p className="text-xs text-neutral-500 mb-3">{plan.tagline}</p>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-serif font-semibold text-neutral-900">${plan.price}</span>
                  <span className="text-xs text-neutral-400 ml-1">/month</span>
                </div>

                <hr className="border-neutral-100 mb-4" />

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-neutral-600">
                      <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => !isCurrent && handleUpgrade(plan.id)}
                  disabled={isCurrent || isLoading}
                  className={cn(
                    'w-full text-sm py-2 rounded-lg font-medium transition-colors',
                    isCurrent
                      ? 'bg-neutral-100 text-neutral-400 cursor-default'
                      : isUpgrade
                      ? 'bg-neutral-900 text-white hover:bg-neutral-700'
                      : 'border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
                  )}
                >
                  {isLoading ? 'Redirecting...'
                    : isCurrent ? 'Current plan'
                    : isUpgrade ? `Upgrade to ${plan.name}`
                    : `Switch to ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-neutral-400 mt-4 text-center">
          Cancel anytime. Billed monthly.
        </p>
      </section>
    </div>
  )
}
