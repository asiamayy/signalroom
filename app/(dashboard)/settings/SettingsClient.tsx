'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Zap, Users, Building2, ExternalLink, LogOut, AlertCircle, Upload, X, MessageSquare, FileText, CheckCircle2 } from 'lucide-react'
import { cn, CARD_SHADOW } from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { createClient } from '@/lib/supabase/client'
import type { Plan, IntegrationConnection, NotionIntegrationMetadata } from '@/types'
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
      '3 active research projects',
      '10 AI customer personas',
      'Core simulation dialogue templates',
      'Automated intelligence summaries',
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
      'Unlimited research projects',
      'Up to 50 AI customer personas',
      '100 interviews per month',
      'Executive-ready research reports',
      'Multi-persona comparative analysis',
      'Advanced insight synthesis',
      'Slack & Notion integrations',
    ],
  },
  {
    id: 'agency',
    name: 'Broadcast',
    tagline: 'For agencies and growing teams',
    price: 999,
    icon: Building2,
    features: [
      'Unlimited AI customer personas',
      'Unlimited interviews',
      'Everything in Signal',
      '10 collaborative team seats',
      'White-label executive reports',
      'Slack & Notion integrations',
      'Priority feature access and support',
    ],
  },
]

interface SettingsClientProps {
  profile: any
  user: any
  personaCount: number
  interviewCount: number
  integrations: IntegrationConnection[]
}

export default function SettingsClient({ profile, user, personaCount, interviewCount, integrations }: SettingsClientProps) {
  const router = useRouter()
  const [upgrading, setUpgrading] = useState<Plan | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [billingError, setBillingError] = useState('')

  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(profile?.brand_logo_url ?? null)
  const [brandColor, setBrandColor] = useState<string | null>(profile?.brand_color ?? null)
  const [colorDraft, setColorDraft] = useState(profile?.brand_color ?? HOME_COLORS.primary)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savingColor, setSavingColor] = useState(false)
  const [brandingError, setBrandingError] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [integrationsList, setIntegrationsList] = useState<IntegrationConnection[]>(integrations)
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null)
  const [notionPages, setNotionPages] = useState<{ id: string; title: string }[] | null>(null)
  const [loadingNotionPages, setLoadingNotionPages] = useState(false)
  const [savingNotionPage, setSavingNotionPage] = useState(false)
  const [integrationsError, setIntegrationsError] = useState('')
  // Read once on mount, client-side only — avoids useSearchParams' Suspense
  // boundary requirement for a one-time banner that doesn't need SSR access.
  const [integrationsBanner, setIntegrationsBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const slackIntegration = integrationsList.find(i => i.provider === 'slack')
  const notionIntegration = integrationsList.find(i => i.provider === 'notion')
  const notionMetadata = notionIntegration?.metadata as NotionIntegrationMetadata | undefined

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('slack') === 'connected') setIntegrationsBanner({ type: 'success', text: 'Slack connected.' })
    else if (params.get('notion') === 'connected') setIntegrationsBanner({ type: 'success', text: 'Notion connected.' })
    else if (params.get('integration_error') === 'plan') setIntegrationsBanner({ type: 'error', text: 'Integrations require the Signal plan or above.' })
    else if (params.get('integration_error')) setIntegrationsBanner({ type: 'error', text: 'Something went wrong connecting that integration — please try again.' })
  }, [])

  useEffect(() => {
    if (notionIntegration && !notionMetadata?.parent_page_id && notionPages === null && !loadingNotionPages) {
      setLoadingNotionPages(true)
      fetch('/api/integrations/notion/pages')
        .then(res => res.json())
        .then(json => setNotionPages(json.data ?? []))
        .catch(() => setIntegrationsError('Failed to load Notion pages — please try again.'))
        .finally(() => setLoadingNotionPages(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notionIntegration, notionMetadata?.parent_page_id])

  const handleDisconnect = async (provider: 'slack' | 'notion') => {
    setIntegrationsError('')
    setDisconnectingProvider(provider)
    try {
      const res = await fetch(`/api/integrations/${provider}/disconnect`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        setIntegrationsError(json.error ?? `Failed to disconnect ${provider}`)
        return
      }
      setIntegrationsList(list => list.filter(i => i.provider !== provider))
      if (provider === 'notion') setNotionPages(null)
    } catch {
      setIntegrationsError(`Failed to disconnect ${provider} — please try again.`)
    } finally {
      setDisconnectingProvider(null)
    }
  }

  const handleSelectNotionPage = async (pageId: string, pageTitle: string) => {
    setIntegrationsError('')
    setSavingNotionPage(true)
    try {
      const res = await fetch('/api/integrations/notion/select-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId, page_title: pageTitle }),
      })
      const json = await res.json()
      if (!res.ok) { setIntegrationsError(json.error ?? 'Failed to save destination page'); return }
      setIntegrationsList(list => list.map(i => i.provider === 'notion' ? { ...i, metadata: json.data } : i))
    } catch {
      setIntegrationsError('Failed to save destination page — please try again.')
    } finally {
      setSavingNotionPage(false)
    }
  }

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
      console.error('Stripe checkout did not return a url:', res.status, json)
      setBillingError(json.error ?? `Failed to start checkout (status ${res.status}) — please try again.`)
    } catch (e) {
      console.error('Stripe checkout request failed:', e)
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
      console.error('Stripe portal did not return a url:', res.status, json)
      setBillingError(json.error ?? `Failed to open billing portal (status ${res.status}) — please try again.`)
    } catch (e) {
      console.error('Stripe portal request failed:', e)
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

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBrandingError('')
    setUploadingLogo(true)
    try {
      const body = new FormData()
      body.append('logo', file)
      const res = await fetch('/api/settings/branding', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) { setBrandingError(json.error ?? 'Failed to upload logo'); return }
      setBrandLogoUrl(json.data.brand_logo_url)
    } catch {
      setBrandingError('Failed to upload logo — please try again.')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    setBrandingError('')
    setUploadingLogo(true)
    try {
      await fetch('/api/settings/branding', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'logo' }),
      })
      setBrandLogoUrl(null)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSaveColor = async () => {
    setBrandingError('')
    setSavingColor(true)
    try {
      const body = new FormData()
      body.append('color', colorDraft)
      const res = await fetch('/api/settings/branding', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) { setBrandingError(json.error ?? 'Failed to save color'); return }
      setBrandColor(json.data.brand_color)
    } catch {
      setBrandingError('Failed to save color — please try again.')
    } finally {
      setSavingColor(false)
    }
  }

  const handleResetColor = async () => {
    setBrandingError('')
    setSavingColor(true)
    try {
      await fetch('/api/settings/branding', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'color' }),
      })
      setBrandColor(null)
      setColorDraft(HOME_COLORS.primary)
    } finally {
      setSavingColor(false)
    }
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

        {/* ── White-label branding (Broadcast only) ──────────────────────────── */}
        {currentPlan === 'agency' && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>White-label branding</h2>
            <div className="rounded-2xl p-5 space-y-5" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
              <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                Shared report links already hide SignalRoom&apos;s branding for your account. Add your own logo and accent color so they read as your agency&apos;s deliverable.
              </p>

              {brandingError && (
                <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ background: '#FFDAD6', color: HOME_COLORS.error }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{brandingError}</p>
                </div>
              )}

              {/* Logo */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: HOME_COLORS.onSurface }}>Logo</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: HOME_COLORS.surfaceContainer, border: `1px solid ${HOME_COLORS.outlineVariant}66` }}
                  >
                    {brandLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brandLogoUrl} alt="Your logo" className="w-full h-full object-contain" />
                    ) : (
                      <Upload size={16} style={{ color: HOME_COLORS.onSurfaceVariant }} />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-black/[0.03]"
                      style={{ color: HOME_COLORS.onSurfaceVariant, border: `1px solid ${HOME_COLORS.outlineVariant}66`, background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {uploadingLogo ? 'Uploading...' : brandLogoUrl ? 'Replace logo' : 'Upload logo'}
                    </button>
                    {brandLogoUrl && (
                      <button
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                        className="flex items-center gap-1 text-xs transition-colors hover:text-red-600"
                        style={{ color: HOME_COLORS.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <X size={11} /> Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />
                </div>
                <p className="text-[11px] mt-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>PNG, JPEG, WebP, or SVG. Up to 2MB.</p>
              </div>

              <hr style={{ border: 'none', borderTop: `1px solid ${HOME_COLORS.outlineVariant}33` }} />

              {/* Accent color */}
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: HOME_COLORS.onSurface }}>Accent color</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="color"
                    value={colorDraft}
                    onChange={e => setColorDraft(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                    style={{ border: `1px solid ${HOME_COLORS.outlineVariant}66`, padding: 0, background: 'none' }}
                  />
                  <input
                    type="text"
                    value={colorDraft}
                    onChange={e => setColorDraft(e.target.value)}
                    placeholder="#1A2B3C"
                    className="text-sm px-3 py-2 rounded-lg w-32"
                    style={{ border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface, background: 'none', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={handleSaveColor}
                    disabled={savingColor || colorDraft === brandColor}
                    className="text-xs font-semibold px-3 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {savingColor ? 'Saving...' : 'Save'}
                  </button>
                  {brandColor && (
                    <button
                      onClick={handleResetColor}
                      disabled={savingColor}
                      className="text-xs transition-colors hover:text-red-600"
                      style={{ color: HOME_COLORS.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Reset to default
                    </button>
                  )}
                </div>
                <p className="text-[11px] mt-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Used for the confidence score, sentiment, and links on your shared report pages.</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Integrations (Signal & Broadcast) ───────────────────────────────── */}
        {(currentPlan === 'pro' || currentPlan === 'agency') && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>Integrations</h2>
            <div className="rounded-2xl p-5 space-y-5" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
              <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                Push new reports and signals automatically to where your team already works.
              </p>

              {integrationsBanner && (
                <div
                  className="flex items-start gap-2 rounded-xl px-4 py-3"
                  style={integrationsBanner.type === 'success'
                    ? { background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }
                    : { background: '#FFDAD6', color: HOME_COLORS.error }}
                >
                  {integrationsBanner.type === 'success' ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />}
                  <p className="text-sm">{integrationsBanner.text}</p>
                </div>
              )}

              {integrationsError && (
                <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ background: '#FFDAD6', color: HOME_COLORS.error }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{integrationsError}</p>
                </div>
              )}

              {/* Slack */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: HOME_COLORS.secondaryContainer }}>
                    <MessageSquare size={16} style={{ color: HOME_COLORS.primary }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Slack</p>
                    <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                      {slackIntegration ? slackIntegration.display_name : 'New reports and signals post here automatically.'}
                    </p>
                  </div>
                </div>
                {slackIntegration ? (
                  <button
                    onClick={() => handleDisconnect('slack')}
                    disabled={disconnectingProvider === 'slack'}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-black/[0.03]"
                    style={{ color: HOME_COLORS.onSurfaceVariant, border: `1px solid ${HOME_COLORS.outlineVariant}66`, background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {disconnectingProvider === 'slack' ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <a
                    href="/api/integrations/slack/authorize"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
                    style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}
                  >
                    Connect
                  </a>
                )}
              </div>

              <hr style={{ border: 'none', borderTop: `1px solid ${HOME_COLORS.outlineVariant}33` }} />

              {/* Notion */}
              <div>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: HOME_COLORS.secondaryContainer }}>
                      <FileText size={16} style={{ color: HOME_COLORS.primary }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Notion</p>
                      <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                        {notionIntegration ? notionIntegration.display_name : 'New reports are added as pages automatically.'}
                      </p>
                    </div>
                  </div>
                  {notionIntegration ? (
                    <button
                      onClick={() => handleDisconnect('notion')}
                      disabled={disconnectingProvider === 'notion'}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-black/[0.03]"
                      style={{ color: HOME_COLORS.onSurfaceVariant, border: `1px solid ${HOME_COLORS.outlineVariant}66`, background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {disconnectingProvider === 'notion' ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  ) : (
                    <a
                      href="/api/integrations/notion/authorize"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90"
                      style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}
                    >
                      Connect
                    </a>
                  )}
                </div>

                {notionIntegration && !notionMetadata?.parent_page_id && (
                  <div className="mt-3 pl-12">
                    {loadingNotionPages ? (
                      <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Loading your Notion pages...</p>
                    ) : notionPages && notionPages.length > 0 ? (
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>Choose a destination page for new reports:</p>
                        <select
                          disabled={savingNotionPage}
                          defaultValue=""
                          onChange={e => {
                            const page = notionPages.find(p => p.id === e.target.value)
                            if (page) handleSelectNotionPage(page.id, page.title)
                          }}
                          className="text-sm px-3 py-2 rounded-lg w-full max-w-xs"
                          style={{ border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface, background: 'none', fontFamily: 'inherit' }}
                        >
                          <option value="" disabled>Select a page...</option>
                          {notionPages.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                    ) : notionPages ? (
                      <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>No pages were shared with SignalRoom during setup — reconnect Notion and share at least one page.</p>
                    ) : null}
                  </div>
                )}

                {notionIntegration && notionMetadata?.parent_page_id && (
                  <p className="text-xs mt-2 pl-12" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                    Reports post into: <span className="font-semibold">{notionMetadata.parent_page_title ?? 'Selected page'}</span>
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

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
