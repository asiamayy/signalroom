import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logError } from '@/lib/logger'
import { AcceptInviteButton, SignOutAndRetryLink } from './AcceptInviteButton'

// Unlisted, invite-only links — keep out of search indexes.
export const metadata = {
  robots: { index: false, follow: false },
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // No session required for this lookup — an invitee may not be logged in
  // yet. Same "cross RLS boundaries safely for one legitimate operation"
  // pattern the report share_token page already uses.
  const admin = await createAdminClient()
  const { data: invite, error: inviteError } = await admin
    .from('workspace_invites')
    .select('id, invited_email, status, workspace:workspaces(name)')
    .eq('token', token)
    .single()

  // Temporary diagnostic — "invite is no longer valid" has been showing up
  // for invites that should still be pending. Logging the raw lookup
  // outcome (never the token itself) so the next occurrence is debuggable
  // instead of a silent dead end.
  if (!invite || invite.status !== 'pending') {
    logError('invite.page_showed_invalid', inviteError ?? new Error('invite missing or not pending'), {
      found: !!invite,
      status: invite?.status ?? null,
      error_code: (inviteError as { code?: string } | null)?.code ?? null,
      token_prefix: token.slice(0, 8),
    })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const workspaceName = (invite?.workspace as any)?.name ?? 'a workspace'
  const redirectParam = `/invite/${token}`

  return (
    <div className="min-h-screen bg-[#FCFCFB] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <img src="/signalroom-logo.svg" alt="SignalRoom Logo" width="94" height="55" className="h-14 w-auto object-contain" />
          </Link>
        </div>

        <div className="bg-white border border-[#E3E5E3] rounded-[12px] p-8">
          {!invite || invite.status !== 'pending' ? (
            <>
              <h1 className="text-xl tracking-tight text-[#121314] mb-1 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                This invite is no longer valid
              </h1>
              <p className="text-sm text-neutral-500 mb-6">
                It may have already been accepted, revoked, or the link is incorrect. Ask the workspace owner to send a new invite.
              </p>
              <Link href="/login" className="text-sm text-[#1A3024] font-medium hover:text-[#5A7973] transition-colors">
                Go to login →
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl tracking-tight text-[#121314] mb-1 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Join {workspaceName}
              </h1>
              <p className="text-sm text-neutral-500 mb-6">
                You&rsquo;ve been invited to collaborate on <span className="font-medium text-[#121314]">{workspaceName}</span> on SignalRoom.
              </p>

              {!user ? (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600">
                    Sign in or create an account with <span className="font-medium text-[#121314]">{invite.invited_email}</span> to accept.
                  </p>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(redirectParam)}`}
                    className="block w-full text-center bg-[#1A3024] text-white text-[11px] font-medium uppercase tracking-[0.2em] py-3 rounded-[4px] hover:bg-[#5A7973] transition-all duration-300"
                  >
                    Log in
                  </Link>
                  <Link
                    href={`/signup?redirect=${encodeURIComponent(redirectParam)}`}
                    className="block w-full text-center border border-[#E3E5E3] text-[#121314] text-[11px] font-medium uppercase tracking-[0.2em] py-3 rounded-[4px] hover:bg-neutral-50 transition-all duration-300"
                  >
                    Create account
                  </Link>
                </div>
              ) : user.email?.toLowerCase() !== invite.invited_email.toLowerCase() ? (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600">
                    You&rsquo;re signed in as <span className="font-medium text-[#121314]">{user.email}</span>, but this invite was sent to <span className="font-medium text-[#121314]">{invite.invited_email}</span>.
                  </p>
                  <SignOutAndRetryLink token={token} />
                </div>
              ) : (
                <AcceptInviteButton token={token} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
