import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const TIER_LIMITS: Record<string, { daily: number; monthly: number }> = {
  free:          { daily: 2,   monthly: 6  },
  single_unlock: { daily: 999, monthly: 1  },
  pro_monthly:   { daily: 999, monthly: 60 },
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user?.email) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('student_profiles')
    .select('display_name, phone, status')
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

  // Fetch all submissions (used for stats)
  const { data: submissions } = await supabaseAdmin
    .from('submissions')
    .select('id, topic_title, detected_language, status, tier_used, created_at')
    .or(`user_email.eq.${user.email},user_phone.eq.${profile.phone}`)
    .order('created_at', { ascending: false })
    .limit(200)

  const allSubmissions = submissions ?? []

  // Top 5 studied topics
  const topicCounts = new Map<string, number>()
  for (const sub of allSubmissions) {
    if (sub.topic_title && sub.status === 'complete') {
      topicCounts.set(sub.topic_title, (topicCounts.get(sub.topic_title) ?? 0) + 1)
    }
  }
  const top_topics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }))

  // Study streak — consecutive calendar days with at least one upload, ending today
  const uploadDates = new Set(allSubmissions.map(s => s.created_at.slice(0, 10)))
  let streak = 0
  const todayUTC = new Date().toISOString().slice(0, 10)
  for (let i = 0; i < 365; i++) {
    const d = new Date(todayUTC)
    d.setUTCDate(d.getUTCDate() - i)
    if (uploadDates.has(d.toISOString().slice(0, 10))) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  // Tier limits
  const tier = usage?.tier ?? 'free'
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free

  return NextResponse.json({
    profile: {
      display_name: profile.display_name,
      phone: profile.phone,
      email: user.email,
      status: (profile as Record<string, unknown>).status as string ?? 'active',
    },
    usage: usage
      ? { ...usage, daily_limit: limits.daily, monthly_limit: limits.monthly }
      : { tier: 'free', uploads_today: 0, uploads_this_month: 0, pro_expires_at: null, daily_limit: 2, monthly_limit: 6 },
    submissions: allSubmissions.slice(0, 100),
    top_topics,
    streak,
  })
}
