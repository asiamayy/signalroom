'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Mail, Share2 } from 'lucide-react'

export function ShareReportMenu({ reportId, title, canSlack }: { reportId: string; title: string; canSlack: boolean }) {
  const [open, setOpen] = useState(false)
  const [complete, setComplete] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const close = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, [])
  const getUrl = async () => { const res = await fetch(`/api/reports/${reportId}/share`, { method: 'POST' }); if (!res.ok) throw new Error(); const { data } = await res.json(); return `${window.location.origin}/r/${data.token}` }
  const confirm = (action: string) => { setComplete(action); setTimeout(() => setComplete(null), 1200) }
  const beginAction = () => setOpen(false)
  const copy = async () => { beginAction(); try { await navigator.clipboard.writeText(await getUrl()); confirm('copy') } catch {} }
  const email = async () => { beginAction(); try { const url = await getUrl(); confirm('email'); window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`I thought you might find this research report useful:\n\n${url}`)}` } catch {} }
  const slack = async () => { beginAction(); try { await navigator.clipboard.writeText(await getUrl()); confirm('slack') } catch {} }
  const bubble = 'absolute flex h-10 w-10 items-center justify-center rounded-full border border-[#c3c8c3]/70 bg-white text-[#18281c] shadow-md transition-colors hover:bg-[#dfe4da] hover:text-[#18281c] active:scale-90'
  const bubbleTransition = { type: 'spring' as const, stiffness: 420, damping: 26 }
  return <div ref={menuRef} className="relative inline-flex items-center"><button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} className="inline-flex items-center rounded-lg bg-[#eae7e7] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#dedbda]" style={{color:'#1c1b1b'}}><Share2 size={18} className="mr-2" />Share{complete && <Check size={13} className="ml-1.5" />}</button><AnimatePresence>{open && <><motion.button key="email" type="button" onClick={email} title="Email report" aria-label="Email report" className={`${bubble} -top-12 left-[calc(50%-1.25rem)]`} initial={{ opacity: 0, scale: 0.72, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.78, y: 8 }} transition={bubbleTransition}><Mail size={16}/></motion.button><motion.button key="copy" type="button" onClick={copy} title="Copy link" aria-label="Copy link" className={`${bubble} -right-11 top-[calc(50%-1.25rem)]`} initial={{ opacity: 0, scale: 0.72, x: -12 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.78, x: -8 }} transition={{ ...bubbleTransition, delay: 0.04 }}><Copy size={16}/></motion.button>{canSlack && <motion.button key="slack" type="button" onClick={slack} title="Share in Slack" aria-label="Share in Slack" className={`${bubble} -bottom-12 left-[calc(50%-1.25rem)]`} initial={{ opacity: 0, scale: 0.72, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.78, y: -8 }} transition={{ ...bubbleTransition, delay: 0.08 }}><img src="/integrations/slack.svg" alt="" className="h-4 w-4"/></motion.button>}</>}</AnimatePresence></div>
}
