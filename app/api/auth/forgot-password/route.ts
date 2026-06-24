import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendPasswordResetEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://study-assistant-ashy.vercel.app'

export async function POST(request: NextRequest) {
  let body: { email: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
  }

  // Always return success — never reveal whether an email is registered
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${SITE_URL}/auth/callback` },
  })

  if (!error && data?.properties?.action_link) {
    await sendPasswordResetEmail(email, data.properties.action_link)
  }

  return NextResponse.json({ success: true })
}
