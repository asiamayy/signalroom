'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, ChevronDown, Loader2, Plus, Power, Trash2, Webhook } from 'lucide-react'
import { HOME_COLORS, HOME_FONT_DISPLAY } from '@/lib/home-theme'
import type { WorkspaceAutomation, WorkspaceAutomationEvent, WorkspaceWebhookProvider } from '@/types'

const EVENTS: { value: WorkspaceAutomationEvent; label: string }[] = [
  { value: 'persona_created', label: 'A persona is created' },
  { value: 'interview_started', label: 'An interview starts' },
  { value: 'report_generated', label: 'An insight report is ready' },
]

export function WorkspaceAutomations({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<WorkspaceAutomation[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState<WorkspaceWebhookProvider>('slack')
  const [displayName, setDisplayName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [events, setEvents] = useState<WorkspaceAutomationEvent[]>(EVENTS.map(item => item.value))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const endpoint = '/api/workspaces/' + workspaceId + '/automations'

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch(endpoint)
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not load workflow notifications.')
      setItems(json.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Could not load workflow notifications.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [workspaceId])

  const save = async () => {
    if (!webhookUrl.trim() || saving || !events.length) return
    setSaving(true); setError('')
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, displayName, webhookUrl, events }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not save workflow notification.')
      setWebhookUrl(''); setDisplayName(''); setEvents(EVENTS.map(item => item.value)); setOpen(false)
      await load()
    } catch (err: any) {
      setError(err?.message ?? 'Could not save workflow notification.')
    } finally {
      setSaving(false)
    }
  }

  const update = async (automationId: string, enabled: boolean) => {
    setItems(current => current.map(item => item.id === automationId ? { ...item, enabled } : item))
    const response = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ automationId, enabled }) })
    if (!response.ok) { setError('Could not update that notification.'); await load() }
  }

  const remove = async (automationId: string) => {
    const response = await fetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ automationId }) })
    if (response.ok) setItems(current => current.filter(item => item.id !== automationId))
    else setError('Could not remove that notification.')
  }

  const toggleEvent = (value: WorkspaceAutomationEvent) => setEvents(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])

  return <section className="mt-10 rounded-[2rem] border p-4 sm:p-5" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: HOME_COLORS.outlineVariant + '55' }}>
    <button type="button" onClick={() => setSettingsOpen(value => !value)} className="flex w-full items-center justify-between gap-4 rounded-[1.25rem] px-3 py-2 text-left transition-colors hover:bg-[#f1f4f0]" style={{ color: HOME_COLORS.primary }}>
      <span><span className="flex items-center gap-2 text-sm font-semibold"><Webhook size={16} />Workspace settings</span><span className="mt-1 block text-xs font-normal" style={{ color: HOME_COLORS.onSurfaceVariant }}>Manage workflow notifications and owner-only workspace controls.</span></span>
      <ChevronDown size={18} className={settingsOpen ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
    </button>
    <AnimatePresence>{settingsOpen && <motion.div initial={{ opacity: 0, height: 0, y: -6 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -6 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden"><div className="px-3 pb-3 pt-7">
    <div className="flex flex-wrap items-start justify-between gap-5"><div><div className="flex items-center gap-2"><BellRing size={18} style={{ color: HOME_COLORS.primary }} /><h2 className="text-xl" style={{ fontFamily: HOME_FONT_DISPLAY, color: HOME_COLORS.primary }}>Workflow notifications</h2></div><p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>Send an update to Slack or Microsoft Teams when shared research moves forward. Webhook addresses remain private and are never shown again.</p></div><button type="button" onClick={() => setOpen(value => !value)} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(24,40,28,0.18)] active:scale-95" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}><Plus size={14} />Add notification</button></div>
    <AnimatePresence>{open && <motion.div initial={{ opacity: 0, height: 0, y: -8 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -8 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden"><div className="mt-7 rounded-2xl border p-5 sm:p-6" style={{ background: HOME_COLORS.surfaceContainerLow, borderColor: HOME_COLORS.outlineVariant + '66' }}>
      <div className="flex gap-2">{(['slack', 'teams'] as WorkspaceWebhookProvider[]).map(item => <button key={item} type="button" onClick={() => setProvider(item)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm" style={{ background: provider === item ? HOME_COLORS.primary : HOME_COLORS.surfaceContainerLowest, color: provider === item ? HOME_COLORS.onPrimary : HOME_COLORS.onSurfaceVariant }}><img src={item === 'slack' ? '/integrations/slack.svg' : '/integrations/teams.svg'} alt="" className="h-4 w-4" />{item === 'slack' ? 'Slack' : 'Microsoft Teams'}</button>)}</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>Destination label<input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder={provider === 'slack' ? '#research-updates' : 'Research team'} maxLength={80} className="mt-2 w-full rounded-xl px-3 py-2.5 text-sm font-normal outline-none" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface, border: '1px solid ' + HOME_COLORS.outlineVariant + '77' }} /></label><label className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>Incoming webhook URL<input value={webhookUrl} onChange={event => setWebhookUrl(event.target.value)} type="url" placeholder={provider === 'slack' ? 'https://hooks.slack.com/…' : 'https://…office.com/webhook/…'} className="mt-2 w-full rounded-xl px-3 py-2.5 text-sm font-normal outline-none" style={{ background: HOME_COLORS.surfaceContainerLowest, color: HOME_COLORS.onSurface, border: '1px solid ' + HOME_COLORS.outlineVariant + '77' }} /></label></div>
      <p className="mt-5 text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>Send an update when</p><div className="mt-3 flex flex-wrap gap-2">{EVENTS.map(item => <button key={item.value} type="button" onClick={() => toggleEvent(item.value)} className="rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: events.includes(item.value) ? HOME_COLORS.secondaryContainer : HOME_COLORS.surfaceContainerLowest, color: events.includes(item.value) ? HOME_COLORS.primary : HOME_COLORS.onSurfaceVariant }}>{item.label}</button>)}</div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="px-3 text-xs font-semibold" style={{ color: HOME_COLORS.onSurfaceVariant }}>Cancel</button><button type="button" onClick={save} disabled={saving || !webhookUrl.trim() || !events.length} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold disabled:opacity-40" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>{saving ? <Loader2 size={13} className="animate-spin" /> : <Webhook size={13} />}Save notification</button></div>
    </div></motion.div>}</AnimatePresence>
    {error && <p className="mt-4 text-xs" style={{ color: HOME_COLORS.error }}>{error}</p>}
    <div className="mt-7 space-y-3">{loading ? <div className="h-16 animate-pulse rounded-xl" style={{ background: HOME_COLORS.surfaceContainerLow }} /> : items.length ? items.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4" style={{ borderColor: HOME_COLORS.outlineVariant + '55', background: HOME_COLORS.surfaceContainerLow }}><div><p className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{item.display_name}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: HOME_COLORS.onSurfaceVariant }}>{item.provider === 'slack' ? 'Slack' : 'Microsoft Teams'} · {item.events.length} trigger{item.events.length === 1 ? '' : 's'}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => update(item.id, !item.enabled)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase" style={{ background: item.enabled ? HOME_COLORS.secondaryContainer : HOME_COLORS.surfaceContainerLowest, color: item.enabled ? HOME_COLORS.primary : HOME_COLORS.onSurfaceVariant }}><Power size={11} />{item.enabled ? 'On' : 'Off'}</button><button type="button" onClick={() => remove(item.id)} aria-label={'Remove ' + item.display_name} className="rounded-full p-2" style={{ color: HOME_COLORS.error }}><Trash2 size={14} /></button></div></div>) : <div className="rounded-2xl border border-dashed p-5 text-sm" style={{ color: HOME_COLORS.onSurfaceVariant, borderColor: HOME_COLORS.outlineVariant + '77' }}>No workflow notifications yet. Add one to keep the team informed without checking the workspace.</div>}</div>
    </div></motion.div>}</AnimatePresence>
  </section>
}
