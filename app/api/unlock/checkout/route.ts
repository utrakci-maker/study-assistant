/**
 * app/api/unlock/checkout/route.ts
 *
 * Creates a Stripe Checkout session — a secure hosted payment page.
 * The student is sent to Stripe's website to enter their card details
 * (we never see the card number), then redirected back to us.
 *
 * POST /api/unlock/checkout
 * Body: { phone, email, type: 'single' | 'pro' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICES } from '@/lib/stripe'
import { validateEmail, normalizeEmail } from '@/lib/emailUtils'

export async function POST(request: NextRequest) {
  let body: { phone?: string; email?: string; type?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  }

  const { phone, email, type } = body

  if (!phone || !email || !type) {
    return NextResponse.json({ message: 'phone, email, and type are required.' }, { status: 400 })
  }
  if (!['single', 'pro'].includes(type)) {
    return NextResponse.json({ message: 'type must be "single" or "pro".' }, { status: 400 })
  }

  const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '')
  if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
    return NextResponse.json({ message: 'Invalid phone number.' }, { status: 400 })
  }
  const emailErr = validateEmail(email)
  if (emailErr) return NextResponse.json({ message: emailErr }, { status: 400 })
  const normalizedEmail = normalizeEmail(email)

  const origin = request.headers.get('origin') || 'https://study-assistant-ashy.vercel.app'
  const isSingle = type === 'single'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: isSingle ? 'payment' : 'subscription',
      line_items: [{
        price_data: isSingle
          ? {
              currency: 'usd',
              product_data: {
                name: 'Single Upload Unlock',
                description: '1 additional AI study plan — no expiry',
              },
              unit_amount: PRICES.single,
            }
          : {
              currency: 'usd',
              product_data: {
                name: 'Pro Monthly Plan',
                description: '60 uploads/month — unlimited daily',
              },
              unit_amount: PRICES.pro,
              recurring: { interval: 'month' },
            },
        quantity: 1,
      }],
      metadata: {
        phone: normalizedPhone,
        email: normalizedEmail,
        type,
      },
      success_url: `${origin}/unlock/success?session_id={CHECKOUT_SESSION_ID}&type=${type}`,
      cancel_url: `${origin}/unlock?cancelled=true`,
      customer_email: normalizedEmail,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error'
    console.error('Stripe checkout error:', msg)
    return NextResponse.json({ message: 'Payment setup failed. Please try again.' }, { status: 500 })
  }
}
