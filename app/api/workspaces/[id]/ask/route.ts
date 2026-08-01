import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { answerReportQuestion } from '@/lib/anthropic/persona-engine'
import { getWorkspaceContext } from '@/lib/workspaces/context'

type InterviewResearch = {
  title?: string
  messages?: { role: string; content: string }[]
  persona?: { name?: string } | null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: workspaceId } = await params
  const { question } = await request.json()
  const cleanQuestion = typeof question === 'string' ? question.trim().slice(0, 1000) : ''
  if (!cleanQuestion) return NextResponse.json({ error: 'Ask a question about this workspace.' }, { status: 400 })

  const { data: workspace, error: workspaceError } = await supabase.from('workspaces').select('id').eq('id', workspaceId).single()
  if (workspaceError || !workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const [reportsResult, interviewsResult, workspaceContext] = await Promise.all([
    supabase.from('reports').select('executive_summary, key_themes, recommendations, interview:interviews(title, messages, persona:personas(name))').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(8),
    supabase.from('interviews').select('title, messages, persona:personas(name)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(8),
    getWorkspaceContext(supabase, workspaceId),
  ])
  if (reportsResult.error || interviewsResult.error) return NextResponse.json({ error: 'Unable to load workspace research.' }, { status: 500 })

  const reports = reportsResult.data ?? []
  const interviews = (interviewsResult.data ?? []) as unknown as InterviewResearch[]
  const transcripts = interviews.map(interview => {
    const participant = interview.persona?.name ?? 'Participant'
    return `${interview.title ?? 'Interview'}\n${(interview.messages ?? []).map(message => `${message.role === 'persona' ? participant : 'Researcher'}: ${message.content}`).join('\n')}`
  }).join('\n\n---\n\n')

  try {
    const answer = await answerReportQuestion({
      question: cleanQuestion,
      executiveSummary: reports.map((report, index) => `Report ${index + 1} — ${(report.interview as any)?.title ?? 'Untitled interview'}: ${report.executive_summary ?? ''}`).join('\n\n'),
      themes: reports.flatMap(report => report.key_themes ?? []),
      recommendations: reports.flatMap(report => report.recommendations ?? []),
      transcript: transcripts,
      workspaceContext,
    })
    if (!answer) throw new Error('No answer returned')
    return NextResponse.json({ data: { answer } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unable to answer that question right now.' }, { status: 500 })
  }
}
