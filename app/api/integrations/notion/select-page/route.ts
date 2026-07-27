import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireIntegrationsEnabled } from '@/lib/utils/entitlements'
import type { NotionIntegrationMetadata } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await requireIntegrationsEnabled(supabase, user.id))) {
    return NextResponse.json({ error: 'Integrations require the Signal plan or above.' }, { status: 403 })
  }

  const { page_id, page_title } = await request.json()
  if (!page_id || typeof page_id !== 'string') {
    return NextResponse.json({ error: 'page_id is required' }, { status: 400 })
  }

  const { data: integration } = await supabase
    .from('integrations')
    .select('metadata')
    .eq('user_id', user.id)
    .eq('provider', 'notion')
    .single()

  if (!integration) {
    return NextResponse.json({ error: 'Notion is not connected' }, { status: 404 })
  }

  const metadata: NotionIntegrationMetadata = {
    ...(integration.metadata as NotionIntegrationMetadata),
    parent_page_id: page_id,
    parent_page_title: typeof page_title === 'string' ? page_title : null,
  }

  const { error } = await supabase
    .from('integrations')
    .update({ metadata })
    .eq('user_id', user.id)
    .eq('provider', 'notion')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: metadata })
}
