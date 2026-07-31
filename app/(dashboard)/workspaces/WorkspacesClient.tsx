'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Plus, X, Trash2, Loader2, Lock, Crown, ShieldCheck, Users, Verified,
  FileText, MessagesSquare, ArrowRight, ChevronDown, UserPlus, Search, Pencil, Activity, BarChart3, Network, TrendingUp, Upload, BookOpen, Sparkles,
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
  const [workspaceCounts, setWorkspaceCounts] = useState<Record<string, { personas: number; interviews: number; reports: number }>>({})
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
  const [lastSeenById, setLastSeenById] = useState<Record<string, string>>({})
  const presenceRef = useRef<{ id: string; name: string; avatarUrl: string | null }[]>([])

  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitingOpen, setInvitingOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [editingWorkspaceName, setEditingWorkspaceName] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceDescription, setWorkspaceDescription] = useState('')
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

    const supabase = createClient()
    const seatSet = new Set<string>()
    const counts: Record<string, { personas: number; interviews: number; reports: number }> = {}
    await Promise.all(ws.map(async (w) => {
      const r = await fetch(`/api/workspaces/${w.id}/members`)
      const j = await r.json()
      ;(j.data ?? []).forEach((m: WorkspaceMember) => seatSet.add(m.id))
      const [personas, interviews, reports] = await Promise.all([
        supabase.from('personas').select('*', { count: 'exact', head: true }).eq('workspace_id', w.id),
        supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('workspace_id', w.id),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('workspace_id', w.id),
      ])
      counts[w.id] = { personas: personas.count ?? 0, interviews: interviews.count ?? 0, reports: reports.count ?? 0 }
    }))
    setAllSeats(seatSet)
    setWorkspaceCounts(counts)
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
    setLastSeenById(previous => {
      const next = { ...previous }
      for (const member of members) {
        if (member.last_seen_at && (!next[member.id] || new Date(member.last_seen_at).getTime() > new Date(next[member.id]).getTime())) {
          next[member.id] = member.last_seen_at
        }
      }
      return next
    })
  }, [members])

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
      const workspace = workspaces.find(item => item.id === selectedId)
      setWorkspaceName(workspace?.name ?? '')
      setWorkspaceDescription(workspace?.description ?? '')
    }
  }, [selectedId, workspaces])

  useEffect(() => {
    if (!selectedId || !currentUserId || !currentUser) return
    const supabase = createClient()
    const channel = supabase.channel(`workspace-presence:${selectedId}`, { config: { presence: { key: currentUserId } } })
    const presencePayload = { id: currentUserId, name: currentUser.name, avatarUrl: currentUser.avatarUrl }
    const updateLastSeen = () => {
      void fetch(`/api/workspaces/${selectedId}/presence`, { method: 'POST', keepalive: true }).catch(() => undefined)
    }
    const syncPresence = () => {
      const state = channel.presenceState() as Record<string, { id: string; name: string; avatarUrl: string | null }[]>
      const seen = new Set<string>()
      const nextPresence = Object.values(state).flat().filter(person => !seen.has(person.id) && Boolean(seen.add(person.id)))
      const activeIds = new Set(nextPresence.map(person => person.id))
      const departed = presenceRef.current.filter(person => !activeIds.has(person.id))
      if (departed.length) {
        const timestamp = new Date().toISOString()
        setLastSeenById(previous => ({ ...previous, ...Object.fromEntries(departed.map(person => [person.id, timestamp])) }))
      }
      presenceRef.current = nextPresence
      setPresence(nextPresence)
    }
    const updateVisibility = () => {
      if (document.visibilityState === 'hidden') {
        updateLastSeen()
        void channel.untrack()
      } else {
        updateLastSeen()
        void channel.track(presencePayload)
      }
    }

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'workspace_activity', filter: `workspace_id=eq.${selectedId}` }, () => loadActivity(selectedId))
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          updateLastSeen()
          void channel.track(presencePayload)
        }
      })

    const heartbeat = window.setInterval(updateLastSeen, 60_000)
    document.addEventListener('visibilitychange', updateVisibility)
    window.addEventListener('pagehide', updateLastSeen)

    return () => {
      updateLastSeen()
      window.clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', updateVisibility)
      window.removeEventListener('pagehide', updateLastSeen)
      presenceRef.current = []
      setPresence([])
      void channel.untrack()
      void supabase.removeChannel(channel)
    }
  }, [selectedId, currentUserId, currentUser])

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim(), description: newWorkspaceDescription.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to create workspace'); return }
      setNewWorkspaceName('')
      setNewWorkspaceDescription('')
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
        body: JSON.stringify({ name: workspaceName.trim(), description: workspaceDescription.trim() }),
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

  return (
      <div className="min-h-full" style={{ background: HOME_COLORS.surfaceContainerLowest, fontFamily: HOME_FONT_BODY, backgroundImage: 'linear-gradient(rgba(24,40,28,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(24,40,28,0.028) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
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
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-end">
                  <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace name</span><input autoFocus value={newWorkspaceName} onChange={e => setNewWorkspaceName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="e.g. Acme launch" maxLength={120} className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface, borderColor: HOME_COLORS.outlineVariant + '88' }} /></label>
                  <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Description <span className="normal-case tracking-normal">(optional)</span></span><input value={newWorkspaceDescription} onChange={e => setNewWorkspaceDescription(e.target.value)} placeholder="What is this workspace for?" maxLength={360} className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface, borderColor: HOME_COLORS.outlineVariant + '88' }} /></label>
                  <button onClick={handleCreate} disabled={creating || !newWorkspaceName.trim()} className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>{creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create workspace</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <WorkspacePortfolioOverview workspaces={workspaces} counts={workspaceCounts} />
          {selectedWorkspace && false && <WorkspaceIntelligence personas={workspacePersonas} interviews={workspaceInterviews} reports={workspaceReports} />}

          {selectedWorkspace && false && <motion.section initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="relative mb-9 min-h-[220px] overflow-hidden rounded-[1.5rem] p-6 shadow-[0_18px_30px_-20px_rgba(24,40,28,0.5)] sm:min-h-[280px] sm:p-8" style={{ background: HOME_COLORS.primary }}>
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
          </motion.section>}

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
                  const counts = workspaceCounts[workspace.id] ?? { personas: 0, interviews: 0, reports: 0 }
                  return <button key={workspace.id} onClick={() => setSelectedId(selected ? null : workspace.id)} className={`group text-left transition-all duration-200 ${index === 0 ? 'md:col-span-7' : 'md:col-span-5'}`} style={{ cursor: 'pointer', border: 'none', background: 'none' }}>
                    <div className={`relative flex min-h-[158px] h-full flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 transition-all duration-300 sm:min-h-[178px] sm:p-6 ${darkTile ? 'hover:-translate-y-1 hover:shadow-[0_18px_30px_-20px_rgba(24,40,28,0.45)]' : 'hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_26px_-22px_rgba(24,40,28,0.32)]'}`} style={darkTile ? { background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: '0 10px 22px -18px rgba(24,40,28,0.28)' } : { background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.primary, border: `1px solid ${HOME_COLORS.outlineVariant}22` }}>
                      {darkTile && <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-opacity duration-700 group-hover:opacity-100" style={{ background: `${HOME_COLORS.primaryFixed}1f`, opacity: 0.45 }} />}
                      <div>
                        <div className="mb-4 flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: darkTile ? 'rgba(255,255,255,0.1)' : HOME_COLORS.primary, color: darkTile ? HOME_COLORS.primaryFixed : HOME_COLORS.onPrimary }}><Building2 size={18} /></div><span className="rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em]" style={{ background: darkTile ? `${HOME_COLORS.primaryFixed}22` : `${HOME_COLORS.primary}0d`, color: darkTile ? HOME_COLORS.primaryFixed : HOME_COLORS.primary }}>{selected ? 'Active workspace' : 'Workspace'}</span></div>
                        <h3 className="text-xl sm:text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{workspace.name}</h3>
                        <p className="mt-4 max-w-md text-sm leading-6" style={{ color: darkTile ? 'rgba(255,255,255,0.55)' : HOME_COLORS.onSurfaceVariant }}>{workspace.description || 'Add a short description so your team knows what this workspace is for.'}</p>
                      </div>
                      <div className="flex items-end justify-between border-t pt-6" style={{ borderColor: darkTile ? 'rgba(255,255,255,0.1)' : `${HOME_COLORS.primary}12` }}><div className="flex gap-6"><WorkspaceStat value={counts.personas} label="Personas" /><WorkspaceStat value={counts.interviews} label="Interviews" /><WorkspaceStat value={counts.reports} label="Reports" /></div><span className="flex h-9 w-9 items-center justify-center rounded-full transition-colors" style={{ background: darkTile ? HOME_COLORS.primaryFixed : HOME_COLORS.primary, color: darkTile ? HOME_COLORS.onPrimaryFixed : HOME_COLORS.onPrimary }}><ChevronDown size={15} className={selected ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} /></span></div>
                    </div>
                  </button>
                })}
              </div>
            )}
          </motion.section>

          {/* Legacy workspace layout retained as a reference while the expanded panel below is active.
          {selectedWorkspace ? false && <section className="grid grid-cols-1 gap-8 border-t pt-14 lg:grid-cols-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
            <div className="lg:col-span-8">
              <div className="rounded-[2rem] p-7 sm:p-10" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
                {isOwnerOfSelected && <div className="flex flex-wrap items-center justify-end gap-2">{editingWorkspaceName ? <><input autoFocus value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleRenameWorkspace()} className="min-w-[180px] rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none" style={{ border: '1px solid rgba(255,255,255,0.22)' }} /><button onClick={handleRenameWorkspace} disabled={savingWorkspaceName || !workspaceName.trim()} className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" style={{ background: HOME_COLORS.primaryFixed, color: HOME_COLORS.onPrimaryFixed, border: 'none', cursor: 'pointer' }}>{savingWorkspaceName ? 'Saving…' : 'Save'}</button><button onClick={() => { setEditingWorkspaceName(false); setWorkspaceName(selectedWorkspace.name) }} className="px-2 text-xs text-white/60 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button></> : <button onClick={() => { setWorkspaceName(selectedWorkspace.name); setEditingWorkspaceName(true) }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 transition-colors hover:bg-white/10 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Pencil size={12} />Edit workspace</button>}<button onClick={() => handleDeleteWorkspace(selectedWorkspace.id)} title="Delete workspace" className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'white', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button></div>}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <div className="flex flex-wrap gap-6">
                    {([{ key: 'personas', label: 'Personas' }, { key: 'interviews', label: 'Interviews' }, { key: 'reports', label: 'Reports' }] as { key: ContentTab; label: string }[]).map(tab => <button key={tab.key} onClick={() => setContentTab(tab.key)} className="border-b-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 hover:border-white/45 hover:text-white" style={{ borderColor: contentTab === tab.key ? HOME_COLORS.primaryFixed : 'transparent', color: contentTab === tab.key ? 'white' : 'rgba(255,255,255,0.45)', background: 'none', cursor: 'pointer' }}>{tab.label}</button>)}
                  </div>
                  {/* workspace_id pre-selects the Workspace dropdown on the
                      target form, so it's created as shared, not personal. * /}
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
                <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research team</p><p className="mt-2 text-sm" style={{ color: HOME_COLORS.onSurface }}>{members.length} member{members.length === 1 ? '' : 's'} with access</p></div>{isOwnerOfSelected && <button onClick={() => setInvitingOpen(open => !open)} className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-[#314536] active:scale-95" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}><UserPlus size={16} /></button>}</div>
                {isOwnerOfSelected && <AnimatePresence>{invitingOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="mt-5 flex gap-2 rounded-xl p-2" style={{ background: HOME_COLORS.surfaceContainer }}><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()} placeholder="teammate@company.com" className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" style={{ color: HOME_COLORS.onSurface }} /><button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>{inviting ? 'Sending...' : 'Invite'}</button></div></motion.div>}</AnimatePresence>}
                <div className="mt-6 space-y-3">{loadingDetail ? [1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainer }} />) : <>{members.map(member => <ResearchTeamMember key={member.id} member={member} status={memberPresenceStatus(member, presence, activity)} canRemove={(isOwnerOfSelected || member.id === currentUserId) && member.role !== 'owner'} onRemove={() => handleRemoveMember(member.id)} />)}{invites.map(invite => <PendingWorkspaceInvite key={invite.id} invite={invite} onRevoke={() => handleRevokeInvite(invite.id)} />)}</>}</div>
              </div>
              <WorkspaceAskAI workspaceId={selectedWorkspace.id} />
            </aside>
          </section> : null}
          */}
          {selectedWorkspace && <WorkspaceExpandedPanel workspace={selectedWorkspace} isOwner={isOwnerOfSelected} members={members} invites={invites} loading={loadingDetail || loadingContent} contentTab={contentTab} contentQuery={contentQuery} personas={workspacePersonas} interviews={workspaceInterviews} reports={workspaceReports} editing={editingWorkspaceName} workspaceName={workspaceName} workspaceDescription={workspaceDescription} inviteOpen={invitingOpen} inviteEmail={inviteEmail} inviting={inviting} saving={savingWorkspaceName} currentUserId={currentUserId} presence={presence} lastSeenById={lastSeenById} activity={activity} onSelectTab={setContentTab} onQueryChange={setContentQuery} onEdit={() => { setWorkspaceName(selectedWorkspace.name); setWorkspaceDescription(selectedWorkspace.description ?? ''); setEditingWorkspaceName(true) }} onNameChange={setWorkspaceName} onDescriptionChange={setWorkspaceDescription} onSave={handleRenameWorkspace} onCancelEdit={() => { setEditingWorkspaceName(false); setWorkspaceName(selectedWorkspace.name); setWorkspaceDescription(selectedWorkspace.description ?? '') }} onDelete={() => handleDeleteWorkspace(selectedWorkspace.id)} onInviteOpen={() => setInvitingOpen(open => !open)} onInviteEmailChange={setInviteEmail} onInvite={handleInvite} onRemoveMember={handleRemoveMember} onRevokeInvite={handleRevokeInvite} />}
          {selectedWorkspace && <WorkspaceIntelligence workspaceId={selectedWorkspace.id} personas={workspacePersonas} interviews={workspaceInterviews} reports={workspaceReports} />}
          {selectedWorkspace && <WorkspaceActivitySnapshot activity={activity} loading={activityLoading} members={members} />}
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

function WorkspacePortfolioOverview({ workspaces, counts }: { workspaces: Workspace[]; counts: Record<string, { personas: number; interviews: number; reports: number }> }) {
  const totals = Object.values(counts).reduce((total, current) => ({ personas: total.personas + current.personas, interviews: total.interviews + current.interviews, reports: total.reports + current.reports }), { personas: 0, interviews: 0, reports: 0 })
  return <section className="mb-9 grid gap-3 sm:grid-cols-4"><div className="rounded-[1.5rem] border p-5 sm:col-span-1" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '66' }}><p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace overview</p><p className="mt-3 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{workspaces.length}</p><p className="mt-1 text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>spaces ready for research</p></div><div className="grid grid-cols-3 divide-x overflow-hidden rounded-[1.5rem] border sm:col-span-3" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '66' }}><PortfolioMetric value={totals.personas} label="Personas" /><PortfolioMetric value={totals.interviews} label="Interviews" /><PortfolioMetric value={totals.reports} label="Reports" /></div></section>
}

function PortfolioMetric({ value, label }: { value: number; label: string }) {
  return <div className="p-5"><p className="text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{value}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{label} across workspaces</p></div>
}

function WorkspaceActivitySnapshot({ activity, loading, members }: { activity: WorkspaceActivity[]; loading: boolean; members: WorkspaceMember[] }) {
  const actor = (actorId: string | null) => members.find(member => member.id === actorId)?.full_name || members.find(member => member.id === actorId)?.email || 'A teammate'
  return <section className="mb-10 rounded-[1.5rem] border p-6 sm:p-7" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: HOME_COLORS.outlineVariant + '66' }}><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace activity</p><h2 className="mt-2 text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Recent research movement</h2></div><Activity size={18} style={{ color: HOME_COLORS.primary }} /></div><div className="mt-5 space-y-3">{loading ? <div className="h-16 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainer }} /> : activity.length ? activity.slice(0, 4).map(item => <div key={item.id} className="rounded-xl border px-4 py-3" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '55' }}><p className="text-xs" style={{ color: HOME_COLORS.onSurface }}><strong>{actor(item.actor_id)}</strong> <span style={{ color: HOME_COLORS.onSurfaceVariant }}>{item.action.replaceAll('_', ' ')}</span></p></div>) : <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Activity will appear as this team creates research.</p>}</div></section>
}

function WorkspaceExpandedPanel({ workspace, isOwner, members, invites, loading, contentTab, contentQuery, personas, interviews, reports, editing, workspaceName, workspaceDescription, inviteOpen, inviteEmail, inviting, saving, currentUserId, presence, lastSeenById, activity, onSelectTab, onQueryChange, onEdit, onNameChange, onDescriptionChange, onSave, onCancelEdit, onDelete, onInviteOpen, onInviteEmailChange, onInvite, onRemoveMember, onRevokeInvite }: {
  workspace: Workspace
  isOwner: boolean
  members: WorkspaceMember[]
  invites: WorkspaceInvite[]
  loading: boolean
  contentTab: ContentTab
  contentQuery: string
  personas: Persona[]
  interviews: (Interview & { persona: Persona })[]
  reports: (Report & { interview: Interview })[]
  editing: boolean
  workspaceName: string
  workspaceDescription: string
  inviteOpen: boolean
  inviteEmail: string
  inviting: boolean
  saving: boolean
  currentUserId: string | null
  presence: { id: string; name: string; avatarUrl: string | null }[]
  lastSeenById: Record<string, string>
  activity: WorkspaceActivity[]
  onSelectTab: (tab: ContentTab) => void
  onQueryChange: (value: string) => void
  onEdit: () => void
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSave: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onInviteOpen: () => void
  onInviteEmailChange: (value: string) => void
  onInvite: () => void
  onRemoveMember: (id: string) => void
  onRevokeInvite: (id: string) => void
}) {
  return <motion.article initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="mb-10 overflow-hidden rounded-[2rem] border shadow-[0_22px_44px_-36px_rgba(24,40,28,0.42)]" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '66' }}>
    <div className="grid grid-cols-1 lg:grid-cols-12">
      <section className="p-6 sm:p-8 lg:col-span-8 lg:p-10">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace context</p>{editing ? <div className="mt-3 space-y-2"><input autoFocus value={workspaceName} onChange={event => onNameChange(event.target.value)} onKeyDown={event => event.key === 'Enter' && onSave()} className="w-full max-w-md rounded-xl border px-3 py-2 text-lg outline-none" style={{ background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.onSurface, borderColor: HOME_COLORS.outlineVariant }} /><textarea value={workspaceDescription} onChange={event => onDescriptionChange(event.target.value)} maxLength={360} placeholder="What is this workspace for?" className="min-h-[72px] w-full max-w-lg resize-y rounded-xl border p-3 text-sm leading-relaxed outline-none" style={{ background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.onSurface, borderColor: HOME_COLORS.outlineVariant }} /><div className="flex gap-2"><button type="button" onClick={onSave} disabled={saving || !workspaceName.trim()} className="rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>{saving ? 'Saving…' : 'Save changes'}</button><button type="button" onClick={onCancelEdit} className="px-3 text-xs font-semibold" style={{ color: HOME_COLORS.onSurfaceVariant }}>Cancel</button></div></div> : <><h2 className="mt-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{workspace.name}</h2><p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{workspace.description || 'Add a short description to help your team understand the purpose of this workspace.'}</p></>}</div>
          {isOwner && !editing && <div className="flex items-center gap-1"><button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#e4e8e2]" style={{ color: HOME_COLORS.onSurfaceVariant, background: 'transparent', border: 'none', cursor: 'pointer' }}><Pencil size={12} />Edit</button><button type="button" onClick={onDelete} aria-label="Delete workspace" className="rounded-full p-2 transition-colors hover:bg-[#f5e9e7]" style={{ color: HOME_COLORS.onSurfaceVariant, background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={15} /></button></div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: HOME_COLORS.outlineVariant + '88' }}><div className="flex flex-wrap gap-6">{([{ key: 'personas', label: 'Personas' }, { key: 'interviews', label: 'Interviews' }, { key: 'reports', label: 'Reports' }] as { key: ContentTab; label: string }[]).map(tab => <button key={tab.key} type="button" onClick={() => onSelectTab(tab.key)} className="border-b-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors" style={{ borderColor: contentTab === tab.key ? HOME_COLORS.primary : 'transparent', color: contentTab === tab.key ? HOME_COLORS.primary : HOME_COLORS.onSurfaceVariant, background: 'none', cursor: 'pointer' }}>{tab.label}</button>)}</div>{contentTab === 'personas' && <Link href={`/personas/new?workspace_id=${workspace.id}`} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.primary }}><Plus size={12} />New persona</Link>}{contentTab === 'interviews' && <Link href={`/interviews/new?workspace_id=${workspace.id}`} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.primary }}><Plus size={12} />New interview</Link>}</div>
        <div className="mt-6 flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: HOME_COLORS.outlineVariant + '88' }}><Search size={16} style={{ color: HOME_COLORS.onSurfaceVariant }} /><input value={contentQuery} onChange={event => onQueryChange(event.target.value)} placeholder={`Filter ${contentTab}...`} className="min-w-0 flex-1 bg-transparent text-sm outline-none" style={{ color: HOME_COLORS.onSurface }} /></div>
        <div className="mt-7">{loading ? <div className="h-32 animate-pulse rounded-2xl" style={{ background: HOME_COLORS.surfaceContainerLow }} /> : <WorkspaceContent tab={contentTab} query={contentQuery} personas={personas} interviews={interviews} reports={reports} />}</div>
      </section>
      <aside className="border-t p-6 sm:p-8 lg:col-span-4 lg:border-l lg:border-t-0 lg:p-10" style={{ background: '#fcfaf9', borderColor: HOME_COLORS.outlineVariant + '88' }}>
        <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research team</p><p className="mt-2 text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{members.length} member{members.length === 1 ? '' : 's'}</p></div>{isOwner && <button type="button" onClick={onInviteOpen} className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[#314536]" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}><UserPlus size={17} /></button>}</div>
        {isOwner && <AnimatePresence>{inviteOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="mt-6 flex gap-2 rounded-2xl border p-1.5" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '88' }}><input type="email" value={inviteEmail} onChange={event => onInviteEmailChange(event.target.value)} onKeyDown={event => event.key === 'Enter' && onInvite()} placeholder="Add teammate..." className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" style={{ color: HOME_COLORS.onSurface }} /><button type="button" onClick={onInvite} disabled={inviting || !inviteEmail.trim()} className="rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] disabled:opacity-40" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}>{inviting ? 'Sending' : 'Invite'}</button></div></motion.div>}</AnimatePresence>}
        <div className="mt-7 space-y-3">{members.map(member => <ResearchTeamMember key={member.id} member={member} status={memberPresenceStatus(member, presence, lastSeenById, activity)} canRemove={(isOwner || member.id === currentUserId) && member.role !== 'owner'} onRemove={() => onRemoveMember(member.id)} />)}{invites.map(invite => <PendingWorkspaceInvite key={invite.id} invite={invite} onRevoke={() => onRevokeInvite(invite.id)} />)}</div>
        <div className="my-8 h-px" style={{ background: HOME_COLORS.outlineVariant + '88' }} />
        <WorkspaceAskAI workspaceId={workspace.id} />
      </aside>
    </div>
  </motion.article>
}

function memberPresenceStatus(member: WorkspaceMember, presence: { id: string }[], lastSeenById: Record<string, string>, activity: WorkspaceActivity[]) {
  if (presence.some(person => person.id === member.id)) return 'Active now'
  const lastSeen = lastSeenById[member.id] ?? member.last_seen_at
  if (lastSeen) return formatLastSeen(lastSeen)
  const latestAction = activity.find(item => item.actor_id === member.id)
  if (!latestAction) return 'No recent activity'
  return formatLastSeen(latestAction.created_at)
}

function formatLastSeen(timestamp: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000))
  return minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`
}

function ResearchTeamMember({ member, status, canRemove, onRemove }: { member: WorkspaceMember; status: string; canRemove: boolean; onRemove: () => void }) {
  const active = status === 'Active now'
  return <div className="group flex items-center justify-between gap-3 rounded-xl px-1 py-1.5">
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-9 w-9 flex-shrink-0 overflow-visible rounded-full"><div className="h-9 w-9 overflow-hidden rounded-full"><PersonaAvatar avatarUrl={member.avatar_url} avatarInitials={getInitials(member.full_name || member.email)} avatarColor={getAvatarColor(member.full_name || member.email)} name={member.full_name ?? member.email} size="sm" /></div>{active && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2" style={{ background: '#54c76d', borderColor: HOME_COLORS.surfaceContainerLow }} />}</div>
      <div className="min-w-0"><p className="truncate text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{member.full_name || member.email}</p><p className="text-[9px] uppercase tracking-wider" style={{ color: active ? HOME_COLORS.primary : HOME_COLORS.onSurfaceVariant }}>{member.role} · {status}</p></div>
    </div>
    {canRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${member.full_name || member.email}`} className="rounded-full p-1.5 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[#e4e8e2]" style={{ color: HOME_COLORS.onSurfaceVariant, background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={14} /></button>}
  </div>
}

function PendingWorkspaceInvite({ invite, onRevoke }: { invite: WorkspaceInvite; onRevoke: () => void }) {
  return <div className="group flex items-center justify-between gap-3 rounded-xl border border-dashed p-3" style={{ borderColor: HOME_COLORS.outlineVariant + '88' }}>
    <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: HOME_COLORS.surfaceContainer }}><UserPlus size={15} style={{ color: HOME_COLORS.onSurfaceVariant }} /></div><div className="min-w-0"><p className="truncate text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{invite.invited_email}</p><p className="text-[9px] uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>Pending invitation</p></div></div>
    <button type="button" onClick={onRevoke} aria-label={`Revoke invitation for ${invite.invited_email}`} className="rounded-full p-1.5 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[#e4e8e2]" style={{ color: HOME_COLORS.onSurfaceVariant, background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
  </div>
}

function WorkspaceIntelligence({ workspaceId = 'workspace', personas, interviews, reports }: { workspaceId?: string; personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[] }) {
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
  const selectedDetail = activeNode === 'overview'
    ? 'Select a persona, report, or theme to inspect how research is connected in this workspace.'
    : activeNode.startsWith('theme:')
      ? (() => { const title = activeNode.slice(6); const supportingReports = reports.filter(report => report.key_themes?.some(theme => theme.title === title)); const quote = supportingReports.flatMap(report => report.key_themes?.find(theme => theme.title === title)?.quotes ?? [])[0]; return `${title} appears across ${supportingReports.length} report${supportingReports.length === 1 ? '' : 's'}${quote ? `. Evidence: “${quote}”` : '.'}` })()
      : activeNode.startsWith('persona:')
        ? (() => { const persona = personas.find(item => item.id === activeNode.slice(8)); const linkedInterviews = interviews.filter(interview => interview.persona_id === persona?.id); const linkedReports = reports.filter(report => linkedInterviews.some(interview => interview.id === report.interview_id)); return `${persona?.name ?? 'This persona'} connects to ${linkedInterviews.length} interview${linkedInterviews.length === 1 ? '' : 's'} and ${linkedReports.length} report${linkedReports.length === 1 ? '' : 's'}.` })()
        : activeNode.startsWith('interview:')
          ? (() => { const interview = interviews.find(item => item.id === activeNode.slice(10)); const report = reports.find(item => item.interview_id === interview?.id); return `${interview?.title ?? 'This interview'} connects ${interview?.persona?.name ?? 'its persona'} to ${report ? 'a generated report' : 'no report yet'}.` })()
          : (() => { const report = reports.find(item => item.id === activeNode.slice(7)); return `${report?.interview?.title ?? 'This report'} is supported by ${report?.key_themes?.length ?? 0} extracted theme${(report?.key_themes?.length ?? 0) === 1 ? '' : 's'}.` })()

  return <section className="mb-9 border-t pt-8" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
    <div className="rounded-[1.5rem] border p-4 sm:p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}>
    <div className="inline-flex rounded-full p-1" style={{ background: HOME_COLORS.surfaceContainerLow }}>{([{ key: 'analytics', label: 'Analytics' }, { key: 'insights', label: 'Insight graph' }] as const).map(tab => <button key={tab.key} type="button" onClick={() => setIntelligenceTab(tab.key)} className="rounded-full px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.13em] transition-all duration-200" style={{ background: intelligenceTab === tab.key ? HOME_COLORS.surfaceContainerLowest : 'transparent', color: intelligenceTab === tab.key ? HOME_COLORS.primary : HOME_COLORS.onSurfaceVariant, boxShadow: intelligenceTab === tab.key ? '0 2px 6px rgba(24,40,28,.12)' : 'none' }}>{tab.label}</button>)}</div>
    <div className={`mt-5 p-2 sm:p-3 ${intelligenceTab === 'analytics' ? 'block' : 'hidden'}`}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace analytics</p><h2 className="mt-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Research momentum</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}><BarChart3 size={18} /></span></div>
      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl" style={{ background: `${HOME_COLORS.outlineVariant}55` }}>
        <AnalyticsMetric value={recentResearch} label="New items / 30 days" />
        <AnalyticsMetric value={reports.length ? `${averageConfidence}%` : '—'} label="Average confidence" />
        <AnalyticsMetric value={`${completionRate}%`} label="Interview completion" />
        <AnalyticsMetric value={themes.length} label="Recurring themes" />
      </div>
      <div className="mt-7"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Leading themes</span><TrendingUp size={14} style={{ color: HOME_COLORS.primary }} /></div>{themes.length ? <div className="space-y-3">{themes.map(theme => <div key={theme.title}><div className="mb-1.5 flex justify-between gap-4 text-xs" style={{ color: HOME_COLORS.onSurface }}><span className="truncate">{theme.title}</span><span className="shrink-0" style={{ color: HOME_COLORS.onSurfaceVariant }}>{theme.count} report{theme.count === 1 ? '' : 's'}</span></div><div className="h-1 overflow-hidden rounded-full" style={{ background: HOME_COLORS.surfaceContainer }}><div className="h-full rounded-full" style={{ width: `${Math.max(12, (theme.count / themes[0].count) * 100)}%`, background: HOME_COLORS.primary }} /></div></div>)}</div> : <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Generate reports to start tracking research confidence and recurring themes.</p>}</div>
    </div>
    <div className={`mt-5 overflow-hidden rounded-[1.25rem] p-6 sm:p-7 ${intelligenceTab === 'insights' ? 'block' : 'hidden'}`} style={{ background: HOME_COLORS.primary }}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primaryFixed }}>Insight graph</p><h2 className="mt-2 text-2xl text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>How your research connects</h2></div><Network size={19} style={{ color: HOME_COLORS.primaryFixed }} /></div>
      <EvidenceGraph workspaceId={workspaceId} personas={personas} interviews={interviews} reports={reports} activeNode={activeNode} onSelect={setActiveNode} />
      <p className="mt-4 text-xs leading-relaxed text-white/65">{selectedDetail}</p>
    </div>
    </div>
  </section>
}

function AnalyticsMetric({ value, label }: { value: string | number; label: string }) {
  return <div className="bg-[#fcf9f8] p-4"><strong className="block text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{value}</strong><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{label}</span></div>
}

function WorkspaceAskAI({ workspaceId }: { workspaceId: string }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')

  const ask = async () => {
    if (!question.trim() || asking) return
    setAsking(true); setError(''); setAnswer('')
    try {
      const response = await fetch('/api/workspaces/' + workspaceId + '/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to answer that question.')
      setAnswer(json.data.answer)
    } catch (err: any) {
      setError(err?.message ?? 'Unable to answer that question.')
    } finally {
      setAsking(false)
    }
  }

  return <section>
    <div className="flex items-center gap-2"><Sparkles size={17} style={{ color: HOME_COLORS.primary }} /><h2 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Ask AI</h2></div>
    <p className="mt-2 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Cross-reference workspace research for immediate, evidence-backed answers.</p>
    <div className="mt-5 rounded-2xl border px-3 py-3" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '88' }}>
      <div className="flex items-center gap-2"><Sparkles size={14} className="shrink-0" style={{ color: HOME_COLORS.onSurfaceVariant }} /><input value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void ask() } }} placeholder="Ask about this workspace..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" style={{ color: HOME_COLORS.onSurface }} /></div>
    </div>
    <button type="button" onClick={ask} disabled={!question.trim() || asking} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-[#314536] disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>{asking ? <Loader2 size={13} className="animate-spin" /> : 'Ask AI'}</button>
    {error && <p className="mt-3 text-xs" style={{ color: HOME_COLORS.error }}>{error}</p>}
    {answer && <p className="mt-4 whitespace-pre-wrap rounded-xl p-3 text-xs leading-relaxed" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface }}>{answer}</p>}
  </section>
}

function EvidenceGraph({ workspaceId, personas, interviews, reports, activeNode, onSelect }: { workspaceId: string; personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[]; activeNode: string; onSelect: (id: string) => void }) {
  const reportByInterviewId = new Map(reports.map(report => [report.interview_id, report]))
  const untestedPersonas = personas.filter(persona => !interviews.some(interview => interview.persona_id === persona.id))
  const [contentFilter, setContentFilter] = useState<'all' | 'reports' | 'themes'>('all')
  const [minimumConfidence, setMinimumConfidence] = useState(0)
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'mixed' | 'neutral' | 'negative'>('all')
  const passesFilter = (report?: Report) => {
    if (contentFilter === 'reports' && !report) return false
    if (contentFilter === 'themes' && !report?.key_themes?.length) return false
    if ((report?.confidence_score ?? 0) < minimumConfidence) return false
    if (sentimentFilter !== 'all' && !report?.key_themes?.some(theme => theme.sentiment === sentimentFilter)) return false
    return true
  }
  const personaGroups = personas
    .map(persona => ({
      persona,
      items: interviews
        .filter(interview => interview.persona_id === persona.id)
        .map(interview => ({ interview, report: reportByInterviewId.get(interview.id) }))
        .filter(item => passesFilter(item.report)),
    }))
    .filter(group => group.items.length > 0)
  const totalPaths = personaGroups.reduce((sum, group) => sum + group.items.length, 0)

  return <div className="mt-7 overflow-hidden rounded-xl border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">Traceable evidence paths</p><p className="mt-1 text-xs text-white/65">Follow a source from persona through the research it generated.</p></div>{activeNode !== 'overview' && <button type="button" onClick={() => onSelect('overview')} className="rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-white/10" style={{ color: HOME_COLORS.primaryFixed, borderColor: 'rgba(255,255,255,0.18)', background: 'transparent' }}>Clear focus</button>}</div>
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><GraphFilter label="Evidence" value={contentFilter} onChange={value => setContentFilter(value as 'all' | 'reports' | 'themes')} options={[['all', 'All'], ['reports', 'Reports'], ['themes', 'Themes']]} /><GraphFilter label="Confidence" value={String(minimumConfidence)} onChange={value => setMinimumConfidence(Number(value))} options={[[String(0), 'Any score'], [String(50), '50%+'], [String(75), '75%+']]} /><GraphFilter label="Sentiment" value={sentimentFilter} onChange={value => setSentimentFilter(value as 'all' | 'positive' | 'mixed' | 'neutral' | 'negative')} options={[['all', 'All'], ['positive', 'Positive'], ['mixed', 'Mixed'], ['neutral', 'Neutral'], ['negative', 'Negative']]} /><span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">{totalPaths} path{totalPaths === 1 ? '' : 's'}</span></div>
    <div className="max-h-[460px] overflow-y-auto overflow-x-auto p-4">
      {personaGroups.length ? <div className="space-y-5">{personaGroups.map(group => {
        const personaNodeId = `persona:${group.persona.id}`
        const groupNodeIds = group.items.flatMap(item => [`interview:${item.interview.id}`, item.report && `report:${item.report.id}`, ...(item.report?.key_themes ?? []).map(theme => `theme:${theme.title}`)]).filter(Boolean) as string[]
        const groupDimmed = activeNode !== 'overview' && activeNode !== personaNodeId && !groupNodeIds.includes(activeNode)
        return <div key={group.persona.id} className={`transition-opacity duration-200 ${groupDimmed ? 'opacity-30' : 'opacity-100'}`}>
          <EvidenceNode kind="Persona" label={group.persona.name} active={activeNode === personaNodeId} onClick={() => onSelect(personaNodeId)} />
          <div className="mt-2.5 ml-4 min-w-[520px] space-y-2.5 border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
            {group.items.map(item => {
              const report = item.report
              const nodeIds = [`interview:${item.interview.id}`, report && `report:${report.id}`, ...(report?.key_themes ?? []).map(theme => `theme:${theme.title}`)].filter(Boolean) as string[]
              const dimmed = activeNode !== 'overview' && activeNode !== personaNodeId && !nodeIds.includes(activeNode)
              return <div key={item.interview.id} className={`grid grid-cols-[minmax(140px,1fr)_18px_minmax(140px,1fr)_18px_minmax(170px,1.3fr)] items-center gap-1.5 transition-opacity duration-200 ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
                <EvidenceNode kind="Interview" label={item.interview.title} active={activeNode === `interview:${item.interview.id}`} onClick={() => onSelect(`interview:${item.interview.id}`)} />
                <GraphArrow />
                {report ? <EvidenceNode kind="Report" label={report.interview?.title ?? item.interview.title} active={activeNode === `report:${report.id}`} onClick={() => onSelect(`report:${report.id}`)} /> : <div className="rounded-lg border border-dashed px-3 py-2 text-center text-[9px] uppercase tracking-[0.1em] text-white/35" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>No report yet</div>}
                <GraphArrow />
                <div className="flex flex-wrap gap-1.5">{report?.key_themes?.length ? report.key_themes.slice(0, 3).map(theme => <EvidenceNode key={theme.title} kind="Theme" label={theme.title} active={activeNode === `theme:${theme.title}`} onClick={() => onSelect(`theme:${theme.title}`)} />) : <span className="text-[10px] text-white/35">Themes appear after report generation</span>}</div>
              </div>
            })}
          </div>
        </div>
      })}</div> : <div className="py-10 text-center"><p className="text-sm text-white/65">{interviews.length ? 'No evidence paths match these filters.' : 'Create an interview in this workspace to begin an evidence path.'}</p>{!interviews.length && untestedPersonas.length > 0 && <div className="mt-4 flex flex-wrap justify-center gap-2">{untestedPersonas.map(persona => <EvidenceNode key={persona.id} kind="Persona" label={persona.name} active={activeNode === `persona:${persona.id}`} onClick={() => onSelect(`persona:${persona.id}`)} />)}</div>}</div>}
    </div>
    <EvidenceDetail activeNode={activeNode} personas={personas} interviews={interviews} reports={reports} />
  </div>
}

function GraphFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="flex flex-col gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/45">{label}<select value={value} onChange={event => onChange(event.target.value)} className="rounded-lg border px-2 py-1.5 text-[10px] font-semibold normal-case tracking-normal outline-none" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', borderColor: 'rgba(255,255,255,0.16)' }}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue} style={{ color: HOME_COLORS.onSurface }}>{optionLabel}</option>)}</select></label>
}

function EvidenceDetail({ activeNode, personas, interviews, reports }: { activeNode: string; personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[] }) {
  if (activeNode === 'overview') return <div className="border-t px-4 py-4 text-xs leading-relaxed text-white/55" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Select any node to inspect its supporting research and navigate directly to the source.</div>

  const detailStyle = { borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)' }
  if (activeNode.startsWith('persona:')) {
    const persona = personas.find(item => item.id === activeNode.slice(8))
    if (!persona) return null
    const linkedInterviews = interviews.filter(interview => interview.persona_id === persona.id)
    return <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="flex items-center justify-between gap-4"><div><p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primaryFixed }}>Persona evidence</p><h3 className="mt-1 text-base font-semibold text-white">{persona.name}</h3><p className="mt-1 text-xs text-white/55">{linkedInterviews.length} linked interview{linkedInterviews.length === 1 ? '' : 's'}.</p></div><Link href={`/personas/${persona.id}`} className="rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10" style={detailStyle}>Open persona</Link></div></div>
  }
  if (activeNode.startsWith('interview:')) {
    const interview = interviews.find(item => item.id === activeNode.slice(10))
    if (!interview) return null
    const report = reports.find(item => item.interview_id === interview.id)
    return <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="flex items-center justify-between gap-4"><div><p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primaryFixed }}>Interview evidence</p><h3 className="mt-1 text-base font-semibold text-white">{interview.title}</h3><p className="mt-1 text-xs text-white/55">{interview.persona?.name ?? 'Participant'} · {report ? 'Report available' : 'No report generated yet'}</p></div><Link href={`/interviews/${interview.id}`} className="rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10" style={detailStyle}>Open interview</Link></div></div>
  }
  if (activeNode.startsWith('report:')) {
    const report = reports.find(item => item.id === activeNode.slice(7))
    if (!report) return null
    return <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="flex items-center justify-between gap-4"><div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primaryFixed }}>Report evidence</p><h3 className="mt-1 truncate text-base font-semibold text-white">{report.interview?.title ?? 'Insight report'}</h3><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">{report.executive_summary}</p></div><Link href={`/reports/${report.id}`} className="shrink-0 rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10" style={detailStyle}>Open report</Link></div></div>
  }

  const title = activeNode.slice(6)
  const supportingReports = reports.filter(report => report.key_themes?.some(theme => theme.title === title))
  const evidence = supportingReports.flatMap(report => (report.key_themes?.find(theme => theme.title === title)?.quotes ?? []).slice(0, 2).map(quote => ({ report, quote }))).slice(0, 4)
  return <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primaryFixed }}>Theme evidence · {supportingReports.length} report{supportingReports.length === 1 ? '' : 's'}</p><h3 className="mt-1 text-base font-semibold text-white">{title}</h3>{evidence.length ? <div className="mt-3 space-y-2">{evidence.map(({ report, quote }, index) => <Link key={index} href={`/reports/${report.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-white/10" style={detailStyle}><p className="text-xs leading-relaxed text-white/75">“{quote}”</p><p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: HOME_COLORS.primaryFixed }}>{report.interview?.title ?? 'Open source report'}</p></Link>)}</div> : <p className="mt-3 text-xs text-white/55">This theme is connected to the listed report evidence.</p>}</div>
}

const EVIDENCE_NODE_STYLES: Record<'Persona' | 'Interview' | 'Report' | 'Theme', { bg: string; border: string; accent: string }> = {
  Persona: { bg: 'rgba(212,232,213,0.16)', border: 'rgba(212,232,213,0.45)', accent: '#d4e8d5' },
  Interview: { bg: 'rgba(255,255,255,0.11)', border: 'rgba(255,255,255,0.3)', accent: '#dfe4da' },
  Report: { bg: 'rgba(245,234,220,0.16)', border: 'rgba(245,234,220,0.45)', accent: '#f5eadc' },
  Theme: { bg: 'rgba(233,229,238,0.16)', border: 'rgba(233,229,238,0.45)', accent: '#e9e5ee' },
}

function EvidenceNode({ kind, label, active, onClick }: { kind: 'Persona' | 'Interview' | 'Report' | 'Theme'; label: string; active: boolean; onClick: () => void }) {
  const style = EVIDENCE_NODE_STYLES[kind]
  return <button type="button" onClick={onClick} title={label} className="min-w-0 rounded-lg border px-3.5 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110" style={{ background: active ? HOME_COLORS.primaryFixed : style.bg, borderColor: active ? HOME_COLORS.primaryFixed : style.border, color: active ? HOME_COLORS.onPrimaryFixed : 'white' }}><span className="block text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: active ? HOME_COLORS.onPrimaryFixed : style.accent }}>{kind}</span><span className="mt-1 block truncate text-xs font-semibold">{label}</span></button>
}

function GraphArrow() {
  return <svg width="18" height="10" viewBox="0 0 18 10" className="mx-auto shrink-0" aria-hidden="true"><line x1="0" y1="5" x2="11" y2="5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" /><path d="M9 1.5 L15 5 L9 8.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function WorkspaceKnowledgeHub({ workspaceId }: { workspaceId: string }) {
  const [sources, setSources] = useState<WorkspaceSource[]>([])
  const [context, setContext] = useState<WorkspaceContext | null>(null)
  const [brief, setBrief] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [knowledgeAvailable, setKnowledgeAvailable] = useState(true)

  const loadKnowledge = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`)
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setSources(json.data?.sources ?? [])
      setContext(json.data?.context ?? null)
      setBrief(json.data?.context?.content ?? '')
      setKnowledgeAvailable(true)
    } catch (err: any) {
      if ((err?.message ?? '').includes('workspace_sources') || (err?.message ?? '').includes('schema cache')) {
        setKnowledgeAvailable(false)
        setError('')
      } else {
        setError(err.message ?? 'Could not load workspace knowledge')
      }
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

  if (!knowledgeAvailable) return <section className="mb-14 border-t pt-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}><div className="rounded-[1.5rem] border p-6" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '55' }}><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace knowledge</p><h2 className="mt-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Shared context hub</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Shared sources and workspace context will be ready here once workspace knowledge is activated.</p></div></section>

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
        {filtered.slice(0, 6).map(persona => <Link key={persona.id} href={`/personas/${persona.id}`} className="flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-white hover:shadow-[0_8px_18px_-16px_rgba(24,40,28,0.3)]" style={{ borderColor: HOME_COLORS.outlineVariant + '88' }}><PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{persona.name}</p><p className="truncate text-[9px] uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>{persona.traits?.job_title || 'No role set'}</p></div></Link>)}
      </div>
    )
  }
  if (tab === 'interviews') {
    const filtered = interviews.filter(interview => !term || `${interview.title} ${interview.persona?.name ?? ''} ${interview.status}`.toLowerCase().includes(term))
    return filtered.length === 0 ? <EmptyContentState icon={MessagesSquare} text={term ? 'No interviews match this filter.' : 'No interviews run in this workspace yet.'} /> : (
    <div className="space-y-2">{filtered.slice(0, 6).map(interview => <Link key={interview.id} href={`/interviews/${interview.id}`} className="flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors hover:bg-white hover:shadow-[0_8px_18px_-16px_rgba(24,40,28,0.3)]" style={{ borderColor: HOME_COLORS.outlineVariant + '88' }}><div className="min-w-0"><p className="truncate text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{interview.title}</p><p className="text-[9px] uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>{interview.persona?.name ?? 'Unknown persona'}</p></div><span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.primary }}>{interview.status}</span></Link>)}</div>
    )
  }
  const filtered = reports.filter(report => !term || `${report.interview?.title ?? ''} ${report.executive_summary}`.toLowerCase().includes(term))
  return filtered.length === 0 ? <EmptyContentState icon={FileText} text={term ? 'No reports match this filter.' : 'No reports generated in this workspace yet.'} /> : (
    <div className="space-y-2">{filtered.slice(0, 6).map(report => <Link key={report.id} href={`/reports/${report.id}`} className="flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors hover:bg-white hover:shadow-[0_8px_18px_-16px_rgba(24,40,28,0.3)]" style={{ borderColor: HOME_COLORS.outlineVariant + '88' }}><div className="min-w-0"><p className="truncate text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{report.interview?.title ?? 'Untitled interview'}</p><p className="truncate text-[10px]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{report.executive_summary}</p></div><span className="text-xs font-semibold" style={{ color: HOME_COLORS.primary }}>{report.confidence_score}%</span></Link>)}</div>
  )
}

function EmptyContentState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon size={18} className="mb-2.5" style={{ color: HOME_COLORS.onSurfaceVariant }} />
      <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{text}</p>
    </div>
  )
}
