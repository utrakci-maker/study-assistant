/**
 * app/api/history/route.ts
 *
 * WHY THIS FILE EXISTS:
 * Students want to re-visit their old study plans.
 * This route lets them look up all their past uploads using their
 * phone + email combination. We require BOTH to prevent one student
 * from snooping on another student's history with just a phone number.
 *
 * POST /api/history
 * Body: { phone: string, email: string }
 * Returns: list of past submissions + current usage stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateEmail, normalizeEmail } from '@/lib/emailUtils'

export async function POST(request: NextRequest) {
  let body: { phone?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  }

  const phone = body.phone?.trim()
  const emailRaw = body.email?.trim()

  if (!phone || !emailRaw) {
    return NextResponse.json({ message: 'Phone and email are required.' }, { status: 400 })
  }

  const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '')
  if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
    return NextResponse.json({ message: 'Invalid phone number.' }, { status: 400 })
  }

  const emailErr = validateEmail(emailRaw)
  if (emailErr) {
    return NextResponse.json({ message: emailErr }, { status: 400 })
  }
  const normalizedEmail = normalizeEmail(emailRaw)

  // ── Security check ─────────────────────────────────────────────
  // Both phone AND email must exist together in usage_tracking.
  // This means someone can't look up history with just a phone number —
  // they need to know the email that was registered with it.
  const { data: usage } = await supabaseAdmin
    .from('usage_tracking')
    .select('tier, uploads_today, uploads_this_month, pro_expires_at')
    .eq('user_phone', normalizedPhone)
    .eq('user_email', normalizedEmail)
    .single()

  if (!usage) {
    return NextResponse.json({
      message: 'No account found with this phone and email combination. Make sure you use the same details you uploaded with.',
      submissions: [],
    }, { status: 404 })
  }

  // ── Fetch submissions ──────────────────────────────────────────
  const { data: submissions } = await supabaseAdmin
    .from('submissions')
    .select('id, topic_title, detected_language, status, created_at, tier_used')
    .eq('user_phone', normalizedPhone)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({
    submissions: submissions || [],
    usage: {
      tier: usage.tier,
      uploadsToday: usage.uploads_today,
      uploadsThisMonth: usage.uploads_this_month,
    },
  })
}
