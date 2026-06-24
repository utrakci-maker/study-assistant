import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('student_profiles')
    .select('display_name, phone')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ message: 'Profile not found' }, { status: 404 })

  // Fetch usage by email first, fallback to phone
  const [{ data: usageByEmail }, { data: usageByPhone }] = await Promise.all([
    supabaseAdmin
      .from('usage_tracking')
      .select('tier, uploads_today, uploads_this_month, pro_expires_at')
      .eq('user_email', user.email)
      .maybeSingle(),
    supabaseAdmin
      .from('usage_tracking')
      .select('tier, uploads_today, uploads_this_month, pro_expires_at')
      .eq('user_phone', profile.phone)
      .maybeSingle(),
  ])
  const usage = usageByEmail ?? usageByPhone

  // Fetch submissions by email or phone, most recent first
  const { data: submissions } = await supabaseAdmin
    .from('submissions')
    .select('id, topic_title, detected_language, status, tier_used, created_at')
    .or(`user_email.eq.${user.email},user_phone.eq.${profile.phone}`)
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({
    profile: {
      display_name: profile.display_name,
      phone: profile.phone,
      email: user.email,
    },
    usage: usage ?? null,
    submissions: submissions ?? [],
  })
}
