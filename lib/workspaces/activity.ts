import 'server-only'

type ActivityClient = {
  from: (table: string) => any
}

export type WorkspaceActivityAction =
  | 'workspace_created'
  | 'workspace_renamed'
  | 'member_invited'
  | 'persona_created'
  | 'interview_started'
  | 'report_generated'

// Collaboration telemetry should never make a research action fail. The
// workspace_activity table is introduced by a separate migration, so this is
// deliberately best-effort while older deployments catch up.
export async function logWorkspaceActivity(
  supabase: ActivityClient,
  input: {
    workspaceId: string | null | undefined
    actorId: string
    action: WorkspaceActivityAction
    entityType?: string
    entityId?: string
    entityLabel?: string
  }
) {
  if (!input.workspaceId) return

  try {
    await supabase.from('workspace_activity').insert({
      workspace_id: input.workspaceId,
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      entity_label: input.entityLabel ?? null,
    })
  } catch {
    // Intentionally ignored; see comment above.
  }
}
