import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendProExpiryReminderEmail } from '@/lib/email'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in1Day  = new Date(now); in1Day.setUTCDate(in1Day.getUTCDate() + 1)
  const in3Days = new Date(now); in3Days.setUTCDate(in3Days.getUTCDate() + 3)

  // Find pro_monthly accounts expiring within the next 1–3 days
  const { data: expiring } = await supabaseAdmin
    .from('usage_tracking')
    .select('user_email, pro_expires_at')
    .eq('tier', 'pro_monthly')
    .gte('pro_expires_at', in1Day.toISOString().slice(0, 10))
    .lte('pro_expires_at', in3Days.toISOString().slice(0, 10))

  if (!expiring || expiring.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Build email → display_name map from auth users + student_profiles
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const { data: profiles } = await supabaseAdmin
    .from('student_profiles')
    .select('id, display_name')

  const profileById = new Map((profiles ?? []).map(p => [p.id, p.display_name]))
  const nameByEmail: Record<string, string> = {}
  for (const u of users) {
    if (!u.email) continue
    nameByEmail[u.email] =
      profileById.get(u.id) ??
      u.user_metadata?.name ??
      u.user_metadata?.full_name ??
      u.email
  }

  let sent = 0
  for (const row of expiring) {
    if (!row.user_email || !row.pro_expires_at) continue
    const expiryDate = new Date(row.pro_expires_at)
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const formattedDate = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    const name = nameByEmail[row.user_email] || row.user_email

    await sendProExpiryReminderEmail(row.user_email, name, daysLeft, formattedDate)
    sent++
  }

  return NextResponse.json({ sent, checked: expiring.length })
}
