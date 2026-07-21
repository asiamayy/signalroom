import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamPersonaResponse } from '@/lib/anthropic/persona-engine'
import { chatMessageSchema, parseBody } from '@/lib/validation'
import { logError } from '@/lib/logger'
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

  const parsed = parseBody(chatMessageSchema, await request.json())
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const { message, image, imageMediaType } = parsed.data

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
    content: message || '(shared an image)',
    timestamp: new Date().toISOString(),
  }

  const updatedMessages: Message[] = [...(interview.messages ?? []), userMessage]

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
          },
          image ?? null,
          interview.devils_advocate ?? false,
          imageMediaType ?? 'image/jpeg'
        )

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
        logError('interviews.chat.stream', error, { userId: user.id, interviewId: id })
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
