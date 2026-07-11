import { Suspense } from 'react'
import PersonaBuilder from '@/components/persona/PersonaBuilder'

export default function NewPersonaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading...</div>}>
      <PersonaBuilder />
    </Suspense>
  )
}
