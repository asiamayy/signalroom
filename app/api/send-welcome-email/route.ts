import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
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
