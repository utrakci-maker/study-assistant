import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  return !!ADMIN_PASSWORD && token === ADMIN_PASSWORD
}

export async function PATCH(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    userId: string
    displayName?: string
    phone?: string
    tier?: string
    proExpiry?: string | null
    notes?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const { userId, displayName, phone, tier, proExpiry, notes } = body
  if (!userId?.trim()) {
    return NextResponse.json({ message: 'userId is required' }, { status: 400 })
  }

  // Update student_profiles
  const profileUpdate: Record<string, string | null> = {}
  if (displayName !== undefined) profileUpdate.display_name = displayName.trim()
  if (phone !== undefined) profileUpdate.phone = phone.trim()
  if (notes !== undefined) profileUpdate.notes = notes.trim() || null

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await supabaseAdmin
      .from('student_profiles')
      .update(profileUpdate)
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json({ message: 'Failed to update profile: ' + profileError.message }, { status: 500 })
    }
  }

  // Update usage_tracking tier/expiry if provided
  if (tier !== undefined || proExpiry !== undefined) {
    const usageUpdate: Record<string, string | null> = {}
    if (tier !== undefined) usageUpdate.tier = tier
    if (proExpiry !== undefined) usageUpdate.pro_expires_at = proExpiry || null

    // Find the usage row by matching the student's phone or email
    const { data: profile } = await supabaseAdmin
      .from('student_profiles')
      .select('phone')
      .eq('id', userId)
      .single()

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = authUser?.user?.email ?? ''
    const studentPhone = (phone?.trim()) || profile?.phone || ''

    const orParts = [
      ...(email ? [`user_email.eq.${email}`] : []),
      ...(studentPhone ? [`user_phone.eq.${studentPhone}`] : []),
    ]

    if (orParts.length > 0) {
      const { data: usageRow } = await supabaseAdmin
        .from('usage_tracking')
        .select('id')
        .or(orParts.join(','))
        .limit(1)
        .maybeSingle()

      if (usageRow) {
        await supabaseAdmin.from('usage_tracking').update(usageUpdate).eq('id', usageRow.id)
      } else if (studentPhone || email) {
        const today = new Date().toISOString().split('T')[0]
        await supabaseAdmin.from('usage_tracking').insert({
          user_phone: studentPhone || null,
          user_email: email || null,
          tier: tier ?? 'free',
          uploads_today: 0,
          uploads_this_month: 0,
          last_reset_date: today,
          monthly_reset_date: today,
          ...(proExpiry ? { pro_expires_at: proExpiry } : {}),
        })
      }
    }
  }

  return NextResponse.json({ success: true })
}
