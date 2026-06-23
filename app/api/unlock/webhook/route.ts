/**
 * app/api/unlock/webhook/route.ts
 *
 * WHY THIS FILE EXISTS:
 * After a student pays on Stripe, Stripe calls THIS URL to tell us
 * "payment succeeded". We then upgrade the student's account automatically.
 *
 * This is called a "webhook" — it's like Stripe knocking on our server's
 * door to deliver news. We verify the knock is really from Stripe
 * (using the webhook secret), then upgrade the student's tier.
 *
 * POST /api/unlock/webhook  (called by Stripe, not by students)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

// Tell Next.js not to parse the body — we need the raw bytes to verify Stripe's signature
export const config = { api: { bodyParser: false } }

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Missing signature.' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ message: 'Invalid signature.' }, { status: 400 })
  }

  // Handle payment completed events
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'invoice.payment_succeeded'
  ) {
    const session = event.data.object as any
    const phone: string = session.metadata?.phone || ''
    const type: string  = session.metadata?.type  || ''

    if (!phone || !type) {
      return NextResponse.json({ received: true }) // Ignore events without our metadata
    }

    if (type === 'single') {
      // Single unlock: bump daily limit by 1 for today
      const { data: usage } = await supabaseAdmin
        .from('usage_tracking')
        .select('uploads_today')
        .eq('user_phone', phone)
        .single()

      if (usage) {
        await supabaseAdmin
          .from('usage_tracking')
          .update({ uploads_today: Math.max(0, usage.uploads_today - 1) })
          .eq('user_phone', phone)
      }
    }

    if (type === 'pro') {
      // Pro monthly: set tier and expiry date (30 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await supabaseAdmin
        .from('usage_tracking')
        .update({
          tier: 'pro_monthly',
          pro_expires_at: expiresAt.toISOString(),
        })
        .eq('user_phone', phone)
    }
  }

  return NextResponse.json({ received: true })
}
