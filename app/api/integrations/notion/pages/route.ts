import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireIntegrationsEnabled } from '@/lib/utils/entitlements'
import { listNotionParentPages } from '@/lib/notion'

// Reading the connecting user's own Notion row — normal cookie client is
// fine here, RLS already scopes it to auth.uid() = user_id.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await requireIntegrationsEnabled(supabase, user.id))) {
    return NextResponse.json({ error: 'Integrations require the Signal plan or above.' }, { status: 403 })
  }

  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'notion')
    .single()

  if (!integration) {
    return NextResponse.json({ error: 'Notion is not connected' }, { status: 404 })
  }

  try {
    const pages = await listNotionParentPages(integration.access_token)
    return NextResponse.json({ data: pages })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to list Notion pages' }, { status: 500 })
  }
}
