import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

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

  const result = await sendEmail({ to: email, templateId: 1 })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
