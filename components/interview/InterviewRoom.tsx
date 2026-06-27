'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, FileText, Loader2, ImagePlus, X, User } from 'lucide-react'
import { cn, formatRelativeTime, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import type { Interview, Message } from '@/types'

interface InterviewRoomProps {
  interview: Interview & { persona: any }
}

export default function InterviewRoom({ interview }: InterviewRoomProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(interview.messages ?? [])
  const [input, setInput] = useState('')
  const [imageData, setImageData] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const color = interview.persona?.avatar_color
    ? (typeof interview.persona.avatar_color === 'string'
        ? JSON.parse(interview.persona.avatar_color)
        : interview.persona.avatar_color)
    : { bg: '#E1F5EE', text: '#0F6E56' }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImagePreview(result)
      const base64 = result.split(',')[1]
      setImageData(base64)
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => { setImageData(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if ((!text && !imageData) || streaming) return
    setInput('')
    setError('')
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, image_url: imagePreview ?? undefined, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    clearImage()
    setStreaming(true)
    setStreamingText('')
    try {
      const res = await fetch(`/api/interviews/${interview.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, image: imageData }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'text') { full += data.content; setStreamingText(full) }
            } catch {}
          }
        }
      }
      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'persona' as const, content: full, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setStreaming(false)
      setStreamingText('')
    }
  }, [input, imageData, imagePreview, streaming, interview.id])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleGenerateReport = async () => {
    if (!canReport) return
    setGeneratingReport(true)
    setError('')
    try {
      const res = await fetch(`/api/interviews/${interview.id}/report`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate report')
      router.push(`/reports/${json.data.id}`)
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate report')
      setGeneratingReport(false)
    }
  }

  const canReport = messages.length >= 2 && !streaming

  const t = interview.persona?.traits
  const incomeMap: Record<string, string> = { under_50k: 'Under $50k', '50k_100k': '$50k–$100k', '100k_200k': '$100k–$200k', over_200k: 'Over $200k' }
  const educationMap: Record<string, string> = { high_school: 'High School', bachelors: "Bachelor's", masters: "Master's", phd: 'PhD' }

  return (
    <div className="flex h-screen" style={{ background: '#F4F6F8' }}>

      {/* ── Main chat area ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3.5 flex-shrink-0" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <PersonaAvatar
              avatarUrl={interview.persona?.avatar_url}
              avatarInitials={interview.persona?.avatar_initials}
              avatarColor={interview.persona?.avatar_color}
              name={interview.persona?.name}
              size="sm"
            />
            <div>
              <h1 className="text-sm font-semibold text-neutral-900">{interview.title}</h1>
              <p className="text-xs text-neutral-400">
                {interview.persona?.name ?? 'Unknown'} · {INTERVIEW_TYPE_LABELS[interview.type]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">{messages.length} messages</span>

            {/* Persona panel toggle */}
            <button
              onClick={() => setPanelOpen(o => !o)}
              title="View persona"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={panelOpen
                ? { background: '#E8F5F1', border: '1px solid #1A8C6A', color: '#0D5C45' }
                : { background: 'white', border: '1px solid rgba(0,0,0,0.1)', color: '#9CA3AF' }
              }
            >
              <User size={15} />
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={!canReport || generatingReport}
              className={cn('flex items-center gap-1.5 text-sm px-5 py-2 rounded-lg font-semibold transition-colors',
                canReport && !generatingReport ? 'text-white' : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              )}
              style={canReport && !generatingReport ? { background: '#1A8C6A' } : {}}
            >
              {generatingReport ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              {generatingReport ? 'Generating...' : 'Get report'}
            </button>
          </div>
        </header>

        {/* Devil's Advocate banner */}
        {(interview as any).devils_advocate && (
          <div className="px-5 py-2.5 flex-shrink-0" style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
            <span className="text-xs font-medium text-red-700">⚠ Devil's Advocate mode — persona leads with skepticism first</span>
          </div>
        )}

        {/* Context banner */}
        {interview.context && (
          <div className="px-5 py-2.5 flex-shrink-0" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <span className="text-xs text-amber-800"><span className="font-medium">Context: </span>{interview.context}</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
              <PersonaAvatar
                avatarUrl={interview.persona?.avatar_url}
                avatarInitials={interview.persona?.avatar_initials}
                avatarColor={interview.persona?.avatar_color}
                name={interview.persona?.name}
                size="xl"
                className="mb-4"
              />
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">Ready to meet {interview.persona?.name ?? 'your persona'}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-4">Ask anything. Test your idea, your pricing, your pitch. They'll respond as themselves — with real opinions and honest pushback.</p>
              <div className="space-y-2 w-full">
                {STARTER_QUESTIONS[interview.type]?.map(q => (
                  <button key={q} onClick={() => setInput(q)} className="w-full text-left text-xs text-neutral-600 bg-white border border-neutral-200 rounded-xl px-3 py-2.5 hover:border-neutral-300 transition-colors" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} persona={interview.persona} />
          ))}

          {streaming && (
            <div className="flex gap-3 items-start">
              <PersonaAvatar
                avatarUrl={interview.persona?.avatar_url}
                avatarInitials={interview.persona?.avatar_initials}
                avatarColor={interview.persona?.avatar_color}
                name={interview.persona?.name}
                size="xs"
                className="mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-xs text-neutral-400 mb-1 font-medium">{interview.persona?.name}</p>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  {streamingText
                    ? <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">{streamingText}<span className="inline-block w-0.5 h-4 bg-neutral-400 ml-0.5 animate-pulse align-middle" /></p>
                    : <div className="flex gap-1 py-1"><span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>
                  }
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && <div className="px-5 py-2 flex-shrink-0" style={{ background: '#FEF2F2', borderTop: '1px solid #FECACA' }}><p className="text-xs text-red-700">{error}</p></div>}

        {/* Input bar */}
        <div className="flex-shrink-0 px-5 py-4" style={{ background: 'white', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          {imagePreview && (
            <div className="relative inline-block mb-3">
              <img src={imagePreview} alt="Upload preview" className="h-20 w-auto rounded-xl object-cover" style={{ border: '1px solid rgba(0,0,0,0.1)' }} />
              <button onClick={clearImage} className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center" style={{ background: '#1A8C6A' }}>
                <X size={11} />
              </button>
            </div>
          )}
          <div className="flex gap-3 items-end">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={streaming}
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all"
              style={imagePreview
                ? { background: '#E8F5F1', border: '1.5px solid #1A8C6A', color: '#1A8C6A' }
                : { background: 'white', border: '1.5px solid rgba(0,0,0,0.12)', color: '#9CA3AF' }
              }
              title="Upload an image"
            >
              <ImagePlus size={16} />
            </button>
            <div className="flex-1 rounded-xl" style={{ background: '#F3F4F6', border: '1.5px solid transparent', transition: 'all 0.15s' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#1A8C6A'; e.currentTarget.style.background = 'white' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#F3F4F6' }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={imagePreview ? `Ask ${interview.persona?.name ?? 'your persona'} about this image...` : `Ask ${interview.persona?.name ?? 'your persona'} something...`}
                rows={1}
                className="w-full px-4 py-3 text-sm bg-transparent text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none"
                style={{ minHeight: '44px', maxHeight: '160px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !imageData) || streaming}
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
              style={(input.trim() || imageData) && !streaming
                ? { background: '#1A8C6A', color: 'white' }
                : { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }
              }
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-center text-xs text-neutral-400 mt-2">
            Enter to send · Shift+Enter for new line · <ImagePlus size={10} className="inline mb-0.5" /> to share an image
          </p>
        </div>
      </div>

      {/* ── Collapsible persona panel ── */}
      <div
        className="flex-shrink-0 overflow-hidden flex flex-col"
        style={{
          width: panelOpen ? '270px' : '0px',
          transition: 'width 0.25s ease',
          background: 'white',
          borderLeft: panelOpen ? '1px solid rgba(0,0,0,0.07)' : 'none',
        }}
      >
        {panelOpen && (
          <>
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <span className="text-sm font-semibold text-neutral-900">Persona profile</span>
              <button onClick={() => setPanelOpen(false)} className="w-6 h-6 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors" style={{ background: '#F3F4F6' }}>
                <X size={12} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col items-center text-center mb-4">
                <PersonaAvatar
                  avatarUrl={interview.persona?.avatar_url}
                  avatarInitials={interview.persona?.avatar_initials}
                  avatarColor={interview.persona?.avatar_color}
                  name={interview.persona?.name}
                  size="md"
                  className="mb-2"
                />
                <h3 className="text-sm font-bold text-neutral-900">{interview.persona?.name}</h3>
                <p className="text-xs text-neutral-400">{t?.job_title}</p>
              </div>

              {/* Demographics */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Demographics</h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'Age', value: t?.age },
                    { label: 'Location', value: t?.location },
                    { label: 'Income', value: t?.income ? incomeMap[t.income] : null },
                    { label: 'Education', value: t?.education ? educationMap[t.education] : null },
                    { label: 'Industry', value: t?.industry },
                  ].filter(r => r.value).map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <dt className="text-neutral-400">{label}</dt>
                      <dd className="font-medium text-neutral-700">{value}</dd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scores */}
              {(t?.tech_savviness || t?.risk_tolerance) && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Profile scores</h4>
                  <div className="space-y-2.5">
                    {t?.tech_savviness && (
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-neutral-500">Tech savviness</span><span className="font-medium text-neutral-700">{t.tech_savviness}/5</span></div>
                        <div className="h-1.5 rounded-full" style={{ background: '#F3F4F6' }}><div className="h-1.5 rounded-full" style={{ background: '#1A8C6A', width: `${(t.tech_savviness / 5) * 100}%` }} /></div>
                      </div>
                    )}
                    {t?.risk_tolerance && (
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-neutral-500">Risk tolerance</span><span className="font-medium text-neutral-700">{t.risk_tolerance}/5</span></div>
                        <div className="h-1.5 rounded-full" style={{ background: '#F3F4F6' }}><div className="h-1.5 rounded-full" style={{ background: '#1A8C6A', width: `${(t.risk_tolerance / 5) * 100}%` }} /></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buying behavior */}
              {t?.buying_behavior && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Buying behavior</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">{t.buying_behavior}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, persona }: { message: Message; persona: any }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%]">
          {message.image_url && (
            <div className="mb-2 flex justify-end">
              <img src={message.image_url} alt="Shared image" className="max-h-48 w-auto rounded-xl object-cover" style={{ border: '1px solid rgba(0,0,0,0.1)' }} />
            </div>
          )}
          {message.content && (
            <div className="rounded-2xl rounded-tr-sm px-4 py-3" style={{ background: '#1A8C6A' }}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">{message.content}</p>
            </div>
          )}
          <p className="text-xs text-neutral-400 text-right mt-1">{formatRelativeTime(message.timestamp)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <PersonaAvatar
        avatarUrl={persona?.avatar_url}
        avatarInitials={persona?.avatar_initials}
        avatarColor={persona?.avatar_color}
        name={persona?.name}
        size="xs"
        className="mt-0.5 flex-shrink-0"
      />
      <div className="flex-1">
        <p className="text-xs text-neutral-400 mb-1 font-medium">{persona?.name}</p>
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]" style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-neutral-400 mt-1">{formatRelativeTime(message.timestamp)}</p>
      </div>
    </div>
  )
}

// ─── Starter questions ────────────────────────────────────────────────────────

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
