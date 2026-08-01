'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Plus, X, Trash2, Loader2, Lock, Crown, ShieldCheck, Users, Verified,
  FileText, MessagesSquare, ArrowRight, ChevronDown, UserPlus, Search, Pencil, Activity, BarChart3, Network, TrendingUp, Upload, BookOpen, Sparkles, Eye, Download, Target, AlertTriangle, CircleCheck, CircleDashed,
} from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { WorkspaceAutomations } from '@/components/workspaces/WorkspaceAutomations'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import type { Plan, Workspace, WorkspaceMember, WorkspaceInvite, WorkspaceActivity, WorkspaceSource, WorkspaceContext, Persona, Interview, Report, Signal } from '@/types'

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
          {selectedWorkspace && <WorkspaceIntelligence workspaceId={selectedWorkspace.id} personas={workspacePersonas} interviews={workspaceInterviews} reports={workspaceReports} activity={activity} members={members} />}
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

function WorkspaceActivitySnapshot({ activity, loading, members }: { activity: WorkspaceActivity[]; loading: boolean; members: WorkspaceMember[] }) {
  const actor = (actorId: string | null) => members.find(member => member.id === actorId)?.full_name || members.find(member => member.id === actorId)?.email || 'A teammate'
  return <section className="mb-10 rounded-[1.5rem] border p-6 sm:p-7" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: HOME_COLORS.outlineVariant + '66' }}><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Recent activity</p><h2 className="mt-2 text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>What your team has been working on</h2></div><Activity size={18} style={{ color: HOME_COLORS.primary }} /></div><div className="mt-5 space-y-3">{loading ? <div className="h-16 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainer }} /> : activity.length ? activity.slice(0, 4).map(item => <div key={item.id} className="rounded-xl border px-4 py-3" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '55' }}><p className="text-xs" style={{ color: HOME_COLORS.onSurface }}><strong>{actor(item.actor_id)}</strong> <span style={{ color: HOME_COLORS.onSurfaceVariant }}>{item.action.replaceAll('_', ' ')}</span></p></div>) : <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Activity will appear when your team adds research here.</p>}</div></section>
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

function WorkspaceIntelligence({ workspaceId = 'workspace', personas, interviews, reports, activity = [], members = [] }: { workspaceId?: string; personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[]; activity?: WorkspaceActivity[]; members?: WorkspaceMember[] }) {
  const [activeNode, setActiveNode] = useState('overview')
  const [intelligenceTab, setIntelligenceTab] = useState<'analytics' | 'insights'>('analytics')
  const [signals, setSignals] = useState<Signal[]>([])
  const [workspaceProjects, setWorkspaceProjects] = useState<{ id: string; name: string }[]>([])
  const [sources, setSources] = useState<WorkspaceSource[]>([])
  const [intelligenceLoading, setIntelligenceLoading] = useState(true)

  useEffect(() => {
    let active = true
    setIntelligenceLoading(true)
    const supabase = createClient()
    Promise.all([
      supabase.from('signals').select('*, project:projects!inner(workspace_id)').eq('projects.workspace_id', workspaceId),
      supabase.from('projects').select('id, name').eq('workspace_id', workspaceId).order('name'),
      fetch(`/api/workspaces/${workspaceId}/knowledge`).then(response => response.ok ? response.json() : { data: { sources: [] } }).catch(() => ({ data: { sources: [] } })),
    ]).then(([signalsResult, projectsResult, knowledge]) => {
      if (!active) return
      setSignals((signalsResult.data ?? []) as unknown as Signal[])
      setWorkspaceProjects(projectsResult.data ?? [])
      setSources(knowledge.data?.sources ?? [])
    }).finally(() => { if (active) setIntelligenceLoading(false) })
    return () => { active = false }
  }, [workspaceId])
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
          : activeNode.startsWith('signal:')
            ? (() => { const signal = signals.find(item => item.id === activeNode.slice(7)); return `${signal?.title ?? 'This signal'} is ${signal?.status ?? 'emerging'} and supported by ${signal?.related_interview_ids?.length ?? 0} linked interview${(signal?.related_interview_ids?.length ?? 0) === 1 ? '' : 's'}.` })()
            : activeNode.startsWith('source:')
              ? (() => { const source = sources.find(item => item.id === activeNode.slice(7)); return `${source?.name ?? 'This source'} is shared workspace context. It informs new research, but is not presented as direct evidence unless cited in a report.` })()
              : activeNode.startsWith('recommendation:')
                ? 'This recommended next move was generated from the connected report evidence.'
          : (() => { const report = reports.find(item => item.id === activeNode.slice(7)); return `${report?.interview?.title ?? 'This report'} is supported by ${report?.key_themes?.length ?? 0} extracted theme${(report?.key_themes?.length ?? 0) === 1 ? '' : 's'}.` })()

  return <section className="mb-9 border-t pt-8" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
    <div className="workspace-intelligence overflow-hidden rounded-[4rem] border shadow-[0_10px_40px_-10px_rgba(24,40,28,0.08)]" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: 'rgba(255,255,255,.55)' }}>
    <style>{`.workspace-insight-view > header { padding-bottom: 5rem; } .workspace-insight-view > div { position: relative; z-index: 20; margin-top: -2.5rem; }`}</style>
    <div className={intelligenceTab === 'analytics' ? 'block' : 'hidden'}><WorkspaceAnalyticsReference personas={personas} interviews={interviews} reports={reports} signals={signals} sources={sources} activity={activity} members={members} loading={intelligenceLoading} onOpenGraph={() => setIntelligenceTab('insights')} /></div>
    <div className="hidden">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace analytics</p><h2 className="mt-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Research momentum</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}><BarChart3 size={18} /></span></div>
      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl" style={{ background: `${HOME_COLORS.outlineVariant}55` }}>
        <AnalyticsMetric value={recentResearch} label="New items / 30 days" />
        <AnalyticsMetric value={reports.length ? `${averageConfidence}%` : '—'} label="Average confidence" />
        <AnalyticsMetric value={`${completionRate}%`} label="Interview completion" />
        <AnalyticsMetric value={themes.length} label="Recurring themes" />
      </div>
      <div className="mt-7"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Leading themes</span><TrendingUp size={14} style={{ color: HOME_COLORS.primary }} /></div>{themes.length ? <div className="space-y-3">{themes.map(theme => <div key={theme.title}><div className="mb-1.5 flex justify-between gap-4 text-xs" style={{ color: HOME_COLORS.onSurface }}><span className="truncate">{theme.title}</span><span className="shrink-0" style={{ color: HOME_COLORS.onSurfaceVariant }}>{theme.count} report{theme.count === 1 ? '' : 's'}</span></div><div className="h-1 overflow-hidden rounded-full" style={{ background: HOME_COLORS.surfaceContainer }}><div className="h-full rounded-full" style={{ width: `${Math.max(12, (theme.count / themes[0].count) * 100)}%`, background: HOME_COLORS.primary }} /></div></div>)}</div> : <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Generate reports to start tracking research confidence and recurring themes.</p>}</div>
    </div>
    <div className={`workspace-insight-view ${intelligenceTab === 'insights' ? 'block' : 'hidden'}`}>
      <header className="relative overflow-hidden bg-[#18281C] p-8 text-white sm:p-10"><div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Workspace intelligence</p><h2 className="text-2xl sm:text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>How your research connects</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Explore the evidence behind each signal, theme, and recommendation.</p></div><WorkspaceIntelligenceTabs active="insights" onChange={setIntelligenceTab} /></div><div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-5"><svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true"><path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87.1,-15.7,87.1,0C87.1,15.7,83.7,31.3,76.4,44.7C69.2,58.1,58.1,69.2,44.7,76.4C31.3,83.7,15.7,87.1,0,87.1C-15.7,87.1,-31.3,83.7,-44.7,76.4C-58.1,69.2,-69.2,58.1,-76.4,44.7C-83.7,31.3,-87.1,15.7,-87.1,0C-87.1,-15.7,-83.7,-31.3,-76.4,-44.7C-69.2,-58.1,-58.1,-69.2,-44.7,-76.4C-31.3,-83.7,-15.7,-87.1,0,-87.1C15.7,-87.1,31.3,-83.7,44.7,-76.4Z" fill="white" transform="translate(100 100)" /></svg></div></header>
      <div className="bg-[#18281C] px-5 pb-12 sm:px-10 sm:pb-16"><EvidenceGraph workspaceId={workspaceId} personas={personas} interviews={interviews} reports={reports} signals={signals} sources={sources} projects={workspaceProjects} activeNode={activeNode} onSelect={setActiveNode} /><p className="mt-4 text-xs leading-relaxed text-white/65">{selectedDetail}</p></div>
    </div>
    </div>
  </section>
}

function AnalyticsMetric({ value, label }: { value: string | number; label: string }) {
  return <div className="bg-[#fcf9f8] p-4"><strong className="block text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{value}</strong><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{label}</span></div>
}

function WorkspaceAnalytics({ personas, interviews, reports, signals, sources, activity, members, loading }: { personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[]; signals: Signal[]; sources: WorkspaceSource[]; activity: WorkspaceActivity[]; members: WorkspaceMember[]; loading: boolean }) {
  const now = Date.now()
  const weekStart = now - 7 * 24 * 60 * 60 * 1000
  const testedPersonas = personas.filter(persona => interviews.some(interview => interview.persona_id === persona.id))
  const testedStages = new Set(testedPersonas.map(persona => persona.funnel_stage ?? 'awareness'))
  const allStages = ['awareness', 'consideration', 'purchase', 'loyalty'] as const
  const missingStages = allStages.filter(stage => !testedStages.has(stage))
  const statusCounts = { emerging: 0, growing: 0, validated: 0 }
  signals.forEach(signal => { statusCounts[signal.status]++ })
  const newThisWeek = [...personas, ...interviews, ...reports, ...signals].filter(item => new Date(item.created_at).getTime() >= weekStart).length
  const dailyResearch = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(now - (6 - index) * 24 * 60 * 60 * 1000); start.setHours(0, 0, 0, 0)
    const end = new Date(start); end.setDate(end.getDate() + 1)
    const count = [...interviews, ...reports, ...signals].filter(item => { const time = new Date(item.created_at).getTime(); return time >= start.getTime() && time < end.getTime() }).length
    return { label: start.toLocaleDateString('en-US', { weekday: 'narrow' }), count }
  })
  const maxDay = Math.max(...dailyResearch.map(day => day.count), 1)
  const themeEvidence = new Map<string, { label: string; reports: Set<string>; sentiments: Set<string> }>()
  reports.forEach(report => report.key_themes?.forEach(theme => {
    const key = theme.title.trim().toLowerCase()
    const current = themeEvidence.get(key) ?? { label: theme.title, reports: new Set<string>(), sentiments: new Set<string>() }
    current.reports.add(report.id); current.sentiments.add(theme.sentiment); themeEvidence.set(key, current)
  }))
  const recurringThemes = [...themeEvidence.values()].filter(theme => theme.reports.size >= 2).sort((a, b) => b.reports.size - a.reports.size)
  const conflictedThemes = recurringThemes.filter(theme => theme.sentiments.size > 1)
  const impactRank: Record<string, number> = { high: 3, medium: 2, low: 1 }
  const opportunities = signals.filter(signal => signal.type === 'opportunity').sort((a, b) => (impactRank[b.impact ?? 'low'] - impactRank[a.impact ?? 'low']) || b.confidence_score - a.confidence_score).slice(0, 3)
  const risks = signals.filter(signal => signal.type === 'risk' || signal.type === 'objection' || signal.type === 'pain_point').sort((a, b) => (impactRank[b.impact ?? 'low'] - impactRank[a.impact ?? 'low']) || b.confidence_score - a.confidence_score).slice(0, 3)
  const needsMoreEvidence = signals.filter(signal => signal.status === 'emerging').slice(0, 2)
  const decision = !reports.length
    ? { title: 'Needs a first report', detail: 'Generate a report from an interview to begin building workspace evidence.', tone: HOME_COLORS.secondaryContainer }
    : conflictedThemes.length > 0
      ? { title: 'Mixed evidence', detail: `${conflictedThemes.length} recurring theme${conflictedThemes.length === 1 ? ' has' : 's have'} conflicting sentiment across reports.`, tone: '#fff1d6' }
      : statusCounts.validated >= 2 && testedPersonas.length >= Math.max(2, Math.ceil(personas.length * 0.6))
        ? { title: 'Ready to inform a decision', detail: 'Multiple findings are supported by repeated research across the workspace.', tone: '#e4f2e7' }
        : { title: 'Needs more evidence', detail: statusCounts.emerging ? `${statusCounts.emerging} signal${statusCounts.emerging === 1 ? ' has' : 's have'} only one supporting source.` : 'Run more interviews to build a stronger evidence base.', tone: '#fff1d6' }
  const nextAction = !reports.length
    ? 'Generate a report from your most useful completed interview.'
    : needsMoreEvidence.length ? `Test “${needsMoreEvidence[0].title}” with another research source.`
      : personas.length && testedPersonas.length < personas.length ? `Run an interview with ${personas.find(persona => !testedPersonas.some(tested => tested.id === persona.id))?.name ?? 'an untested persona'}.`
        : missingStages.length ? `Add research for the ${missingStages[0]} stage.`
          : sources.length === 0 ? 'Add background materials so the team has shared context.'
            : 'Review the strongest opportunity and choose a next experiment.'
  const contributions = [...activity.reduce((map, event) => map.set(event.actor_id ?? 'unknown', (map.get(event.actor_id ?? 'unknown') ?? 0) + 1), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const memberName = (id: string) => members.find(member => member.id === id)?.full_name || members.find(member => member.id === id)?.email || 'A teammate'

  if (loading) return <div className="mt-5 h-72 animate-pulse rounded-[1.25rem]" style={{ background: HOME_COLORS.surfaceContainerLow }} />

  return <div className="p-2 sm:p-3"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Workspace analytics</p><h2 className="mt-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Research at a glance</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>See what has been tested, where the evidence is strongest, and what to do next.</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}><BarChart3 size={18} /></span></div>
    <div className="mt-7 grid overflow-hidden rounded-xl border sm:grid-cols-4" style={{ borderColor: `${HOME_COLORS.outlineVariant}66` }}><AnalyticsMetric value={personas.length + interviews.length + reports.length} label="Research completed" /><AnalyticsMetric value={statusCounts.validated} label="Validated signals" /><AnalyticsMetric value={`${testedPersonas.length}/${personas.length}`} label="Personas tested" /><AnalyticsMetric value={newThisWeek} label="New this week" /></div>
    <div className="mt-6 grid gap-4 lg:grid-cols-12"><section className="rounded-xl border p-5 lg:col-span-7" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}66` }}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Decision readiness</p><h3 className="mt-2 text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{decision.title}</h3><p className="mt-2 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{decision.detail}</p></div><CircleCheck size={20} style={{ color: HOME_COLORS.primary }} /></div><div className="mt-5 rounded-lg p-4" style={{ background: decision.tone }}><p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: HOME_COLORS.primary }}>Next best action</p><p className="mt-2 text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{nextAction}</p></div></section><section className="rounded-xl border p-5 lg:col-span-5" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}><p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Evidence strength</p><div className="mt-4 grid grid-cols-3 gap-2"><EvidenceStatus value={statusCounts.emerging} label="Emerging" detail="1 source" /><EvidenceStatus value={statusCounts.growing} label="Growing" detail="2–3 sources" /><EvidenceStatus value={statusCounts.validated} label="Validated" detail="4+ sources" /></div><p className="mt-4 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>A source can be an interview, comparison, audience test, or concept test that supports the same signal.</p></section></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-3"><InsightList title="Top opportunities" icon={<Target size={16} />} items={opportunities.map(signal => signal.title)} empty="Opportunities will appear as signals are generated." /><InsightList title="Risks to address" icon={<AlertTriangle size={16} />} items={risks.map(signal => signal.title)} empty="No major risks have been identified yet." /><InsightList title="Research gaps" icon={<CircleDashed size={16} />} items={[...(testedPersonas.length < personas.length ? [`${personas.length - testedPersonas.length} persona${personas.length - testedPersonas.length === 1 ? ' has' : 's have'} not been interviewed`] : []), ...(missingStages.length ? [`No tested research in: ${missingStages.join(', ')}`] : []), ...needsMoreEvidence.map(signal => `Needs another source: ${signal.title}`)].slice(0, 3)} empty="No clear gaps right now." /></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-12"><section className="rounded-xl border p-5 lg:col-span-7" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research momentum</p><p className="mt-1 text-sm" style={{ color: HOME_COLORS.onSurface }}>Interviews, reports, and signals added in the last 7 days.</p></div><TrendingUp size={16} style={{ color: HOME_COLORS.primary }} /></div><div className="mt-6 flex h-24 items-end gap-2">{dailyResearch.map(day => <div key={day.label} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md" style={{ height: `${Math.max(6, (day.count / maxDay) * 100)}%`, background: day.count ? HOME_COLORS.primary : HOME_COLORS.surfaceContainer }} /><span className="text-[9px]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{day.label}</span></div>)}</div></section><section className="rounded-xl border p-5 lg:col-span-5" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}66` }}><p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Agreement and disagreement</p><p className="mt-2 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{recurringThemes.length ? `${recurringThemes.length} recurring theme${recurringThemes.length === 1 ? '' : 's'} found across reports.` : 'Generate more reports to compare recurring themes.'}</p><p className="mt-2 text-xs leading-relaxed" style={{ color: conflictedThemes.length ? '#9b5a00' : HOME_COLORS.onSurfaceVariant }}>{conflictedThemes.length ? `${conflictedThemes.length} theme${conflictedThemes.length === 1 ? '' : 's'} show mixed reactions: ${conflictedThemes.slice(0, 2).map(theme => theme.label).join(', ')}.` : recurringThemes.length ? 'No conflicting sentiment was found in the recurring themes.' : ''}</p></section></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-12"><section className="rounded-xl border p-5 lg:col-span-7" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}><p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Team contribution</p><div className="mt-4 space-y-3">{contributions.length ? contributions.map(([id, count]) => <div key={id} className="flex items-center justify-between gap-3 text-sm"><span style={{ color: HOME_COLORS.onSurface }}>{memberName(id)}</span><span className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{count} activity item{count === 1 ? '' : 's'}</span></div>) : <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Team activity will appear as research is created.</p>}</div></section><section className="rounded-xl border p-5 lg:col-span-5" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}66` }}><p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Shared research context</p><p className="mt-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{sources.length}</p><p className="mt-1 text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>shared source material{sources.length === 1 ? '' : 's'} available to the workspace.</p></section></div>
  </div>
}

function EvidenceStatus({ value, label, detail }: { value: number; label: string; detail: string }) {
  return <div className="rounded-lg p-3" style={{ background: HOME_COLORS.surfaceContainerLow }}><strong className="block text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>{value}</strong><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{label}</span><span className="mt-1 block text-[9px]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{detail}</span></div>
}

function InsightList({ title, icon, items, empty }: { title: string; icon: React.ReactNode; items: string[]; empty: string }) {
  return <section className="rounded-xl border p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}><div className="flex items-center gap-2" style={{ color: HOME_COLORS.primary }}>{icon}<p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{title}</p></div><div className="mt-4 space-y-3">{items.length ? items.map(item => <p key={item} className="border-l-2 pl-3 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurface, borderColor: HOME_COLORS.primaryFixedDim }}>{item}</p>) : <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{empty}</p>}</div></section>
}

function WorkspaceAnalyticsReference({ personas, interviews, reports, signals, sources, activity, members, loading, onOpenGraph }: { personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[]; signals: Signal[]; sources: WorkspaceSource[]; activity: WorkspaceActivity[]; members: WorkspaceMember[]; loading: boolean; onOpenGraph: () => void }) {
  const now = Date.now()
  const weekStart = now - 7 * 24 * 60 * 60 * 1000
  const testedPersonas = personas.filter(persona => interviews.some(interview => interview.persona_id === persona.id))
  const testedStages = new Set(testedPersonas.map(persona => persona.funnel_stage ?? 'awareness'))
  const stages = ['awareness', 'consideration', 'purchase', 'loyalty'] as const
  const missingStages = stages.filter(stage => !testedStages.has(stage))
  const statuses = { emerging: 0, growing: 0, validated: 0 }
  signals.forEach(signal => { statuses[signal.status]++ })
  const newThisWeek = [...personas, ...interviews, ...reports, ...signals].filter(item => new Date(item.created_at).getTime() >= weekStart).length
  const impact = { high: 3, medium: 2, low: 1 }
  const opportunities = signals.filter(signal => signal.type === 'opportunity').sort((a, b) => (impact[b.impact ?? 'low'] - impact[a.impact ?? 'low']) || b.confidence_score - a.confidence_score).slice(0, 3)
  const risks = signals.filter(signal => signal.type === 'risk' || signal.type === 'objection' || signal.type === 'pain_point').sort((a, b) => (impact[b.impact ?? 'low'] - impact[a.impact ?? 'low']) || b.confidence_score - a.confidence_score).slice(0, 3)
  const emerging = signals.filter(signal => signal.status === 'emerging')
  const themes = new Map<string, { label: string; sentiments: Set<string>; count: number }>()
  reports.forEach(report => report.key_themes?.forEach(theme => { const key = theme.title.trim().toLowerCase(); const item = themes.get(key) ?? { label: theme.title, sentiments: new Set<string>(), count: 0 }; item.count++; item.sentiments.add(theme.sentiment); themes.set(key, item) }))
  const recurring = [...themes.values()].filter(theme => theme.count >= 2)
  const disagreements = recurring.filter(theme => theme.sentiments.size > 1)
  const decision = !reports.length ? { title: 'Needs a first report', detail: 'Generate a report from an interview to begin building workspace evidence.' } : disagreements.length ? { title: 'Mixed evidence', detail: `${disagreements.length} recurring theme${disagreements.length === 1 ? ' has' : 's have'} conflicting reactions across reports.` } : statuses.validated >= 2 && testedPersonas.length >= Math.max(2, Math.ceil(personas.length * .6)) ? { title: 'Ready to inform a decision', detail: 'Multiple findings are supported by repeated research across the workspace.' } : { title: 'Needs more evidence', detail: emerging.length ? `${emerging.length} signal${emerging.length === 1 ? ' has' : 's have'} only one supporting source.` : 'Run more interviews to build a stronger evidence base.' }
  const nextAction = !reports.length ? 'Generate a report from your most useful completed interview.' : emerging.length ? `Test “${emerging[0].title}” with another research source.` : personas.length > testedPersonas.length ? `Run an interview with ${personas.find(persona => !testedPersonas.some(tested => tested.id === persona.id))?.name ?? 'an untested persona'}.` : missingStages.length ? `Add research for the ${missingStages[0]} stage.` : sources.length === 0 ? 'Add background materials so the team has shared context.' : 'Review the strongest opportunity and choose a next experiment.'
  const daily = Array.from({ length: 7 }, (_, index) => { const date = new Date(now - (6 - index) * 86400000); const start = new Date(date); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1); return { label: start.toLocaleDateString('en-US', { weekday: 'narrow' }), count: [...interviews, ...reports, ...signals].filter(item => { const time = new Date(item.created_at).getTime(); return time >= start.getTime() && time < end.getTime() }).length } })
  const maxDay = Math.max(...daily.map(day => day.count), 1)
  const contributors = [...activity.reduce((items, entry) => items.set(entry.actor_id ?? 'unknown', (items.get(entry.actor_id ?? 'unknown') ?? 0) + 1), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const memberName = (id: string) => members.find(member => member.id === id)?.full_name || members.find(member => member.id === id)?.email || 'A teammate'
  const cardClass = 'rounded-[2.5rem] border border-[#E5E1DF] bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg sm:p-8'

  if (loading) return <div className="h-[640px] animate-pulse" style={{ background: HOME_COLORS.surfaceContainerLow }} />

  return <><header className="relative overflow-hidden bg-[#18281C] p-8 pb-20 text-white sm:p-10 sm:pb-20"><div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Workspace intelligence</p><h1 className="text-2xl sm:text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>Research at a glance</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">See what has been tested, where the evidence is strongest, and what to do next.</p></div><nav className="flex rounded-full border border-white/30 bg-white/20 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_12px_28px_-18px_rgba(0,0,0,0.75)] backdrop-blur-xl"><span className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#18281C] shadow-[0_4px_12px_rgba(24,40,28,0.12)]">Analytics</span><button type="button" onClick={onOpenGraph} className="rounded-full px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20">Insight graph</button></nav></div><div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-5"><svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true"><path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.3,87.1,-15.7,87.1,0C87.1,15.7,83.7,31.3,76.4,44.7C69.2,58.1,58.1,69.2,44.7,76.4C31.3,83.7,15.7,87.1,0,87.1C-15.7,87.1,-31.3,83.7,-44.7,76.4C-58.1,69.2,-69.2,58.1,-76.4,44.7C-83.7,31.3,-87.1,15.7,-87.1,0C-87.1,-15.7,-83.7,-31.3,-76.4,-44.7C-69.2,-58.1,-58.1,-69.2,-44.7,-76.4C-31.3,-83.7,-15.7,-87.1,0,-87.1C15.7,-87.1,31.3,-83.7,44.7,-76.4Z" fill="white" transform="translate(100 100)" /></svg></div></header><div className="relative z-20 -mt-10 px-5 pb-12 sm:px-10 sm:pb-16"><section className="mb-12 grid grid-cols-2 overflow-hidden rounded-3xl border border-[#E5E1DF] bg-white shadow-lg md:grid-cols-4"><ReferenceMetric value={personas.length + interviews.length + reports.length} label="Research completed" /><ReferenceMetric value={statuses.validated} label="Validated signals" /><ReferenceMetric value={`${testedPersonas.length}/${personas.length}`} label="Personas tested" /><ReferenceMetric value={newThisWeek} label="New this week" last /></section><div className="grid grid-cols-1 gap-8 lg:grid-cols-12"><div className="space-y-8 lg:col-span-8"><article className={`${cardClass} flex flex-col justify-between`}><div className="mb-6 flex items-start justify-between"><div><p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Decision readiness</p><h2 className="text-3xl font-medium" style={{ fontFamily: HOME_FONT_DISPLAY }}>{decision.title}</h2><p className="mt-4 text-sm text-[#6B7280]">{decision.detail}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E1DF] text-[#18281C] opacity-40"><CircleCheck size={20} /></span></div><div className="rounded-2xl border border-[#F0E6D2] bg-[#FDF6E3] p-6"><p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#8C7A5B]">Next best action</p><p className="flex items-center gap-2 text-sm font-semibold text-[#18281C]">{nextAction}<ArrowRight size={16} /></p></div></article><div className="grid grid-cols-1 gap-6 md:grid-cols-3"><ReferenceInsightCard title="Top opportunities" icon={<Target size={16} />} items={opportunities.map(signal => signal.title)} empty="Opportunities will appear as signals are generated." /><ReferenceInsightCard title="Risks to address" icon={<AlertTriangle size={16} />} items={risks.map(signal => signal.title)} empty="No major risks have been identified yet." /><ReferenceInsightCard title="Research gaps" icon={<CircleDashed size={16} />} items={[...(personas.length > testedPersonas.length ? [`${personas.length - testedPersonas.length} persona${personas.length - testedPersonas.length === 1 ? ' has' : 's have'} not been interviewed`] : []), ...(missingStages.length ? [`No tested research in: ${missingStages.join(', ')}`] : []), ...emerging.slice(0, 1).map(signal => `Needs another source: ${signal.title}`)]} empty="No clear gaps right now." /></div><article className={cardClass}><div className="mb-12 flex items-start justify-between"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Research momentum</p><p className="text-sm text-[#18281C]">Interviews, reports, and signals added in the last 7 days.</p></div><TrendingUp size={20} className="opacity-40" /></div><div className="flex h-24 items-end justify-between px-4">{daily.map(day => <div key={day.label} className="flex flex-col items-center gap-2"><div className="w-1.5 rounded-full" style={{ height: `${Math.max(8, (day.count / maxDay) * 64)}px`, background: day.count ? '#18281C' : '#E5E1DF' }} /><span className="text-[10px] font-bold" style={{ color: day.count ? '#18281C' : '#6B7280' }}>{day.label}</span></div>)}</div></article></div><aside className="space-y-8 lg:col-span-4"><article className={cardClass}><p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Evidence strength</p><div className="mb-6 grid grid-cols-3 gap-3"><ReferenceEvidence value={statuses.emerging} label="Emerging" detail="1 source" /><ReferenceEvidence value={statuses.growing} label="Growing" detail="2–3 sources" /><ReferenceEvidence value={statuses.validated} label="Validated" detail="4+ sources" /></div><p className="text-[11px] leading-relaxed text-[#6B7280]">A source can be an interview, comparison, audience test, or concept test that supports the same signal.</p></article><article className={`${cardClass} flex h-64 flex-col`}><p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Agreement and disagreement</p><div className="flex flex-grow items-center justify-center text-center"><p className="text-sm text-[#6B7280]">{recurring.length ? disagreements.length ? `${disagreements.length} recurring theme${disagreements.length === 1 ? ' has' : 's have'} mixed reactions.` : `${recurring.length} recurring theme${recurring.length === 1 ? '' : 's'} show consistent reactions.` : 'Generate more reports to compare recurring themes.'}</p></div></article><article className={`${cardClass} space-y-8`}><div><div className="mb-4 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Team contribution</p><span className="text-[10px] text-[#6B7280]">Active contributors</span></div>{contributors.length ? <div className="space-y-3">{contributors.map(([id, count]) => <div key={id} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-stone-200 text-[10px] font-bold">{getInitials(memberName(id))}</span><p className="text-xs font-medium">{memberName(id)}</p><span className="ml-auto text-[10px] text-[#6B7280]">{count} item{count === 1 ? '' : 's'}</span></div>)}</div> : <p className="text-sm text-[#6B7280]">Team activity will appear as research is created.</p>}</div><hr className="border-[#E5E1DF]" /><div><p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Shared research context</p><div className="flex items-baseline gap-2"><span className="text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{sources.length}</span><span className="text-xs text-[#6B7280]">shared source material{sources.length === 1 ? '' : 's'}</span></div></div></article></aside></div></div></>
}

function ReferenceMetric({ value, label, last = false }: { value: string | number; label: string; last?: boolean }) {
  return <div className={`p-4 text-center sm:p-5 ${last ? '' : 'border-r border-[#E5E1DF]'}`}><p className="mb-1 text-3xl font-medium sm:text-4xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{value}</p><p className="text-[8px] font-bold uppercase tracking-widest text-[#6B7280] sm:text-[9px]">{label}</p></div>
}

function WorkspaceIntelligenceTabs({ active, onChange }: { active: 'analytics' | 'insights'; onChange: (tab: 'analytics' | 'insights') => void }) {
  return <nav className="flex rounded-full border border-white/30 bg-white/20 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_12px_28px_-18px_rgba(0,0,0,0.75)] backdrop-blur-xl"><button type="button" onClick={() => onChange('analytics')} className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${active === 'analytics' ? 'bg-white text-[#18281C] shadow-[0_4px_12px_rgba(24,40,28,0.12)]' : 'text-white hover:bg-white/20'}`}>Analytics</button><button type="button" onClick={() => onChange('insights')} className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${active === 'insights' ? 'bg-white text-[#18281C] shadow-[0_4px_12px_rgba(24,40,28,0.12)]' : 'text-white hover:bg-white/20'}`}>Insight graph</button></nav>
}

function ReferenceInsightCard({ title, icon, items, empty }: { title: string; icon: React.ReactNode; items: string[]; empty: string }) {
  return <article className="rounded-3xl border border-[#E5E1DF] bg-white p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"><div className="mb-4 flex items-center gap-2 text-[#18281C] opacity-50">{icon}<p className="text-[9px] font-bold uppercase tracking-widest">{title}</p></div>{items.length ? <ul className="space-y-3">{items.slice(0, 3).map(item => <li key={item} className="border-l-2 border-[#18281C] pl-3 text-sm leading-relaxed">{item}</li>)}</ul> : <p className="text-sm italic text-[#6B7280]">{empty}</p>}</article>
}

function ReferenceEvidence({ value, label, detail }: { value: number; label: string; detail: string }) {
  return <div className="rounded-2xl bg-[#FCF9F8] p-4 text-center sm:p-5"><p className="mb-1 text-3xl sm:text-4xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{value}</p><p className="text-[10px] font-bold uppercase tracking-wide text-[#18281C]/70 sm:text-[11px]">{label}</p><p className="mt-1 text-[9px] text-[#6B7280] sm:text-[10px]">{detail}</p></div>
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

function EvidenceGraph({ workspaceId, personas, interviews, reports, signals, sources, projects, activeNode, onSelect }: { workspaceId: string; personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[]; signals: Signal[]; sources: WorkspaceSource[]; projects: { id: string; name: string }[]; activeNode: string; onSelect: (id: string) => void }) {
  const reportByInterviewId = new Map(reports.map(report => [report.interview_id, report]))
  const untestedPersonas = personas.filter(persona => !interviews.some(interview => interview.persona_id === persona.id))
  const [contentFilter, setContentFilter] = useState<'all' | 'reports' | 'themes'>('all')
  const [minimumConfidence, setMinimumConfidence] = useState(0)
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'mixed' | 'neutral' | 'negative'>('all')
  const [personaFilter, setPersonaFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [signalStatusFilter, setSignalStatusFilter] = useState<'all' | Signal['status']>('all')
  const [researchTypeFilter, setResearchTypeFilter] = useState<'all' | Signal['source_type']>('all')
  const [dateRange, setDateRange] = useState<'all' | '30' | '90'>('all')
  const [graphView, setGraphView] = useState<'evidence' | 'timeline'>('evidence')
  const [pinned, setPinned] = useState<{ id: string; label: string }[]>([])
  useEffect(() => {
    try { setPinned(JSON.parse(window.localStorage.getItem(`signalroom-decision-board-${workspaceId}`) ?? '[]')) } catch { setPinned([]) }
  }, [workspaceId])
  useEffect(() => {
    window.localStorage.setItem(`signalroom-decision-board-${workspaceId}`, JSON.stringify(pinned))
  }, [pinned, workspaceId])
  const cutoff = dateRange === 'all' ? 0 : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000
  const visibleSignals = signals.filter(signal => (projectFilter === 'all' || signal.project_id === projectFilter) && (signalStatusFilter === 'all' || signal.status === signalStatusFilter) && (researchTypeFilter === 'all' || signal.source_type === researchTypeFilter) && new Date(signal.created_at).getTime() >= cutoff)
  const passesFilter = (report?: Report) => {
    if (contentFilter === 'reports' && !report) return false
    if (contentFilter === 'themes' && !report?.key_themes?.length) return false
    if ((report?.confidence_score ?? 0) < minimumConfidence) return false
    if (sentimentFilter !== 'all' && !report?.key_themes?.some(theme => theme.sentiment === sentimentFilter)) return false
    return true
  }
  const personaGroups = personas
    .filter(persona => personaFilter === 'all' || persona.id === personaFilter)
    .map(persona => ({
      persona,
      items: interviews
        .filter(interview => interview.persona_id === persona.id && (projectFilter === 'all' || interview.project_id === projectFilter))
        .map(interview => ({ interview, report: reportByInterviewId.get(interview.id) }))
        .filter(item => passesFilter(item.report) && (cutoff === 0 || new Date(item.interview.created_at).getTime() >= cutoff)),
    }))
    .filter(group => group.items.length > 0)
  const totalPaths = personaGroups.reduce((sum, group) => sum + group.items.length, 0)

  return <div className="mt-7 overflow-hidden rounded-xl border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">Traceable evidence paths</p><p className="mt-1 text-xs text-white/65">Follow a source from persona through the research it generated.</p></div>{activeNode !== 'overview' && <button type="button" onClick={() => onSelect('overview')} className="rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-white/10" style={{ color: HOME_COLORS.primaryFixed, borderColor: 'rgba(255,255,255,0.18)', background: 'transparent' }}>Clear focus</button>}</div>
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><GraphFilter label="Evidence" value={contentFilter} onChange={value => setContentFilter(value as 'all' | 'reports' | 'themes')} options={[['all', 'All'], ['reports', 'Reports'], ['themes', 'Themes']]} /><GraphFilter label="Confidence" value={String(minimumConfidence)} onChange={value => setMinimumConfidence(Number(value))} options={[[String(0), 'Any score'], [String(50), '50%+'], [String(75), '75%+']]} /><GraphFilter label="Sentiment" value={sentimentFilter} onChange={value => setSentimentFilter(value as 'all' | 'positive' | 'mixed' | 'neutral' | 'negative')} options={[['all', 'All'], ['positive', 'Positive'], ['mixed', 'Mixed'], ['neutral', 'Neutral'], ['negative', 'Negative']]} /><span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">{totalPaths} path{totalPaths === 1 ? '' : 's'}</span></div>
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><GraphFilter label="Persona" value={personaFilter} onChange={setPersonaFilter} options={[['all', 'All personas'], ...personas.map(persona => [persona.id, persona.name] as [string, string])]} /><GraphFilter label="Research type" value={researchTypeFilter} onChange={value => setResearchTypeFilter(value as 'all' | Signal['source_type'])} options={[['all', 'All types'], ['interview', 'Interview'], ['compare', 'Compare'], ['audience_panel', 'Audience test'], ['concept_test', 'Concept test']]} /><GraphFilter label="Signal status" value={signalStatusFilter} onChange={value => setSignalStatusFilter(value as 'all' | Signal['status'])} options={[['all', 'All statuses'], ['emerging', 'Emerging'], ['growing', 'Growing'], ['validated', 'Validated']]} /><GraphFilter label="Date" value={dateRange} onChange={value => setDateRange(value as 'all' | '30' | '90')} options={[['all', 'All time'], ['30', 'Last 30 days'], ['90', 'Last 90 days']]} /><div className="ml-auto inline-flex rounded-full border p-0.5" style={{ borderColor: 'rgba(255,255,255,0.16)' }}><button type="button" onClick={() => setGraphView('evidence')} className="rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ background: graphView === 'evidence' ? 'rgba(255,255,255,0.16)' : 'transparent', color: 'white' }}>Evidence</button><button type="button" onClick={() => setGraphView('timeline')} className="rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ background: graphView === 'timeline' ? 'rgba(255,255,255,0.16)' : 'transparent', color: 'white' }}>Timeline</button></div></div>
    <div className="border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><GraphFilter label="Project" value={projectFilter} onChange={setProjectFilter} options={[['all', 'All projects'], ...projects.map(project => [project.id, project.name] as [string, string])]} /></div>
    {activeNode !== 'overview' && <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><p className="min-w-0 truncate text-xs text-white/65">Selected evidence can be saved to your decision board.</p><button type="button" onClick={() => { const label = activeNode.startsWith('signal:') ? visibleSignals.find(signal => signal.id === activeNode.slice(7))?.title : activeNode.startsWith('source:') ? sources.find(source => source.id === activeNode.slice(7))?.name : activeNode.startsWith('persona:') ? personas.find(persona => persona.id === activeNode.slice(8))?.name : activeNode.startsWith('interview:') ? interviews.find(interview => interview.id === activeNode.slice(10))?.title : activeNode.startsWith('report:') ? reports.find(report => report.id === activeNode.slice(7))?.interview?.title : activeNode.slice(6); if (label && !pinned.some(item => item.id === activeNode)) setPinned(items => [...items, { id: activeNode, label }]) }} className="shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-white/10" style={{ color: HOME_COLORS.primaryFixed, borderColor: 'rgba(255,255,255,0.18)', background: 'transparent' }}>Pin selection</button></div>}
    {pinned.length > 0 && <div className="border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">Decision board</p><div className="mt-2 flex flex-wrap gap-2">{pinned.map(item => <button type="button" key={item.id} onClick={() => onSelect(item.id)} className="rounded-full border px-3 py-1.5 text-[10px] text-white/75 transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.18)', background: 'transparent' }}>{item.label}</button>)}</div></div>}
    <div className="max-h-[460px] overflow-y-auto overflow-x-auto p-4">
      {graphView === 'timeline' ? <EvidenceTimeline reports={reports} signals={visibleSignals} /> : <><div className="mb-5 rounded-lg border p-3" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">Shared source material</p><p className="mt-1 text-xs text-white/65">These materials provide background context. They are kept separate from direct report evidence unless explicitly cited.</p><div className="mt-3 flex flex-wrap gap-2">{sources.length ? sources.slice(0, 5).map(source => <EvidenceNode key={source.id} kind="Source" label={source.name} active={activeNode === `source:${source.id}`} onClick={() => onSelect(`source:${source.id}`)} />) : <span className="text-xs text-white/40">No shared materials yet.</span>}</div></div><div className="mb-5 rounded-lg border p-3" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">Signal clusters</p><p className="mt-1 text-xs text-white/65">Signals group together recurring evidence from interviews, comparisons, audience tests, and concept tests.</p><div className="mt-3 flex flex-wrap gap-2">{visibleSignals.length ? visibleSignals.map(signal => <EvidenceNode key={signal.id} kind="Signal" label={`${signal.title} · ${signal.status}`} active={activeNode === `signal:${signal.id}`} onClick={() => onSelect(`signal:${signal.id}`)} />) : <span className="text-xs text-white/40">No signals match these filters.</span>}</div></div>{personaGroups.length ? <div className="space-y-5">{personaGroups.map(group => {
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
                <GraphArrow strength={report?.confidence_score} />
                {report ? <EvidenceNode kind="Report" label={report.interview?.title ?? item.interview.title} active={activeNode === `report:${report.id}`} onClick={() => onSelect(`report:${report.id}`)} /> : <div className="rounded-lg border border-dashed px-3 py-2 text-center text-[9px] uppercase tracking-[0.1em] text-white/35" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>No report yet</div>}
                <GraphArrow strength={report?.confidence_score} />
                <div className="flex flex-wrap gap-1.5">{report?.key_themes?.length ? report.key_themes.slice(0, 3).map(theme => <EvidenceNode key={theme.title} kind="Theme" label={theme.title} active={activeNode === `theme:${theme.title}`} onClick={() => onSelect(`theme:${theme.title}`)} />) : <span className="text-[10px] text-white/35">Themes appear after report generation</span>}{report?.recommendations?.slice(0, 2).map((recommendation, index) => <EvidenceNode key={recommendation.title} kind="Recommendation" label={recommendation.title} active={activeNode === `recommendation:${report.id}:${index}`} onClick={() => onSelect(`recommendation:${report.id}:${index}`)} />)}</div>
              </div>
            })}
          </div>
        </div>
      })}</div> : <div className="py-10 text-center"><p className="text-sm text-white/65">{interviews.length ? 'No evidence paths match these filters.' : 'Create an interview in this workspace to begin an evidence path.'}</p>{!interviews.length && untestedPersonas.length > 0 && <div className="mt-4 flex flex-wrap justify-center gap-2">{untestedPersonas.map(persona => <EvidenceNode key={persona.id} kind="Persona" label={persona.name} active={activeNode === `persona:${persona.id}`} onClick={() => onSelect(`persona:${persona.id}`)} />)}</div>}</div>}</>}
    </div>
    <EvidenceDetail activeNode={activeNode} personas={personas} interviews={interviews} reports={reports} signals={signals} sources={sources} />
    <GraphAskAI workspaceId={workspaceId} activeNode={activeNode} />
  </div>
}

function GraphFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="flex flex-col gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/45">{label}<select value={value} onChange={event => onChange(event.target.value)} className="rounded-lg border px-2 py-1.5 text-[10px] font-semibold normal-case tracking-normal outline-none" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', borderColor: 'rgba(255,255,255,0.16)' }}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue} style={{ color: HOME_COLORS.onSurface }}>{optionLabel}</option>)}</select></label>
}

function EvidenceDetail({ activeNode, personas, interviews, reports, signals, sources }: { activeNode: string; personas: Persona[]; interviews: (Interview & { persona: Persona })[]; reports: (Report & { interview: Interview })[]; signals: Signal[]; sources: WorkspaceSource[] }) {
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

  if (activeNode.startsWith('signal:')) {
    const signal = signals.find(item => item.id === activeNode.slice(7))
    if (!signal) return null
    const supportingInterviews = interviews.filter(interview => signal.related_interview_ids?.includes(interview.id))
    return <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primaryFixed }}>Signal evidence · {signal.status}</p><h3 className="mt-1 text-base font-semibold text-white">{signal.title}</h3><p className="mt-2 text-xs leading-relaxed text-white/65">{signal.summary}</p><div className="mt-3 flex flex-wrap gap-2">{supportingInterviews.map(interview => <Link key={interview.id} href={`/interviews/${interview.id}`} className="rounded-full border px-3 py-1.5 text-[10px] text-white/75 transition-colors hover:bg-white/10" style={detailStyle}>{interview.title}</Link>)}</div><p className="mt-3 text-[10px] text-white/45">{signal.related_interview_ids?.length ?? 0} linked interview source{(signal.related_interview_ids?.length ?? 0) === 1 ? '' : 's'} · {signal.confidence_score}% confidence</p></div>
  }

  if (activeNode.startsWith('source:')) {
    const source = sources.find(item => item.id === activeNode.slice(7))
    if (!source) return null
    return <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primaryFixed }}>Shared source material</p><h3 className="mt-1 text-base font-semibold text-white">{source.name}</h3><p className="mt-2 text-xs leading-relaxed text-white/65">This file gives the workspace background context for future research. It is not treated as direct evidence unless a report explicitly cites it.</p></div>
  }

  if (activeNode.startsWith('recommendation:')) {
    const [, reportId, index] = activeNode.split(':')
    const recommendation = reports.find(report => report.id === reportId)?.recommendations?.[Number(index)]
    if (!recommendation) return null
    return <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primaryFixed }}>Recommended next move · {recommendation.priority} priority</p><h3 className="mt-1 text-base font-semibold text-white">{recommendation.title}</h3><p className="mt-2 text-xs leading-relaxed text-white/65">{recommendation.detail}</p></div>
  }

  const title = activeNode.slice(6)
  const supportingReports = reports.filter(report => report.key_themes?.some(theme => theme.title === title))
  const evidence = supportingReports.flatMap(report => (report.key_themes?.find(theme => theme.title === title)?.quotes ?? []).slice(0, 2).map(quote => ({ report, quote }))).slice(0, 4)
  return <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><p className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: HOME_COLORS.primaryFixed }}>Theme evidence · {supportingReports.length} report{supportingReports.length === 1 ? '' : 's'}</p><h3 className="mt-1 text-base font-semibold text-white">{title}</h3>{evidence.length ? <div className="mt-3 space-y-2">{evidence.map(({ report, quote }, index) => <Link key={index} href={`/reports/${report.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-white/10" style={detailStyle}><p className="text-xs leading-relaxed text-white/75">“{quote}”</p><p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: HOME_COLORS.primaryFixed }}>{report.interview?.title ?? 'Open source report'}</p></Link>)}</div> : <p className="mt-3 text-xs text-white/55">This theme is connected to the listed report evidence.</p>}</div>
}

const EVIDENCE_NODE_STYLES: Record<'Persona' | 'Interview' | 'Report' | 'Theme' | 'Signal' | 'Source' | 'Recommendation', { bg: string; border: string; accent: string }> = {
  Persona: { bg: 'rgba(212,232,213,0.16)', border: 'rgba(212,232,213,0.45)', accent: '#d4e8d5' },
  Interview: { bg: 'rgba(255,255,255,0.11)', border: 'rgba(255,255,255,0.3)', accent: '#dfe4da' },
  Report: { bg: 'rgba(245,234,220,0.16)', border: 'rgba(245,234,220,0.45)', accent: '#f5eadc' },
  Theme: { bg: 'rgba(233,229,238,0.16)', border: 'rgba(233,229,238,0.45)', accent: '#e9e5ee' },
  Signal: { bg: 'rgba(255,229,193,0.16)', border: 'rgba(255,229,193,0.45)', accent: '#ffe5c1' },
  Source: { bg: 'rgba(210,224,236,0.16)', border: 'rgba(210,224,236,0.45)', accent: '#d2e0ec' },
  Recommendation: { bg: 'rgba(218,236,210,0.16)', border: 'rgba(218,236,210,0.45)', accent: '#daecd2' },
}

function EvidenceNode({ kind, label, active, onClick }: { kind: 'Persona' | 'Interview' | 'Report' | 'Theme' | 'Signal' | 'Source' | 'Recommendation'; label: string; active: boolean; onClick: () => void }) {
  const style = EVIDENCE_NODE_STYLES[kind]
  return <button type="button" onClick={onClick} title={label} className="min-w-0 rounded-lg border px-3.5 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110" style={{ background: active ? HOME_COLORS.primaryFixed : style.bg, borderColor: active ? HOME_COLORS.primaryFixed : style.border, color: active ? HOME_COLORS.onPrimaryFixed : 'white' }}><span className="block text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: active ? HOME_COLORS.onPrimaryFixed : style.accent }}>{kind}</span><span className="mt-1 block truncate text-xs font-semibold">{label}</span></button>
}

function GraphArrow({ strength = 0 }: { strength?: number }) {
  const opacity = Math.max(.28, Math.min(.85, strength / 100))
  const width = strength >= 75 ? 2.5 : strength >= 50 ? 2 : 1.5
  return <svg width="18" height="10" viewBox="0 0 18 10" className="mx-auto shrink-0" aria-label={strength ? `Evidence strength ${strength}%` : 'Evidence path'}><line x1="0" y1="5" x2="11" y2="5" stroke={`rgba(255,255,255,${opacity})`} strokeWidth={width} /><path d="M9 1.5 L15 5 L9 8.5" fill="none" stroke={`rgba(255,255,255,${opacity})`} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function EvidenceTimeline({ reports, signals }: { reports: Report[]; signals: Signal[] }) {
  const events = [...reports.map(report => ({ id: `report-${report.id}`, date: report.created_at, type: 'Report', label: report.interview?.title ?? 'Insight report' })), ...signals.map(signal => ({ id: `signal-${signal.id}`, date: signal.updated_at || signal.created_at, type: 'Signal', label: `${signal.title} · ${signal.status}` }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return <div className="space-y-3">{events.length ? events.map(event => <div key={event.id} className="flex gap-3 rounded-lg border p-3" style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}><span className="mt-1 h-2 w-2 rounded-full" style={{ background: HOME_COLORS.primaryFixed }} /><div><p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-white/45">{event.type} · {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p><p className="mt-1 text-sm text-white">{event.label}</p></div></div>) : <p className="py-10 text-center text-sm text-white/55">Research activity will appear here as reports and signals are created.</p>}</div>
}

function GraphAskAI({ workspaceId, activeNode }: { workspaceId: string; activeNode: string }) {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const ask = async () => {
    setLoading(true); setAnswer('')
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: `Explain the evidence connected to ${activeNode === 'overview' ? 'this workspace' : activeNode}. Give the strongest supporting and conflicting evidence, and name the report or interview each point comes from.` }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error ?? 'Unable to answer this question.')
      setAnswer(json.data.answer)
    } catch (error: any) { setAnswer(error?.message ?? 'Unable to answer this question.') } finally { setLoading(false) }
  }
  return <div className="border-t px-4 py-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-white/65">Ask AI to explain this evidence using the workspace research.</p><button type="button" onClick={() => void ask()} disabled={loading} className="rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-white/10 disabled:opacity-50" style={{ color: HOME_COLORS.primaryFixed, borderColor: 'rgba(255,255,255,0.18)', background: 'transparent' }}>{loading ? 'Reviewing…' : 'Ask AI about this evidence'}</button></div>{answer && <p className="mt-3 whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed text-white/75" style={{ background: 'rgba(255,255,255,0.06)' }}>{answer}</p>}</div>
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
  const [replacingSourceId, setReplacingSourceId] = useState<string | null>(null)
  const [renamingSourceId, setRenamingSourceId] = useState<string | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [savingSourceName, setSavingSourceName] = useState(false)
  const [previewSource, setPreviewSource] = useState<WorkspaceSource | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

  const uploadSource = async (file: File | null, sourceId?: string) => {
    if (!file) return
    setUploading(true)
    setReplacingSourceId(sourceId ?? null)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      if (sourceId) form.append('sourceId', sourceId)
      const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`, { method: sourceId ? 'PUT' : 'POST', body: form })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setSources(previous => sourceId ? previous.map(source => source.id === sourceId ? json.data : source) : [json.data, ...previous])
    } catch (err: any) {
      setError(err.message ?? (sourceId ? 'Could not replace source' : 'Could not upload source'))
    } finally {
      setUploading(false)
      setReplacingSourceId(null)
    }
  }

  const getSourceUrl = async (source: WorkspaceSource, download = false) => {
    const response = await fetch(`/api/workspaces/${workspaceId}/knowledge?sourceId=${encodeURIComponent(source.id)}${download ? '&download=1' : ''}`)
    const json = await response.json()
    if (!response.ok || !json.data?.url) throw new Error(json.error ?? 'Could not open source')
    return json.data.url as string
  }

  const viewSource = async (source: WorkspaceSource) => {
    if (source.extracted_text.trim()) {
      setPreviewUrl(null)
      setPreviewSource(source)
      return
    }
    try {
      setPreviewUrl(await getSourceUrl(source))
      setPreviewSource(source)
    } catch (err: any) {
      setError(err.message ?? 'Could not open source')
    }
  }

  const downloadSource = async (source: WorkspaceSource) => {
    try {
      const link = document.createElement('a')
      link.href = await getSourceUrl(source, true)
      link.download = source.name
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err: any) {
      setError(err.message ?? 'Could not download source')
    }
  }

  const startRename = (source: WorkspaceSource) => {
    setRenamingSourceId(source.id)
    setSourceName(source.name)
  }

  const renameSource = async (sourceId: string) => {
    const name = sourceName.trim()
    if (!name) return
    setSavingSourceName(true)
    setError('')
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId, name }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error)
      setSources(previous => previous.map(source => source.id === sourceId ? json.data : source))
      setRenamingSourceId(null)
      setSourceName('')
    } catch (err: any) {
      setError(err.message ?? 'Could not rename source')
    } finally {
      setSavingSourceName(false)
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
      setError(err.message ?? 'Could not save research notes')
    } finally {
      setSaving(false)
    }
  }

  const deleteSource = async (sourceId: string) => {
    if (!confirm('Remove this shared source?')) return
    const response = await fetch(`/api/workspaces/${workspaceId}/knowledge`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId }) })
    if (response.ok) setSources(previous => previous.filter(source => source.id !== sourceId))
  }

  if (!knowledgeAvailable) return <section className="mb-14 border-t pt-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}><div className="rounded-[1.5rem] border p-6" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '55' }}><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research materials</p><h2 className="mt-2 text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Shared research</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Your team's notes and files will be available here once shared research is set up.</p></div></section>

  return <section className="mb-14 border-t pt-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research materials</p><h2 className="mt-2 text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Shared research</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Keep the notes and files your team should use while working in this workspace.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-opacity hover:opacity-90" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}><Upload size={14} />{uploading && !replacingSourceId ? 'Uploading…' : 'Add source'}<input type="file" className="hidden" disabled={uploading} accept=".pdf,.doc,.docx,.csv,.txt,.md,.json" onChange={event => { const file = event.target.files?.[0] ?? null; event.currentTarget.value = ''; void uploadSource(file) }} /></label></div>
    {error && <p className="mb-4 rounded-lg px-3 py-2 text-xs" style={{ background: '#ffdad6', color: HOME_COLORS.error }}>{error}</p>}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12"><div className="rounded-[1.5rem] border p-6 lg:col-span-7" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}66` }}><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2"><BookOpen size={17} style={{ color: HOME_COLORS.primary }} /><h3 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Research notes</h3></div><button onClick={saveBrief} disabled={saving || brief === (context?.content ?? '')} className="rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] disabled:opacity-40" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary, border: 'none', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save notes'}</button></div><p className="mt-3 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Add the background, audience, approved messaging, and research priorities your team should keep in mind.</p><textarea value={brief} onChange={event => setBrief(event.target.value)} maxLength={12000} placeholder="e.g. Brand positioning, target audience, campaign objectives, approved claims, and research constraints…" className="mt-5 min-h-[160px] w-full resize-y rounded-xl p-4 text-sm leading-relaxed outline-none" style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }} /></div>
      <div className="rounded-[1.5rem] border p-6 lg:col-span-5" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}66` }}><h3 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Shared sources</h3><p className="mt-2 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Text, CSV, and JSON sources feed into workspace context automatically. PDFs and decks remain available to the team and can be distilled into the brief.</p><div className="mt-5 space-y-3">{loading ? <div className="h-16 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainer }} /> : sources.length ? sources.map(source => <SharedSourceItem key={source.id} source={source} uploading={uploading && replacingSourceId === source.id} renaming={renamingSourceId === source.id} renameValue={sourceName} savingName={savingSourceName} onView={() => void viewSource(source)} onDownload={() => void downloadSource(source)} onStartRename={() => startRename(source)} onRenameValueChange={setSourceName} onRename={() => void renameSource(source.id)} onCancelRename={() => { setRenamingSourceId(null); setSourceName('') }} onReplace={file => void uploadSource(file, source.id)} onRemove={() => void deleteSource(source.id)} />) : <p className="rounded-xl border border-dashed p-5 text-center text-xs" style={{ borderColor: `${HOME_COLORS.outlineVariant}88`, color: HOME_COLORS.onSurfaceVariant }}>No shared source materials yet.</p>}</div></div></div>
    <AnimatePresence>{previewSource && <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => { setPreviewSource(null); setPreviewUrl(null) }}><motion.div role="dialog" aria-modal="true" aria-label={`Preview ${previewSource.name}`} className="w-full max-w-3xl overflow-hidden rounded-2xl border" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant, boxShadow: '0 24px 70px rgba(15,23,42,.24)' }} initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} onMouseDown={event => event.stopPropagation()}><div className="flex items-center justify-between gap-4 border-b px-5 py-4" style={{ borderColor: `${HOME_COLORS.outlineVariant}66` }}><div className="min-w-0"><p className="truncate text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{previewSource.name}</p><p className="mt-1 text-[10px]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{previewSource.extracted_text.trim() ? 'Text preview' : 'Document preview'}</p></div><button type="button" onClick={() => { setPreviewSource(null); setPreviewUrl(null) }} className="rounded-full p-2 transition-colors hover:bg-[#e4e8e2]" aria-label="Close preview" style={{ color: HOME_COLORS.onSurfaceVariant }}><X size={16} /></button></div>{previewSource.extracted_text.trim() ? <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap px-5 py-5 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_BODY }}>{previewSource.extracted_text}</pre> : previewUrl ? <iframe title={`Preview ${previewSource.name}`} src={previewUrl} className="h-[65vh] w-full bg-white" /> : <div className="p-8 text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Preparing preview…</div>}</motion.div></motion.div>}</AnimatePresence>
  </section>
}

function SharedSourceItem({ source, uploading, renaming, renameValue, savingName, onView, onDownload, onStartRename, onRenameValueChange, onRename, onCancelRename, onReplace, onRemove }: { source: WorkspaceSource; uploading: boolean; renaming: boolean; renameValue: string; savingName: boolean; onView: () => void; onDownload: () => void; onStartRename: () => void; onRenameValueChange: (value: string) => void; onRename: () => void; onCancelRename: () => void; onReplace: (file: File | null) => void; onRemove: () => void }) {
  return <div className="rounded-xl border p-3.5" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}55` }}>{renaming ? <div className="flex gap-2"><input autoFocus value={renameValue} onChange={event => onRenameValueChange(event.target.value)} onKeyDown={event => event.key === 'Enter' && onRename()} maxLength={180} className="min-w-0 flex-1 rounded-lg border px-2.5 py-2 text-xs outline-none" style={{ background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.onSurface, borderColor: HOME_COLORS.outlineVariant }} /><button type="button" onClick={onRename} disabled={savingName || !renameValue.trim()} className="rounded-lg px-2.5 text-[10px] font-semibold disabled:opacity-40" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}>{savingName ? 'Saving' : 'Save'}</button><button type="button" onClick={onCancelRename} className="rounded-lg px-2 text-[10px] font-semibold" style={{ color: HOME_COLORS.onSurfaceVariant }}>Cancel</button></div> : <><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{source.name}</p><p className="mt-1 text-[10px]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{formatSourceSize(source.size_bytes)} · {source.extracted_text ? 'Ready to use' : 'Saved file'}</p></div><button type="button" onClick={onRemove} title="Remove source" className="rounded-full px-1.5 py-1 text-[10px] font-semibold" style={{ background: 'none', border: 'none', color: HOME_COLORS.error, cursor: 'pointer' }}>Remove</button></div><div className="mt-3 flex flex-wrap gap-1.5"><button type="button" onClick={onView} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors hover:bg-[#e4e8e2]" style={{ color: HOME_COLORS.primary }}><Eye size={12} />View</button><button type="button" onClick={onDownload} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors hover:bg-[#e4e8e2]" style={{ color: HOME_COLORS.primary }}><Download size={12} />Download</button><button type="button" onClick={onStartRename} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors hover:bg-[#e4e8e2]" style={{ color: HOME_COLORS.primary }}><Pencil size={11} />Rename</button><label className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors hover:bg-[#e4e8e2]" style={{ color: HOME_COLORS.primary }}><Upload size={11} />{uploading ? 'Replacing…' : 'Replace'}<input type="file" className="hidden" disabled={uploading} accept=".pdf,.doc,.docx,.csv,.txt,.md,.json" onChange={event => { const file = event.target.files?.[0] ?? null; event.currentTarget.value = ''; onReplace(file) }} /></label></div></>}</div>
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
