'use client'

import { OnboardingModal } from '@/components/ui/OnboardingModal'

export function PersonasPageClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OnboardingModal />
      {children}
    </>
  )
}
