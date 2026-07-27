import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireIntegrationsEnabled } from '@/lib/utils/entitlements'
import { buildSlackAuthorizeUrl } from '@/lib/slack'

// Full-page navigation (an <a href>, not a fetch) — errors redirect back to
// Settings with a query param rather than a JSON response, since nothing is
// parsing this as JSON.
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
    .insert({ user_id: user.id, provider: 'slack' })
    .select('state')
    .single()

  if (error || !oauthState) {
    return NextResponse.redirect(new URL('/settings?integration_error=state', request.url))
  }

  return NextResponse.redirect(buildSlackAuthorizeUrl(oauthState.state))
}
