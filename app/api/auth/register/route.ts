import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendRegistrationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  let body: { email: string; phone: string; displayName: string; password: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const { email, phone, displayName, password } = body

  if (!email?.trim() || !phone?.trim() || !displayName?.trim() || !password?.trim()) {
    return NextResponse.json(
      { message: 'Full name, email, phone number, and password are all required.' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanPhone = phone.trim()
  const cleanName = displayName.trim()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
  })

  if (authError) {
    const msg = authError.message.toLowerCase().includes('already')
      ? 'An account with this email already exists.'
      : authError.message
    return NextResponse.json({ message: msg }, { status: 400 })
  }

  const userId = authData.user.id

  const { error: profileError } = await supabaseAdmin.from('student_profiles').insert({
    id: userId,
    display_name: cleanName,
    phone: cleanPhone,
    status: 'pending',
  })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { message: 'Failed to save your profile. Please try again.' },
      { status: 500 }
    )
  }

  const today = new Date().toISOString().split('T')[0]
  await supabaseAdmin.from('usage_tracking').insert({
    user_phone: cleanPhone,
    user_email: cleanEmail,
    tier: 'free',
    uploads_today: 0,
    uploads_this_month: 0,
    last_reset_date: today,
    monthly_reset_date: today,
  })

  await sendRegistrationEmail(cleanEmail, cleanName)

  return NextResponse.json({ success: true })
}
