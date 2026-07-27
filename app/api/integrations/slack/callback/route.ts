import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireIntegrationsEnabled } from '@/lib/utils/entitlements'
import { exchangeSlackCode } from '@/lib/slack'
import { logError } from '@/lib/logger'

// Same-browser redirect back from Slack — the user's own Supabase session
// cookie IS present here (unlike the Stripe webhook, which has no session
// at all), so this uses the normal cookie-based client and does its own
// auth.getUser() check like every other route, not the admin client.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?integration_error=slack', request.url))
  }

  // Validate against a server-generated row — never trust the client-
  // supplied state value itself, only that it matches something we can now
  // consume exactly once.
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
    oauthState.provider !== 'slack'
  ) {
    return NextResponse.redirect(new URL('/settings?integration_error=state', request.url))
  }

  await supabase.from('oauth_states').update({ used_at: new Date().toISOString() }).eq('id', oauthState.id)

  if (!(await requireIntegrationsEnabled(supabase, user.id))) {
    return NextResponse.redirect(new URL('/settings?integration_error=plan', request.url))
  }

  try {
    const token = await exchangeSlackCode(code)
    const { error } = await supabase
      .from('integrations')
      .upsert({
        user_id: user.id,
        provider: 'slack',
        access_token: token.incoming_webhook.url,
        display_name: `${token.team.name} · #${token.incoming_webhook.channel}`,
        metadata: {
          channel_name: token.incoming_webhook.channel,
          channel_id: token.incoming_webhook.channel_id,
          team_id: token.team.id,
        },
      }, { onConflict: 'user_id,provider' })

    if (error) throw error
  } catch (e) {
    logError('integrations.slack.connect', e, { userId: user.id })
    return NextResponse.redirect(new URL('/settings?integration_error=slack', request.url))
  }

  return NextResponse.redirect(new URL('/settings?slack=connected', request.url))
}
