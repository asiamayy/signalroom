'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserPlus, Plus, X, Trash2, Loader2, Lock, Crown } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW, getInitials, getAvatarColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import type { Plan, Workspace, WorkspaceMember, WorkspaceInvite } from '@/types'

export function TeamClient() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [allSeats, setAllSeats] = useState<Set<string>>(new Set())

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

    // Total distinct seats used across every workspace, for the "X/10" indicator.
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
    const [mRes, iRes] = await Promise.all([
      fetch(`/api/workspaces/${workspaceId}/members`),
      fetch(`/api/workspaces/${workspaceId}/invites`),
    ])
    const mJson = await mRes.json()
    const iJson = await iRes.json()
    setMembers(mJson.data ?? [])
    setInvites(iJson.data ?? [])
    setLoadingDetail(false)
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
    return <div className="min-h-full p-4 sm:p-10" style={{ background: HOME_COLORS.surface }} />
  }

  if (plan !== 'agency') {
    return (
      <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full p-4 sm:p-10 max-w-2xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-2" style={{ ...DISPLAY_LG_STYLE, fontSize: '28px', lineHeight: '36px', color: HOME_COLORS.onSurface }}>
            <UserPlus size={22} style={{ color: HOME_COLORS.onSurfaceVariant }} />
            Team
          </h1>
          <p className="text-sm mt-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Invite teammates into isolated workspaces — each with full create/edit access, scoped to just what you share with them.
          </p>
        </div>
        <div className="rounded-2xl p-10 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: HOME_COLORS.surfaceContainerHigh }}>
            <Lock size={22} style={{ color: HOME_COLORS.onSurfaceVariant }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: HOME_COLORS.onSurface }}>Broadcast plan required</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Create up to {seatLimit} team seats across isolated workspaces — one per client, or however you want to split your research.
          </p>
          <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm font-semibold px-6 py-3 rounded-full text-white transition-colors" style={{ background: HOME_COLORS.primary }}>
            Upgrade plan →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full p-4 sm:p-10">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="flex items-center gap-2" style={{ ...DISPLAY_LG_STYLE, fontSize: '28px', lineHeight: '36px', color: HOME_COLORS.onSurface }}>
            <UserPlus size={22} style={{ color: HOME_COLORS.onSurfaceVariant }} />
            Team
          </h1>
          <p className="text-sm mt-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Isolated workspaces — each member only sees what they&rsquo;ve been added to.</p>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: allSeats.size >= seatLimit ? '#FFDAD6' : HOME_COLORS.secondaryContainer,
            color: allSeats.size >= seatLimit ? HOME_COLORS.error : HOME_COLORS.primary,
          }}
        >
          {allSeats.size} / {seatLimit} seats used
        </span>
      </div>

      {error && <p className="text-sm rounded-lg px-3 py-2 mb-4" style={{ color: HOME_COLORS.error, background: '#FFDAD6' }}>{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Workspace list */}
        <section className="p-5 rounded-xl h-fit" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: HOME_COLORS.onSurface }}>Workspaces</h3>
          {loadingWorkspaces ? (
            <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: HOME_COLORS.surfaceContainer }} />)}</div>
          ) : workspaces.length === 0 ? (
            <p className="text-xs mb-3" style={{ color: HOME_COLORS.onSurfaceVariant }}>No workspaces yet — create one below.</p>
          ) : (
            <div className="space-y-1.5 mb-4">
              {workspaces.map(w => (
                <button
                  key={w.id}
                  onClick={() => setSelectedId(w.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors"
                  style={selectedId === w.id
                    ? { background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary, fontWeight: 600, border: 'none', cursor: 'pointer' }
                    : { color: HOME_COLORS.onSurface, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {w.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}66` }}>
            <input
              value={newWorkspaceName}
              onChange={e => setNewWorkspaceName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="New workspace name"
              maxLength={120}
              className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg outline-none"
              style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newWorkspaceName.trim()}
              className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40"
              style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            </button>
          </div>
        </section>

        {/* Selected workspace detail */}
        <main className="flex flex-col gap-6 min-w-0">
          {!selectedWorkspace ? (
            <div className="rounded-xl p-10 text-center" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
              <p className="text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>Select or create a workspace to manage its members.</p>
            </div>
          ) : (
            <>
              <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
                <div className="flex items-center justify-between mb-1 gap-3">
                  <h2 className="text-lg font-semibold" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY }}>{selectedWorkspace.name}</h2>
                  <button
                    onClick={() => handleDeleteWorkspace(selectedWorkspace.id)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
                    style={{ border: `1px solid ${HOME_COLORS.outlineVariant}`, color: HOME_COLORS.error, background: 'none', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} /> Delete workspace
                  </button>
                </div>
                <p className="text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  Personas, interviews, and reports assigned here are visible and editable by every member below — and only them.
                </p>
              </section>

              <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>Members</h3>
                  <button
                    onClick={() => setInvitingOpen(o => !o)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                    style={{ border: `1px solid ${HOME_COLORS.outlineVariant}`, color: HOME_COLORS.onSurface, background: 'none', cursor: 'pointer' }}
                  >
                    <UserPlus size={12} /> Invite member
                  </button>
                </div>

                {invitingOpen && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: HOME_COLORS.surfaceContainerLow }}>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleInvite()}
                      placeholder="teammate@company.com"
                      className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg outline-none"
                      style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
                    />
                    <button
                      onClick={handleInvite}
                      disabled={inviting || !inviteEmail.trim()}
                      className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
                      style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, border: 'none', cursor: 'pointer' }}
                    >
                      {inviting ? 'Sending...' : 'Send invite'}
                    </button>
                  </div>
                )}

                {loadingDetail ? (
                  <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: HOME_COLORS.surfaceContainer }} />)}</div>
                ) : (
                  <div className="space-y-2">
                    {members.map(m => {
                      const initials = getInitials(m.full_name || m.email)
                      const color = getAvatarColor(m.full_name || m.email)
                      return (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: HOME_COLORS.surfaceContainerLow }}>
                          <PersonaAvatar avatarUrl={m.avatar_url} avatarInitials={initials} avatarColor={color} name={m.full_name ?? m.email} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: HOME_COLORS.onSurface }}>{m.full_name || m.email}</p>
                            <p className="text-[11px] truncate" style={{ color: HOME_COLORS.onSurfaceVariant }}>{m.email}</p>
                          </div>
                          {m.role === 'owner' ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}>
                              <Crown size={10} /> Owner
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              aria-label={`Remove ${m.full_name || m.email}`}
                              className="flex-shrink-0"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: HOME_COLORS.onSurfaceVariant }}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {invites.length > 0 && (
                <section className="p-6 rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: HOME_COLORS.onSurface }}>Pending invites</h3>
                  <div className="space-y-2">
                    {invites.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: HOME_COLORS.surfaceContainerLow }}>
                        <span className="text-sm" style={{ color: HOME_COLORS.onSurface }}>{inv.invited_email}</span>
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="text-xs font-medium transition-colors"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: HOME_COLORS.error }}
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
