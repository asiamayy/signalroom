import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const projectId = params.get('project_id')
  const personaId = params.get('persona_id')
  const interviewId = params.get('interview_id')
  const type = params.get('type')
  const minConfidence = params.get('min_confidence')
  const since = params.get('since')

  let query = supabase
    .from('signals')
    .select('*')
    .eq('user_id', user.id)
    .order('confidence_score', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)
  if (personaId) query = query.contains('related_persona_ids', [personaId])
  if (interviewId) query = query.contains('related_interview_ids', [interviewId])
  if (type) query = query.eq('type', type)
  if (minConfidence) query = query.gte('confidence_score', Number(minConfidence))
  if (since) query = query.gte('created_at', since)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
