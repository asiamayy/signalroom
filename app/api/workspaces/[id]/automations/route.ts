import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { WorkspaceAutomationEvent, WorkspaceWebhookProvider } from '@/types'

const EVENTS: WorkspaceAutomationEvent[] = ['persona_created', 'interview_started', 'report_generated']

function validWebhookUrl(value: unknown, provider: WorkspaceWebhookProvider) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase()
    const isSlack = host === 'hooks.slack.com' || host.endsWith('.hooks.slack.com')
    const isTeams = host === 'outlook.office.com' || host.endsWith('.webhook.office.com') || host.endsWith('.logic.azure.com')
    return (provider === 'slack' ? isSlack : isTeams) ? url.toString() : null
  } catch {
    return null
  }
}

async function requireOwner(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: workspace } = await supabase.from('workspaces').select('id, owner_id').eq('id', workspaceId).maybeSingle()
  if (!workspace || workspace.owner_id !== user.id) {
    return { error: NextResponse.json({ error: 'Only the workspace owner can manage workflow notifications.' }, { status: 403 }) }
  }
  return { user, workspace }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireOwner(id)
  if ('error' in access) return access.error

  const admin = await createAdminClient()
  // Deliberately omit webhook_url from every browser response.
  const { data, error } = await admin
    .from('workspace_automations')
    .select('id, workspace_id, provider, display_name, events, enabled, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireOwner(id)
  if ('error' in access) return access.error

  const body = await request.json()
  const provider = body.provider === 'teams' ? 'teams' : body.provider === 'slack' ? 'slack' : null
  if (!provider) return NextResponse.json({ error: 'Choose Slack or Microsoft Teams.' }, { status: 400 })
  const webhookUrl = validWebhookUrl(body.webhookUrl, provider)
  if (!webhookUrl) return NextResponse.json({ error: provider === 'slack' ? 'Enter a valid Slack incoming-webhook URL.' : 'Enter a valid Microsoft Teams incoming-webhook URL.' }, { status: 400 })
  const events = Array.isArray(body.events)
    ? body.events.filter((event: unknown): event is WorkspaceAutomationEvent => typeof event === 'string' && EVENTS.includes(event as WorkspaceAutomationEvent))
    : EVENTS
  if (!events.length) return NextResponse.json({ error: 'Choose at least one trigger.' }, { status: 400 })
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 80) : ''

  const admin = await createAdminClient()
  const { error } = await admin.from('workspace_automations').insert({
    workspace_id: id,
    provider,
    webhook_url: webhookUrl,
    display_name: displayName || (provider === 'slack' ? 'Slack' : 'Microsoft Teams') + ' workspace updates',
    events,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireOwner(id)
  if ('error' in access) return access.error

  const { automationId, enabled } = await request.json()
  if (typeof automationId !== 'string' || typeof enabled !== 'boolean') return NextResponse.json({ error: 'Invalid notification setting.' }, { status: 400 })
  const admin = await createAdminClient()
  const { error } = await admin.from('workspace_automations').update({ enabled }).eq('id', automationId).eq('workspace_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requireOwner(id)
  if ('error' in access) return access.error

  const { automationId } = await request.json()
  if (typeof automationId !== 'string') return NextResponse.json({ error: 'Notification setting required.' }, { status: 400 })
  const admin = await createAdminClient()
  const { error } = await admin.from('workspace_automations').delete().eq('id', automationId).eq('workspace_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
