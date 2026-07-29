'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { getSentimentColor, CARD_SHADOW } from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_DISPLAY } from '@/lib/home-theme'
import type { ReportTheme } from '@/types'

export function ThemesClient({ themes, confidenceScore, variant = 'default' }: { themes: ReportTheme[]; confidenceScore: number; variant?: 'default' | 'report-detail' }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const openTheme = openIndex === null ? null : themes[openIndex]
  return <><div className={variant === 'report-detail' ? 'space-y-5' : 'space-y-3'}>{themes.map((theme, index) => <ThemeCard key={index} theme={theme} index={index} variant={variant} onClick={() => setOpenIndex(index)} />)}</div><AnimatePresence>{openTheme && <Modal key="theme-modal" onClose={() => setOpenIndex(null)} maxWidth={540} layoutId={`report-theme-${openIndex}`}><ThemeModalContent theme={openTheme} confidenceScore={confidenceScore} /></Modal>}</AnimatePresence></>
}

function ThemeCard({ theme, index, variant, onClick }: { theme: ReportTheme; index: number; variant: 'default' | 'report-detail'; onClick: () => void }) {
  const icon = theme.sentiment === 'positive' ? CheckCircle2 : theme.sentiment === 'negative' ? AlertCircle : Info
  const SentimentIcon = icon
  if (variant === 'report-detail') return <motion.button layoutId={`report-theme-${index}`} onClick={onClick} className="group w-full cursor-pointer rounded-2xl border p-7 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(24,40,28,0.10)]" style={{ background: HOME_COLORS.surfaceContainerLowest, borderColor: `${HOME_COLORS.outlineVariant}2b`, boxShadow: CARD_SHADOW }}>
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row"><div className="flex items-start gap-4"><span className="mt-0.5 text-3xl leading-none transition-colors duration-300 group-hover:text-[#18281c]/40" style={{ color: HOME_COLORS.outlineVariant, fontFamily: HOME_FONT_DISPLAY }}>{String(index + 1).padStart(2, '0')}</span><h3 className="text-xl leading-tight" style={{ color: HOME_COLORS.onSurface, fontFamily: HOME_FONT_DISPLAY, fontWeight: 600 }}>{theme.title}</h3></div><div className="flex shrink-0 gap-2"><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${getSentimentColor(theme.sentiment)}`}><SentimentIcon size={11} />{theme.sentiment} sentiment</span><span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase" style={{ background: HOME_COLORS.surfaceContainerHigh, color: HOME_COLORS.onSurfaceVariant }}>Insight</span></div></div>
    <p className="mb-6 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{theme.summary}</p>
    {theme.quotes?.length ? <div className="space-y-3">{theme.quotes.map((quote, quoteIndex) => <blockquote key={quoteIndex} className="flex gap-3 rounded-xl border-l-4 px-5 py-4 text-base italic leading-relaxed" style={{ color: HOME_COLORS.onSurface, background: HOME_COLORS.surfaceContainerLow, borderLeftColor: `${HOME_COLORS.primary}33` }}><Quote size={14} className="mt-1 shrink-0" style={{ color: HOME_COLORS.primary }} />{quote}</blockquote>)}</div> : null}
  </motion.button>
  return <motion.div layoutId={`report-theme-${index}`} onClick={onClick} className="cursor-pointer rounded-2xl p-5 transition-all hover:shadow-xl" style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: CARD_SHADOW }}><ThemeBody theme={theme} index={index} /></motion.div>
}

function ThemeBody({ theme, index }: { theme: ReportTheme; index: number }) { const SentimentIcon = theme.sentiment === 'positive' ? CheckCircle2 : theme.sentiment === 'negative' ? AlertCircle : Info; return <><div className="mb-3 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="mt-0.5 shrink-0 font-mono text-xs" style={{ color: HOME_COLORS.outlineVariant }}>{String(index + 1).padStart(2, '0')}</span><h3 className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{theme.title}</h3></div><span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${getSentimentColor(theme.sentiment)}`}><SentimentIcon size={10} />{theme.sentiment}</span></div><p className="mb-4 pl-6 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>{theme.summary}</p></> }

function ThemeModalContent({ theme, confidenceScore }: { theme: ReportTheme; confidenceScore: number }) { return <div><div className="mb-4 flex items-start justify-between gap-3 pr-8"><h2 className="text-lg" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>{theme.title}</h2><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${getSentimentColor(theme.sentiment)}`}>{theme.sentiment}</span></div><p className="mb-5 text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurface }}>{theme.summary}</p>{theme.quotes?.length ? <div className="mb-5 space-y-2">{theme.quotes.map((quote, i) => <blockquote key={i} className="flex gap-2.5 rounded-r-md border-l-2 py-2 pl-3 pr-3 text-sm italic leading-relaxed" style={{ color: HOME_COLORS.onSurface, background: HOME_COLORS.surfaceContainerLow, borderLeftColor: HOME_COLORS.outlineVariant }}><Quote size={12} className="mt-1 shrink-0" />{quote}</blockquote>)}</div> : null}<div className="flex justify-between border-t pt-4 text-xs" style={{ borderColor: `${HOME_COLORS.outlineVariant}4d`, color: HOME_COLORS.onSurfaceVariant }}><span>Interview depth score</span><span className="font-semibold" style={{ color: HOME_COLORS.onSurface }}>{confidenceScore}</span></div></div> }
