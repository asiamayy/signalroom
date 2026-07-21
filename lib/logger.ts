// Minimal structured error logging — one JSON line per error so hosted log
// search (Vercel, Supabase, or a future Sentry drain) can filter by scope.
// Pass only identifiers (user id, interview id) in context, never message
// content, traits, transcripts, or tokens.

export function logError(
  scope: string,
  error: unknown,
  context: Record<string, string | number | boolean | null | undefined> = {}
) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(JSON.stringify({
    level: 'error',
    scope,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  }))
}
