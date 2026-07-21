import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only the signed-in user's own address can receive the welcome email —
  // this route must never act as a relay for arbitrary recipients.
  const email = user.email

  if (!email) {
    return NextResponse.json({ error: 'No email on account' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        to: [{ email }],
        templateId: 1,
        sender: { name: 'Asiah Sharpe', email: 'hello@getsignalroom.com' },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Brevo error:', err)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Welcome email error:', e)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
