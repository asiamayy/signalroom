'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { getSentimentColor } from '@/lib/utils'
import type { ReportTheme } from '@/types'

export function ThemesClient({ themes, confidenceScore }: { themes: ReportTheme[]; confidenceScore: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const openTheme = openIndex !== null ? themes[openIndex] : null

  return (
    <>
      <div className="space-y-3">
        {themes.map((theme, i) => (
          <ThemeCard key={i} theme={theme} index={i} onClick={() => setOpenIndex(i)} />
        ))}
      </div>

      <AnimatePresence>
        {openTheme && (
          <Modal key="theme-modal" onClose={() => setOpenIndex(null)} maxWidth={540} layoutId={`report-theme-${openIndex}`}>
            <ThemeModalContent theme={openTheme} confidenceScore={confidenceScore} />
          </Modal>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Theme card body — shared between the real card and the modal ────────────

function ThemeCardBody({ theme, index }: { theme: ReportTheme; index: number }) {
  const sentimentClass = getSentimentColor(theme.sentiment)
  const SentimentIcon = theme.sentiment === 'positive' ? CheckCircle2
    : theme.sentiment === 'negative' ? AlertCircle
    : Info

  return (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <span className="text-xs text-neutral-300 font-mono mt-0.5 flex-shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="text-sm font-semibold text-neutral-900">{theme.title}</h3>
        </div>
        <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${sentimentClass}`}>
          <SentimentIcon size={10} />
          {theme.sentiment}
        </span>
      </div>

      <p className="text-sm text-neutral-600 leading-relaxed mb-4 pl-6">{theme.summary}</p>

      {theme.quotes && theme.quotes.length > 0 && (
        <div className="pl-6 space-y-2">
          {theme.quotes.map((quote, i) => (
            <blockquote
              key={i}
              className="flex gap-2.5 text-sm text-neutral-700 bg-neutral-50 border-l-2 border-neutral-200 pl-3 py-1.5 pr-3 rounded-r-md italic leading-relaxed"
            >
              <Quote size={12} className="text-neutral-300 flex-shrink-0 mt-1" />
              {quote}
            </blockquote>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Theme card ────────────────────────────────────────────────────────────────

function ThemeCard({ theme, index, onClick }: { theme: ReportTheme; index: number; onClick: () => void }) {
  return (
    <motion.div
      layoutId={`report-theme-${index}`}
      onClick={onClick}
      className="bg-white border border-neutral-200 rounded-xl p-5 cursor-pointer transition-all hover:border-neutral-300 hover:shadow-sm"
    >
      <ThemeCardBody theme={theme} index={index} />
    </motion.div>
  )
}

// ─── Theme deep-dive modal content ─────────────────────────────────────────────

function ThemeModalContent({ theme, confidenceScore }: { theme: ReportTheme; confidenceScore: number }) {
  const sentimentClass = getSentimentColor(theme.sentiment)
  const SentimentIcon = theme.sentiment === 'positive' ? CheckCircle2
    : theme.sentiment === 'negative' ? AlertCircle
    : Info

  return (
    <div>
      <div className="flex items-start justify-between gap-3 pr-8 mb-4">
        <h2 className="text-lg font-serif font-bold text-neutral-900">{theme.title}</h2>
        <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${sentimentClass}`}>
          <SentimentIcon size={10} />
          {theme.sentiment}
        </span>
      </div>

      <p className="text-sm text-neutral-700 leading-relaxed mb-5">{theme.summary}</p>

      {theme.quotes && theme.quotes.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">Supporting quotes</p>
          <div className="space-y-2">
            {theme.quotes.map((quote, i) => (
              <blockquote
                key={i}
                className="flex gap-2.5 text-sm text-neutral-700 bg-neutral-50 border-l-2 border-neutral-200 pl-3 py-2 pr-3 rounded-r-md italic leading-relaxed"
              >
                <Quote size={12} className="text-neutral-300 flex-shrink-0 mt-1" />
                {quote}
              </blockquote>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <span className="text-xs text-neutral-400">Report confidence score</span>
        <span className="text-sm font-semibold text-neutral-900">{confidenceScore}</span>
      </div>
    </div>
  )
}
