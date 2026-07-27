import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireIntegrationsEnabled } from '@/lib/utils/entitlements'
import { exchangeNotionCode } from '@/lib/notion'
import { logError } from '@/lib/logger'
import type { NotionIntegrationMetadata } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?integration_error=notion', request.url))
  }

  const { data: oauthState } = await supabase
    .from('oauth_states')
    .select('id, used_at, expires_at, user_id, provider')
    .eq('state', state)
    .single()

  if (
    !oauthState ||
    oauthState.used_at ||
    new Date(oauthState.expires_at) < new Date() ||
    oauthState.user_id !== user.id ||
    oauthState.provider !== 'notion'
  ) {
    return NextResponse.redirect(new URL('/settings?integration_error=state', request.url))
  }

  await supabase.from('oauth_states').update({ used_at: new Date().toISOString() }).eq('id', oauthState.id)

  if (!(await requireIntegrationsEnabled(supabase, user.id))) {
    return NextResponse.redirect(new URL('/settings?integration_error=plan', request.url))
  }

  try {
    const token = await exchangeNotionCode(code)
    // parent_page_id starts null — this is exactly what makes the Settings
    // UI show the "pick a destination page" dropdown next.
    const metadata: NotionIntegrationMetadata = {
      workspace_id: token.workspace_id,
      bot_id: token.bot_id,
      parent_page_id: null,
      parent_page_title: null,
    }

    const { error } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'notion',
        access_token: token.access_token,
        display_name: token.workspace_name,
        metadata,
      }, { onConflict: 'user_id,provider' })

    if (error) throw error
  } catch (e) {
    logError('integrations.notion.connect', e, { userId: user.id })
    return NextResponse.redirect(new URL('/settings?integration_error=notion', request.url))
  }

  return NextResponse.redirect(new URL('/settings?notion=connected', request.url))
}
