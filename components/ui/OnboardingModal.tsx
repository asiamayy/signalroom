'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Users, MessageSquare, FileText, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Build a persona',
    body: 'Define who you want to interview — their job, income, frustrations, and goals. The more specific you are, the more useful the feedback.',
    tip: 'Try the AI generate button — describe your target customer in one sentence and it fills everything in.',
  },
  {
    icon: MessageSquare,
    color: 'bg-blue-50 text-blue-600',
    title: 'Run the interview',
    body: 'Ask your persona anything — your idea, your pricing, your landing page. They respond in character with real opinions and honest pushback.',
    tip: 'You can also upload an image — drop in a screenshot or mockup and ask for their reaction.',
  },
  {
    icon: FileText,
    color: 'bg-purple-50 text-purple-600',
    title: 'Get your report',
    body: 'After a few exchanges, click "Get report" to generate a structured research report with key themes, quotes, and recommendations.',
    tip: 'Use Compare to ask the same question to multiple personas and see how different segments respond.',
  },
]

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

  if (!visible) return null

  const currentStep = STEPS[step]
  const Icon = currentStep.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Welcome to SignalRoom</span>
          </div>
          <h2 className="font-serif text-xl tracking-tight text-neutral-900">
            Get your first insight in under 10 minutes
          </h2>
        </div>

        {/* Step indicators */}
        <div className="flex px-7 pt-5 gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                i === step ? 'bg-neutral-900' : i < step ? 'bg-emerald-400' : 'bg-neutral-200'
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="px-7 py-6">
          <div className="flex items-start gap-4 mb-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', currentStep.color)}>
              <Icon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-neutral-400 font-mono">0{step + 1}</span>
                <h3 className="text-sm font-semibold text-neutral-900">{currentStep.title}</h3>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">{currentStep.body}</p>
            </div>
          </div>

          {/* Tip */}
          <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3">
            <p className="text-xs text-neutral-500 leading-relaxed">
              <span className="font-medium text-neutral-700">💡 Tip: </span>
              {currentStep.tip}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 bg-neutral-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Build my first persona
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-1.5 bg-neutral-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Next
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
