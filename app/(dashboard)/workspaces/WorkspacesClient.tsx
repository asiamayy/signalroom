'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Plus, X, Trash2, Loader2, Lock, Crown, ShieldCheck, Users, Verified,
  FileText, MessagesSquare, ArrowRight, UserPlus,
} from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY } from '@/lib/home-theme'
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
    if (plan === 'agency') loadWorkspaces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan])

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

  if (loadingPlan) {
    return <div className="min-h-full" style={{ background: DARK_BG }} />
  }

  if (plan !== 'agency') {
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

  if (plan === 'agency') {
    return (
      <div className="min-h-full" style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }}>
        <main className="mx-auto max-w-[1800px] px-4 pb-16 sm:px-10">
          <section className="flex flex-col justify-between gap-10 pb-14 pt-16 xl:flex-row xl:items-end xl:gap-16 sm:pt-24">
            <div className="max-w-4xl">
              <h1 className="text-[50px] leading-[0.95] tracking-[-0.04em] sm:text-[76px]" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.primary }}>
                Workspace <br /><span className="italic font-normal opacity-30">Command Center.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-xl leading-snug italic sm:text-[26px]" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>
                A curated architecture for shared research. Keep teams, personas, interviews, and reports aligned in every environment.
              </p>
            </div>
            <div className="flex flex-col gap-8 border-l py-3 pl-8 sm:pl-12" style={{ borderColor: `${HOME_COLORS.primary}1a` }}>
              <div>
                <span className="block text-4xl font-light leading-none" style={{ color: HOME_COLORS.primary }}>{workspaces.length || '0'}</span>
                <span className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: `${HOME_COLORS.primary}66` }}>Active environments</span>
              </div>
              <button onClick={() => setShowCreatePanel(v => !v)} className="inline-flex items-center justify-center gap-3 self-start rounded-full px-7 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>
                Deploy new hub <Plus size={15} />
              </button>
            </div>
          </section>

          <section className="relative mb-16 min-h-[440px] overflow-hidden rounded-[2rem] p-7 sm:p-12 lg:p-16" style={{ background: HOME_COLORS.primary }}>
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <svg className="h-full w-full" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
                <path d="M50,450 L950,450 M50,50 L50,450" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
                <path d="M100,380 Q300,320 400,390 T700,350 T900,410" fill="none" stroke={HOME_COLORS.primaryFixed} strokeWidth="1.5" />
                <circle cx="400" cy="390" fill={HOME_COLORS.primaryFixed} r="5"><animate attributeName="r" dur="3s" repeatCount="indefinite" values="5;10;5" /></circle>
                <circle cx="700" cy="350" fill="white" r="4" opacity="0.6" />
              </svg>
            </div>
            <div className="relative z-10 flex flex-col justify-between gap-10 lg:flex-row lg:items-start">
              <div>
                <span className="mb-6 inline-block rounded-full bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: HOME_COLORS.primaryFixed }}>Real-time synthesis map</span>
                <h2 className="text-4xl leading-tight text-white sm:text-5xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>Workspace Intelligence <br /><span className="italic font-normal text-white/45">Pulse Monitor</span></h2>
              </div>
              <div className="min-w-0 rounded-3xl border p-6 sm:min-w-[270px]" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(18px)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/35">Active threads</span>
                <div className="mt-6 space-y-4 text-xs text-white">
                  <MetricLine label="Personas" value={`${realPersonaCount} active`} percent={Math.min(100, Math.max(8, realPersonaCount * 12))} />
                  <MetricLine label="Interviews" value={`${realInterviewCount} tracked`} percent={Math.min(100, Math.max(8, realInterviewCount * 12))} />
                  <MetricLine label="Reports" value={`${realReportCount} synthesized`} percent={Math.min(100, Math.max(8, realReportCount * 12))} />
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-10 flex flex-wrap items-center gap-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 sm:mt-16">
              <div className="flex -space-x-3">
                {members.slice(0, 4).map(m => <div key={m.id} className="h-9 w-9 rounded-full border-2" style={{ borderColor: HOME_COLORS.primary }}><PersonaAvatar avatarUrl={m.avatar_url} avatarInitials={getInitials(m.full_name || m.email)} avatarColor={getAvatarColor(m.full_name || m.email)} name={m.full_name ?? m.email} size="sm" /></div>)}
                {members.length > 4 && <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-[9px]" style={{ borderColor: HOME_COLORS.primary, background: `${HOME_COLORS.primaryFixed}33`, color: HOME_COLORS.primaryFixed }}>+{members.length - 4}</div>}
              </div>
              <span>{members.length > 0 ? `Coordinating ${members.length} team members` : 'Ready for your research team'}</span>
            </div>
          </section>

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

          <section className="mb-16">
            <div className="mb-8 flex items-center justify-between gap-6">
              <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Active <span className="italic font-normal">Environments</span></h2>
              <span className="rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: `${HOME_COLORS.outlineVariant}88`, color: HOME_COLORS.onSurfaceVariant }}>{allSeats.size} / {seatLimit} seats in use</span>
            </div>
            {loadingWorkspaces ? <div className="h-72 animate-pulse rounded-[2rem]" style={{ background: HOME_COLORS.surfaceContainerLow }} /> : workspaces.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed px-6 py-20 text-center" style={{ borderColor: HOME_COLORS.outlineVariant, background: HOME_COLORS.surfaceContainerLow }}><Building2 size={26} className="mx-auto mb-4" style={{ color: HOME_COLORS.primary }} /><p style={{ color: HOME_COLORS.onSurfaceVariant }}>No workspaces yet — deploy a hub to invite your team.</p></div>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                {workspaces.map((workspace, index) => {
                  const selected = workspace.id === selectedId
                  return <button key={workspace.id} onClick={() => setSelectedId(workspace.id)} className={`group text-left transition-all duration-500 ${index === 0 ? 'lg:col-span-7' : 'lg:col-span-5'}`} style={{ cursor: 'pointer', border: 'none', background: 'none' }}>
                    <div className={`flex min-h-[290px] h-full flex-col justify-between overflow-hidden rounded-[2rem] p-8 sm:p-10 ${selected ? 'hover:-translate-y-1' : 'hover:-translate-y-1 hover:bg-white'}`} style={selected ? { background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: '0 24px 48px -22px rgba(24,40,28,0.3)' } : { background: HOME_COLORS.surfaceContainerLow, color: HOME_COLORS.primary, border: `1px solid ${HOME_COLORS.outlineVariant}22` }}>
                      <div>
                        <div className="mb-10 flex items-start justify-between"><div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: selected ? 'rgba(255,255,255,0.1)' : HOME_COLORS.primary, color: selected ? HOME_COLORS.primaryFixed : HOME_COLORS.onPrimary }}><Building2 size={26} /></div><span className="rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ background: selected ? `${HOME_COLORS.primaryFixed}22` : `${HOME_COLORS.primary}0d`, color: selected ? HOME_COLORS.primaryFixed : HOME_COLORS.primary }}>{selected ? 'Active workspace' : 'Research hub'}</span></div>
                        <h3 className="text-3xl sm:text-4xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{workspace.name}</h3>
                        <p className="mt-4 max-w-md text-sm leading-6" style={{ color: selected ? 'rgba(255,255,255,0.55)' : HOME_COLORS.onSurfaceVariant }}>A focused environment for shared personas, interviews, and executive-ready reports.</p>
                      </div>
                      <div className="flex items-end justify-between border-t pt-6" style={{ borderColor: selected ? 'rgba(255,255,255,0.1)' : `${HOME_COLORS.primary}12` }}><div className="flex gap-8"><WorkspaceStat value={selected ? realPersonaCount : '—'} label="Personas" /><WorkspaceStat value={selected ? realInterviewCount : '—'} label="Interviews" /></div><span className="flex h-11 w-11 items-center justify-center rounded-full transition-colors" style={{ background: selected ? HOME_COLORS.primaryFixed : HOME_COLORS.primary, color: selected ? HOME_COLORS.onPrimaryFixed : HOME_COLORS.onPrimary }}><ArrowRight size={18} /></span></div>
                    </div>
                  </button>
                })}
              </div>
            )}
          </section>

          {selectedWorkspace && <section className="grid grid-cols-1 gap-8 border-t pt-14 lg:grid-cols-12" style={{ borderColor: `${HOME_COLORS.outlineVariant}55` }}>
            <div className="lg:col-span-8">
              <div className="rounded-[2rem] p-7 sm:p-10" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
                <div className="flex flex-wrap items-start justify-between gap-5"><div><span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primaryFixed }}>Selected workspace</span><h2 className="mt-3 text-3xl" style={{ fontFamily: HOME_FONT_DISPLAY }}>{selectedWorkspace.name}</h2></div><button onClick={() => handleDeleteWorkspace(selectedWorkspace.id)} title="Delete workspace" className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'white', background: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button></div>
                <div className="mt-10 flex flex-wrap gap-6 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>{([{ key: 'personas', label: 'Personas' }, { key: 'interviews', label: 'Interviews' }, { key: 'reports', label: 'Reports' }] as { key: ContentTab; label: string }[]).map(tab => <button key={tab.key} onClick={() => setContentTab(tab.key)} className="border-b-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: contentTab === tab.key ? HOME_COLORS.primaryFixed : 'transparent', color: contentTab === tab.key ? 'white' : 'rgba(255,255,255,0.45)', background: 'none', cursor: 'pointer' }}>{tab.label}</button>)}</div>
                <div className="mt-6">{loadingContent ? <div className="h-32 animate-pulse rounded-2xl bg-white/5" /> : <WorkspaceContent tab={contentTab} personas={workspacePersonas} interviews={workspaceInterviews} reports={workspaceReports} />}</div>
              </div>
            </div>
            <aside className="lg:col-span-4">
              <div className="rounded-[2rem] border p-7 sm:p-8" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: `${HOME_COLORS.outlineVariant}55` }}>
                <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>Research team</p><p className="mt-2 text-sm" style={{ color: HOME_COLORS.onSurface }}>{members.length} member{members.length === 1 ? '' : 's'} with access</p></div><button onClick={() => setInvitingOpen(open => !open)} className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}><UserPlus size={16} /></button></div>
                <AnimatePresence>{invitingOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div className="mt-5 flex gap-2 rounded-xl p-2" style={{ background: HOME_COLORS.surfaceContainer }}><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()} placeholder="teammate@company.com" className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" style={{ color: HOME_COLORS.onSurface }} /><button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}>{inviting ? 'Sending...' : 'Invite'}</button></div></motion.div>}</AnimatePresence>
                <div className="mt-6 space-y-3">{loadingDetail ? [1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainer }} />) : members.map(member => <div key={member.id} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full"><PersonaAvatar avatarUrl={member.avatar_url} avatarInitials={getInitials(member.full_name || member.email)} avatarColor={getAvatarColor(member.full_name || member.email)} name={member.full_name ?? member.email} size="sm" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{member.full_name || member.email}</p><p className="text-[9px] uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>{member.role}</p></div></div>{member.role !== 'owner' && <button onClick={() => handleRemoveMember(member.id)} aria-label={`Remove ${member.full_name || member.email}`} className="p-1" style={{ color: HOME_COLORS.error, background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>}</div>)}{invites.map(invite => <div key={invite.id} className="flex items-center justify-between gap-3 text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}><span className="truncate">{invite.invited_email}</span><button onClick={() => handleRevokeInvite(invite.id)} className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.error, background: 'none', border: 'none', cursor: 'pointer' }}>Revoke</button></div>)}</div>
              </div>
            </aside>
          </section>}
        </main>
      </div>
    )
  }

  return (
    <div style={{ background: DARK_BG, fontFamily: HOME_FONT_BODY, ...gridBackground }} className="min-h-full">
      <main className="p-6 sm:p-10 max-w-[1300px] mx-auto">
        {/* Hero */}
        <section className="max-w-3xl mb-10 sm:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-[0.5px] w-8" style={{ background: 'rgba(255,255,255,0.4)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.6)' }}>Isolated Research Workspaces</span>
          </div>
          <h1 className="mb-5" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, fontSize: '40px', lineHeight: '48px', letterSpacing: '-0.02em', color: 'white' }}>Workspaces</h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-sm leading-relaxed max-w-lg font-light" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Dedicated environments for <span className="italic" style={{ fontFamily: HOME_FONT_DISPLAY, color: 'white' }}>client and brand research</span> — invite your team, and each member sees only what they&rsquo;ve been added to.
            </p>
            <button
              onClick={() => setShowCreatePanel(v => !v)}
              className="whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-[11px] tracking-widest uppercase hover:opacity-90 transition-all group flex items-center gap-2 flex-shrink-0"
              style={{ background: HOME_COLORS.primaryFixedDim, color: '#18281c', border: 'none', cursor: 'pointer' }}
            >
              Initiate Workspace
              <Plus size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        <AnimatePresence>
          {showCreatePanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-2xl p-5 flex items-center gap-3 flex-wrap" style={glass}>
                <input
                  autoFocus
                  value={newWorkspaceName}
                  onChange={e => setNewWorkspaceName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Name this workspace — e.g. a client or brand"
                  maxLength={120}
                  className="flex-1 min-w-[200px] bg-transparent text-sm outline-none placeholder:text-white/20"
                  style={{ color: 'white', border: 'none' }}
                />
                <button
                  onClick={handleCreate}
                  disabled={creating || !newWorkspaceName.trim()}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-full disabled:opacity-40 flex-shrink-0"
                  style={{ background: HOME_COLORS.primaryFixedDim, color: '#18281c', border: 'none', cursor: 'pointer' }}
                >
                  {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Create
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-xs rounded-xl px-3.5 py-2.5 mb-6" style={{ color: '#FFB4AB', background: 'rgba(255,180,171,0.1)', border: '0.5px solid rgba(255,180,171,0.2)' }}>{error}</p>
        )}

        {/* Workspace switcher */}
        {!loadingWorkspaces && workspaces.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-10">
            {workspaces.map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedId(w.id)}
                className="px-4 py-2 rounded-full text-xs font-medium transition-all"
                style={w.id === selectedId
                  ? { background: 'rgba(184,204,186,0.15)', border: '0.5px solid rgba(184,204,186,0.4)', color: HOME_COLORS.primaryFixedDim, cursor: 'pointer' }
                  : { ...glass, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
              >
                {w.name}
              </button>
            ))}
          </div>
        )}

        {loadingWorkspaces ? (
          <div className="h-[280px] rounded-2xl animate-pulse" style={glass} />
        ) : workspaces.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={glass}>
            <Building2 size={22} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>No workspaces yet — create one to invite your team.</p>
          </div>
        ) : !selectedWorkspace ? null : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left column */}
            <div className="col-span-1 lg:col-span-8 space-y-8">
              {/* Active workspace highlight */}
              <div
                className="rounded-2xl p-6 sm:p-7 relative overflow-hidden"
                style={{ ...glass, background: `linear-gradient(135deg, rgba(184,204,186,0.06), rgba(255,255,255,0.02))` }}
              >
                <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest mb-3" style={{ background: 'rgba(184,204,186,0.15)', color: HOME_COLORS.primaryFixedDim }}>Active Workspace</span>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white leading-tight" style={{ fontFamily: HOME_FONT_DISPLAY }}>{selectedWorkspace.name}</h2>
                  </div>
                  <button
                    onClick={() => handleDeleteWorkspace(selectedWorkspace.id)}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ border: '0.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', background: 'none', cursor: 'pointer' }}
                    title="Delete workspace"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pt-5" style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Members</p>
                      <p className="text-sm text-white font-medium">{members.length} {members.length === 1 ? 'person' : 'people'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Personas</p>
                      <p className="text-sm text-white font-medium">{realPersonaCount} active</p>
                    </div>
                  </div>
                  <div className="flex -space-x-2.5">
                    {members.slice(0, 4).map(m => (
                      <div key={m.id} className="w-8 h-8 rounded-full flex-shrink-0" style={{ border: `2px solid ${DARK_BG}` }}>
                        <PersonaAvatar avatarUrl={m.avatar_url} avatarInitials={getInitials(m.full_name || m.email)} avatarColor={getAvatarColor(m.full_name || m.email)} name={m.full_name ?? m.email} size="sm" />
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ border: `2px solid ${DARK_BG}`, background: 'white', color: '#18281c' }}>
                        +{members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content tabs */}
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.4)' }}>Workspace Content</h2>
                  <div className="flex gap-5">
                    {([
                      { key: 'personas', label: 'Personas' },
                      { key: 'interviews', label: 'Interviews' },
                      { key: 'reports', label: 'Reports' },
                    ] as { key: ContentTab; label: string }[]).map(t => (
                      <button
                        key={t.key}
                        onClick={() => setContentTab(t.key)}
                        className="text-[9px] font-bold uppercase tracking-widest pb-1 transition-colors"
                        style={contentTab === t.key
                          ? { color: 'rgba(255,255,255,0.9)', borderBottom: `1px solid ${HOME_COLORS.primaryFixedDim}`, background: 'none', cursor: 'pointer' }
                          : { color: 'rgba(255,255,255,0.3)', border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl p-5 sm:p-6" style={glassActive}>
                  {loadingContent ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
                    </div>
                  ) : contentTab === 'personas' ? (
                    workspacePersonas.length === 0 ? (
                      <EmptyContentState icon={Users} text="No personas assigned to this workspace yet." />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {workspacePersonas.slice(0, 6).map(p => (
                          <Link key={p.id} href={`/personas/${p.id}`} className="rounded-xl p-3.5 border flex items-center gap-3 transition-colors hover:bg-white/[0.04]" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <PersonaAvatar avatarUrl={p.avatar_url} avatarInitials={p.avatar_initials} avatarColor={p.avatar_color} name={p.name} size="sm" className="flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{p.name}</p>
                              <p className="text-[9px] uppercase tracking-widest font-black truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.traits?.job_title || 'No role set'}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )
                  ) : contentTab === 'interviews' ? (
                    workspaceInterviews.length === 0 ? (
                      <EmptyContentState icon={MessagesSquare} text="No interviews run in this workspace yet." />
                    ) : (
                      <div className="space-y-2.5">
                        {workspaceInterviews.slice(0, 6).map(iv => (
                          <Link key={iv.id} href={`/interviews/${iv.id}`} className="flex items-center justify-between gap-3 rounded-xl p-3.5 border transition-colors hover:bg-white/[0.04]" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center gap-3 min-w-0">
                              <PersonaAvatar avatarUrl={iv.persona?.avatar_url} avatarInitials={iv.persona?.avatar_initials} avatarColor={iv.persona?.avatar_color} name={iv.persona?.name} size="sm" className="flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{iv.title}</p>
                                <p className="text-[9px] uppercase tracking-widest font-black" style={{ color: 'rgba(255,255,255,0.35)' }}>{iv.persona?.name ?? 'Unknown persona'}</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: HOME_COLORS.primaryFixedDim }}>{iv.status}</span>
                          </Link>
                        ))}
                      </div>
                    )
                  ) : (
                    workspaceReports.length === 0 ? (
                      <EmptyContentState icon={FileText} text="No reports generated in this workspace yet." />
                    ) : (
                      <div className="space-y-2.5">
                        {workspaceReports.slice(0, 6).map(r => (
                          <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center justify-between gap-3 rounded-xl p-3.5 border transition-colors hover:bg-white/[0.04]" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{r.interview?.title ?? 'Untitled interview'}</p>
                              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.executive_summary}</p>
                            </div>
                            <span className="text-xs font-bold flex-shrink-0" style={{ color: HOME_COLORS.primaryFixedDim }}>{r.confidence_score}%</span>
                          </Link>
                        ))}
                      </div>
                    )
                  )}

                  <div className="flex items-center gap-8 mt-6 pt-5" style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Personas</p>
                      <p className="text-lg text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>{realPersonaCount}</p>
                    </div>
                    <div className="w-[0.5px] h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Interviews</p>
                      <p className="text-lg text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>{realInterviewCount}</p>
                    </div>
                    <div className="w-[0.5px] h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Reports</p>
                      <p className="text-lg text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>{realReportCount}</p>
                    </div>
                  </div>
                </div>

                {/* Secondary summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Link href="/reports" className="rounded-2xl p-5 sm:p-6 group transition-all hover:bg-white/[0.02]" style={glass}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}>
                        <FileText size={17} />
                      </div>
                      <h3 className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors" style={{ fontFamily: HOME_FONT_DISPLAY }}>Reports</h3>
                    </div>
                    <p className="text-[11px] leading-relaxed mb-4 font-light" style={{ color: 'rgba(255,255,255,0.35)' }}>Executive-ready summaries generated from this workspace&rsquo;s interviews.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest italic" style={{ color: HOME_COLORS.primaryFixedDim }}>{realReportCount} report{realReportCount === 1 ? '' : 's'}</span>
                      <ArrowRight size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  </Link>
                  <Link href="/interviews" className="rounded-2xl p-5 sm:p-6 group transition-all hover:bg-white/[0.02]" style={glass}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}>
                        <MessagesSquare size={17} />
                      </div>
                      <h3 className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors" style={{ fontFamily: HOME_FONT_DISPLAY }}>Interviews</h3>
                    </div>
                    <p className="text-[11px] leading-relaxed mb-4 font-light" style={{ color: 'rgba(255,255,255,0.35)' }}>A shared library of every interview run inside this workspace.</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest italic" style={{ color: HOME_COLORS.primaryFixedDim }}>{realInterviewCount} interview{realInterviewCount === 1 ? '' : 's'}</span>
                      <ArrowRight size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="col-span-1 lg:col-span-4 space-y-6">
              {/* Isolation model explainer */}
              <div className="rounded-2xl p-6 sm:p-7 space-y-6" style={glass}>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.3)' }}>Access Model</p>
                  <h3 className="text-lg font-semibold text-white leading-tight" style={{ fontFamily: HOME_FONT_DISPLAY }}>Data Isolation</h3>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: `0.5px solid ${HOME_COLORS.primaryFixedDim}33`, background: `${HOME_COLORS.primaryFixedDim}0d` }}>
                    <Verified size={14} style={{ color: HOME_COLORS.primaryFixedDim }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Personas, interviews, and reports assigned here are visible and editable by <span className="text-white font-medium">every member below — and only them</span>.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-5 pt-5" style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Isolation</p>
                    <p className="text-sm text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>Full</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Seats used</p>
                    <p className="text-sm text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>{allSeats.size} / {seatLimit}</p>
                  </div>
                </div>
                <Link
                  href="/faq"
                  className="w-full py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center justify-center gap-2"
                  style={{ border: '0.5px solid rgba(255,255,255,0.1)' }}
                >
                  <ShieldCheck size={15} />
                  Workspace Guidelines
                </Link>
              </div>

              {/* Team */}
              <div className="rounded-2xl p-6 sm:p-7 space-y-6" style={{ ...glass, border: `0.5px solid ${HOME_COLORS.primaryFixedDim}33` }}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-white" style={{ fontFamily: HOME_FONT_DISPLAY }}>Research Team</h3>
                    <p className="text-[9px] uppercase tracking-widest font-black italic" style={{ color: 'rgba(255,255,255,0.3)' }}>Members of this workspace</p>
                  </div>
                  <button
                    onClick={() => setInvitingOpen(o => !o)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{ border: '0.5px solid rgba(255,255,255,0.1)', color: 'white', background: 'none', cursor: 'pointer' }}
                  >
                    <UserPlus size={14} />
                  </button>
                </div>

                <AnimatePresence>
                  {invitingOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleInvite()}
                          placeholder="teammate@company.com"
                          className="flex-1 min-w-0 text-xs px-2 py-1.5 bg-transparent outline-none placeholder:text-white/20"
                          style={{ color: 'white', border: 'none' }}
                        />
                        <button
                          onClick={handleInvite}
                          disabled={inviting || !inviteEmail.trim()}
                          className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
                          style={{ background: HOME_COLORS.primaryFixedDim, color: '#18281c', border: 'none', cursor: 'pointer' }}
                        >
                          {inviting ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  {loadingDetail ? (
                    [1, 2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />)
                  ) : (
                    <>
                      {members.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '0.5px solid rgba(255,255,255,0.1)' }}>
                              <PersonaAvatar avatarUrl={m.avatar_url} avatarInitials={getInitials(m.full_name || m.email)} avatarColor={getAvatarColor(m.full_name || m.email)} name={m.full_name ?? m.email} size="md" shape="square" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white tracking-tight truncate">{m.full_name || m.email}</p>
                              {m.role === 'owner' ? (
                                <p className="text-[9px] uppercase tracking-widest font-black italic flex items-center gap-1" style={{ color: HOME_COLORS.primaryFixedDim }}><Crown size={9} /> Owner</p>
                              ) : (
                                <p className="text-[9px] uppercase tracking-widest font-black italic truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.email}</p>
                              )}
                            </div>
                          </div>
                          {m.role === 'owner' ? (
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#34d399' }} />
                          ) : (
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              aria-label={`Remove ${m.full_name || m.email}`}
                              className="flex-shrink-0"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}

                      {invites.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-3.5 rounded-xl opacity-50">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ border: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.03)' }}>
                              <span className="text-[9px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Inv</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white/40 tracking-tight truncate">{inv.invited_email}</p>
                              <p className="text-[9px] uppercase tracking-widest font-black italic" style={{ color: 'rgba(255,255,255,0.2)' }}>Invite pending</p>
                            </div>
                          </div>
                          <button onClick={() => handleRevokeInvite(inv.id)} className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest" style={{ color: '#FFB4AB', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Revoke
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="pt-4" style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[9px] text-center font-bold uppercase tracking-[0.25em] italic" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {members.length} team member{members.length === 1 ? '' : 's'} in this workspace
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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
