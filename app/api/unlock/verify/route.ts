/**
 * app/api/unlock/verify/route.ts
 *
 * WHY THIS FILE EXISTS:
 * Some students in Iraq pay via bank transfer, ZainCash, or WhatsApp.
 * You (the admin) generate an unlock code and send it to them manually.
 * This route verifies that code and upgrades their account.
 *
 * POST /api/unlock/verify
 * Body: { phone, email, code }
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateEmail, normalizeEmail } from '@/lib/emailUtils'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

// Codes can be as short as 4 alphanumeric characters — without this, an
// attacker could script through the ~1.6M possible combos and steal a real
// customer's paid unlock code (or grant themselves free Pro access).
const VERIFY_RATE_LIMIT = 10
const VERIFY_RATE_WINDOW_SECONDS = 15 * 60

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const { allowed, retryAfter } = await rateLimit(`unlock-verify:${clientIp}`, VERIFY_RATE_LIMIT, VERIFY_RATE_WINDOW_SECONDS)
  if (!allowed) {
    return NextResponse.json(
      { message: 'Too many attempts. Please wait a while and try again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  let body: { phone?: string; email?: string; code?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  }

  const { phone, email, code } = body

  if (!phone || !email || !code) {
    return NextResponse.json({ message: 'Phone, email, and code are required.' }, { status: 400 })
  }

  const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '')
  if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
    return NextResponse.json({ message: 'Invalid phone number.' }, { status: 400 })
  }
  const emailErr = validateEmail(email)
  if (emailErr) return NextResponse.json({ message: emailErr }, { status: 400 })
  const normalizedEmail = normalizeEmail(email)
  const normalizedCode = code.trim().toUpperCase()

  // Find the code in the database
  const { data: unlockCode, error } = await supabaseAdmin
    .from('unlock_codes')
    .select('*')
    .eq('code', normalizedCode)
    .single()

  if (error || !unlockCode) {
    return NextResponse.json({ message: 'Invalid unlock code. Please check and try again.' }, { status: 400 })
  }

  // Check if already used
  if (unlockCode.used_at) {
    return NextResponse.json({ message: 'This code has already been used.' }, { status: 400 })
  }

  // Check if expired
  if (unlockCode.expires_at && new Date(unlockCode.expires_at) < new Date()) {
    return NextResponse.json({ message: 'This code has expired.' }, { status: 400 })
  }

  // Mark code as used
  await supabaseAdmin
    .from('unlock_codes')
    .update({
      used_by_phone: normalizedPhone,
      used_by_email: normalizedEmail,
      used_at: new Date().toISOString(),
    })
    .eq('code', normalizedCode)

  // Apply the unlock to their account
  if (unlockCode.type === 'single') {
    // Reduce their upload count by 1 (effectively gives them one more free upload)
    const { data: usage } = await supabaseAdmin
      .from('usage_tracking')
      .select('uploads_today')
      .eq('user_phone', normalizedPhone)
      .single()

    if (usage && usage.uploads_today > 0) {
      await supabaseAdmin
        .from('usage_tracking')
        .update({ uploads_today: usage.uploads_today - 1 })
        .eq('user_phone', normalizedPhone)
    } else if (!usage) {
      // First time user — create record
      const today = new Date().toISOString().split('T')[0]
      await supabaseAdmin.from('usage_tracking').insert({
        user_phone: normalizedPhone,
        user_email: normalizedEmail,
        tier: 'free',
        uploads_today: 0,
        uploads_this_month: 0,
        last_reset_date: today,
        monthly_reset_date: today,
      })
    }

    return NextResponse.json({ success: true, type: 'single', message: 'Unlock applied! You have 1 extra upload available.' })
  }

  if (unlockCode.type === 'pro_30day') {
    // Upgrade to Pro for 30 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data: existing } = await supabaseAdmin
      .from('usage_tracking')
      .select('id')
      .eq('user_phone', normalizedPhone)
      .single()

    if (existing) {
      await supabaseAdmin
        .from('usage_tracking')
        .update({ tier: 'pro_monthly', pro_expires_at: expiresAt.toISOString() })
        .eq('user_phone', normalizedPhone)
    } else {
      const today = new Date().toISOString().split('T')[0]
      await supabaseAdmin.from('usage_tracking').insert({
        user_phone: normalizedPhone,
        user_email: normalizedEmail,
        tier: 'pro_monthly',
        pro_expires_at: expiresAt.toISOString(),
        uploads_today: 0,
        uploads_this_month: 0,
        last_reset_date: today,
        monthly_reset_date: today,
      })
    }

    return NextResponse.json({
      success: true,
      type: 'pro_30day',
      message: 'Pro plan activated for 30 days! Enjoy 60 uploads/month.',
      expiresAt: expiresAt.toISOString(),
    })
  }

  return NextResponse.json({ message: 'Unknown code type.' }, { status: 400 })
}
