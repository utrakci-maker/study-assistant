import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  return !!ADMIN_PASSWORD && token === ADMIN_PASSWORD
}

const ACTIVITY_DAYS = 30

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') ?? ''
  const phone = searchParams.get('phone') ?? ''
  if (!email && !phone) {
    return NextResponse.json({ message: 'email or phone required' }, { status: 400 })
  }

  const orParts = [
    ...(email ? [`user_email.eq.${email}`] : []),
    ...(phone ? [`user_phone.eq.${phone}`] : []),
  ]

  const { data: submissions } = await supabaseAdmin
    .from('submissions')
    .select('id, topic_title, detected_language, status, created_at')
    .or(orParts.join(','))
    .order('created_at', { ascending: false })
    .limit(1000)

  const allSubmissions = submissions ?? []

  // Totals
  const now = Date.now()
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000
  const totals = {
    total: allSubmissions.length,
    complete: allSubmissions.filter(s => s.status === 'complete').length,
    failed: allSubmissions.filter(s => s.status === 'failed').length,
    this_week: allSubmissions.filter(s => new Date(s.created_at).getTime() >= weekAgo).length,
    this_month: allSubmissions.filter(s => new Date(s.created_at).getTime() >= monthAgo).length,
  }

  // Daily activity, last 30 days, zero-filled
  const countsByDate = new Map<string, number>()
  for (const sub of allSubmissions) {
    const day = sub.created_at.slice(0, 10)
    countsByDate.set(day, (countsByDate.get(day) ?? 0) + 1)
  }
  const activity: { date: string; count: number }[] = []
  const todayUTC = new Date().toISOString().slice(0, 10)
  for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
    const d = new Date(todayUTC)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    activity.push({ date: key, count: countsByDate.get(key) ?? 0 })
  }

  // Top topics
  const topicCounts = new Map<string, number>()
  for (const sub of allSubmissions) {
    if (sub.topic_title && sub.status === 'complete') {
      topicCounts.set(sub.topic_title, (topicCounts.get(sub.topic_title) ?? 0) + 1)
    }
  }
  const top_topics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, count]) => ({ topic, count }))

  // Language mix
  const langCounts = new Map<string, number>()
  for (const sub of allSubmissions) {
    if (sub.detected_language) {
      langCounts.set(sub.detected_language, (langCounts.get(sub.detected_language) ?? 0) + 1)
    }
  }
  const language_mix = Array.from(langCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({ lang, count }))

  // Streak — consecutive calendar days with at least one upload, ending today
  const uploadDates = new Set(allSubmissions.map(s => s.created_at.slice(0, 10)))
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(todayUTC)
    d.setUTCDate(d.getUTCDate() - i)
    if (uploadDates.has(d.toISOString().slice(0, 10))) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  const last_upload_at = allSubmissions[0]?.created_at ?? null

  return NextResponse.json({ totals, activity, top_topics, language_mix, streak, last_upload_at })
}
