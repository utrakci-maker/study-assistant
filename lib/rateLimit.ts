/**
 * lib/rateLimit.ts
 *
 * WHY THIS FILE EXISTS:
 * Tier limits in lib/tiers.ts key off a self-reported phone+email, which
 * costs nothing to fake — anyone can submit a new pair on every request and
 * get a fresh "free" allowance. This is a backstop keyed on IP address
 * instead, so scripted abuse from one source gets throttled regardless of
 * what phone/email it claims to be.
 *
 * Requires the `rate_limits` table + `rl_hit` function — see the SQL
 * checked in alongside this file's introducing commit. The rl_hit() function
 * does the increment-or-reset atomically in one statement (INSERT ... ON
 * CONFLICT), so concurrent requests for the same key can't race past the limit.
 */

import { supabaseAdmin } from './supabase'

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export interface RateLimitResult {
  allowed: boolean
  retryAfter: number // seconds
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc('rl_hit', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  })

  if (error || !data || !data[0]) {
    // Fail open — a rate-limit outage shouldn't take real students down with it.
    console.error('Rate limit check failed:', error)
    return { allowed: true, retryAfter: 0 }
  }

  const row = data[0] as { allowed: boolean; count: number; retry_after: number }
  return { allowed: row.allowed, retryAfter: row.retry_after }
}
