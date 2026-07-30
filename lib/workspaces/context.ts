import 'server-only'

type ContextClient = { from: (table: string) => any }

// Keeps shared context useful without crowding out the task-specific prompt.
// Only text-extractable sources contribute automatically; PDFs and decks are
// safely stored for the workspace and can be distilled into the brief below.
export async function getWorkspaceContext(supabase: ContextClient, workspaceId: string | null | undefined) {
  if (!workspaceId) return ''
  try {
    const [context, sources] = await Promise.all([
      supabase.from('workspace_contexts').select('content').eq('workspace_id', workspaceId).maybeSingle(),
      supabase.from('workspace_sources').select('name, extracted_text').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(5),
    ])
    const brief = context.data?.content?.trim() ?? ''
    const sourceText = (sources.data ?? [])
      .filter((source: { extracted_text?: string }) => source.extracted_text?.trim())
      .map((source: { name: string; extracted_text: string }) => `Source: ${source.name}\n${source.extracted_text.slice(0, 2200)}`)
      .join('\n\n')
    const combined = [brief && `Workspace brief:\n${brief}`, sourceText && `Shared source excerpts:\n${sourceText}`].filter(Boolean).join('\n\n')
    return combined.slice(0, 10000)
  } catch {
    return ''
  }
}
