/**
 * lib/tiers.ts
 *
 * WHY THIS FILE EXISTS:
 * This is the "bouncer" of your app. Before any student can upload an image
 * and use Claude AI, we check if they're allowed to.
 *
 * HOW THE TIER SYSTEM WORKS:
 * - FREE tier: 2 uploads per day, 6 per month, no payment needed
 * - SINGLE UNLOCK: pay for 1 extra upload when daily limit is hit
 * - PRO MONTHLY: unlimited uploads for 30 days (subscribers)
 *
 * HOW IT PREVENTS ABUSE:
 * We store each phone number's upload counts in the database.
 * Every time someone uploads, we check their count BEFORE calling Claude.
 * This means even if someone tries to spam uploads, they hit the wall here
 * and we never waste money on Claude API calls.
 */

import { supabaseAdmin as supabase } from './supabase'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface TierCheckResult {
  canUpload: boolean
  reason: string
  tier: string
  uploadsToday: number
  uploadsThisMonth: number
}

interface UsageRecord {
  id: string
  user_phone: string
  tier: string
  uploads_today: number
  uploads_this_month: number
  last_reset_date: string
  monthly_reset_date: string
  pro_expires_at: string | null
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// TIER LIMITS
// ─────────────────────────────────────────────────────────────

const LIMITS = {
  free: { daily: 2, monthly: 6 },
  single_unlock: { daily: 999, monthly: 1 },
  pro_monthly: { daily: 999, monthly: 60 },
}

// ─────────────────────────────────────────────────────────────
// MAIN FUNCTION: Check if a student can upload
// ─────────────────────────────────────────────────────────────

export async function checkTierLimits(userPhone: string, userEmail?: string): Promise<TierCheckResult> {
  // Step 1: Look up this phone number in the database
  const { data: usage, error } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_phone', userPhone)
    .single()

  // Step 2: If they've never uploaded before, create a record for them
  if (error || !usage) {
    const newRecord = await createUsageRecord(userPhone, userEmail)
    if (!newRecord) {
      return {
        canUpload: false,
        reason: 'Database error. Please try again.',
        tier: 'free',
        uploadsToday: 0,
        uploadsThisMonth: 0,
      }
    }
    // Brand new user — they definitely can upload
    return {
      canUpload: true,
      reason: 'New user — welcome!',
      tier: 'free',
      uploadsToday: 0,
      uploadsThisMonth: 0,
    }
  }

  // Step 3: Reset daily count if it's a new day
  const resetUsage = await resetDailyLimitIfNeeded(usage)

  // Step 4: Check if Pro subscription has expired
  let tier = resetUsage.tier
  if (tier === 'pro_monthly' && resetUsage.pro_expires_at) {
    const expiry = new Date(resetUsage.pro_expires_at)
    if (expiry < new Date()) {
      tier = 'free'
      await supabase
        .from('usage_tracking')
        .update({ tier: 'free' })
        .eq('user_phone', userPhone)
    }
  }

  // Step 5: Get limits for their tier
  const limits = LIMITS[tier as keyof typeof LIMITS] || LIMITS.free

  // Step 6: Check daily limit
  if (resetUsage.uploads_today >= limits.daily) {
    return {
      canUpload: false,
      reason: tier === 'free'
        ? `Daily limit reached (${limits.daily}/day on free plan). Unlock for $0.99 or upgrade to Pro.`
        : `Daily limit reached.`,
      tier,
      uploadsToday: resetUsage.uploads_today,
      uploadsThisMonth: resetUsage.uploads_this_month,
    }
  }

  // Step 7: Check monthly limit
  if (resetUsage.uploads_this_month >= limits.monthly) {
    return {
      canUpload: false,
      reason: tier === 'free'
        ? `Monthly limit reached (${limits.monthly}/month on free plan). Upgrade to Pro for 60/month.`
        : `Monthly limit reached.`,
      tier,
      uploadsToday: resetUsage.uploads_today,
      uploadsThisMonth: resetUsage.uploads_this_month,
    }
  }

  // Step 8: All good — they can upload
  return {
    canUpload: true,
    reason: 'OK',
    tier,
    uploadsToday: resetUsage.uploads_today,
    uploadsThisMonth: resetUsage.uploads_this_month,
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER: Increment upload counts after a successful upload
// ─────────────────────────────────────────────────────────────

export async function incrementUploadCount(userPhone: string): Promise<void> {
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('uploads_today, uploads_this_month')
    .eq('user_phone', userPhone)
    .single()

  if (!usage) return

  await supabase
    .from('usage_tracking')
    .update({
      uploads_today: (usage.uploads_today || 0) + 1,
      uploads_this_month: (usage.uploads_this_month || 0) + 1,
    })
    .eq('user_phone', userPhone)
}

// ─────────────────────────────────────────────────────────────
// HELPER: Reset daily count if midnight has passed
// ─────────────────────────────────────────────────────────────

export async function resetDailyLimitIfNeeded(usage: UsageRecord): Promise<UsageRecord> {
  const today = new Date().toISOString().split('T')[0] // "2024-01-15"
  const lastReset = usage.last_reset_date

  if (lastReset !== today) {
    // It's a new day — reset the daily counter
    const { data: updated } = await supabase
      .from('usage_tracking')
      .update({
        uploads_today: 0,
        last_reset_date: today,
      })
      .eq('user_phone', usage.user_phone)
      .select()
      .single()

    return updated || usage
  }

  return usage
}

// ─────────────────────────────────────────────────────────────
// HELPER: Create a new usage record for a first-time user
// ─────────────────────────────────────────────────────────────

async function createUsageRecord(userPhone: string, userEmail?: string): Promise<UsageRecord | null> {
  const today = new Date().toISOString().split('T')[0]

  // Try inserting with email first; if the email already belongs to another
  // phone's record (UNIQUE conflict), retry without the email.
  const insertPayload = {
    user_phone: userPhone,
    user_email: userEmail ?? null,
    tier: 'free',
    uploads_today: 0,
    uploads_this_month: 0,
    last_reset_date: today,
    monthly_reset_date: today,
  }

  let { data, error } = await supabase
    .from('usage_tracking')
    .insert(insertPayload)
    .select()
    .single()

  if (error && userEmail) {
    // Email already exists on another row — create record without it
    const { data: d2, error: e2 } = await supabase
      .from('usage_tracking')
      .insert({ ...insertPayload, user_email: null })
      .select()
      .single()
    data = d2
    error = e2
  }

  if (error) {
    console.error('Error creating usage record:', error)
    return null
  }

  return data
}

// ─────────────────────────────────────────────────────────────
// EMAIL LIMITS: Check upload limit by email address
// ─────────────────────────────────────────────────────────────

export async function checkEmailTierLimits(userEmail: string): Promise<TierCheckResult> {
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_email', userEmail)
    .single()

  if (!usage) {
    // This email hasn't been linked to any record yet — no limit hit
    return { canUpload: true, reason: 'New email', tier: 'free', uploadsToday: 0, uploadsThisMonth: 0 }
  }

  const resetUsage = await resetDailyLimitIfNeeded(usage)
  const tier = resetUsage.tier
  const limits = LIMITS[tier as keyof typeof LIMITS] || LIMITS.free

  if (resetUsage.uploads_today >= limits.daily) {
    return {
      canUpload: false,
      reason: `Daily limit reached for this email (${limits.daily}/day on free plan). Unlock for $0.99 or upgrade to Pro.`,
      tier,
      uploadsToday: resetUsage.uploads_today,
      uploadsThisMonth: resetUsage.uploads_this_month,
    }
  }

  if (resetUsage.uploads_this_month >= limits.monthly) {
    return {
      canUpload: false,
      reason: `Monthly limit reached for this email. Upgrade to Pro for 60/month.`,
      tier,
      uploadsToday: resetUsage.uploads_today,
      uploadsThisMonth: resetUsage.uploads_this_month,
    }
  }

  return { canUpload: true, reason: 'OK', tier, uploadsToday: resetUsage.uploads_today, uploadsThisMonth: resetUsage.uploads_this_month }
}

// ─────────────────────────────────────────────────────────────
// EMAIL LIMITS: Increment count on the record that owns this email
// ─────────────────────────────────────────────────────────────

export async function incrementEmailUploadCount(userEmail: string): Promise<void> {
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('uploads_today, uploads_this_month')
    .eq('user_email', userEmail)
    .single()

  if (!usage) return

  await supabase
    .from('usage_tracking')
    .update({
      uploads_today: (usage.uploads_today || 0) + 1,
      uploads_this_month: (usage.uploads_this_month || 0) + 1,
    })
    .eq('user_email', userEmail)
}
