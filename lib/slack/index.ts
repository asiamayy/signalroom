import type { Report, Signal, Interview } from '@/types'

const SLACK_OAUTH_AUTHORIZE_URL = 'https://slack.com/oauth/v2/authorize'
const SLACK_OAUTH_ACCESS_URL = 'https://slack.com/api/oauth.v2.access'

function redirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`
}

// scope=incoming-webhook only — Slack's own consent screen lets the user
// pick the destination channel, and the token exchange hands back a
// ready-to-POST webhook URL for it. No bot token, no separate
// "list channels, let the user pick in our UI" step needed.
export function buildSlackAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: 'incoming-webhook',
    redirect_uri: redirectUri(),
    state,
  })
  return `${SLACK_OAUTH_AUTHORIZE_URL}?${params.toString()}`
}

interface SlackOAuthAccessResponse {
  ok: boolean
  error?: string
  team: { id: string; name: string }
  incoming_webhook: { url: string; channel: string; channel_id: string }
}

export async function exchangeSlackCode(code: string): Promise<SlackOAuthAccessResponse> {
  const res = await fetch(SLACK_OAUTH_ACCESS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri(),
    }),
  })

  const json = await res.json() as SlackOAuthAccessResponse
  if (!res.ok || !json.ok) {
    throw new Error(json.error ?? 'Slack token exchange failed')
  }
  return json
}

// Slack incoming webhooks accept a plain JSON POST — a non-2xx or a body
// that isn't literally "ok" both indicate failure. Caller is always
// responsible for its own try/catch; this never swallows an error itself.
export async function sendSlackMessage(webhookUrl: string, blocks: any[], fallbackText: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: fallbackText, blocks }),
  })

  const body = await res.text()
  if (!res.ok || body !== 'ok') {
    throw new Error(`Slack webhook post failed: ${res.status} ${body}`)
  }
}

function appUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

export function slackReportBlocks(
  report: Pick<Report, 'id' | 'executive_summary' | 'confidence_score'>,
  interview: Pick<Interview, 'title'>
): { blocks: any[]; fallbackText: string } {
  const fallbackText = `New research report: ${interview.title} (confidence ${report.confidence_score})`
  const blocks = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*New research report:* ${interview.title}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: report.executive_summary },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `Confidence score: *${report.confidence_score}*` }],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `<${appUrl(`/reports/${report.id}`)}|View full report>` },
    },
  ]
  return { blocks, fallbackText }
}

export function slackSignalBlocks(
  signal: Pick<Signal, 'title' | 'summary' | 'confidence_score' | 'impact'>
): { blocks: any[]; fallbackText: string } {
  const fallbackText = `New signal: ${signal.title}`
  const blocks = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*New signal detected:* ${signal.title}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: signal.summary },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `Confidence: *${signal.confidence_score}* · Impact: *${signal.impact ?? 'n/a'}*` }],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `<${appUrl('/signals')}|View signals>` },
    },
  ]
  return { blocks, fallbackText }
}
