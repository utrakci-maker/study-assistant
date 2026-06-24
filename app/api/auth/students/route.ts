import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  return !!ADMIN_PASSWORD && token === ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { data: profiles } = await supabaseAdmin
    .from('student_profiles')
    .select('id, display_name, phone, created_at')
    .order('created_at', { ascending: false })

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ students: [] })
  }

  // Get auth emails for all student IDs
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const userMap = new Map(users.map(u => [u.id, u.email ?? '']))

  // Get usage/tier info for all students
  const phones = profiles.map(p => p.phone).filter(Boolean)
  const emails = profiles.map(p => userMap.get(p.id) ?? '').filter(Boolean)

  const orParts = [
    ...phones.map(ph => `user_phone.eq.${ph}`),
    ...emails.map(em => `user_email.eq.${em}`),
  ]

  const { data: usages } = orParts.length > 0
    ? await supabaseAdmin
        .from('usage_tracking')
        .select('user_phone, user_email, tier, uploads_this_month, pro_expires_at')
        .or(orParts.join(','))
    : { data: [] }

  // Build a lookup: email → usage OR phone → usage
  const usageByEmail = new Map((usages ?? []).filter(u => u.user_email).map(u => [u.user_email, u]))
  const usageByPhone = new Map((usages ?? []).filter(u => u.user_phone).map(u => [u.user_phone, u]))

  const students = profiles.map(p => {
    const email = userMap.get(p.id) ?? ''
    const usage = usageByEmail.get(email) ?? usageByPhone.get(p.phone)
    return {
      id: p.id,
      display_name: p.display_name,
      phone: p.phone,
      email,
      tier: usage?.tier ?? 'free',
      uploads_this_month: usage?.uploads_this_month ?? 0,
      pro_expires_at: usage?.pro_expires_at ?? null,
      created_at: p.created_at,
    }
  })

  return NextResponse.json({ students })
}
