import 'server-only'

import type { PersonaActivityAction } from '@/types'

type ActivityClient = {
  from: (table: string) => any
}

export async function logPersonaActivity(
  supabase: ActivityClient,
  input: {
    personaId: string
    actorId: string
    action: PersonaActivityAction
    detail?: string | null
  }
) {
  try {
    await supabase.from('persona_activity').insert({
      persona_id: input.personaId,
      actor_id: input.actorId,
      action: input.action,
      detail: input.detail ?? null,
    })
  } catch {
    // Activity should never interrupt a research action. This also lets
    // existing deployments continue working until the migration is applied.
  }
}
