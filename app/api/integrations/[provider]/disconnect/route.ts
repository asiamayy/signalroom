import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireIntegrationsEnabled } from '@/lib/utils/entitlements'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider } = await params
  if (provider !== 'slack' && provider !== 'notion') {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  if (!(await requireIntegrationsEnabled(supabase, user.id))) {
    return NextResponse.json({ error: 'Integrations require the Signal plan or above.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
