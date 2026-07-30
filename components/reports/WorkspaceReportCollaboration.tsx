'use client'

import { useEffect, useMemo, useState } from 'react'
import { AtSign, Bot, MessageCircle, Send, Sparkles, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HOME_COLORS, HOME_FONT_DISPLAY } from '@/lib/home-theme'
import type { WorkspaceComment, WorkspaceMember } from '@/types'

function displayName(member: { full_name?: string | null; email?: string | null }) {
  return member.full_name?.trim() || member.email?.split('@')[0] || 'Teammate'
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'S') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')
}

export function WorkspaceReportCollaboration({ reportId, workspaceId }: { reportId: string; workspaceId: string }) {
  const [comments, setComments] = useState<WorkspaceComment[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [posting, setPosting] = useState(false)
  const [discussionError, setDiscussionError] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState('')

  const mentionableMembers = useMemo(() => members.filter(member => member.id !== currentUserId), [members, currentUserId])

  useEffect(() => {
    let alive = true
    const supabase = createClient()
    const load = async () => {
      const [commentRes, memberRes, auth] = await Promise.all([
        fetch(`/api/reports/${reportId}/comments`),
        fetch(`/api/workspaces/${workspaceId}/members`),
        supabase.auth.getUser(),
      ])
      if (!alive) return
      const commentJson = await commentRes.json()
      const memberJson = await memberRes.json()
      setCurrentUserId(auth.data.user?.id ?? null)
      setMembers(memberJson.data ?? [])
      if (commentRes.ok) setComments(commentJson.data ?? [])
      else setDiscussionError('Workspace discussion will be available after its shared data is enabled.')
    }
    void load()

    const channel = supabase
      .channel(`workspace-report-comments:${reportId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_comments', filter: `report_id=eq.${reportId}` }, () => {
        fetch(`/api/reports/${reportId}/comments`)
          .then(response => response.ok ? response.json() : null)
          .then(json => { if (alive && json?.data) setComments(json.data) })
          .catch(() => {})
      })
      .subscribe()

    return () => {
      alive = false
      void supabase.removeChannel(channel)
    }
  }, [reportId, workspaceId])

  const toggleMention = (member: WorkspaceMember) => {
    const name = displayName(member)
    setMentions(current => current.includes(member.id) ? current.filter(id => id !== member.id) : [...current, member.id])
    setComment(current => current.includes(`@${name}`) ? current : `${current}${current ? ' ' : ''}@${name} `)
  }

  const postComment = async () => {
    if (!comment.trim() || posting) return
    setPosting(true)
    setDiscussionError('')
    try {
      const response = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment, mentionedUserIds: mentions, sectionKey: 'report' }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not post comment.')
      setComments(current => [...current, json.data])
      setComment('')
      setMentions([])
    } catch (error: any) {
      setDiscussionError(error?.message ?? 'Could not post comment.')
    } finally {
      setPosting(false)
    }
  }

  const askReport = async () => {
    if (!question.trim() || asking) return
    setAsking(true)
    setAskError('')
    setAnswer('')
    try {
      const response = await fetch(`/api/reports/${reportId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to answer that question.')
      setAnswer(json.data.answer)
    } catch (error: any) {
      setAskError(error?.message ?? 'Unable to answer that question.')
    } finally {
      setAsking(false)
    }
  }

  return <div className="space-y-6">
    <section className="rounded-2xl p-6" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: '0 8px 24px rgba(24,40,28,.05)' }}>
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><MessageCircle size={17} style={{ color: HOME_COLORS.primary }} /><h2 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.onSurface, fontWeight: 600 }}>Workspace discussion</h2></div><p className="mt-2 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Leave a note for your team or bring a teammate into the finding.</p></div>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide" style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}><Users size={11} />Shared</span>
      </div>
      <div className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
        {comments.length ? comments.map(item => {
          const name = displayName(item.author ?? {})
          return <div key={item.id} className="rounded-xl p-3.5" style={{ background: HOME_COLORS.surfaceContainerLow }}>
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>{initials(name)}</span><span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{name}</span><span className="ml-auto text-[10px]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{item.content}</p>
          </div>
        }) : <p className="rounded-xl border border-dashed p-4 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant, borderColor: `${HOME_COLORS.outlineVariant}88` }}>No notes yet. Add the decision, question, or evidence your team should see.</p>}
      </div>
      <div className="mt-5">
        {mentionableMembers.length > 0 && <div className="mb-3 flex flex-wrap items-center gap-2"><AtSign size={13} style={{ color: HOME_COLORS.onSurfaceVariant }} />{mentionableMembers.slice(0, 5).map(member => <button key={member.id} type="button" onClick={() => toggleMention(member)} className="rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors" style={{ background: mentions.includes(member.id) ? HOME_COLORS.primary : HOME_COLORS.surfaceContainer, color: mentions.includes(member.id) ? HOME_COLORS.onPrimary : HOME_COLORS.onSurfaceVariant }}>{displayName(member)}</button>)}</div>}
        <textarea value={comment} onChange={event => setComment(event.target.value)} maxLength={3000} placeholder="Share a thought with the workspace…" className="min-h-[82px] w-full resize-y rounded-xl p-3 text-sm outline-none" style={{ color: HOME_COLORS.onSurface, background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66` }} />
        {discussionError && <p className="mt-2 text-xs" style={{ color: HOME_COLORS.error }}>{discussionError}</p>}
        <div className="mt-3 flex justify-end"><button type="button" onClick={postComment} disabled={!comment.trim() || posting} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-transform active:scale-95 disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>{posting ? 'Posting…' : <><Send size={13} />Post note</>}</button></div>
      </div>
    </section>

    <section className="rounded-2xl p-6" style={{ background: '#dfe4da' }}>
      <div className="flex items-center gap-2"><Bot size={18} style={{ color: HOME_COLORS.primary }} /><h2 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary, fontWeight: 600 }}>Ask AI about this report</h2></div>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Get a grounded answer from this report, interview, and your shared workspace context.</p>
      <div className="mt-4 flex gap-2"><input value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void askReport() } }} maxLength={1000} placeholder="What were the top objections?" className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm outline-none" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface, border: `1px solid ${HOME_COLORS.outlineVariant}55` }} /><button type="button" onClick={askReport} disabled={!question.trim() || asking} className="rounded-lg px-3 transition-transform active:scale-95 disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }} aria-label="Ask AI">{asking ? <Sparkles className="animate-pulse" size={16} /> : <Send size={16} />}</button></div>
      {askError && <p className="mt-3 text-xs" style={{ color: HOME_COLORS.error }}>{askError}</p>}
      {answer && <div className="mt-4 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface }}>{answer}</div>}
    </section>
  </div>
}
