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

  // Get all auth users and all student profiles in parallel
  const [{ data: { users } }, { data: profiles }] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin.from('student_profiles').select('id, display_name, phone, created_at'),
  ])

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  // Pending: auth users who signed in with Google but have no profile yet
  const pending = users
    .filter(u => !profileMap.has(u.id) && u.email && u.app_metadata?.provider === 'google')
    .map(u => ({
      id: u.id,
      email: u.email ?? '',
      name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? '',
      avatar_url: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? '',
      signed_up_at: u.created_at,
    }))
    .sort((a, b) => new Date(b.signed_up_at).getTime() - new Date(a.signed_up_at).getTime())

  // Activated: auth users who have a profile
  const activatedUsers = users.filter(u => profileMap.has(u.id))
  const userEmailMap = new Map(activatedUsers.map(u => [u.id, u.email ?? '']))

  // Fetch usage/tier for all activated students
  const phones = (profiles ?? []).map(p => p.phone).filter(Boolean)
  const emails = activatedUsers.map(u => u.email ?? '').filter(Boolean)
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

  const usageByEmail = new Map((usages ?? []).filter(u => u.user_email).map(u => [u.user_email, u]))
  const usageByPhone = new Map((usages ?? []).filter(u => u.user_phone).map(u => [u.user_phone, u]))

  const students = (profiles ?? [])
    .map(p => {
      const email = userEmailMap.get(p.id) ?? ''
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
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ pending, students })
}
