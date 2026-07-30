'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Plus, X, Trash2, Loader2, Lock, Crown, ShieldCheck, Users, Verified,
  FileText, MessagesSquare, ArrowRight, UserPlus, Search, Pencil, Activity, BarChart3, Network, TrendingUp, Upload, BookOpen, Sparkles,
} from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { WorkspaceAutomations } from '@/components/workspaces/WorkspaceAutomations'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import type { Plan, Workspace, WorkspaceMember, WorkspaceInvite, WorkspaceActivity, WorkspaceSource, WorkspaceContext, Persona, Interview, Report } from '@/types'

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
  const [currentUser, setCurrentUser] = useState<{ name: string; avatarUrl: string | null } | null>(null)
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
  const [contentQuery, setContentQuery] = useState('')
  const [activity, setActivity] = useState<WorkspaceActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [presence, setPresence] = useState<{ id: string; name: string; avatarUrl: string | null }[]>([])

  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitingOpen, setInvitingOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [editingWorkspaceName, setEditingWorkspaceName] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [savingWorkspaceName, setSavingWorkspaceName] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoadingPlan(false); return }
      setCurrentUserId(data.user.id)
      const { data: profile } = await supabase.from('profiles').select('plan, full_name, avatar_url, email').eq('id', data.user.id).single()
      setPlan((profile?.plan ?? 'free') as Plan)
      setCurrentUser({ name: profile?.full_name || profile?.email || 'You', avatarUrl: profile?.avatar_url ?? null })
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

  const loadActivity = async (workspaceId: string) => {
    setActivityLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/activity`)
      const json = await res.json()
      if (res.ok) setActivity(json.data ?? [])
    } catch {
      setActivity([])
    } finally {
      setActivityLoading(false)
    }
  }

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId)
      loadActivity(selectedId)
      setContentQuery('')
      setEditingWorkspaceName(false)
      setWorkspaceName(workspaces.find(workspace => workspace.id === selectedId)?.name ?? '')
    }
  }, [selectedId, workspaces])

  useEffect(() => {
    if (!selectedId || !currentUserId || !currentUser) return
    const supabase = createClient()
    const channel = supabase.channel(`workspace-presence:${selectedId}`, { config: { presence: { key: currentUserId } } })
    const syncPresence = () => {
      const state = channel.presenceState() as Record<string, { id: string; name: string; avatarUrl: string | null }[]>
      const seen = new Set<string>()
      setPresence(Object.values(state).flat().filter(person => !seen.has(person.id) && Boolean(seen.add(person.id))))
    }

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'workspace_activity', filter: `workspace_id=eq.${selectedId}` }, () => loadActivity(selectedId))
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ id: currentUserId, name: currentUser.name, avatarUrl: currentUser.avatarUrl })
        }
      })

    return () => { void supabase.removeChannel(channel) }
  }, [selectedId, currentUserId, currentUser])

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

  const handleRenameWorkspace = async () => {
    if (!selectedId || !workspaceName.trim()) return
    setSavingWorkspaceName(true)
    setError('')
    try {
      const res = await fetch(`/api/workspaces/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to rename workspace'); return }
      setWorkspaces(previous => previous.map(workspace => workspace.id === selectedId ? json.data : workspace))
      setEditingWorkspaceName(false)
      void loadActivity(selectedId)
    } catch {
      setError('Something went wrong — please try again')
    } finally {
      setSavingWorkspaceName(false)
    }
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
  const activityActor = (actorId: string | null) => members.find(member => member.id === actorId)?.full_name || members.find(member => member.id === actorId)?.email || 'A teammate'

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

          <AnimatePresence>
            {showCreatePanel && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="mb-7 rounded-2xl border p-4 sm:p-5" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}55` }}>
                <div className="flex flex-wrap items-center gap-3">
                  <input autoFocus value={newWorkspaceName} onChange={e => setNewWorkspaceName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="Name this workspace — e.g. a client or brand" maxLength={120} className="min-w-[220px] flex-1 bg-transparent px-3 py-2 text-sm outline-none" style={{ color: HOME_COLORS.onSurface }} />
                  <button onClick={handleCreate} disabled={creating || !newWorkspaceName.trim()} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>{creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create workspace</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {selectedWorkspace && <WorkspaceIntelligence personas={workspacePersonas} interviews={workspaceInterviews} reports={workspaceReports} />}

          <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="relative mb-9 min-h-[220px] overflow-hidden rounded-[1.5rem] p-6 shadow-[0_18px_30px_-20px_rgba(24,40,28,0.5)] sm:min-h-[280px] sm:p-8" style={{ background: HOME_COLORS.primary }}>
            <div className="relative z-10 flex flex-col justify-between gap-10 lg:flex-row lg:items-start">
              <div>
                <span className="mb-3 inline-block rounded-full bg-white/10 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.primaryFixed }}>Workspace activity</span>
                <h2 className="text-2xl leading-tight text-white sm:text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>Workspace Activity <br /><span className="italic font-normal text-white/45">Research Overview</span></h2>
                {presence.length > 1 && <div className="mt-6 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: HOME_COLORS.primaryFixed, boxShadow: `0 0 0 4px ${HOME_COLORS.primaryFixed}1f` }} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">{presence.length - 1} teammate{presence.length === 2 ? '' : 's'} viewing now</span>
                  <div className="flex -space-x-2">
                    {presence.filter(person => person.id !== currentUserId).slice(0, 4).map(person => <div key={person.id} className="h-7 w-7 overflow-hidden rounded-full border-2" style={{ borderColor: HOME_COLORS.primary }}><PersonaAvatar avatarUrl={person.avatarUrl} avatarInitials={getInitials(person.name)} avatarColor={getAvatarColor(person.name)} name={person.name} size="sm" /></div>)}
                  </div>
                </div>}
              </div>
              <div className="min-w-0 rounded-2xl border p-5 sm:min-w-[260px]" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(18px)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/60" style={{ fontFamily: HOME_FONT_BODY }}><Activity size={13} />Latest activity</span>
                <div className="mt-4 space-y-3">
                  {activityLoading ? <div className="h-16 animate-pulse rounded-lg bg-white/10" /> : activity.length ? activity.slice(0, 3).map(item => <ActivityRow key={item.id} item={item} actor={activityActor(item.actor_id)} />) : <p className="text-xs leading-relaxed text-white/60">Activity will appear as your team creates research in this workspace.</p>}
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
            {showCreatePanel && false && (
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
                  return <button key={workspace.id} onClick={() => setSelectedId(workspace.id)} className={`group text-left transition-all duration-200 ${index === 0 ? 'md:col-span-7' : 'md:col-span-5'}`} style={{ cursor: 'pointer', border: 'none', background: 'none' }}>
                    <div className={`relative flex min-h-[158px] h-full flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 transition-all duration-300 sm:min-h-[178px] sm:p-6 ${darkTile ? 'hover:-translate-y-1 hover:shadow-[0_18px_30px_-20px_rgba(24,40,28,0.45)]' : 'hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_26px_-22px_rgba(24,40,28,0.32)]'}`} style={darkTile ? { background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: '0 10px 22px -18px rgba(24,40,28,0.28)' } : { background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.primary, border: `1px solid ${HOME_COLORS.outlineVariant}22` }}>
                      {darkTile && <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-opacity duration-700 group-hover:opacity-100" style={{ background: `${HOME_COLORS.primaryFixed}1f`, opacity: 0.45 }} />}
                      <div>
                        <div className="mb-4 flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: darkTile ? 'rgba(255,255,255,0.1)' : HOME_COLORS.primary, color: darkTile ? HOME_COLORS.primaryFixed : HOME_COLORS.onPrimary }}><Building2 size={18} /></div><span className="rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ background: darkTile ? `${HOME_COLORS.primaryFixed}22` : `${HOME_COLORS.primary}0d`, color: darkTile ? HOME_COLORS.primaryFixed : HOME_COLORS.primary }}>{selected ? 'Active workspace' : 'Workspace'}</span></div>
                        <h3 className="text-xl sm:text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{workspace.name}</h3>
                        <p className="mt-4 max-w-md text-sm leading-6" style={{ color: darkTile ? 'rgba(255,255,255,0.55)' : HOME_COLORS.onSurfaceVariant }}>A focused space for your team’s shared personas, interviews, and reports.</p>
                      </div>
                      <div className="flex items-end justify-between border-t pt-6" style={{ borderColor: darkTile ? 'rgba(255,255,255,0.1)' : `${HOME_COLORS.primary}12` }}><div className="flex gap-8"><WorkspaceStat value={selected ? realPersonaCount : '—'} label="Personas" /><WorkspaceStat value={selected ? realInterviewCount : '—'} label="Interviews" /></div><span className="flex h-9 w-9 items-center justify-center rounded-full transition-colors" style={{ background: darkTile ? HOME_COLORS.primaryFixed : HOME_COLORS.primary, color: darkTile ? HOME_COLORS.onPrimaryFixed : HOME_COLORS.onPrimary }}><ArrowRight size={15} /></span></div>
                    </div>
                  </button>
                })}
                <Link href="/reports" className="group rounded-[1.25rem] p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_30px_-24px_rgba(24,40,28,0.35)] md:col-span-4" style={{ background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.primary, border: `1px solid ${HOME_COLORS.outlineVariant}22` }}>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80" style={{ fontFamily: HOME_FONT_BODY }}>Shared research</span>
                  <div className="mt-5 flex items-end justify-between"><div><h3 className="text-base" style={{ fontFamily: HOME_FONT_DISPLAY }}>Workspace Content</h3><p className="mt-1 text-xs opacity-70" style={{ fontFamily: HOME_FONT_BODY }}>{realPersonaCount + realInterviewCount + realReportCount} shared research items.</p></div><FileText size={20} className="opacity-30" /></div>
                </Link>
                <button type="button" onClick={() => setInvitingOpen(true)} className="group rounded-[1.25rem] p-5 text-left transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_30px_-24px_rgba(24,40,28,0.35)] md:col-span-4" style={{ background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.primary, border: `1px solid ${HOME_COLORS.outlineVariant}22`, cursor: 'pointer' }}>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80" style={{ fontFamily: HOME_FONT_BODY }}>Workspace members</span>
                  <div className="mt-4 flex items-center gap-3">{members[0] ? <div className="h-10 w-10 overflow-hidden rounded-xl"><PersonaAvatar avatarUrl={members[0].avatar_url} avatarInitials={getInitials(members[0].full_name || members[0].email)} avatarColor={getAvatarColor(members[0].full_name || members[0].email)} name={members[0].full_name ?? members[0].email} size="sm" shape="square" /></div> : <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${HOME_COLORS.primary}12` }}><Users size={16} /></div>}<div className="min-w-0"><h3 className="truncate text-sm" style={{ fontFamily: HOME_FONT_DISPLAY }}>{members[0]?.full_name || members[0]?.email || 'Invite your team'}</h3><p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70" style={{ fontFamily: HOME_FONT_BODY }}>{members.length ? `${members.length} members with access` : 'Add a member'}</p></div></div>
                </button>
              </div>
            )}
          </motion.section>

          {selectedWorkspace && <section className="grid grid-cols-1 gap-8 border-t pt-14 lg:grid-cols-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
            <div className="lg:col-span-8">
              <div className="rounded-[2rem] p-7 sm:p-10" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
                <div className="flex flex-wrap items-start justify-between gap-5"><div><span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primaryFixed }}>Selected workspace</span>{editingWorkspaceName ? <div className="mt-3 flex flex-wrap items-center gap-2"><input autoFocus value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleRenameWorkspace()} className="min-w-[220px] rounded-lg bg-white/10 px-3 py-2 text-xl text-white outline-none" style={{ fontFamily: HOME_FONT_DISPLAY, border: '1px solid rgba(255,255,255,0.22)' }} /><button onClick={handleRenameWorkspace} disabled={savingWorkspaceName || !workspaceName.trim()} className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" style={{ background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed, border: 'none', cursor: 'pointer' }}>{savingWorkspaceName ? 'Saving…' : 'Save'}</button><button onClick={() => { setEditingWorkspaceName(false); setWorkspaceName(selectedWorkspace.name) }} className="px-2 text-xs text-white/60 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button></div> : <div className="mt-3 flex items-center gap-3"><h2 className="text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{selectedWorkspace.name}</h2>{isOwnerOfSelected && <button onClick={() => { setWorkspaceName(selectedWorkspace.name); setEditingWorkspaceName(true) }} title="Rename workspace" className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Pencil size={14} /></button>}</div>}</div>{isOwnerOfSelected && <button onClick={() => handleDeleteWorkspace(selectedWorkspace.id)} title="Delete workspace" className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'white', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>}</div>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <div className="flex flex-wrap gap-6">
                    {([{ key: 'personas', label: 'Personas' }, { key: 'interviews', label: 'Interviews' }, { key: 'reports', label: 'Reports' }] as { key: ContentTab; label: string }[]).map(tab => <button key={tab.key} onClick={() => setContentTab(tab.key)} className="border-b-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 hover:border-white/45 hover:text-white" style={{ borderColor: contentTab === tab.key ? HOME_COLORS.primaryFixed : 'transparent', color: contentTab === tab.key ? 'white' : 'rgba(255,255,255,0.45)', background: 'none', cursor: 'pointer' }}>{tab.label}</button>)}
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
                <div className="mt-5 flex max-w-md items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}><Search size={14} className="text-white/50" /><input value={contentQuery} onChange={event => setContentQuery(event.target.value)} placeholder={`Filter ${contentTab}…`} className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40" /></div>
                <div className="mt-6">{loadingContent ? <div className="h-32 animate-pulse rounded-2xl bg-white/5" /> : <WorkspaceContent tab={contentTab} query={contentQuery} personas={workspacePersonas} interviews={workspaceInterviews} reports={workspaceReports} />}</div>
              </div>
            </div>
            <aside className="lg:col-span-4">
              <div className="rounded-[2rem] border p-7 sm:p-8" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}55` }}>
                <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research team</p><p className="mt-2 text-sm" style={{ color: HOME_COLORS.onSurface }}>{members.length} member{members.length === 1 ? '' : 's'} with access</p></div>{isOwnerOfSelected && <button onClick={() => setInvitingOpen(open => !open)} className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(24,40,28,0.18)] active:scale-95" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}><UserPlus size={16} /></button>}</div>
                {isOwnerOfSelected && <AnimatePresence>{invitingOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="mt-5 flex gap-2 rounded-xl p-2" style={{ background: HOME_COLORS.surfaceContainer }}><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()} placeholder="teammate@company.com" className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" style={{ color: HOME_COLORS.onSurface }} /><button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>{inviting ? 'Sending...' : 'Invite'}</button></div></motion.div>}</AnimatePresence>}
                <div className="mt-6 space-y-3">{loadingDetail ? [1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainer }} />) : members.map(member => <div key={member.id} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full"><PersonaAvatar avatarUrl={member.avatar_url} avatarInitials={getInitials(member.full_name || member.email)} avatarColor={getAvatarColor(member.full_name || member.email)} name={member.full_name ?? member.email} size="sm" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{member.full_name || member.email}</p><p className="text-[9px] uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>{member.role}</p></div></div>{(isOwnerOfSelected || member.id === currentUserId) && member.role !== 'owner' && <button onClick={() => handleRemoveMember(member.id)} aria-label={member.id === currentUserId ? 'Leave workspace' : `Remove ${member.full_name || member.email}`} className="p-1" style={{ color: HOME_COLORS.error, background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>}</div>)}{invites.map(invite => <div key={invite.id} className="flex items-center justify-between gap-3 text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}><span className="truncate">{invite.invited_email}</span><button onClick={() => handleRevokeInvite(invite.id)} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.error, background: 'none', border: 'none', cursor: 'pointer' }}>Revoke</button></div>)}</div>
              </div>
              <WorkspaceAskAI reports={workspaceReports} />
            </aside>
          </section>}
          {selectedWorkspace && <WorkspaceKnowledgeHub workspaceId={selectedWorkspace.id} />}
          {selectedWorkspace && isOwnerOfSelected && <WorkspaceAutomations workspaceId={selectedWorkspace.id} />}
        </main>
      </div>
    )
  }

function ActivityRow({ item, actor }: { item: WorkspaceActivity; actor: string }) {
  const labels: Record<WorkspaceActivity['action'], string> = {
    workspace_created: 'created this workspace',
    workspace_renamed: `renamed it to ${item.entity_label ?? 'a new name'}`,
    member_invited: `invited ${item.entity_label ?? 'a teammate'}`,
    persona_created: `created persona ${item.entity_label ?? ''}`,
    interview_started: `started interview ${item.entity_label ?? ''}`,
    report_generated: `generated a report for ${item.entity_label ?? 'an interview'}`,
  }
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(item.created_at).getTime()) / 60000))
  const time = elapsedMinutes < 1 ? 'just now' : elapsedMinutes < 60 ? `${elapsedMinutes}m ago` : elapsedMinutes < 1440 ? `${Math.floor(elapsedMinutes / 60)}h ago` : `${Math.floor(elapsedMinutes / 1440)}d ago`
  return <div className="flex gap-2 text-[11px] leading-4 text-white/80"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: HOME_COLORS.primaryFixed }} /><p><strong className="font-semibold text-white">{actor}</strong> {labels[item.action]} <span className="whitespace-nowrap text-white/40">{time}</span></p></div>
}

function WorkspaceStat({ value, label }: { value: number | string; label: string }) {
  return <div><span className="block text-2xl font-light sm:text-3xl">{value}</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em] opacity-45">{label}</span></div>
}

function WorkspaceIntelligence({ personas, interviews, reports }: { personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[] }) {
  const [activeNode, setActiveNode] = useState('overview')
  const [intelligenceTab, setIntelligenceTab] = useState<'analytics' | 'insights'>('analytics')
  const now = Date.now()
  const lastThirtyDays = now - 30 * 24 * 60 * 60 * 1000
  const recentResearch = [...personas, ...interviews, ...reports].filter(item => new Date(item.created_at).getTime() >= lastThirtyDays).length
  const averageConfidence = reports.length ? Math.round(reports.reduce((sum, report) => sum + report.confidence_score, 0) / reports.length) : 0
  const completedInterviews = interviews.filter(interview => interview.status === 'completed').length
  const completionRate = interviews.length ? Math.round((completedInterviews / interviews.length) * 100) : 0
  const themeCounts = new Map<string, number>()
  reports.forEach(report => report.key_themes?.forEach(theme => themeCounts.set(theme.title, (themeCounts.get(theme.title) ?? 0) + 1)))
  const themes = [...themeCounts.entries()].map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 4)
  const graphPersonas = personas.slice(0, 2)
  const graphReports = reports.slice(0, 2)
  const selectedDetail = activeNode === 'overview'
    ? 'Select a persona, report, or theme to inspect how research is connected in this workspace.'
    : activeNode.startsWith('theme:')
      ? `${activeNode.slice(6)} appears across ${themeCounts.get(activeNode.slice(6)) ?? 0} report${(themeCounts.get(activeNode.slice(6)) ?? 0) === 1 ? '' : 's'}.`
      : activeNode.startsWith('persona:')
        ? `${personas.find(persona => persona.id === activeNode.slice(8))?.name ?? 'This persona'} connects to the interviews and reports shown here.`
        : 'This report contributes themes and evidence to the workspace intelligence map.'

  return <section className="mb-9 border-t pt-8" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace intelligence</p><h2 className="mt-1 text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Research overview</h2></div><div className="flex rounded-full p-1" style={{ background: HOME_COLORS.surfaceContainerLow }}>{([{ key: 'analytics', label: 'Analytics', icon: BarChart3 }, { key: 'insights', label: 'Insight graph', icon: Network }] as const).map(tab => <button key={tab.key} type="button" onClick={() => setIntelligenceTab(tab.key)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold transition-all duration-200" style={{ background: intelligenceTab === tab.key ? HOME_COLORS.primary : 'transparent', color: intelligenceTab === tab.key ? HOME_COLORS.onPrimary : HOME_COLORS.onSurfaceVariant }}><tab.icon size={12} />{tab.label}</button>)}</div></div>
    <div className={`rounded-[1.5rem] border p-6 sm:p-7 ${intelligenceTab === 'analytics' ? 'block' : 'hidden'}`} style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace analytics</p><h2 className="mt-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Research momentum</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}><BarChart3 size={18} /></span></div>
      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl" style={{ background: `${HOME_COLORS.outlineVariant}55` }}>
        <AnalyticsMetric value={recentResearch} label="New items / 30 days" />
        <AnalyticsMetric value={reports.length ? `${averageConfidence}%` : '—'} label="Average confidence" />
        <AnalyticsMetric value={`${completionRate}%`} label="Interview completion" />
        <AnalyticsMetric value={themes.length} label="Recurring themes" />
      </div>
      <div className="mt-7"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Leading themes</span><TrendingUp size={14} style={{ color: HOME_COLORS.primary }} /></div>{themes.length ? <div className="space-y-3">{themes.map(theme => <div key={theme.title}><div className="mb-1.5 flex justify-between gap-4 text-xs" style={{ color: HOME_COLORS.onSurface }}><span className="truncate">{theme.title}</span><span className="shrink-0" style={{ color: HOME_COLORS.onSurfaceVariant }}>{theme.count} report{theme.count === 1 ? '' : 's'}</span></div><div className="h-1 overflow-hidden rounded-full" style={{ background: HOME_COLORS.surfaceContainer }}><div className="h-full rounded-full" style={{ width: `${Math.max(12, (theme.count / themes[0].count) * 100)}%`, background: HOME_COLORS.primary }} /></div></div>)}</div> : <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Generate reports to start tracking research confidence and recurring themes.</p>}</div>
    </div>
    <div className={`overflow-hidden rounded-[1.5rem] border p-6 sm:p-7 ${intelligenceTab === 'insights' ? 'block' : 'hidden'}`} style={{ background: HOME_COLORS.primary, borderColor: HOME_COLORS.primary }}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primaryFixed }}>Insight graph</p><h2 className="mt-2 text-2xl text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>How your research connects</h2></div><Network size={19} style={{ color: HOME_COLORS.primaryFixed }} /></div>
      <div className="relative mt-7 grid min-h-[220px] grid-cols-3 gap-3 overflow-hidden rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><path d="M95 70 C190 70, 210 110, 300 110 S410 65, 505 65 M95 155 C190 155, 210 110, 300 110 S410 155, 505 155" fill="none" stroke="rgba(212,232,213,0.35)" strokeWidth="1" strokeDasharray="4 5" /></svg>
        <GraphColumn label="Personas" nodes={graphPersonas.map(persona => ({ id: `persona:${persona.id}`, label: persona.name }))} activeNode={activeNode} onSelect={setActiveNode} />
        <GraphColumn label="Reports" nodes={graphReports.map(report => ({ id: `report:${report.id}`, label: report.interview?.title ?? 'Insight report' }))} activeNode={activeNode} onSelect={setActiveNode} />
        <GraphColumn label="Themes" nodes={themes.slice(0, 2).map(theme => ({ id: `theme:${theme.title}`, label: theme.title }))} activeNode={activeNode} onSelect={setActiveNode} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/65">{selectedDetail}</p>
    </div>
  </section>
}

function AnalyticsMetric({ value, label }: { value: string | number; label: string }) {
  return <div className="bg-[#fcf9f8] p-4"><strong className="block text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{value}</strong><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{label}</span></div>
}

function WorkspaceAskAI({ reports }: { reports: (Report & { interview: Interview })[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')
  const reportId = selectedId || reports[0]?.id

  const ask = async () => {
    if (!reportId || !question.trim() || asking) return
    setAsking(true); setError(''); setAnswer('')
    try {
      const response = await fetch('/api/reports/' + reportId + '/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to answer that question.')
      setAnswer(json.data.answer)
    } catch (err: any) {
      setError(err?.message ?? 'Unable to answer that question.')
    } finally {
      setAsking(false)
    }
  }

  return <section className="mt-6 rounded-[2rem] border p-6" style={{ background: '#dfe4da', borderColor: HOME_COLORS.outlineVariant + '55' }}>
    <div className="flex items-center gap-2"><Sparkles size={17} style={{ color: HOME_COLORS.primary }} /><h2 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Ask AI</h2></div>
    <p className="mt-2 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{reports.length ? 'Ask a focused question about a report in this workspace.' : 'Generate an insight report to ask AI about your workspace research.'}</p>
    {reports.length > 0 && <><div className="mt-4 flex flex-wrap gap-1.5">{reports.slice(0, 4).map(report => <button key={report.id} type="button" onClick={() => { setSelectedId(report.id); setAnswer('') }} className="max-w-full truncate rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors" style={{ background: report.id === reportId ? HOME_COLORS.primary : HOME_COLORS.surfaceContainerLowest, color: report.id === reportId ? HOME_COLORS.onPrimary : HOME_COLORS.onSurfaceVariant }}>{report.interview?.title ?? 'Insight report'}</button>)}</div>
      <div className="mt-4 flex gap-2"><input value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void ask() } }} placeholder="What were the key objections?" className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-xs outline-none" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface, border: '1px solid ' + HOME_COLORS.outlineVariant + '66' }} /><button type="button" onClick={ask} disabled={!question.trim() || asking} className="rounded-xl px-3 transition-transform active:scale-95 disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>{asking ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}</button></div>
      {error && <p className="mt-3 text-xs" style={{ color: HOME_COLORS.error }}>{error}</p>}
      {answer && <p className="mt-4 whitespace-pre-wrap rounded-xl p-3 text-xs leading-relaxed" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface }}>{answer}</p>}
    </>}
  </section>
}

function GraphColumn({ label, nodes, activeNode, onSelect }: { label: string; nodes: { id: string; label: string }[]; activeNode: string; onSelect: (id: string) => void }) {
  return <div className="relative z-10 flex flex-col gap-3"><span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/45">{label}</span>{nodes.length ? nodes.map(node => <button key={node.id} onClick={() => onSelect(node.id)} className="rounded-lg px-2 py-2 text-left text-[10px] font-semibold transition-colors" style={{ background: activeNode === node.id ? HOME_COLORS.primaryFixed : 'rgba(255,255,255,0.1)', color: activeNode === node.id ? HOME_COLORS.onPrimaryFixed : 'white', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}><span className="block truncate">{node.label}</span></button>) : <span className="text-[10px] text-white/35">No data yet</span>}</div>
}

function WorkspaceKnowledgeHub({ workspaceId }: { workspaceId: string }) {
  const [sources, setSources] = useState<WorkspaceSource[]>([])
  const [context, setContext] = useState<WorkspaceContext | null>(null)
  const [brief, setBrief] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadKnowledge = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`)
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setSources(json.data?.sources ?? [])
      setContext(json.data?.context ?? null)
      setBrief(json.data?.context?.content ?? '')
    } catch (err: any) {
      setError(err.message ?? 'Could not load workspace knowledge')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadKnowledge() }, [workspaceId])

  const uploadSource = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`, { method: 'POST', body: form })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setSources(previous => [json.data, ...previous])
    } catch (err: any) {
      setError(err.message ?? 'Could not upload source')
    } finally {
      setUploading(false)
    }
  }

  const saveBrief = async () => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: brief }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setContext(json.data)
      setBrief(json.data.content)
    } catch (err: any) {
      setError(err.message ?? 'Could not save workspace brief')
    } finally {
      setSaving(false)
    }
  }

  const deleteSource = async (sourceId: string) => {
    if (!confirm('Remove this shared source?')) return
    const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId }) })
    if (response.ok) setSources(previous => previous.filter(source => source.id !== sourceId))
  }

  return <section className="mb-14 border-t pt-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace knowledge</p><h2 className="mt-2 text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Shared context hub</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Give every workspace research action the same informed starting point.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-opacity hover:opacity-90" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}><Upload size={14} />{uploading ? 'Uploading…' : 'Add source'}<input type="file" className="hidden" disabled={uploading} accept=".pdf,.doc,.docx,.csv,.txt,.md,.json" onChange={event => uploadSource(event.target.files)} /></label></div>
    {error && <p className="mb-4 rounded-lg px-3 py-2 text-xs" style={{ background: '#ffdad6', color: HOME_COLORS.error }}>{error}</p>}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12"><div className="rounded-[1.5rem] border p-6 lg:col-span-7" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2"><BookOpen size={17} style={{ color: HOME_COLORS.primary }} /><h3 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Workspace brief</h3></div><button onClick={saveBrief} disabled={saving || brief === (context?.content ?? '')} className="rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] disabled:opacity-40" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary, border: 'none', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save brief'}</button></div><p className="mt-3 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Add the positioning, audience, claims, guardrails, or research priorities that should inform every shared persona, interview, and report.</p><textarea value={brief} onChange={event => setBrief(event.target.value)} maxLength={12000} placeholder="e.g. Brand positioning, target audience, campaign objectives, approved claims, and research constraints…" className="mt-5 min-h-[160px] w-full resize-y rounded-xl p-4 text-sm leading-relaxed outline-none" style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }} /></div>
      <div className="rounded-[1.5rem] border p-6 lg:col-span-5" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}66` }}><h3 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Shared sources</h3><p className="mt-2 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Text, CSV, and JSON sources feed into workspace context automatically. PDFs and decks remain available to the team and can be distilled into the brief.</p><div className="mt-5 space-y-2">{loading ? <div className="h-16 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainer }} /> : sources.length ? sources.map(source => <div key={source.id} className="flex items-center justify-between gap-3 rounded-xl border p-3" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}55` }}><div className="min-w-0"><p className="truncate text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{source.name}</p><p className="mt-1 text-[10px]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatSourceSize(source.size_bytes)} · {source.extracted_text ? 'Context-ready' : 'Stored source'}</p></div><button onClick={() => deleteSource(source.id)} className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{ background: 'none', border: 'none', color: HOME_COLORS.error, cursor: 'pointer' }}>Remove</button></div>) : <p className="rounded-xl border border-dashed p-5 text-center text-xs" style={{ borderColor: `${HOME_COLORS.outlineVariant}88`, color: HOME_COLORS.onSurfaceVariant }}>No shared source materials yet.</p>}</div></div></div>
  </section>
}

function formatSourceSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function WorkspaceContent({ tab, query, personas, interviews, reports }: { tab: ContentTab; query: string; personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[] }) {
  const term = query.trim().toLowerCase()
  if (tab === 'personas') {
    const filtered = personas.filter(persona => !term || `${persona.name} ${persona.traits?.job_title ?? ''} ${persona.traits?.industry ?? ''}`.toLowerCase().includes(term))
    return filtered.length === 0 ? <EmptyContentState icon={Users} text={term ? 'No personas match this filter.' : 'No personas assigned to this workspace yet.'} /> : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.slice(0, 6).map(persona => <Link key={persona.id} href={`/personas/${persona.id}`} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" /><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{persona.name}</p><p className="truncate text-[9px] uppercase tracking-wider text-white/40">{persona.traits?.job_title || 'No role set'}</p></div></Link>)}
      </div>
    )
  }
  if (tab === 'interviews') {
    const filtered = interviews.filter(interview => !term || `${interview.title} ${interview.persona?.name ?? ''} ${interview.status}`.toLowerCase().includes(term))
    return filtered.length === 0 ? <EmptyContentState icon={MessagesSquare} text={term ? 'No interviews match this filter.' : 'No interviews run in this workspace yet.'} /> : (
      <div className="space-y-2">{filtered.slice(0, 6).map(interview => <Link key={interview.id} href={`/interviews/${interview.id}`} className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{interview.title}</p><p className="text-[9px] uppercase tracking-wider text-white/40">{interview.persona?.name ?? 'Unknown persona'}</p></div><span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.primaryFixed }}>{interview.status}</span></Link>)}</div>
    )
  }
  const filtered = reports.filter(report => !term || `${report.interview?.title ?? ''} ${report.executive_summary}`.toLowerCase().includes(term))
  return filtered.length === 0 ? <EmptyContentState icon={FileText} text={term ? 'No reports match this filter.' : 'No reports generated in this workspace yet.'} /> : (
    <div className="space-y-2">{filtered.slice(0, 6).map(report => <Link key={report.id} href={`/reports/${report.id}`} className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{report.interview?.title ?? 'Untitled interview'}</p><p className="truncate text-[10px] text-white/40">{report.executive_summary}</p></div><span className="text-xs font-semibold" style={{ color: HOME_COLORS.primaryFixed }}>{report.confidence_score}%</span></Link>)}</div>
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
