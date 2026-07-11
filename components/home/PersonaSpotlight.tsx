import Link from 'next/link'
import { HOME_COLORS } from '@/lib/home-theme'
import { CARD_SHADOW } from '@/lib/utils'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import type { Persona } from '@/types'

interface PersonaSpotlightProps {
  persona: Persona
  quote: string
  interviewId: string | null
}

export function PersonaSpotlight({ persona, quote, interviewId }: PersonaSpotlightProps) {
  return (
    <div className="rounded-2xl p-6" style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary, boxShadow: CARD_SHADOW }}>
      <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-6 opacity-60">Persona Spotlight</h4>
      <div className="flex items-center gap-4 mb-6">
        <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="lg" className="ring-2 ring-[#b8ccba]" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{persona.name}</p>
          <p className="text-[11px] uppercase tracking-wider truncate" style={{ color: HOME_COLORS.primaryFixedDim }}>{persona.traits?.job_title || 'Persona'}</p>
        </div>
      </div>
      <p className="text-sm italic leading-relaxed mb-6 opacity-90">&ldquo;{quote}&rdquo;</p>
      {interviewId && (
        <Link href={`/interviews/${interviewId}`} className="w-full block text-center py-3 rounded-xl text-[11px] font-semibold uppercase tracking-widest transition-colors hover:bg-white/10" style={{ background: HOME_COLORS.primaryContainer, color: HOME_COLORS.onPrimaryContainer }}>
          View interview highlights
        </Link>
      )}
    </div>
  )
}
