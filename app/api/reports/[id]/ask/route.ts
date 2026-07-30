import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { answerReportQuestion } from '@/lib/anthropic/persona-engine'
import { getWorkspaceContext } from '@/lib/workspaces/context'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { question } = await request.json()
  const cleanQuestion = typeof question === 'string' ? question.trim().slice(0, 1000) : ''
  if (!cleanQuestion) return NextResponse.json({ error: 'Ask a question about this report.' }, { status: 400 })

  // RLS ensures the caller can read this report. A null workspace deliberately
  // cannot use this shared-workspace tool.
  const { data: report, error } = await supabase
    .from('reports')
    .select('id, workspace_id, executive_summary, key_themes, recommendations, interview:interviews(messages, persona:personas(name))')
    .eq('id', id)
    .single()
  if (error || !report?.workspace_id) return NextResponse.json({ error: 'Workspace report not found' }, { status: 404 })

  try {
    const interview = report.interview as unknown as { messages?: { role: string; content: string }[]; persona?: { name?: string } | null } | null
    const transcript = (interview?.messages ?? [])
      .map(message => `${message.role === 'persona' ? interview?.persona?.name ?? 'Participant' : 'Researcher'}: ${message.content}`)
      .join('\n\n')
    const workspaceContext = await getWorkspaceContext(supabase, report.workspace_id)
    const answer = await answerReportQuestion({
      question: cleanQuestion,
      executiveSummary: report.executive_summary ?? '',
      themes: report.key_themes ?? [],
      recommendations: report.recommendations ?? [],
      transcript,
      workspaceContext,
    })
    if (!answer) throw new Error('No answer returned')
    return NextResponse.json({ data: { answer } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to answer that question right now.' }, { status: 500 })
  }
}
