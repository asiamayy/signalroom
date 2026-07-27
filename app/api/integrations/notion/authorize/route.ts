import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireIntegrationsEnabled } from '@/lib/utils/entitlements'
import { buildNotionAuthorizeUrl } from '@/lib/notion'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!(await requireIntegrationsEnabled(supabase, user.id))) {
    return NextResponse.redirect(new URL('/settings?integration_error=plan', request.url))
  }

  const { data: oauthState, error } = await supabase
    .from('oauth_states')
    .insert({ user_id: user.id, provider: 'notion' })
    .select('state')
    .single()

  if (error || !oauthState) {
    return NextResponse.redirect(new URL('/settings?integration_error=state', request.url))
  }

  return NextResponse.redirect(buildNotionAuthorizeUrl(oauthState.state))
}
