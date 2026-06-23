import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamPersonaResponse } from '@/lib/anthropic/persona-engine'
import type { Message } from '@/types'

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
  const { message } = await request.json()

  // Load the interview + persona
  const { data: interview, error: interviewError } = await supabase
    .from('interviews')
    .select('*, persona:personas(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (interviewError || !interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
  }

  const userMessage: Message = {
    id: crypto.randomUUID(),
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  }

  const updatedMessages: Message[] = [...(interview.messages ?? []), userMessage]

  // Stream the persona's response
  const encoder = new TextEncoder()
  let personaResponseText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamPersonaResponse(
          interview.persona,
          interview.type,
          interview.context,
          updatedMessages,
          (chunk) => {
            personaResponseText += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
          }
        )

        // Save both messages to Supabase
        const personaMessage: Message = {
          id: crypto.randomUUID(),
          role: 'persona',
          content: personaResponseText,
          timestamp: new Date().toISOString(),
        }

        const finalMessages = [...updatedMessages, personaMessage]

        await supabase
          .from('interviews')
          .update({ messages: finalMessages, updated_at: new Date().toISOString() })
          .eq('id', id)

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
