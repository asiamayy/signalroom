import { createAdminClient } from '@/lib/supabase/server'
import { getPlanForUser } from '@/lib/utils/entitlements'
import { sendSlackMessage, slackReportBlocks, slackSignalBlocks } from '@/lib/slack'
import { createNotionReportPage, reportToNotionBlocks } from '@/lib/notion'
import { logError } from '@/lib/logger'
import type { Report, Interview, Signal, NotionIntegrationMetadata } from '@/types'

// Reads planCheckUserId's own integrations row(s) — the WORKSPACE OWNER's
// connection when the report/signal belongs to a workspace, not the acting
// member's. Under the integrations table's RLS (auth.uid() = user_id), a
// member's session cannot read the owner's row at all, so this deliberately
// uses the admin (service-role) client for this one narrow read — never for
// anything else in this feature, and the token is only ever used to make an
// outbound POST, never serialized into any HTTP response.

export async function pushReportCreated(
  planCheckUserId: string,
  report: Pick<Report, 'id' | 'executive_summary' | 'confidence_score' | 'key_themes' | 'recommendations'>,
  interview: Pick<Interview, 'title'>
) {
  const admin = await createAdminClient()
  const { limits } = await getPlanForUser(admin, planCheckUserId)
  if (!limits.integrations_enabled) return

  const { data: rows } = await admin
    .from('integrations')
    .select('provider, access_token, metadata')
    .eq('user_id', planCheckUserId)

  if (!rows || rows.length === 0) return

  const slack = rows.find(r => r.provider === 'slack')
  const notion = rows.find(r => r.provider === 'notion')

  if (slack) {
    try {
      const { blocks, fallbackText } = slackReportBlocks(report, interview)
      await sendSlackMessage(slack.access_token, blocks, fallbackText)
    } catch (e) {
      logError('integrations.slack.report', e, { userId: planCheckUserId, reportId: report.id })
    }
  }

  const notionMetadata = notion?.metadata as NotionIntegrationMetadata | undefined
  if (notion && notionMetadata?.parent_page_id) {
    try {
      await createNotionReportPage(
        notion.access_token,
        notionMetadata.parent_page_id,
        interview.title,
        reportToNotionBlocks(report)
      )
    } catch (e) {
      logError('integrations.notion.report', e, { userId: planCheckUserId, reportId: report.id })
    }
  }
}

// Only called from the "brand new signal" insert path, never the
// merge/update path — pushing on every reinforcement of an existing signal
// would spam the channel. Slack only: Notion stays the structured report
// repository, not a firehose of every emerging signal.
export async function pushSignalCreated(
  planCheckUserId: string,
  signal: Pick<Signal, 'id' | 'title' | 'summary' | 'confidence_score' | 'impact'>
) {
  const admin = await createAdminClient()
  const { limits } = await getPlanForUser(admin, planCheckUserId)
  if (!limits.integrations_enabled) return

  const { data: slack } = await admin
    .from('integrations')
    .select('access_token')
    .eq('user_id', planCheckUserId)
    .eq('provider', 'slack')
    .maybeSingle()

  if (!slack) return

  try {
    const { blocks, fallbackText } = slackSignalBlocks(signal)
    await sendSlackMessage(slack.access_token, blocks, fallbackText)
  } catch (e) {
    logError('integrations.slack.signal', e, { userId: planCheckUserId, signalId: signal.id })
  }
}
