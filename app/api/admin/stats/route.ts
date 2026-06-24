/**
 * app/api/admin/stats/route.ts
 * GET /api/admin/stats?password=xxx
 * Returns dashboard stats — only works with the correct admin password.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('password') !== ADMIN_PASSWORD) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalSubmissions },
    { count: todaySubmissions },
    { count: totalUsers },
    { count: freeUsers },
    { count: proUsers },
    { data: cacheRows },
    { data: recentSubmissions },
    { count: codesTotal },
    { count: codesUsed },
  ] = await Promise.all([
    supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabaseAdmin.from('usage_tracking').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('usage_tracking').select('*', { count: 'exact', head: true }).eq('tier', 'free'),
    supabaseAdmin.from('usage_tracking').select('*', { count: 'exact', head: true }).eq('tier', 'pro_monthly'),
    supabaseAdmin.from('content_cache').select('hit_count'),
    supabaseAdmin.from('submissions').select('id, user_phone, user_email, topic_title, status, tier_used, cost_usd, created_at').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('unlock_codes').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('unlock_codes').select('*', { count: 'exact', head: true }).not('used_at', 'is', null),
  ])

  const totalCacheHits = (cacheRows || []).reduce((sum, r) => sum + (r.hit_count || 0), 0)
  const cachedItems = (cacheRows || []).length

  return NextResponse.json({
    totalSubmissions: totalSubmissions || 0,
    todaySubmissions: todaySubmissions || 0,
    totalUsers: totalUsers || 0,
    freeUsers: freeUsers || 0,
    proUsers: proUsers || 0,
    totalCacheHits,
    cachedItems,
    recentSubmissions: recentSubmissions || [],
    codesTotal: codesTotal || 0,
    codesUsed: codesUsed || 0,
  })
}
