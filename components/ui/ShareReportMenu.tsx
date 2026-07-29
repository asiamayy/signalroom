'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Mail, Share2 } from 'lucide-react'

export function ShareReportMenu({ reportId, title, canSlack }: { reportId: string; title: string; canSlack: boolean }) {
  const [open, setOpen] = useState(false)
  const [complete, setComplete] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const close = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, [])
  const getUrl = async () => { const res = await fetch(`/api/reports/${reportId}/share`, { method: 'POST' }); if (!res.ok) throw new Error(); const { data } = await res.json(); return `${window.location.origin}/r/${data.token}` }
  const confirm = (action: string) => { setComplete(action); setTimeout(() => setComplete(null), 1200) }
  const copy = async () => { try { await navigator.clipboard.writeText(await getUrl()); confirm('copy') } catch {} }
  const email = async () => { try { const url = await getUrl(); confirm('email'); window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`I thought you might find this research report useful:\n\n${url}`)}` } catch {} }
  const slack = async () => { try { await navigator.clipboard.writeText(await getUrl()); confirm('slack') } catch {} }
  const bubble = 'absolute flex h-10 w-10 items-center justify-center rounded-full border border-[#c3c8c3]/70 bg-white text-[#18281c] shadow-md transition-colors hover:bg-[#dfe4da] hover:text-[#18281c]'
  const pressed = (action: string) => complete === action ? 'scale-90 bg-[#dfe4da]' : 'active:scale-90'
  return <div ref={menuRef} className="relative inline-flex items-center"><button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} className="inline-flex items-center rounded-lg bg-[#eae7e7] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#dedbda]" style={{color:'#1c1b1b'}}><Share2 size={18} className="mr-2" />Share</button>{open && <><button onClick={email} title="Email report" className={`${bubble} ${pressed('email')} -top-12 left-1/2 -translate-x-1/2`}><Mail size={16}/>{complete === 'email' && <Check size={11} className="absolute -right-1 -bottom-1 rounded-full bg-[#18281c] p-0.5 text-white"/>}</button><button onClick={copy} title="Copy link" className={`${bubble} ${pressed('copy')} -right-11 top-1/2 -translate-y-1/2`}><Copy size={16}/>{complete === 'copy' && <Check size={11} className="absolute -right-1 -bottom-1 rounded-full bg-[#18281c] p-0.5 text-white"/>}</button>{canSlack && <button onClick={slack} title="Share in Slack" className={`${bubble} ${pressed('slack')} -bottom-12 left-1/2 -translate-x-1/2`}><img src="/integrations/slack.svg" alt="Slack" className="h-4 w-4"/>{complete === 'slack' && <Check size={11} className="absolute -right-1 -bottom-1 rounded-full bg-[#18281c] p-0.5 text-white"/>}</button>}</>}</div>
}
