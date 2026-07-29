'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Zap, Users, Building2, ExternalLink, LogOut, AlertCircle, Upload, X, Plus, CheckCircle2, Star, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { createClient } from '@/lib/supabase/client'
import type { Plan, IntegrationConnection, NotionIntegrationMetadata } from '@/types'
import { PLAN_LIMITS } from '@/types'

// ─── Accent color presets — a tasteful, professional spread for report branding ──

const ACCENT_PRESETS: { hex: string; name: string }[] = [
  { hex: '#18281c', name: 'Signal Forest' },
  { hex: '#516354', name: 'Sage' },
  { hex: '#2D3E31', name: 'Evergreen' },
  { hex: '#7e9080', name: 'Moss' },
]

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
      'Client-ready white-label report presentation',
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
  const [usageReady, setUsageReady] = useState(false)

  const [displayName, setDisplayName] = useState<string>(profile?.full_name ?? '')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(profile?.full_name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')

  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(profile?.brand_logo_url ?? null)
  const [brandColor, setBrandColor] = useState<string | null>(profile?.brand_color ?? null)
  const [colorDraft, setColorDraft] = useState(profile?.brand_color ?? HOME_COLORS.primary)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savingColor, setSavingColor] = useState(false)
  const [brandingError, setBrandingError] = useState('')

  // Personal saved-color lineup — up to 8, with up to 4 pinned as
  // favorites shown first. Purely a Settings convenience: the report page
  // always uses the single brand_color above, unchanged by any of this.
  const [palette, setPalette] = useState<string[]>(profile?.brand_palette ?? ACCENT_PRESETS.map(p => p.hex))
  const [favorites, setFavorites] = useState<string[]>(profile?.brand_favorites ?? [])
  const logoInputRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

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
    const timeout = window.setTimeout(() => setUsageReady(true), 180)
    return () => window.clearTimeout(timeout)
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
  const profileNameParts = displayName.trim().split(/\s+/).filter(Boolean)
  const profileInitials = profileNameParts.length >= 2
    ? `${profileNameParts[0][0]}${profileNameParts[profileNameParts.length - 1]?.[0]}`.toUpperCase()
    : (profileNameParts[0] ?? user?.email?.split('@')[0] ?? 'YR').slice(0, 2).toUpperCase()

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) { setNameError('Name cannot be empty'); return }
    setNameError('')
    setSavingName(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('profiles').update({ full_name: trimmed }).eq('id', user.id)
      if (error) { setNameError('Failed to save — please try again'); return }
      setDisplayName(trimmed)
      setEditingName(false)
    } catch {
      setNameError('Failed to save — please try again')
    } finally {
      setSavingName(false)
    }
  }

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

  const saveColor = async (hex: string) => {
    setBrandingError('')
    setSavingColor(true)
    try {
      const body = new FormData()
      body.append('color', hex)
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

  // Swatches are a one-click "choose and apply" action — no separate Save
  // step to discover. The hex field below still needs an explicit Save
  // since you're actively fine-tuning a value there.
  const handlePresetClick = (hex: string) => {
    setColorDraft(hex)
    saveColor(hex)
  }

  const handleSaveColor = () => saveColor(colorDraft)

  const persistPalette = async (next: string[]) => {
    setPalette(next)
    try {
      await fetch('/api/settings/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palette: next }),
      })
    } catch {
      setBrandingError('Failed to save your color lineup — please try again.')
    }
  }

  const persistFavorites = async (next: string[]) => {
    setFavorites(next)
    try {
      await fetch('/api/settings/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: next }),
      })
    } catch {
      setBrandingError('Failed to save your favorites — please try again.')
    }
  }

  const toggleFavorite = (e: React.MouseEvent, hex: string) => {
    e.stopPropagation()
    setBrandingError('')
    const isFavorite = favorites.some(c => c.toLowerCase() === hex.toLowerCase())
    if (isFavorite) {
      persistFavorites(favorites.filter(c => c.toLowerCase() !== hex.toLowerCase()))
      return
    }
    if (favorites.length >= 4) {
      setBrandingError('You can pin up to 4 favorites — unpin one first.')
      return
    }
    persistFavorites([...favorites, hex])
  }

  const removeFromPalette = (e: React.MouseEvent, hex: string) => {
    e.stopPropagation()
    setBrandingError('')
    persistPalette(palette.filter(c => c.toLowerCase() !== hex.toLowerCase()))
    // A removed color can't stay pinned, and if it was the active report
    // color there's nothing wrong with leaving it active (it's still a
    // valid hex, just no longer saved in the lineup) — only the two saved
    // lists need to drop it.
    if (favorites.some(c => c.toLowerCase() === hex.toLowerCase())) {
      persistFavorites(favorites.filter(c => c.toLowerCase() !== hex.toLowerCase()))
    }
  }

  // Fires once the native color picker popup closes (not on every drag
  // frame) — that "final choice" moment is what both applies the color to
  // the report and saves it into the personal lineup, capped at 8 with the
  // oldest evicted first.
  const handleCustomColorChosen = (hex: string) => {
    setColorDraft(hex)
    if (!palette.some(c => c.toLowerCase() === hex.toLowerCase())) {
      const next = [...palette, hex]
      if (next.length > 8) next.shift()
      persistPalette(next)
    }
    saveColor(hex)
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
      <div className="mx-auto flex max-w-[1400px] flex-col gap-20 px-4 py-12 sm:px-10 sm:py-16">
        <header className="flex flex-col items-start justify-between gap-8 pb-4 sm:flex-row sm:items-end sm:gap-12">
          <div>
            <h1 style={{ ...DISPLAY_LG_STYLE, fontSize: '40px', lineHeight: '48px', color: HOME_COLORS.onSurface }}>
              Account <span className="italic">Settings</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Manage your intelligence infrastructure and account access.</p>
          </div>
          {profile?.stripe_subscription_id && (
            <button onClick={handleManageBilling} disabled={openingPortal} className="inline-flex items-center justify-center gap-2 self-start rounded-full px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5 hover:shadow-lg sm:self-auto" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <ExternalLink size={14} />
              {openingPortal ? 'Opening billing...' : 'Manage billing'}
            </button>
          )}
          {!profile?.stripe_subscription_id && (
            <a href="#plans" className="inline-flex items-center justify-center self-start rounded-full px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5 hover:shadow-lg sm:self-auto" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
              Explore plans
            </a>
          )}
        </header>

        {billingError && (
          <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-8" style={{ background: '#FFDAD6', color: HOME_COLORS.error }}>
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{billingError}</p>
          </div>
        )}

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <section className="lg:col-span-5">
            <div className="h-full">
              <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Profile</p>
              <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border p-2 text-3xl font-semibold sm:h-32 sm:w-32" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}55`, color: HOME_COLORS.primary }}>
                    {profileInitials}
                  </div>
                  <div>
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={nameDraft}
                          onChange={e => setNameDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setNameDraft(displayName); setNameError('') } }}
                          maxLength={80}
                          className="rounded-lg px-2.5 py-1.5 text-xl outline-none"
                          style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}88`, color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}
                        />
                        <button onClick={handleSaveName} disabled={savingName} aria-label="Save name" className="flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-50" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>
                          <Check size={13} />
                        </button>
                        <button onClick={() => { setEditingName(false); setNameDraft(displayName); setNameError('') }} disabled={savingName} aria-label="Cancel" className="flex h-7 w-7 items-center justify-center rounded-full" style={{ color: HOME_COLORS.onSurfaceVariant, background: 'none', border: `1px solid ${HOME_COLORS.outlineVariant}88`, cursor: 'pointer' }}>
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center gap-2">
                        <p className="text-2xl" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>{displayName || 'Your account'}</p>
                        <button onClick={() => { setEditingName(true); setNameDraft(displayName) }} aria-label="Edit name" title="Edit name" className="opacity-0 transition-opacity group-hover:opacity-100" style={{ color: HOME_COLORS.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Pencil size={14} />
                        </button>
                      </div>
                    )}
                    {nameError && <p className="mt-1 text-xs" style={{ color: HOME_COLORS.error }}>{nameError}</p>}
                    <p className="mt-1 text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>{user?.email}</p>
                  </div>
                </div>
                <button onClick={handleSignOut} disabled={signingOut} className="inline-flex items-center gap-2 self-start py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-transform hover:translate-x-1 hover:text-red-600 sm:self-auto" style={{ color: HOME_COLORS.error, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <LogOut size={14} />
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
              <div className="hidden mt-6 grid-cols-1 gap-3 border-t pt-5 sm:grid-cols-2" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
                <div><p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace plan</p><p className="mt-1 text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{currentPlanData?.name ?? 'Free'}</p></div>
                <div><p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research workspace</p><p className="mt-1 text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Active and ready</p></div>
              </div>
            </div>
          </section>

        {/* ── Usage ────────────────────────────────────────────────────────── */}
        <section className="lg:col-span-7 lg:border-l lg:pl-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}44` }}>
          <div>
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Capacity</p>
              </div>
            </div>
            <div className="space-y-10">
            {/* Personas */}
            <div>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <span className="text-xl" style={{ color: HOME_COLORS.onSurface }}>AI Personas</span>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Compute allocation</p>
                </div>
                <span className="whitespace-nowrap text-3xl font-light" style={{ color: HOME_COLORS.onSurface }}>
                  {personaCount} / {personaLimit === Infinity ? '∞' : personaLimit}
                </span>
              </div>
              <div className="h-[2px] overflow-hidden rounded-full" style={{ background: HOME_COLORS.surfaceContainerHigh }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    background: personaLimit !== Infinity && personaCount >= personaLimit ? HOME_COLORS.error : HOME_COLORS.primary,
                    width: usageReady ? (personaLimit === Infinity ? '10%' : `${Math.min(100, (personaCount / personaLimit) * 100)}%`) : '0%',
                  }}
                />
              </div>
            </div>

            {/* Interviews */}
            <div>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <span className="text-xl" style={{ color: HOME_COLORS.onSurface }}>Active Interviews</span>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research volume</p>
                </div>
                <span className="whitespace-nowrap text-3xl font-light" style={{ color: HOME_COLORS.onSurface }}>
                  {interviewCount} / {interviewLimit === Infinity ? '∞' : interviewLimit}
                </span>
              </div>
              <div className="h-[2px] overflow-hidden rounded-full" style={{ background: HOME_COLORS.surfaceContainerHigh }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ background: HOME_COLORS.primary, width: usageReady ? (interviewLimit === Infinity ? '10%' : `${Math.min(100, (interviewCount / interviewLimit) * 100)}%`) : '0%' }}
                />
              </div>
            </div>

            </div>
            {personaLimit !== Infinity && personaCount >= personaLimit && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ color: HOME_COLORS.error, background: '#FFDAD6' }}>
                You&apos;ve reached your persona limit. Upgrade to create more.
              </p>
            )}
          </div>
        </section>

        {/* ── Current plan ─────────────────────────────────────────────────── */}
        <section className="hidden lg:col-span-4 lg:row-span-2">
          <div className="flex h-full flex-col rounded-[20px] p-6 sm:p-7" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimaryContainer }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">Current plan</p>
            <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {currentPlanData && (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ background: HOME_COLORS.secondaryContainer }}>
                    <currentPlanData.icon size={17} style={{ color: HOME_COLORS.primary }} />
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold">
                    {currentPlanData?.name ?? 'Free'}
                  </p>
                  <p className="text-xs opacity-70">
                    {currentPlanData && currentPlanData.price === 0 ? 'No cost' : `$${currentPlanData?.price ?? 0}/month`}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3 border-y py-5 text-sm" style={{ borderColor: `${HOME_COLORS.onPrimaryContainer}22` }}>
              <div className="flex justify-between gap-3"><span className="opacity-70">Personas</span><span className="font-semibold">{personaLimit === Infinity ? 'Unlimited' : `${personaLimit} included`}</span></div>
              <div className="flex justify-between gap-3"><span className="opacity-70">Interviews</span><span className="font-semibold">{interviewLimit === Infinity ? 'Unlimited' : `${interviewLimit} / month`}</span></div>
            </div>
            <p className="mt-5 text-sm leading-6 opacity-75">Your research tools, reports, and workspace access are all in one plan.</p>
            <div className="mt-auto pt-7">
              <a href="#plans" className="inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85" style={{ background: HOME_COLORS.onPrimaryContainer, color: HOME_COLORS.primaryContainer }}>Explore plans</a>
            </div>
          </div>
        </section>

        {/* ── White-label branding (Broadcast only) ──────────────────────────── */}
        {currentPlan === 'agency' && (
          <section className="border-t pt-12 lg:col-span-7" style={{ borderColor: `${HOME_COLORS.outlineVariant}44` }}>
            <div className="space-y-7">
              <div>
                <h2 className="text-[32px]" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.onSurface }}>Workspace identity</h2>
                <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: HOME_COLORS.onSurfaceVariant }}>Make every shared report feel like a finished client deliverable under your own identity.</p>
              </div>
              <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                Broadcast reports include a branded cover, decision brief, section navigation, research-scope panel, and confidential footer. Your logo and accent color bring that presentation to life on every shared report.
              </p>

              {brandingError && (
                <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ background: '#FFDAD6', color: HOME_COLORS.error }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{brandingError}</p>
                </div>
              )}

              <div className="grid gap-10 md:grid-cols-2 md:gap-12">
              {/* Logo */}
              <div className="space-y-6">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Platform logo</label>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="group relative flex aspect-[4/2] w-full flex-col items-center justify-center overflow-hidden rounded-lg border transition-all duration-300 hover:bg-[#f8f6f5] hover:shadow-sm"
                  style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}33`, cursor: 'pointer' }}
                >
                  {brandLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brandLogoUrl} alt="Your logo" className="absolute inset-0 h-full w-full object-contain p-5" />
                  )}
                  {!brandLogoUrl && <Upload size={32} className="mb-3 opacity-50 transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-70" style={{ color: HOME_COLORS.onSurfaceVariant }} />}
                  <span className="relative text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurface }}>{uploadingLogo ? 'Uploading identity...' : brandLogoUrl ? 'Replace identity' : 'Upload identity'}</span>
                </button>
                <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoSelect} />
                {brandLogoUrl && <button onClick={handleRemoveLogo} disabled={uploadingLogo} className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.error, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><X size={12} /> Remove logo</button>}
              </div>

              {/* Accent color */}
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Accent chroma</label>
                  <span className="text-[10px]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{palette.length} / 8 saved · {favorites.length} / 4 pinned</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[...favorites, ...palette.filter(c => !favorites.some(f => f.toLowerCase() === c.toLowerCase()))].map(hex => {
                    const active = colorDraft.toLowerCase() === hex.toLowerCase()
                    const isFavorite = favorites.some(c => c.toLowerCase() === hex.toLowerCase())
                    const preset = ACCENT_PRESETS.find(p => p.hex.toLowerCase() === hex.toLowerCase())
                    const name = preset?.name ?? hex.toUpperCase()
                    return (
                      <div key={hex} className="group relative">
                        <button
                          type="button"
                          onClick={() => handlePresetClick(hex)}
                          disabled={savingColor}
                          title={name}
                          aria-label={`Use ${name}`}
                          className={`h-10 w-10 rounded-full transition-transform hover:scale-110 disabled:opacity-60 ${active ? 'ring-2 ring-[#18281c] ring-offset-4 ring-offset-white' : ''}`}
                          style={{
                            background: hex,
                            border: active ? 'none' : `1px solid ${HOME_COLORS.outlineVariant}66`,
                            cursor: 'pointer',
                          }}
                        />
                        <button
                          type="button"
                          onClick={e => toggleFavorite(e, hex)}
                          aria-label={isFavorite ? `Unpin ${name}` : `Pin ${name} as a favorite`}
                          className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border transition-opacity ${isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          style={{ background: 'white', borderColor: HOME_COLORS.outlineVariant, color: isFavorite ? '#B8860B' : HOME_COLORS.onSurfaceVariant, cursor: 'pointer' }}
                        >
                          <Star size={11} fill={isFavorite ? '#B8860B' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={e => removeFromPalette(e, hex)}
                          aria-label={`Remove ${name} from your saved colors`}
                          title="Remove from saved colors"
                          className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ background: 'white', borderColor: HOME_COLORS.outlineVariant, color: HOME_COLORS.error, cursor: 'pointer' }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )
                  })}
                  <div className="relative h-10 w-10">
                    <button type="button" onClick={() => colorInputRef.current?.click()} aria-label="Choose a custom accent color" className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white" style={{ borderColor: HOME_COLORS.outlineVariant, color: HOME_COLORS.onSurfaceVariant, background: 'none', cursor: 'pointer' }}><Plus size={16} /></button>
                    {/* Kept in normal layout (not display:none) so the browser
                        has a real on-screen rect to anchor the native color
                        picker popup to — display:none elements have no box,
                        which is why the picker was opening at the page's
                        top-left corner instead of near this button. */}
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={colorDraft}
                      onChange={e => setColorDraft(e.target.value)}
                      onBlur={e => handleCustomColorChosen(e.target.value)}
                      className="absolute inset-0 h-10 w-10 cursor-pointer opacity-0"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <input
                    type="text"
                    value={colorDraft}
                    onChange={e => setColorDraft(e.target.value)}
                    placeholder="#1A2B3C"
                    className="w-28 rounded bg-transparent px-3 py-1 text-[13px] uppercase tracking-wider outline-none"
                    style={{ color: HOME_COLORS.onSurfaceVariant, background: HOME_COLORS.surfaceContainerLow, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
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
                <p className="text-[11px] mt-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Used across your shared report cover, decision brief, section navigation, confidence score, sentiment, and links.</p>
              </div>
            </div>
            </div>
          </section>
        )}

        {/* ── Integrations (Signal & Broadcast) ───────────────────────────────── */}
        {(currentPlan === 'pro' || currentPlan === 'agency') && (
          <section className="border-t pt-12 lg:col-span-5 lg:border-l lg:pl-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}44` }}>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Intelligence ecosystem</p>
              </div>
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
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/integrations/slack.svg" alt="Slack" className="h-6 w-6" />
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
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/integrations/notion.svg" alt="Notion" className="h-6 w-6" />
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
        </div>
        <section id="plans" className="border-t pt-16 sm:pt-20" style={{ borderColor: `${HOME_COLORS.outlineVariant}44` }}>
          <p className="mb-10 text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Scale your research capabilities as your team grows.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map(plan => {
              const isCurrent = plan.id === currentPlan
              const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan)
              const isLoading = upgrading === plan.id
              const Icon = plan.icon

              return (
                <div
                  key={plan.id}
                  className="flex flex-col rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: isCurrent ? HOME_COLORS.primaryContainer : HOME_COLORS.surfaceContainerLow,
                    boxShadow: isCurrent ? '0 24px 48px -20px rgba(24, 40, 28, 0.28)' : 'none',
                    border: isCurrent ? `1px solid ${HOME_COLORS.primaryContainer}` : `1px solid ${HOME_COLORS.outlineVariant}22`,
                  }}
                >
                  {/* Badge */}
                  {plan.highlight && !isCurrent && (
                    <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}>
                      Most popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="self-start text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1.5 rounded-full mb-6" style={{ background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed }}>
                      Current plan
                    </span>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={15} style={{ color: isCurrent ? HOME_COLORS.primaryFixed : HOME_COLORS.onSurfaceVariant }} />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: isCurrent ? HOME_COLORS.onPrimary : HOME_COLORS.onSurface }}>{plan.name}</h3>
                  </div>
                  <p className="text-xs mb-8 italic" style={{ color: isCurrent ? HOME_COLORS.primaryFixed : HOME_COLORS.onSurfaceVariant }}>{plan.tagline}</p>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <span className="text-4xl leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: isCurrent ? HOME_COLORS.onPrimary : HOME_COLORS.onSurface }}>Free</span>
                    ) : (
                      <>
                        <span className="text-4xl leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: isCurrent ? HOME_COLORS.onPrimary : HOME_COLORS.onSurface }}>${plan.price}</span>
                        <span className="text-xs ml-1" style={{ color: isCurrent ? HOME_COLORS.primaryFixed : HOME_COLORS.onSurfaceVariant }}>/month</span>
                      </>
                    )}
                  </div>

                  <hr className="mb-6" style={{ border: 'none', borderTop: `1px solid ${isCurrent ? `${HOME_COLORS.primaryFixed}33` : `${HOME_COLORS.outlineVariant}33`}` }} />

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-10">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-xs" style={{ color: isCurrent ? HOME_COLORS.onPrimary : HOME_COLORS.onSurfaceVariant }}>
                        <Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: isCurrent ? HOME_COLORS.primaryFixed : HOME_COLORS.primary }} strokeWidth={2.5} />
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
                      'w-full rounded-full py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-200',
                      isCurrent
                        ? 'cursor-default'
                        : isUpgrade
                        ? 'cursor-pointer hover:-translate-y-0.5 hover:brightness-95 hover:shadow-md'
                        : 'cursor-pointer hover:-translate-y-0.5 hover:bg-[#d8cfcf] hover:shadow-sm'
                    )}
                    style={
                      isCurrent
                        ? { background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed, border: 'none' }
                        : isUpgrade
                        ? { background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none' }
                        : { color: HOME_COLORS.onSurfaceVariant, border: `1px solid ${HOME_COLORS.outlineVariant}66` }
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
