'use client'

import { useState } from 'react'
import { Copy, Mail, MessageCircle, Share2 } from 'lucide-react'

export function ShareReportMenu({ reportId, title, canSlack }: { reportId: string; title: string; canSlack: boolean }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const getUrl = async () => { const res = await fetch(`/api/reports/${reportId}/share`, { method: 'POST' }); if (!res.ok) throw new Error(); const { data } = await res.json(); return `${window.location.origin}/r/${data.token}` }
  const copy = async () => { try { await navigator.clipboard.writeText(await getUrl()); setStatus('Copied'); setTimeout(() => setStatus(''), 1800) } catch { setStatus('Try again') } }
  const email = async () => { try { const url = await getUrl(); window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`I thought you might find this research report useful:\n\n${url}`)}` } catch { setStatus('Try again') } }
  const slack = async () => { try { await navigator.clipboard.writeText(await getUrl()); setStatus('Link copied for Slack'); setTimeout(() => setStatus(''), 1800) } catch { setStatus('Try again') } }
  const bubble = 'absolute flex h-10 w-10 items-center justify-center rounded-full border border-[#c3c8c3]/70 bg-white text-[#18281c] shadow-md transition-colors hover:bg-[#dfe4da] hover:text-[#18281c]'
  return <div className="relative inline-flex items-center"><button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} className="inline-flex items-center rounded-lg bg-[#eae7e7] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[#dedbda]" style={{color:'#1c1b1b'}}><Share2 size={18} className="mr-2" />Share</button>{open && <><button onClick={email} title="Email report" className={`${bubble} -top-12 left-1/2 -translate-x-1/2`}><Mail size={16}/></button><button onClick={copy} title="Copy link" className={`${bubble} -right-11 top-1/2 -translate-y-1/2`}><Copy size={16}/></button>{canSlack && <button onClick={slack} title="Copy link for Slack" className={`${bubble} -bottom-12 left-1/2 -translate-x-1/2`}><MessageCircle size={16}/></button>}</>}{status && <span className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold" style={{color:'#18281c'}}>{status}</span>}</div>
}
