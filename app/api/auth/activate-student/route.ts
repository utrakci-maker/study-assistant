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

  let body: { userId: string; displayName: string; phone: string; tier?: string; proExpiry?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const { userId, displayName, phone, tier = 'free', proExpiry } = body

  if (!userId?.trim() || !displayName?.trim() || !phone?.trim()) {
    return NextResponse.json({ message: 'userId, displayName, and phone are required' }, { status: 400 })
  }

  // Check the auth user exists and get their email
  const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (userError || !user) {
    return NextResponse.json({ message: 'Student auth account not found' }, { status: 404 })
  }

  // Check profile doesn't already exist
  const { data: existingProfile } = await supabaseAdmin
    .from('student_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile) {
    return NextResponse.json({ message: 'Student is already activated' }, { status: 409 })
  }

  // Create student profile
  const { error: profileError } = await supabaseAdmin.from('student_profiles').insert({
    id: userId,
    display_name: displayName.trim(),
    phone: phone.trim(),
  })

  if (profileError) {
    return NextResponse.json({ message: 'Failed to create profile: ' + profileError.message }, { status: 500 })
  }

  // Create/update usage_tracking with tier
  const cleanEmail = user.email ?? ''
  const cleanPhone = phone.trim()
  const today = new Date().toISOString().split('T')[0]

  const { data: existingUsage } = await supabaseAdmin
    .from('usage_tracking')
    .select('id')
    .or(`user_email.eq.${cleanEmail},user_phone.eq.${cleanPhone}`)
    .limit(1)
    .maybeSingle()

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

  return NextResponse.json({ success: true, userId, email: cleanEmail, tier })
}
