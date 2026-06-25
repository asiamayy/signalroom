import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReport } from '@/lib/anthropic/persona-engine'

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

  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*, persona:personas(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
  }

  if (!interview.messages || interview.messages.length < 2) {
    return NextResponse.json(
      { error: 'Need at least one exchange before generating a report' },
      { status: 400 }
    )
  }

  try {
    const reportData = await generateReport(
      interview.persona,
      interview.type,
      interview.context,
      interview.messages
    )

    let report

    // If a report already exists for this interview, update it instead of inserting
    if (interview.report_id) {
      const { data: updated, error: updateError } = await supabase
        .from('reports')
        .update({
          executive_summary: reportData.executive_summary,
          key_themes: reportData.key_themes,
          recommendations: reportData.recommendations,
          confidence_score: reportData.confidence_score,
        })
        .eq('id', interview.report_id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      report = updated
    } else {
      // Create a new report
      const { data: inserted, error: insertError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          interview_id: id,
          executive_summary: reportData.executive_summary,
          key_themes: reportData.key_themes,
          recommendations: reportData.recommendations,
          confidence_score: reportData.confidence_score,
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      report = inserted

      // Link report to interview
      await supabase
        .from('interviews')
        .update({ status: 'completed', report_id: report.id })
        .eq('id', id)
    }

    return NextResponse.json({ data: report }, { status: 201 })
  } catch (e: any) {
    console.error('Report generation error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Failed to generate report' }, { status: 500 })
  }
}
