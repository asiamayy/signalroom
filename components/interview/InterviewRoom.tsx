'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, FileText, Loader2, ChevronDown } from 'lucide-react'
import { cn, formatRelativeTime, INTERVIEW_TYPE_LABELS, getAvatarColor } from '@/lib/utils'
import type { Interview, Message } from '@/types'

interface InterviewRoomProps {
  interview: Interview & { persona: any }
}

export default function InterviewRoom({ interview }: InterviewRoomProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(interview.messages ?? [])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const color = interview.persona?.avatar_color
    ? (typeof interview.persona.avatar_color === 'string'
        ? JSON.parse(interview.persona.avatar_color)
        : interview.persona.avatar_color)
    : { bg: '#E1F5EE', text: '#0F6E56' }

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input])

  // ─── Send a message ─────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    setInput('')
    setError('')
    setStreaming(true)
    setStreamingText('')

    // Optimistically add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch(`/api/interviews/${interview.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.text) {
              accumulated += data.text
              setStreamingText(accumulated)
            }

            if (data.done) {
              // Commit streamed message to state
              const personaMsg: Message = {
                id: crypto.randomUUID(),
                role: 'persona',
                content: accumulated,
                timestamp: new Date().toISOString(),
              }
              setMessages(prev => [...prev, personaMsg])
              setStreamingText('')
            }

            if (data.error) throw new Error(data.error)
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setStreaming(false)
    }
  }, [input, streaming, interview.id])

  // Enter to send (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Generate report ─────────────────────────────────────────────────────────

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    setError('')
    try {
      const res = await fetch(`/api/interviews/${interview.id}/report`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      router.push(`/reports/${json.data.id}`)
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate report')
      setGeneratingReport(false)
    }
  }

  const canReport = messages.length >= 2 && !streaming

  return (
    <div className="flex flex-col h-screen bg-neutral-50">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Persona avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
            style={{ background: color.bg, color: color.text }}
          >
            {interview.persona?.avatar_initials ?? '?'}
          </div>
          <div>
            <h1 className="text-sm font-medium text-neutral-900">{interview.title}</h1>
            <p className="text-xs text-neutral-500">
              {interview.persona?.name ?? 'Unknown'} · {INTERVIEW_TYPE_LABELS[interview.type]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">{messages.length} messages</span>
          <button
            onClick={handleGenerateReport}
            disabled={!canReport || generatingReport}
            className={cn(
              'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors',
              canReport && !generatingReport
                ? 'bg-neutral-900 text-white hover:bg-neutral-700'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            )}
          >
            {generatingReport
              ? <Loader2 size={13} className="animate-spin" />
              : <FileText size={13} />
            }
            {generatingReport ? 'Generating...' : 'Get report'}
          </button>
        </div>
      </header>

      {/* ── Context banner ───────────────────────────────────────────────── */}
      {interview.context && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
          <span className="font-medium">Context: </span>{interview.context}
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        {/* Empty state */}
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium mb-4"
              style={{ background: color.bg, color: color.text }}
            >
              {interview.persona?.avatar_initials ?? '?'}
            </div>
            <h3 className="text-sm font-medium text-neutral-900 mb-1">
              Ready to meet {interview.persona?.name ?? 'your persona'}
            </h3>
            <p className="text-sm text-neutral-500 leading-relaxed mb-4">
              Ask anything. Test your idea, your pricing, your pitch. They'll respond as themselves — with real opinions and honest pushback.
            </p>
            <div className="space-y-2 w-full">
              {STARTER_QUESTIONS[interview.type]?.map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="w-full text-left text-xs text-neutral-600 bg-white border border-neutral-200 rounded-lg px-3 py-2.5 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            persona={interview.persona}
            avatarColor={color}
          />
        ))}

        {/* Streaming indicator */}
        {streaming && (
          <div className="flex gap-3 items-start">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5"
              style={{ background: color.bg, color: color.text }}
            >
              {interview.persona?.avatar_initials ?? '?'}
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-400 mb-1">{interview.persona?.name}</p>
              <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                {streamingText ? (
                  <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                    {streamingText}
                    <span className="inline-block w-0.5 h-4 bg-neutral-400 ml-0.5 animate-pulse align-middle" />
                  </p>
                ) : (
                  <div className="flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="px-5 py-2 bg-red-50 border-t border-red-100 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 py-4 bg-white border-t border-neutral-200">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl focus-within:border-neutral-400 focus-within:bg-white transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${interview.persona?.name ?? 'your persona'} something...`}
              rows={1}
              className="w-full px-4 py-3 text-sm bg-transparent text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none"
              style={{ minHeight: '44px', maxHeight: '160px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
              input.trim() && !streaming
                ? 'bg-neutral-900 text-white hover:bg-neutral-700'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            )}
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-center text-xs text-neutral-400 mt-2">
          Shift + Enter for new line · Enter to send
        </p>
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  persona,
  avatarColor,
}: {
  message: Message
  persona: any
  avatarColor: { bg: string; text: string }
}) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="bg-neutral-900 text-white rounded-2xl rounded-tr-sm px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-xs text-neutral-400 text-right mt-1">{formatRelativeTime(message.timestamp)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5"
        style={{ background: avatarColor.bg, color: avatarColor.text }}
      >
        {persona?.avatar_initials ?? '?'}
      </div>
      <div className="flex-1">
        <p className="text-xs text-neutral-400 mb-1">{persona?.name}</p>
        <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
          <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-neutral-400 mt-1">{formatRelativeTime(message.timestamp)}</p>
      </div>
    </div>
  )
}

// ─── Starter questions per interview type ─────────────────────────────────────

const STARTER_QUESTIONS: Record<string, string[]> = {
  concept_testing: [
    "I'm going to describe a product idea. Tell me your honest first reaction.",
    "What problem does this sound like it's solving, in your words?",
    "What would make you skeptical about a tool like this?",
  ],
  pricing_discovery: [
    "If a tool like this existed, what would you expect to pay for it per month?",
    "At what price would this feel like an obvious yes? At what price would you walk away?",
    "What would you need to see to justify $99/month for something like this?",
  ],
  message_testing: [
    "I'll share a headline — tell me what you think it means and if it resonates.",
    "What part of this message would make you click? What would make you scroll past?",
    "Does this feel like it's talking to you, or someone else?",
  ],
  competitive_positioning: [
    "What tools do you currently use for this kind of work?",
    "What would need to be true for you to switch from what you're using now?",
    "How do you currently solve this problem, even imperfectly?",
  ],
  feature_prioritization: [
    "If you could only have one of these features at launch, which would it be?",
    "What's the first thing you'd want to do after signing up for something like this?",
    "What's missing from tools you've tried in this space?",
  ],
  custom: [
    "Walk me through how you typically approach this problem.",
    "What's your biggest frustration with how you're doing this today?",
    "What would a perfect solution look like to you?",
  ],
}
