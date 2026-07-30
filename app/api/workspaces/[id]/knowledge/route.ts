import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'workspace-sources'
const MAX_FILE_BYTES = 20 * 1024 * 1024

function canExtractText(file: File) {
  return file.type.startsWith('text/') || [
    'application/json', 'application/csv', 'text/csv',
  ].includes(file.type) || /\.(csv|txt|md|json)$/i.test(file.name)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [sources, context] = await Promise.all([
    supabase.from('workspace_sources').select('*').eq('workspace_id', id).order('created_at', { ascending: false }),
    supabase.from('workspace_contexts').select('*').eq('workspace_id', id).maybeSingle(),
  ])
  if (sources.error) return NextResponse.json({ error: sources.error.message }, { status: 500 })
  if (context.error) return NextResponse.json({ error: context.error.message }, { status: 500 })
  return NextResponse.json({ data: { sources: sources.data ?? [], context: context.data } })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const { content } = await request.json()
    const safeContent = typeof content === 'string' ? content.trim().slice(0, 12000) : ''
    const { data, error } = await supabase
      .from('workspace_contexts')
      .upsert({ workspace_id: id, content: safeContent, updated_by: user.id, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: 'Files must be 20 MB or smaller' }, { status: 400 })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${id}/${user.id}/${Date.now()}-${safeName}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || 'application/octet-stream' })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const extractedText = canExtractText(file) ? (await file.text()).slice(0, 12000) : ''
  const { data, error } = await supabase
    .from('workspace_sources')
    .insert({ workspace_id: id, user_id: user.id, name: file.name, storage_path: storagePath, file_type: file.type || '', size_bytes: file.size, extracted_text: extractedText })
    .select()
    .single()

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { sourceId } = await request.json()
  if (typeof sourceId !== 'string') return NextResponse.json({ error: 'Source ID required' }, { status: 400 })

  const { data: source, error: lookupError } = await supabase
    .from('workspace_sources').select('*').eq('id', sourceId).eq('workspace_id', id).single()
  if (lookupError || !source) return NextResponse.json({ error: 'Source not found' }, { status: 404 })

  const { error } = await supabase.from('workspace_sources').delete().eq('id', sourceId).eq('workspace_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.storage.from(BUCKET).remove([source.storage_path])
  return NextResponse.json({ success: true })
}
