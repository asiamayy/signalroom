import Link from 'next/link'
import { Quote } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import type { Persona } from '@/types'

interface PersonaSpotlightProps {
  persona: Persona
  quote: string
  interviewId: string | null
}

export function PersonaSpotlight({ persona, quote, interviewId }: PersonaSpotlightProps) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3 block" style={{ color: '#1C3D2E' }}>Persona Spotlight</span>
      <div className="flex items-center gap-3 mb-3">
        <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{persona.name}</p>
          <p className="text-[11px] uppercase tracking-wide truncate" style={{ color: '#9CA3AF' }}>{persona.traits?.job_title || 'Persona'}</p>
        </div>
      </div>
      <div className="flex items-start gap-2 mb-3">
        <Quote size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#D1D5DB' }} />
        <p className="text-sm italic text-neutral-700 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      </div>
      {interviewId && (
        <Link href={`/interviews/${interviewId}`} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#1C3D2E' }}>
          View interview highlights →
        </Link>
      )}
    </div>
  )
}
