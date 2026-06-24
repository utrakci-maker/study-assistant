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

  const [{ data: { users } }, { data: profiles }] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin.from('student_profiles').select('id, display_name, phone, notes, status, created_at'),
  ])

  const allProfileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  // Pending Google OAuth: auth user with no profile at all, signed in via Google
  const googlePending = users
    .filter(u => !allProfileMap.has(u.id) && u.email && u.app_metadata?.provider === 'google')
    .map(u => ({
      id: u.id,
      email: u.email ?? '',
      name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? '',
      avatar_url: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? '',
      signed_up_at: u.created_at,
    }))
    .sort((a, b) => new Date(b.signed_up_at).getTime() - new Date(a.signed_up_at).getTime())

  // Self-registered pending: profile exists with status='pending'
  const userEmailMap = new Map(users.map(u => [u.id, u.email ?? '']))
  const selfRegPending = (profiles ?? [])
    .filter(p => (p as Record<string, unknown>).status as string === 'pending')
    .map(p => ({
      id: p.id,
      display_name: p.display_name,
      phone: p.phone,
      email: userEmailMap.get(p.id) ?? '',
      created_at: p.created_at,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Activated: profile with status='active' (or null/undefined from before status column was added)
  const activatedProfiles = (profiles ?? []).filter(p => {
    const s = (p as Record<string, unknown>).status as string | null
    return s === 'active' || s == null
  })
  const activatedProfileMap = new Map(activatedProfiles.map(p => [p.id, p]))
  const activatedUsers = users.filter(u => activatedProfileMap.has(u.id))
  const activatedEmailMap = new Map(activatedUsers.map(u => [u.id, u.email ?? '']))

  // Fetch usage/tier for activated students
  const phones = activatedProfiles.map(p => p.phone).filter(Boolean)
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

  const students = activatedProfiles
    .map(p => {
      const email = activatedEmailMap.get(p.id) ?? ''
      const usage = usageByEmail.get(email) ?? usageByPhone.get(p.phone)
      return {
        id: p.id,
        display_name: p.display_name,
        phone: p.phone,
        email,
        notes: (p as Record<string, unknown>).notes as string | null ?? null,
        tier: usage?.tier ?? 'free',
        uploads_this_month: usage?.uploads_this_month ?? 0,
        pro_expires_at: usage?.pro_expires_at ?? null,
        created_at: p.created_at,
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ pending: googlePending, selfRegPending, students })
}
