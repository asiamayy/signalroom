'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Plus, X, Trash2, Loader2, Lock, Crown, ShieldCheck, Users, Verified,
  FileText, MessagesSquare, ArrowRight, UserPlus,
} from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import type { Plan, Workspace, WorkspaceMember, WorkspaceInvite, Persona, Interview, Report } from '@/types'

// Dark glass-morphism system, ported from the approved design mock —
// distinct from the light HOME_COLORS surfaces the rest of the dashboard
// uses, scoped to just this page.
const DARK_BG = '#18281c'
const gridBackground = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
  backgroundSize: '80px 80px',
}
const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(24px)',
  border: '0.5px solid rgba(255,255,255,0.1)',
}
const glassActive: React.CSSProperties = {
  background: 'rgba(252,249,248,0.06)',
  backdropFilter: 'blur(16px)',
  border: '0.5px solid rgba(255,255,255,0.15)',
}

type ContentTab = 'personas' | 'interviews' | 'reports'

export function WorkspacesClient() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [allSeats, setAllSeats] = useState<Set<string>>(new Set())

  // Real content scoped to the selected workspace.
  const [workspacePersonas, setWorkspacePersonas] = useState<Persona[]>([])
  const [workspaceInterviews, setWorkspaceInterviews] = useState<(Interview & { persona: Persona })[]>([])
  const [workspaceReports, setWorkspaceReports] = useState<(Report & { interview: Interview })[]>([])
  const [loadingContent, setLoadingContent] = useState(false)
  const [contentTab, setContentTab] = useState<ContentTab>('personas')

  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitingOpen, setInvitingOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoadingPlan(false); return }
      setCurrentUserId(data.user.id)
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', data.user.id).single()
      setPlan((profile?.plan ?? 'free') as Plan)
      setLoadingPlan(false)
    })
  }, [])

  const loadWorkspaces = async () => {
    setLoadingWorkspaces(true)
    const res = await fetch('/api/workspaces')
    const json = await res.json()
    const ws: Workspace[] = json.data ?? []
    setWorkspaces(ws)
    setLoadingWorkspaces(false)
    setSelectedId(prev => prev ?? ws[0]?.id ?? null)

    const seatSet = new Set<string>()
    await Promise.all(ws.map(async (w) => {
      const r = await fetch(`/api/workspaces/${w.id}/members`)
      const j = await r.json()
      ;(j.data ?? []).forEach((m: WorkspaceMember) => seatSet.add(m.id))
    }))
    setAllSeats(seatSet)
  }

  useEffect(() => {
    // Always load, regardless of the viewer's own plan — a Free/Pro member
    // can be invited into someone else's Broadcast workspace, and access to
    // what you've been added to was never supposed to require your own
    // Broadcast subscription. GET /api/workspaces already scopes correctly
    // to owner-or-member via RLS; the old `plan === 'agency'` guard here
    // just blocked members from ever finding out they had access at all.
    if (!loadingPlan) loadWorkspaces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingPlan])

  const loadDetail = async (workspaceId: string) => {
    setLoadingDetail(true)
    setLoadingContent(true)
    const supabase = createClient()
    const [mRes, iRes, personasRes, interviewsRes, reportsRes] = await Promise.all([
      fetch(`/api/workspaces/${workspaceId}/members`),
      fetch(`/api/workspaces/${workspaceId}/invites`),
      supabase.from('personas').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
      supabase.from('interviews').select('*, persona:personas(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
      supabase.from('reports').select('*, interview:interviews(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
    ])
    const mJson = await mRes.json()
    const iJson = await iRes.json()
    setMembers(mJson.data ?? [])
    setInvites(iJson.data ?? [])
    setWorkspacePersonas(personasRes.data ?? [])
    setWorkspaceInterviews((interviewsRes.data ?? []) as (Interview & { persona: Persona })[])
    setWorkspaceReports((reportsRes.data ?? []) as (Report & { interview: Interview })[])
    setLoadingDetail(false)
    setLoadingContent(false)
  }

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
  }, [selectedId])

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to create workspace'); return }
      setNewWorkspaceName('')
      setShowCreatePanel(false)
      setSelectedId(json.data.id)
      await loadWorkspaces()
    } catch {
      setError('Something went wrong — please try again')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm('Delete this workspace? Members lose access immediately. Personas, interviews, and reports inside it become personal to whoever created them — nothing is deleted.')) return
    await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
    if (selectedId === id) setSelectedId(null)
    await loadWorkspaces()
  }

  const handleInvite = async () => {
    if (!selectedId || !inviteEmail.trim()) return
    setInviting(true)
    setError('')
    try {
      const res = await fetch(`/api/workspaces/${selectedId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to send invite'); return }
      setInviteEmail('')
      setInvitingOpen(false)
      await loadDetail(selectedId)
    } catch {
      setError('Something went wrong — please try again')
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!selectedId) return
    await fetch(`/api/workspaces/${selectedId}/invites`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: inviteId }),
    })
    await loadDetail(selectedId)
  }

  const handleRemoveMember = async (userId: string) => {
    if (!selectedId) return
    await fetch(`/api/workspaces/${selectedId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    await loadDetail(selectedId)
    await loadWorkspaces()
  }

  const seatLimit = PLAN_LIMITS.agency.team_seats
  const selectedWorkspace = workspaces.find(w => w.id === selectedId)
  const isOwnerOfSelected = members.some(m => m.id === currentUserId && m.role === 'owner')

  if (loadingPlan || loadingWorkspaces) {
    return <div className="min-h-full" style={{ background: DARK_BG }} />
  }

  // Broadcast is what lets you *create* workspaces and pay for the seats —
  // but being invited into someone else's workspace has never required a
  // Broadcast subscription of your own. GET /api/workspaces already scopes
  // to owner-or-member via RLS, so if this list isn't empty, the viewer
  // belongs somewhere regardless of their own plan.
  const hasAccess = plan === 'agency' || workspaces.length > 0

  if (!hasAccess) {
    return (
      <div style={{ background: DARK_BG, fontFamily: HOME_FONT_BODY, ...gridBackground }} className="min-h-full p-6 sm:p-10 flex items-center justify-center">
        <div className="rounded-2xl p-8 sm:p-10 text-center max-w-md" style={glass}>
          <div className="w-11 h-11 rounded-xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Lock size={18} style={{ color: HOME_COLORS.primaryFixedDim }} />
          </div>
          <h1 className="text-xl mb-2" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: 'white' }}>Workspaces</h1>
          <p className="text-xs mb-2" style={{ color: HOME_COLORS.primaryFixedDim }}>Broadcast plan required</p>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Create up to {seatLimit} team seats across isolated workspaces — one per client, or however you want to split your research. Each member gets full create/edit access, scoped to just what you share with them.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-full transition-opacity hover:opacity-90"
            style={{ background: HOME_COLORS.primaryFixedDim, color: '#18281c' }}
          >
            Upgrade plan →
          </Link>
        </div>
      </div>
    )
  }

  const realPersonaCount = workspacePersonas.length
  const realInterviewCount = workspaceInterviews.length
  const realReportCount = workspaceReports.length

  return (
      <div className="min-h-full" style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY, backgroundImage: 'linear-gradient(rgba(24,40,28,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(24,40,28,0.045) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <main className="mx-auto max-w-[1440px] px-4 pb-14 sm:px-10">
          <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="flex flex-col justify-between gap-6 pb-8 pt-8 xl:flex-row xl:items-end xl:gap-10 sm:pt-10">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-3"><span className="h-px w-12" style={{ background: `${HOME_COLORS.primary}33` }} /><span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Isolated Research Workspaces</span></div>
              <h1 className="mb-4" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.primary }}>Workspaces</h1>
              <p className="max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                Dedicated environments for client and brand research. Invite your team and each member sees only what they&apos;ve been added to.
              </p>
            </div>
            <div className="flex flex-col gap-4 border-l py-1 pl-6 sm:pl-8" style={{ borderColor: `${HOME_COLORS.primary}1a` }}>
              <div>
                <span className="block text-3xl font-light leading-none" style={{ color: HOME_COLORS.primary }}>{workspaces.length || '0'}</span>
                <span className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: `${HOME_COLORS.primary}66` }}>Active workspaces</span>
              </div>
              {/* Creating a workspace is a Broadcast-subscriber action, not
                  tied to any specific workspace — gated by the viewer's own
                  plan, unlike everything else below which is gated by
                  membership/ownership of the selected workspace. */}
              {plan === 'agency' && (
                <button onClick={() => setShowCreatePanel(v => !v)} className="group relative inline-flex items-center gap-1.5 self-start rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-300 ease-out hover:pr-7 hover:shadow-lg active:scale-95" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>
                  <Plus size={13} /> Initiate Workspace <ArrowRight size={12} className="absolute right-2.5 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100" />
                </button>
              )}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="relative mb-9 min-h-[220px] overflow-hidden rounded-[1.5rem] p-6 shadow-[0_18px_30px_-20px_rgba(24,40,28,0.5)] sm:min-h-[280px] sm:p-8" style={{ background: HOME_COLORS.primary }}>
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <svg className="h-full w-full" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <path d="M50,450 L950,450 M50,50 L50,450" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
                <path d="M100,380 Q300,320 400,390 T700,350 T900,410" fill="none" stroke={HOME_COLORS.primaryFixed} strokeWidth="1.5" strokeDasharray="8 10"><animate attributeName="stroke-dashoffset" dur="4s" repeatCount="indefinite" values="0;-72" /></path>
                <circle cx="400" cy="390" fill={HOME_COLORS.primaryFixed} r="5"><animate attributeName="r" dur="3s" repeatCount="indefinite" values="5;10;5" /></circle>
                <circle cx="700" cy="350" fill="white" r="4" opacity="0.6" />
              </svg>
            </div>
            <div className="relative z-10 flex flex-col justify-between gap-10 lg:flex-row lg:items-start">
              <div>
                <span className="mb-3 inline-block rounded-full bg-white/10 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.primaryFixed }}>Workspace activity</span>
                <h2 className="text-2xl leading-tight text-white sm:text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>Workspace Activity <br /><span className="italic font-normal text-white/45">Research Overview</span></h2>
              </div>
              <div className="min-w-0 rounded-2xl border p-5 sm:min-w-[260px]" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(18px)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="text-[8px] font-bold uppercase tracking-[0.22em] text-white/35">In this workspace</span>
                <div className="mt-5 space-y-4 text-[11px] text-white">
                  <MetricLine label="Personas" value={`${realPersonaCount} active`} percent={Math.min(100, Math.max(8, realPersonaCount * 12))} />
                  <MetricLine label="Interviews" value={`${realInterviewCount} tracked`} percent={Math.min(100, Math.max(8, realInterviewCount * 12))} />
                  <MetricLine label="Reports" value={`${realReportCount} synthesized`} percent={Math.min(100, Math.max(8, realReportCount * 12))} />
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-6 flex flex-wrap items-center gap-4 text-[8px] font-bold uppercase tracking-[0.18em] text-white/40 sm:mt-8">
              <div className="flex -space-x-3">
                {members.slice(0, 4).map(m => <div key={m.id} className="h-9 w-9 rounded-full border-2" style={{ borderColor: HOME_COLORS.primary }}><PersonaAvatar avatarUrl={m.avatar_url} avatarInitials={getInitials(m.full_name || m.email)} avatarColor={getAvatarColor(m.full_name || m.email)} name={m.full_name ?? m.email} size="sm" /></div>)}
                {members.length > 4 && <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-[9px]" style={{ borderColor: HOME_COLORS.primary, background: `${HOME_COLORS.primaryFixed}33`, color: HOME_COLORS.primaryFixed }}>+{members.length - 4}</div>}
              </div>
              <span>{members.length > 0 ? `${members.length} team members with access` : 'Ready for your research team'}</span>
            </div>
          </motion.section>

          <AnimatePresence>
            {showCreatePanel && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mb-10 rounded-2xl border p-4 sm:p-5" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}55` }}>
                <div className="flex flex-wrap items-center gap-3">
                  <input autoFocus value={newWorkspaceName} onChange={e => setNewWorkspaceName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="Name this workspace — e.g. a client or brand" maxLength={120} className="min-w-[220px] flex-1 bg-transparent px-3 py-2 text-sm outline-none" style={{ color: HOME_COLORS.onSurface }} />
                  <button onClick={handleCreate} disabled={creating || !newWorkspaceName.trim()} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>{creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create workspace</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {error && <p className="mb-8 rounded-xl px-4 py-3 text-sm" style={{ background: '#ffdad6', color: HOME_COLORS.error }}>{error}</p>}

          <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="mb-10">
            <div className="mb-5 flex items-center justify-between gap-6">
              <h2 className="text-lg sm:text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Active <span className="italic font-normal">Environments</span></h2>
              <span className="rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: `${HOME_COLORS.outlineVariant}88`, color: HOME_COLORS.onSurfaceVariant }}>{allSeats.size} / {seatLimit} seats in use</span>
            </div>
            {loadingWorkspaces ? <div className="h-72 animate-pulse rounded-[2rem]" style={{ background: HOME_COLORS.surfaceContainerLow }} /> : workspaces.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed px-6 py-20 text-center" style={{ borderColor: HOME_COLORS.outlineVariant, background: HOME_COLORS.surfaceContainerLow }}><Building2 size={26} className="mx-auto mb-4" style={{ color: HOME_COLORS.primary }} /><p style={{ color: HOME_COLORS.onSurfaceVariant }}>No workspaces yet — create one to invite your team.</p></div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                {workspaces.map((workspace, index) => {
                  const selected = workspace.id === selectedId
                  const darkTile = selected
                  return <button key={workspace.id} onClick={() => setSelectedId(workspace.id)} className={`group text-left transition-all duration-500 ${index === 0 ? 'md:col-span-7' : 'md:col-span-5'}`} style={{ cursor: 'pointer', border: 'none', background: 'none' }}>
                    <div className={`relative flex min-h-[190px] h-full flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 transition-all duration-700 sm:min-h-[230px] sm:p-7 ${darkTile ? 'hover:-translate-y-2 hover:shadow-[0_22px_38px_-20px_rgba(24,40,28,0.5)]' : 'hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_32px_-22px_rgba(24,40,28,0.35)]'}`} style={darkTile ? { background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: '0 12px 26px -18px rgba(24,40,28,0.32)' } : { background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.primary, border: `1px solid ${HOME_COLORS.outlineVariant}22` }}>
                      {darkTile && <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-opacity duration-700 group-hover:opacity-100" style={{ background: `${HOME_COLORS.primaryFixed}1f`, opacity: 0.45 }} />}
                      <div>
                        <div className="mb-7 flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: darkTile ? 'rgba(255,255,255,0.1)' : HOME_COLORS.primary, color: darkTile ? HOME_COLORS.primaryFixed : HOME_COLORS.onPrimary }}><Building2 size={22} /></div><span className="rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ background: darkTile ? `${HOME_COLORS.primaryFixed}22` : `${HOME_COLORS.primary}0d`, color: darkTile ? HOME_COLORS.primaryFixed : HOME_COLORS.primary }}>{selected ? 'Active workspace' : 'Workspace'}</span></div>
                        <h3 className="text-2xl sm:text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{workspace.name}</h3>
                        <p className="mt-4 max-w-md text-sm leading-6" style={{ color: darkTile ? 'rgba(255,255,255,0.55)' : HOME_COLORS.onSurfaceVariant }}>A focused space for your team’s shared personas, interviews, and reports.</p>
                      </div>
                      <div className="flex items-end justify-between border-t pt-6" style={{ borderColor: darkTile ? 'rgba(255,255,255,0.1)' : `${HOME_COLORS.primary}12` }}><div className="flex gap-8"><WorkspaceStat value={selected ? realPersonaCount : '—'} label="Personas" /><WorkspaceStat value={selected ? realInterviewCount : '—'} label="Interviews" /></div><span className="flex h-9 w-9 items-center justify-center rounded-full transition-colors" style={{ background: darkTile ? HOME_COLORS.primaryFixed : HOME_COLORS.primary, color: darkTile ? HOME_COLORS.onPrimaryFixed : HOME_COLORS.onPrimary }}><ArrowRight size={15} /></span></div>
                    </div>
                  </button>
                })}
                <Link href="/reports" className="group rounded-[1.25rem] p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_30px_-24px_rgba(24,40,28,0.35)] md:col-span-4" style={{ background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.primary, border: `1px solid ${HOME_COLORS.outlineVariant}22` }}>
                  <span className="block text-[8px] font-semibold uppercase tracking-[0.22em] opacity-45">Shared research</span>
                  <div className="mt-5 flex items-end justify-between"><div><h3 className="text-base" style={{ fontFamily: HOME_FONT_DISPLAY }}>Workspace Content</h3><p className="mt-1 text-[9px] opacity-45">{realPersonaCount + realInterviewCount + realReportCount} shared research items.</p></div><FileText size={20} className="opacity-30" /></div>
                </Link>
                <button type="button" onClick={() => setInvitingOpen(true)} className="group rounded-[1.25rem] p-5 text-left transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_30px_-24px_rgba(24,40,28,0.35)] md:col-span-4" style={{ background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.primary, border: `1px solid ${HOME_COLORS.outlineVariant}22`, cursor: 'pointer' }}>
                  <span className="block text-[8px] font-semibold uppercase tracking-[0.22em] opacity-45">Workspace members</span>
                  <div className="mt-4 flex items-center gap-3">{members[0] ? <div className="h-10 w-10 overflow-hidden rounded-xl"><PersonaAvatar avatarUrl={members[0].avatar_url} avatarInitials={getInitials(members[0].full_name || members[0].email)} avatarColor={getAvatarColor(members[0].full_name || members[0].email)} name={members[0].full_name ?? members[0].email} size="sm" shape="square" /></div> : <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${HOME_COLORS.primary}12` }}><Users size={16} /></div>}<div className="min-w-0"><h3 className="truncate text-sm" style={{ fontFamily: HOME_FONT_DISPLAY }}>{members[0]?.full_name || members[0]?.email || 'Invite your team'}</h3><p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] opacity-45">{members.length ? `${members.length} members with access` : 'Add a member'}</p></div></div>
                </button>
                <Link href="/reports" className="flex flex-col justify-between rounded-[1.25rem] p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_30px_-24px_rgba(24,40,28,0.5)] md:col-span-4" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.primaryFixed }}>
                  <div className="flex items-start justify-between"><span className="text-[8px] font-semibold uppercase tracking-[0.22em] opacity-60">Quick action</span><ArrowRight size={14} className="opacity-50" /></div>
                  <span className="mt-6 flex items-center justify-center rounded-md py-2 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed }}>View research reports</span>
                </Link>
              </div>
            )}
          </motion.section>

          {selectedWorkspace && <section className="grid grid-cols-1 gap-8 border-t pt-14 lg:grid-cols-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
            <div className="lg:col-span-8">
              <div className="rounded-[2rem] p-7 sm:p-10" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
                <div className="flex flex-wrap items-start justify-between gap-5"><div><span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primaryFixed }}>Selected workspace</span><h2 className="mt-3 text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{selectedWorkspace.name}</h2></div>{isOwnerOfSelected && <button onClick={() => handleDeleteWorkspace(selectedWorkspace.id)} title="Delete workspace" className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'white', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>}</div>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <div className="flex flex-wrap gap-6">
                    {([{ key: 'personas', label: 'Personas' }, { key: 'interviews', label: 'Interviews' }, { key: 'reports', label: 'Reports' }] as { key: ContentTab; label: string }[]).map(tab => <button key={tab.key} onClick={() => setContentTab(tab.key)} className="border-b-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: contentTab === tab.key ? HOME_COLORS.primaryFixed : 'transparent', color: contentTab === tab.key ? 'white' : 'rgba(255,255,255,0.45)', background: 'none', cursor: 'pointer' }}>{tab.label}</button>)}
                  </div>
                  {/* workspace_id pre-selects the Workspace dropdown on the
                      target form, so it's created as shared, not personal. */}
                  {contentTab === 'personas' && (
                    <Link href={`/personas/new?workspace_id=${selectedWorkspace.id}`} className="flex items-center gap-1.5 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.primaryFixed }}>
                      <Plus size={12} /> New Persona
                    </Link>
                  )}
                  {contentTab === 'interviews' && (
                    <Link href={`/interviews/new?workspace_id=${selectedWorkspace.id}`} className="flex items-center gap-1.5 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.primaryFixed }}>
                      <Plus size={12} /> New Interview
                    </Link>
                  )}
                </div>
                <div className="mt-6">{loadingContent ? <div className="h-32 animate-pulse rounded-2xl bg-white/5" /> : <WorkspaceContent tab={contentTab} personas={workspacePersonas} interviews={workspaceInterviews} reports={workspaceReports} />}</div>
              </div>
            </div>
            <aside className="lg:col-span-4">
              <div className="rounded-[2rem] border p-7 sm:p-8" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}55` }}>
                <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research team</p><p className="mt-2 text-sm" style={{ color: HOME_COLORS.onSurface }}>{members.length} member{members.length === 1 ? '' : 's'} with access</p></div>{isOwnerOfSelected && <button onClick={() => setInvitingOpen(open => !open)} className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}><UserPlus size={16} /></button>}</div>
                {isOwnerOfSelected && <AnimatePresence>{invitingOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="mt-5 flex gap-2 rounded-xl p-2" style={{ background: HOME_COLORS.surfaceContainer }}><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()} placeholder="teammate@company.com" className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" style={{ color: HOME_COLORS.onSurface }} /><button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>{inviting ? 'Sending...' : 'Invite'}</button></div></motion.div>}</AnimatePresence>}
                <div className="mt-6 space-y-3">{loadingDetail ? [1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainer }} />) : members.map(member => <div key={member.id} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full"><PersonaAvatar avatarUrl={member.avatar_url} avatarInitials={getInitials(member.full_name || member.email)} avatarColor={getAvatarColor(member.full_name || member.email)} name={member.full_name ?? member.email} size="sm" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{member.full_name || member.email}</p><p className="text-[9px] uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>{member.role}</p></div></div>{(isOwnerOfSelected || member.id === currentUserId) && member.role !== 'owner' && <button onClick={() => handleRemoveMember(member.id)} aria-label={member.id === currentUserId ? 'Leave workspace' : `Remove ${member.full_name || member.email}`} className="p-1" style={{ color: HOME_COLORS.error, background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>}</div>)}{invites.map(invite => <div key={invite.id} className="flex items-center justify-between gap-3 text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}><span className="truncate">{invite.invited_email}</span><button onClick={() => handleRevokeInvite(invite.id)} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.error, background: 'none', border: 'none', cursor: 'pointer' }}>Revoke</button></div>)}</div>
              </div>
            </aside>
          </section>}
        </main>
      </div>
    )
  }

function MetricLine({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4"><span>{label}</span><span style={{ color: HOME_COLORS.primaryFixed }}>{value}</span></div>
      <div className="h-px overflow-hidden rounded-full bg-white/10"><div className="h-full" style={{ width: `${percent}%`, background: HOME_COLORS.primaryFixed }} /></div>
    </div>
  )
}

function WorkspaceStat({ value, label }: { value: number | string; label: string }) {
  return <div><span className="block text-2xl font-light sm:text-3xl">{value}</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em] opacity-45">{label}</span></div>
}

function WorkspaceContent({ tab, personas, interviews, reports }: { tab: ContentTab; personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[] }) {
  if (tab === 'personas') {
    return personas.length === 0 ? <EmptyContentState icon={Users} text="No personas assigned to this workspace yet." /> : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {personas.slice(0, 6).map(persona => <Link key={persona.id} href={`/personas/${persona.id}`} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" /><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{persona.name}</p><p className="truncate text-[9px] uppercase tracking-wider text-white/40">{persona.traits?.job_title || 'No role set'}</p></div></Link>)}
      </div>
    )
  }
  if (tab === 'interviews') {
    return interviews.length === 0 ? <EmptyContentState icon={MessagesSquare} text="No interviews run in this workspace yet." /> : (
      <div className="space-y-2">{interviews.slice(0, 6).map(interview => <Link key={interview.id} href={`/interviews/${interview.id}`} className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{interview.title}</p><p className="text-[9px] uppercase tracking-wider text-white/40">{interview.persona?.name ?? 'Unknown persona'}</p></div><span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.primaryFixed }}>{interview.status}</span></Link>)}</div>
    )
  }
  return reports.length === 0 ? <EmptyContentState icon={FileText} text="No reports generated in this workspace yet." /> : (
    <div className="space-y-2">{reports.slice(0, 6).map(report => <Link key={report.id} href={`/reports/${report.id}`} className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{report.interview?.title ?? 'Untitled interview'}</p><p className="truncate text-[10px] text-white/40">{report.executive_summary}</p></div><span className="text-xs font-semibold" style={{ color: HOME_COLORS.primaryFixed }}>{report.confidence_score}%</span></Link>)}</div>
  )
}

function EmptyContentState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon size={18} className="mb-2.5" style={{ color: 'rgba(255,255,255,0.15)' }} />
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{text}</p>
    </div>
  )
}
