import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'project-files'

// Returns a short-lived signed download URL — the bucket is private, so
// files can't be fetched by a plain public URL.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fileId } = await params

  const { data: file, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single()

  if (error || !file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(file.storage_path, 60)

  if (signError || !signed) {
    return NextResponse.json({ error: signError?.message ?? 'Failed to create download link' }, { status: 500 })
  }

  return NextResponse.json({ data: { url: signed.signedUrl, name: file.name } })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fileId } = await params

  const { data: file } = await supabase
    .from('project_files')
    .select('storage_path')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single()

  if (file) {
    await supabase.storage.from(BUCKET).remove([file.storage_path])
  }

  const { error } = await supabase
    .from('project_files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
