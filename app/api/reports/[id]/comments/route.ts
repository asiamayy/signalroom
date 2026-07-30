import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getWorkspaceReport(supabase: Awaited<ReturnType<typeof createClient>>, reportId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('id, workspace_id')
    .eq('id', reportId)
    .single()

  if (error || !data?.workspace_id) return null
  return data
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const report = await getWorkspaceReport(supabase, id)
  if (!report) return NextResponse.json({ error: 'Workspace report not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('workspace_comments')
    .select('*, author:profiles(id, full_name, email, avatar_url)')
    .eq('report_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const report = await getWorkspaceReport(supabase, id)
  if (!report) return NextResponse.json({ error: 'Workspace report not found' }, { status: 404 })

  const body = await request.json()
  const content = typeof body.content === 'string' ? body.content.trim().slice(0, 3000) : ''
  const sectionKey = typeof body.sectionKey === 'string' ? body.sectionKey.slice(0, 80) : 'report'
  const mentionIds = Array.isArray(body.mentionedUserIds)
    ? body.mentionedUserIds.filter((value: unknown) => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value)).slice(0, 20)
    : []

  if (!content) return NextResponse.json({ error: 'Write a comment before posting.' }, { status: 400 })

  const { data, error } = await supabase
    .from('workspace_comments')
    .insert({
      workspace_id: report.workspace_id,
      report_id: report.id,
      author_id: user.id,
      content,
      section_key: sectionKey || 'report',
      mentioned_user_ids: mentionIds,
    })
    .select('*, author:profiles(id, full_name, email, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
