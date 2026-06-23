import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InterviewRoom from '@/components/interview/InterviewRoom'

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*, persona:personas(*)')
    .eq('id', id)
    .single()

  if (error || !interview) notFound()

  return <InterviewRoom interview={interview} />
}
