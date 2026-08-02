import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamPersonaResponse } from '@/lib/anthropic/persona-engine'
import { logError } from '@/lib/logger'
import type { Message } from '@/types'

// Follow-up conversation with ONE persona about a creative asset they already
// reacted to — makes the initial panel result a real back-and-forth instead
// of a dead report, reusing the same streaming engine as Interview chat.
// Deliberately ephemeral for v1 (not persisted) — the initial panel run is
// what gets saved; a follow-up thread lives only in the browser tab.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { persona_id, image, imageMediaType, intended_focus, initial_reaction, messages } = await request.json()

  if (!persona_id || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Missing persona or message' }, { status: 400 })
  }

  // No user_id filter — RLS scopes this to personas the caller owns plus any
  // workspace-shared ones they're a member of, same as every other route.
  const { data: persona, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', persona_id)
    .single()

  if (error || !persona) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }

  const context = `The user previously showed you a visual asset (packaging, ad, or landing page concept) and asked for your honest reaction. Your initial reaction was: "${initial_reaction ?? ''}"${intended_focus ? `\nThey said they intended attention to land on: "${intended_focus}"` : ''}\n\nContinue reacting as yourself, staying consistent with that initial reaction unless something in the follow-up genuinely changes your mind.`

  const typedMessages = messages as Message[]

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamPersonaResponse(
          persona,
          'custom',
          context,
          typedMessages,
          (chunk) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
          },
          image ?? null,
          false,
          imageMediaType ?? 'image/jpeg',
          ''
        )

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (streamError) {
        logError('creative_review.chat.stream', streamError, { userId: user.id, personaId: persona_id })
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
