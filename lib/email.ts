// Shared Brevo sender — extracted so the welcome email and workspace-invite
// email (the two transactional emails this app sends) don't each duplicate
// the raw fetch call. Accepts either a pre-made Brevo template (templateId)
// or inline HTML, since the invite email doesn't have a template set up in
// the Brevo dashboard yet.
type SendEmailArgs =
  | { to: string; templateId: number; params?: Record<string, unknown> }
  | { to: string; subject: string; htmlContent: string }

export async function sendEmail(args: SendEmailArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = 'templateId' in args
    ? { to: [{ email: args.to }], templateId: args.templateId, params: args.params }
    : { to: [{ email: args.to }], subject: args.subject, htmlContent: args.htmlContent }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Asiah Sharpe', email: 'hello@getsignalroom.com' },
        ...payload,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[email] Brevo error:', err)
      return { ok: false, error: err?.message ?? 'Failed to send email' }
    }

    return { ok: true }
  } catch (e) {
    console.error('[email] send failed:', e)
    return { ok: false, error: 'Failed to send email' }
  }
}
