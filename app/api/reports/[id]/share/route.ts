import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'

// POST — create (or return the existing) share token for a report the caller
// owns. The public page at /r/{token} only resolves reports with a token, so
// nothing is shared until the owner asks for a link.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: report, error } = await supabase
    .from('reports')
    .select('id, share_token')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  if (report.share_token) {
    return NextResponse.json({ data: { token: report.share_token } })
  }

  const token = randomUUID()
  const { error: updateError } = await supabase
    .from('reports')
    .update({ share_token: token })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ data: { token } }, { status: 201 })
}

// DELETE — revoke the share token; every previously copied /r/{token} link
// stops resolving immediately.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('reports')
    .update({ share_token: null })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
