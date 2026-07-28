import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createAdminClient() {
  // No cookies forwarded, deliberately. createServerClient is built to
  // mirror whoever's session is in the request — that's correct for
  // createClient() above, but it's exactly wrong for an admin client: if a
  // visitor's session cookie were forwarded here, this client would
  // authenticate as *them* regardless of the service-role key, and RLS
  // would apply as if this were a normal per-user request. An admin client
  // must never have a session to fall back to, so every request is
  // authorized purely by the service-role key itself.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}
