import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  return !!ADMIN_PASSWORD && token === ADMIN_PASSWORD
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    email: string
    phone: string
    displayName: string
    password: string
    tier?: string
    proExpiry?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const { email, phone, displayName, password, tier = 'free', proExpiry } = body

  if (!email?.trim() || !phone?.trim() || !displayName?.trim() || !password?.trim()) {
    return NextResponse.json(
      { message: 'email, phone, displayName, and password are all required' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanPhone = phone.trim()
  const cleanName  = displayName.trim()

  // Create Supabase Auth user (email_confirm: true skips email verification)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
  })

  if (authError) {
    const msg = authError.message.includes('already')
      ? 'A student with this email already exists.'
      : authError.message
    return NextResponse.json({ message: msg }, { status: 400 })
  }

  const userId = authData.user.id

  // Create student profile
  const { error: profileError } = await supabaseAdmin.from('student_profiles').insert({
    id: userId,
    display_name: cleanName,
    phone: cleanPhone,
  })

  if (profileError) {
    // Rollback: remove the auth user so we don't leave orphaned accounts
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { message: 'Failed to save student profile: ' + profileError.message },
      { status: 500 }
    )
  }

  // Upsert usage_tracking with the chosen tier
  const { data: existingUsage } = await supabaseAdmin
    .from('usage_tracking')
    .select('id')
    .or(`user_email.eq.${cleanEmail},user_phone.eq.${cleanPhone}`)
    .limit(1)
    .maybeSingle()

  const today = new Date().toISOString().split('T')[0]

  if (existingUsage) {
    await supabaseAdmin.from('usage_tracking').update({
      tier,
      user_email: cleanEmail,
      user_phone: cleanPhone,
      ...(proExpiry ? { pro_expires_at: proExpiry } : {}),
    }).eq('id', existingUsage.id)
  } else {
    await supabaseAdmin.from('usage_tracking').insert({
      user_phone: cleanPhone,
      user_email: cleanEmail,
      tier,
      uploads_today: 0,
      uploads_this_month: 0,
      last_reset_date: today,
      monthly_reset_date: today,
      ...(proExpiry ? { pro_expires_at: proExpiry } : {}),
    })
  }

  return NextResponse.json({
    success: true,
    userId,
    email: cleanEmail,
    displayName: cleanName,
    phone: cleanPhone,
    tier,
  })
}
