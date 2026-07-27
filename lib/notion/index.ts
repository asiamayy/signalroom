import type { Report } from '@/types'

const NOTION_OAUTH_AUTHORIZE_URL = 'https://api.notion.com/v1/oauth/authorize'
const NOTION_OAUTH_TOKEN_URL = 'https://api.notion.com/v1/oauth/token'
const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

function redirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`
}

// Notion's own consent screen lets the user share specific pages with the
// integration, but the token exchange doesn't tell us which one to nest new
// content under — that's a separate "pick a destination page" step in
// Settings after connecting (see listNotionParentPages below).
export function buildNotionAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.NOTION_CLIENT_ID!,
    response_type: 'code',
    owner: 'user',
    redirect_uri: redirectUri(),
    state,
  })
  return `${NOTION_OAUTH_AUTHORIZE_URL}?${params.toString()}`
}

interface NotionOAuthTokenResponse {
  access_token: string
  bot_id: string
  workspace_id: string
  workspace_name: string | null
}

export async function exchangeNotionCode(code: string): Promise<NotionOAuthTokenResponse> {
  const basicAuth = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')

  const res = await fetch(NOTION_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() }),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.message ?? 'Notion token exchange failed')
  }
  return json as NotionOAuthTokenResponse
}

// Extracts a human-readable title from a Notion page object. The property
// holding the title can be named differently depending on whether it's a
// standalone page ("title") or a database row (often "Name", but could be
// anything) — Notion's own convention is "whichever property has
// type === 'title'", not a fixed key name, so this scans for it defensively
// rather than assuming a key.
function extractPageTitle(page: any): string {
  const properties = page?.properties ?? {}
  for (const key of Object.keys(properties)) {
    const prop = properties[key]
    if (prop?.type === 'title' && Array.isArray(prop.title)) {
      const text = prop.title.map((t: any) => t?.plain_text ?? '').join('')
      if (text) return text
    }
  }
  return 'Untitled'
}

export async function listNotionParentPages(accessToken: string): Promise<{ id: string; title: string }[]> {
  const res = await fetch(`${NOTION_API_BASE}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filter: { value: 'page', property: 'object' } }),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.message ?? 'Notion search failed')
  }

  return (json.results ?? []).map((page: any) => ({
    id: page.id,
    title: extractPageTitle(page),
  }))
}

export async function createNotionReportPage(
  accessToken: string,
  parentPageId: string,
  title: string,
  children: any[]
): Promise<void> {
  const res = await fetch(`${NOTION_API_BASE}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: {
        title: { title: [{ text: { content: title } }] },
      },
      children,
    }),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.message ?? `Notion page creation failed: ${res.status}`)
  }
}

function heading(text: string) {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: text } }] } }
}

function paragraph(text: string) {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }] } }
}

function bullet(text: string) {
  return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }] } }
}

export function reportToNotionBlocks(
  report: Pick<Report, 'executive_summary' | 'key_themes' | 'recommendations' | 'confidence_score'>
): any[] {
  const blocks: any[] = [
    heading('Executive Summary'),
    paragraph(`Confidence score: ${report.confidence_score}`),
    paragraph(report.executive_summary),
  ]

  if (report.key_themes.length > 0) {
    blocks.push(heading('Key Themes'))
    for (const theme of report.key_themes) {
      blocks.push(bullet(`${theme.title}: ${theme.summary}`))
    }
  }

  if (report.recommendations.length > 0) {
    blocks.push(heading('Recommendations'))
    for (const rec of report.recommendations) {
      blocks.push(bullet(`[${rec.priority}] ${rec.title}: ${rec.detail}`))
    }
  }

  return blocks
}
