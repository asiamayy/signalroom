'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Users, MessageSquare, FileText, X, Sparkles, Lightbulb } from 'lucide-react'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY } from '@/lib/home-theme'

const STEPS = [
  {
    icon: Users,
    title: 'Build a persona',
    body: 'Define who you want to interview — their job, income, frustrations, and goals. The more specific you are, the more useful the feedback.',
    tip: 'Try the AI generate button — describe your target customer in one sentence and it fills everything in.',
  },
  {
    icon: MessageSquare,
    title: 'Run the interview',
    body: 'Ask your persona anything — your idea, your pricing, your landing page. They respond in character with real opinions and honest pushback.',
    tip: 'You can also upload an image — drop in a screenshot or mockup and ask for their reaction.',
  },
  {
    icon: FileText,
    title: 'Get your report',
    body: 'After a few exchanges, click "Get report" to generate a structured research report with key themes, quotes, and recommendations.',
    tip: 'Use Compare to ask the same question to multiple personas and see how different segments respond.',
  },
]

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function OnboardingModal() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show only if user hasn't seen onboarding before
    const seen = localStorage.getItem('signalroom_onboarded')
    if (!seen) {
      setVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('signalroom_onboarded', 'true')
    setVisible(false)
  }

  const handleFinish = () => {
    localStorage.setItem('signalroom_onboarded', 'true')
    setVisible(false)
    router.push('/personas/new')
  }

  const currentStep = STEPS[step]
  const Icon = currentStep.icon
  const isLast = step === STEPS.length - 1

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', fontFamily: HOME_FONT_BODY }}
          onClick={handleDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            className="relative w-full overflow-hidden"
            style={{
              maxWidth: 480,
              borderRadius: 24,
              background: HOME_COLORS.surfaceContainerLowest,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={SPRING}
          >
            {/* Header — the app's dark-green editorial hero treatment */}
            <div className="relative px-7 pt-7 pb-6" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}>
              <button
                onClick={handleDismiss}
                aria-label="Close"
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: HOME_COLORS.primaryFixedDim }}
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <Sparkles size={14} style={{ color: HOME_COLORS.primaryFixedDim }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primaryFixed }}>
                  Welcome to SignalRoom
                </span>
              </div>

              <h2
                className="text-xl sm:text-[22px] leading-snug pr-6"
                style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.02em' }}
              >
                Get your first insight in under 10 minutes
              </h2>

              {/* Step indicators */}
              <div className="flex gap-2 mt-6">
                {STEPS.map((s, i) => (
                  <button
                    key={s.title}
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}: ${s.title}`}
                    className="flex-1 h-1 rounded-full transition-colors"
                    style={{
                      background: i <= step ? HOME_COLORS.primaryFixed : 'rgba(255,255,255,0.18)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="px-7 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.primary }}
                    >
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: HOME_COLORS.onSurfaceVariant, fontFamily: HOME_FONT_DISPLAY }}
                        >
                          0{step + 1}
                        </span>
                        <h3 className="text-[15px] font-semibold" style={{ color: HOME_COLORS.onSurface }}>
                          {currentStep.title}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                        {currentStep.body}
                      </p>
                    </div>
                  </div>

                  {/* Tip */}
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66` }}
                  >
                    <p className="text-xs leading-relaxed flex items-start gap-2" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                      <Lightbulb size={12} className="flex-shrink-0 mt-0.5" style={{ color: HOME_COLORS.primary }} />
                      <span>
                        <span className="font-semibold" style={{ color: HOME_COLORS.onSurface }}>Tip: </span>
                        {currentStep.tip}
                      </span>
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-7 pb-7 flex items-center justify-between gap-4">
              <button
                onClick={handleDismiss}
                className="text-sm transition-colors hover:opacity-70"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: HOME_COLORS.onSurfaceVariant, fontFamily: 'inherit' }}
              >
                Skip tour
              </button>

              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="text-sm font-medium px-4 py-2.5 rounded-full transition-colors"
                    style={{
                      background: 'none',
                      border: `1px solid ${HOME_COLORS.outlineVariant}`,
                      cursor: 'pointer',
                      color: HOME_COLORS.onSurface,
                      fontFamily: 'inherit',
                    }}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={isLast ? handleFinish : () => setStep(s => s + 1)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-6 py-2.5 rounded-full transition-all hover:shadow-lg"
                  style={{
                    background: HOME_COLORS.primary,
                    color: HOME_COLORS.onPrimary,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {isLast ? 'Build my first persona' : 'Next'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
