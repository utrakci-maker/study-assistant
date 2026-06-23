/**
 * lib/stripe.ts
 *
 * WHY THIS FILE EXISTS:
 * Stripe is the payment processor — it handles card payments securely
 * so we never touch credit card numbers ourselves (too risky + illegal without certification).
 *
 * This file creates ONE shared Stripe client used by all API routes.
 * The secret key stays on the server only — never sent to the browser.
 */

import Stripe from 'stripe'

// Use a placeholder so the build succeeds even before env vars are set in Vercel.
// The actual key is required at runtime — any call to stripe.* will fail gracefully
// with an auth error if the key is wrong, rather than crashing the whole app.
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_replace_in_vercel'

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-06-20',
})

// Prices in cents (USD)
export const PRICES = {
  single: 99,     // $0.99
  pro: 499,       // $4.99/month
}
