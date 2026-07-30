import 'server-only'

import { createAdminClient } from '@/lib/supabase/server'
import { logError } from '@/lib/logger'
import type { WorkspaceAutomationEvent, WorkspaceWebhookProvider } from '@/types'

type WorkspaceWebhook = {
  id: string
  provider: WorkspaceWebhookProvider
  webhook_url: string
  display_name: string
  events: WorkspaceAutomationEvent[]
}

const EVENT_LABELS: Record<WorkspaceAutomationEvent, string> = {
  persona_created: 'A new persona was created',
  interview_started: 'A new interview was started',
  report_generated: 'A new insight report is ready',
}

function payloadFor(provider: WorkspaceWebhookProvider, workspaceName: string, event: WorkspaceAutomationEvent, itemName: string) {
  const headline = EVENT_LABELS[event]
  const text = `${headline} in ${workspaceName}: ${itemName}`
  if (provider === 'teams') {
    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: '18281C',
      summary: text,
      sections: [{ activityTitle: 'SignalRoom workspace update', activitySubtitle: workspaceName, text: `**${headline}**\n\n${itemName}` }],
    }
  }
  return {
    text,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: 'SignalRoom workspace update' } },
      { type: 'section', text: { type: 'mrkdwn', text: `*${headline}*\n${itemName}` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: workspaceName }] },
    ],
  }
}

// Best-effort outbound notification. This runs after a successful product
// action and must never make persona, interview, or report creation fail.
export async function pushWorkspaceAutomation(input: {
  workspaceId: string | null | undefined
  event: WorkspaceAutomationEvent
  itemName: string
}) {
  if (!input.workspaceId) return
  try {
    const admin = await createAdminClient()
    const [{ data: workspace }, { data: webhooks }] = await Promise.all([
      admin.from('workspaces').select('name').eq('id', input.workspaceId).maybeSingle(),
      admin.from('workspace_automations').select('id, provider, webhook_url, display_name, events').eq('workspace_id', input.workspaceId).eq('enabled', true),
    ])
    if (!workspace || !webhooks?.length) return

    await Promise.all(webhooks
      .filter((webhook: WorkspaceWebhook) => webhook.events.includes(input.event))
      .map(async (webhook: WorkspaceWebhook) => {
        try {
          const response = await fetch(webhook.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadFor(webhook.provider, workspace.name, input.event, input.itemName)),
          })
          if (!response.ok) throw new Error(`Webhook returned ${response.status}`)
        } catch (error) {
          logError('workspace_automations.dispatch', error, { workspaceId: input.workspaceId, automationId: webhook.id, event: input.event })
        }
      }))
  } catch (error) {
    logError('workspace_automations.lookup', error, { workspaceId: input.workspaceId, event: input.event })
  }
}
