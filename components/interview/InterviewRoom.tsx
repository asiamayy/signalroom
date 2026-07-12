'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Send, FileText, Loader2, ImagePlus, X, User, ArrowRight } from 'lucide-react'
import { cn, formatRelativeTime, INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_DISPLAY } from '@/lib/home-theme'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import type { Interview, Message } from '@/types'

interface InterviewRoomProps {
  interview: Interview & { persona: any; project?: { id: string; name: string } | null }
}

export default function InterviewRoom({ interview }: InterviewRoomProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(interview.messages ?? [])
  const [input, setInput] = useState('')
  const [imageData, setImageData] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageMediaType, setImageMediaType] = useState<string>('image/jpeg')
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
    setImageMediaType(file.type || 'image/jpeg')
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
    const currentImageData = imageData
    const currentImagePreview = imagePreview
    if ((!text && !currentImageData) || streaming) return
    setInput('')
    setError('')
    setImageData(null)
    setImagePreview(null)
    setImageMediaType('image/jpeg')
    if (fileInputRef.current) fileInputRef.current.value = ''

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      image_url: currentImagePreview ?? undefined,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setStreaming(true)
    setStreamingText('')

    let full = ''
    try {
      const res = await fetch(`/api/interviews/${interview.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, image: currentImageData, imageMediaType }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              // API sends { text: chunk } format
              const textChunk = data.text ?? data.content ?? null
              if (textChunk) {
                full += textChunk
                setStreamingText(full)
              }
            } catch {}
          }
        }
      }

      if (full) {
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'persona' as const,
          content: full,
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, assistantMsg])
      }
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

        {/* Top bar — editorial hero */}
        <header className="relative px-4 sm:px-8 py-5 sm:py-6 flex-shrink-0 overflow-hidden" style={{ background: HOME_COLORS.surfaceContainerLowest, borderBottom: `1px solid ${HOME_COLORS.outlineVariant}4d` }}>
          {/* Decorative persona photo — replaces the reference mockup's grey blob */}
          <div className="absolute -top-3 right-4 sm:right-8 opacity-90 pointer-events-none hidden sm:block">
            <PersonaAvatar
              avatarUrl={interview.persona?.avatar_url}
              avatarInitials={interview.persona?.avatar_initials}
              avatarColor={interview.persona?.avatar_color}
              name={interview.persona?.name}
              size="3xl"
              style={{ boxShadow: `0 0 0 4px ${HOME_COLORS.surfaceContainerLowest}` }}
            />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 max-w-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-px flex-shrink-0" style={{ background: HOME_COLORS.primary }} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Research Simulation</span>
              </div>
              <h1 className="leading-tight text-xl sm:text-2xl mb-1" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>
                Interview with <span className="italic" style={{ fontWeight: 400 }}>{interview.persona?.name ?? 'Unknown'}</span>
              </h1>
              <p className="text-sm italic truncate" style={{ color: HOME_COLORS.onSurfaceVariant }}>{interview.title}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold uppercase tracking-wide flex-wrap" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                <span>{INTERVIEW_TYPE_LABELS[interview.type]}</span>
                {interview.project && (
                  <>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <Link href={`/projects/${interview.project.id}`} className="hover:underline" style={{ color: HOME_COLORS.primary }}>
                      {interview.project.name}
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span className="hidden sm:inline text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{messages.length} messages</span>

              {/* Persona panel toggle */}
              <button
                onClick={() => setPanelOpen(o => !o)}
                title="View persona"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                style={panelOpen
                  ? { background: HOME_COLORS.secondaryContainer, border: `1px solid ${HOME_COLORS.primary}`, color: HOME_COLORS.primary }
                  : { background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurfaceVariant }
                }
              >
                <User size={15} />
              </button>

              <button
                onClick={handleGenerateReport}
                disabled={!canReport || generatingReport}
                className={cn('group relative flex items-center gap-1.5 text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full font-semibold transition-all duration-300 ease-out flex-shrink-0',
                  canReport && !generatingReport ? 'text-white hover:pr-7 sm:hover:pr-9 hover:shadow-lg active:scale-95' : 'cursor-not-allowed'
                )}
                style={canReport && !generatingReport ? { background: HOME_COLORS.primary } : { background: HOME_COLORS.surfaceContainerHigh, color: HOME_COLORS.onSurfaceVariant }}
              >
                {generatingReport ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                <span className="hidden sm:inline">{generatingReport ? 'Generating...' : 'Get report'}</span>
                {canReport && !generatingReport && (
                  <ArrowRight size={12} className="absolute right-2.5 sm:right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Devil's Advocate banner */}
        {(interview as any).devils_advocate && (
          <div className="px-3 sm:px-5 py-2.5 flex-shrink-0" style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
            <span className="text-xs font-medium text-red-700">⚠ Devil's Advocate mode — persona leads with skepticism first</span>
          </div>
        )}

        {/* Context banner */}
        {interview.context && (
          <div className="px-3 sm:px-5 py-2.5 flex-shrink-0" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <span className="text-xs text-amber-800"><span className="font-medium">Context: </span>{interview.context}</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
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
            <div className="flex gap-2.5 sm:gap-3 items-start">
              <PersonaAvatar
                avatarUrl={interview.persona?.avatar_url}
                avatarInitials={interview.persona?.avatar_initials}
                avatarColor={interview.persona?.avatar_color}
                name={interview.persona?.name}
                size="xs"
                className="flex-shrink-0 mt-4"
              />
              <div className="flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                  {interview.persona?.name}
                </span>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}33` }}>
                  {streamingText
                    ? <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: HOME_COLORS.onSurface }}>{streamingText}<span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse align-middle" style={{ background: HOME_COLORS.onSurface }} /></p>
                    : <div className="flex gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: HOME_COLORS.onSurfaceVariant, animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: HOME_COLORS.onSurfaceVariant, animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: HOME_COLORS.onSurfaceVariant, animationDelay: '300ms' }} />
                      </div>
                  }
                </div>
              </div>
            </div>
          )}

          {/* First interview tip — shows after first response */}
          {messages.length === 2 && !streaming && (
            <div className="mx-auto max-w-lg rounded-xl px-4 py-3 text-center" style={{ background: '#E8F5F1', border: '1px solid #A7D9C8' }}>
              <p className="text-xs font-medium" style={{ color: '#2A5C4E' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2A5C4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px', marginBottom: '2px' }}>
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.9 10.2 19 8.7 19 7a7 7 0 1 0-13.4 2.8c.7 1.2 1.8 2 2.4 2.7.6.7 1 1.5 1 2.5"/>
                  <path d="M9 18h6"/><path d="M10 22h4"/>
                </svg>
                <strong>Pro tip:</strong> Start with one specific question — pricing, messaging, or persona fit. The narrower the question, the stronger the signal.
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && <div className="px-5 py-2 flex-shrink-0" style={{ background: '#FEF2F2', borderTop: '1px solid #FECACA' }}><p className="text-xs text-red-700">{error}</p></div>}

        {/* Input bar */}
        <div className="flex-shrink-0 px-3 sm:px-5 py-3 sm:py-4" style={{ background: 'white', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          {imagePreview && (
            <div className="relative inline-block mb-3">
              <img src={imagePreview} alt="Upload preview" className="h-20 w-auto rounded-xl object-cover" style={{ border: '1px solid rgba(0,0,0,0.1)' }} />
              <button onClick={clearImage} className="absolute -top-2 -right-2 w-5 h-5 text-white rounded-full flex items-center justify-center" style={{ background: '#2A5C4E' }}>
                <X size={11} />
              </button>
            </div>
          )}
          <div className="flex gap-2 sm:gap-3 items-end">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={streaming}
              className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all"
              style={imagePreview
                ? { background: '#E8F5F1', border: '1.5px solid #2A5C4E', color: '#2A5C4E' }
                : { background: 'white', border: '1.5px solid rgba(0,0,0,0.12)', color: '#9CA3AF' }
              }
              title="Upload an image"
            >
              <ImagePlus size={16} />
            </button>
            <div className="flex-1 rounded-xl" style={{ background: '#F3F4F6', border: '1.5px solid transparent', transition: 'all 0.15s' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#2A5C4E'; e.currentTarget.style.background = 'white' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#F3F4F6' }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={imagePreview ? `Ask ${interview.persona?.name ?? 'your persona'} about this image...` : `Ask ${interview.persona?.name ?? 'your persona'} something...`}
                rows={1}
                className="w-full px-3 sm:px-4 py-3 text-sm bg-transparent text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none"
                style={{ minHeight: '44px', maxHeight: '160px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !imageData) || streaming}
              className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors"
              style={(input.trim() || imageData) && !streaming
                ? { background: '#2A5C4E', color: 'white' }
                : { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }
              }
            >
              <Send size={15} />
            </button>
          </div>
          <p className="hidden sm:block text-center text-xs text-neutral-400 mt-2">
            Enter to send · Shift+Enter for new line · <ImagePlus size={10} className="inline mb-0.5" /> to share an image
          </p>
        </div>
      </div>

      {/* ── Collapsible persona panel — desktop: inline sidebar, mobile: overlay drawer ── */}
      {panelOpen && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setPanelOpen(false)}
        />
      )}
      <div
        className={cn(
          'flex-shrink-0 overflow-hidden flex flex-col',
          panelOpen ? 'fixed md:relative inset-y-0 right-0 z-50 md:z-auto w-[85vw] max-w-[320px] md:w-[270px]' : 'w-0'
        )}
        style={{
          transition: 'width 0.25s ease',
          background: HOME_COLORS.surfaceContainerLow,
          borderLeft: panelOpen ? `1px solid ${HOME_COLORS.outlineVariant}66` : 'none',
        }}
      >
        {panelOpen && (
          <>
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${HOME_COLORS.outlineVariant}66` }}>
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>Persona Preview</span>
              <button onClick={() => setPanelOpen(false)} className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors" style={{ color: HOME_COLORS.onSurfaceVariant, background: HOME_COLORS.surfaceContainerHigh }}>
                <X size={12} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Identity card */}
              <div className="rounded-xl p-5 flex flex-col items-center text-center" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimary }}>
                <PersonaAvatar
                  avatarUrl={interview.persona?.avatar_url}
                  avatarInitials={interview.persona?.avatar_initials}
                  avatarColor={interview.persona?.avatar_color}
                  name={interview.persona?.name}
                  size="lg"
                  className="mb-3 ring-2 ring-white/20"
                />
                <h3 className="text-lg leading-tight" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>{interview.persona?.name}</h3>
                <p className="text-[11px] uppercase tracking-wider mt-1" style={{ color: HOME_COLORS.onPrimaryContainer }}>{t?.job_title}</p>
              </div>

              {/* Demographics */}
              <div className="rounded-xl p-4" style={{ background: HOME_COLORS.surfaceContainerLowest }}>
                <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>Demographics</h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'Age', value: t?.age },
                    { label: 'Location', value: t?.location },
                    { label: 'Income', value: t?.income ? incomeMap[t.income] : null },
                    { label: 'Education', value: t?.education ? educationMap[t.education] : null },
                    { label: 'Industry', value: t?.industry },
                  ].filter(r => r.value).map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <dt style={{ color: HOME_COLORS.onSurfaceVariant }}>{label}</dt>
                      <dd className="font-medium" style={{ color: HOME_COLORS.onSurface }}>{value}</dd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scores */}
              {(t?.tech_savviness || t?.risk_tolerance) && (
                <div className="rounded-xl p-4" style={{ background: HOME_COLORS.surfaceContainerLowest }}>
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: HOME_COLORS.onSurfaceVariant }}>Profile scores</h4>
                  <div className="space-y-2.5">
                    {t?.tech_savviness && (
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span style={{ color: HOME_COLORS.onSurfaceVariant }}>Tech savviness</span><span className="font-medium" style={{ color: HOME_COLORS.onSurface }}>{t.tech_savviness}/5</span></div>
                        <div className="h-1.5 rounded-full" style={{ background: HOME_COLORS.surfaceContainer }}><div className="h-1.5 rounded-full" style={{ background: HOME_COLORS.primary, width: `${(t.tech_savviness / 5) * 100}%` }} /></div>
                      </div>
                    )}
                    {t?.risk_tolerance && (
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span style={{ color: HOME_COLORS.onSurfaceVariant }}>Risk tolerance</span><span className="font-medium" style={{ color: HOME_COLORS.onSurface }}>{t.risk_tolerance}/5</span></div>
                        <div className="h-1.5 rounded-full" style={{ background: HOME_COLORS.surfaceContainer }}><div className="h-1.5 rounded-full" style={{ background: HOME_COLORS.primary, width: `${(t.risk_tolerance / 5) * 100}%` }} /></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Buying behavior */}
              {t?.buying_behavior && (
                <div className="rounded-xl p-4" style={{ background: HOME_COLORS.surfaceContainerLowest }}>
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>Buying behavior</h4>
                  <p className="text-xs leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{t.buying_behavior}</p>
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

// Conventional chat layout: you (the researcher) on the right, the persona's
// answers — the actual research output — on the left, so the transcript reads
// top-to-bottom like a real conversation log.
function MessageBubble({ message, persona }: { message: Message; persona: any }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex flex-col gap-1.5 items-end max-w-[88%] sm:max-w-[70%]">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            You · {formatRelativeTime(message.timestamp)}
          </span>
          {message.image_url && (
            <img src={message.image_url} alt="Shared image" className="max-h-48 w-auto rounded-xl object-cover" style={{ border: `1px solid ${HOME_COLORS.outlineVariant}66` }} />
          )}
          {message.content && (
            <div className="rounded-2xl rounded-tr-sm px-4 py-3" style={{ background: HOME_COLORS.primary }}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: HOME_COLORS.onPrimary }}>{message.content}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5 sm:gap-3 items-start">
      <PersonaAvatar
        avatarUrl={persona?.avatar_url}
        avatarInitials={persona?.avatar_initials}
        avatarColor={persona?.avatar_color}
        name={persona?.name}
        size="xs"
        className="flex-shrink-0 mt-4"
      />
      <div className="flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>
          {persona?.name} · {formatRelativeTime(message.timestamp)}
        </span>
        <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}33` }}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: HOME_COLORS.onSurface }}>{message.content}</p>
        </div>
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
