/**
 * app/unlock/success/page.tsx
 *
 * The page students see after a successful Stripe payment.
 * Stripe redirects them here with ?session_id=... and ?type=single|pro
 *
 * This is a simple confirmation — the actual account upgrade is done by
 * the webhook (app/api/unlock/webhook/route.ts) which Stripe calls separately.
 */

import Link from 'next/link'

interface Props {
  searchParams: { type?: string; session_id?: string }
}

export default function UnlockSuccessPage({ searchParams }: Props) {
  const type = searchParams.type || 'single'
  const isPro = type === 'pro'

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden text-center">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white">
          <div className="text-6xl mb-3">{isPro ? '👑' : '⚡'}</div>
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-green-100 mt-1 text-sm">
            Thank you for your purchase
          </p>
        </div>

        <div className="p-8 space-y-4">
          {isPro ? (
            <>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="font-semibold text-purple-800 text-lg">Pro Plan Activated! 🎉</p>
                <p className="text-purple-600 text-sm mt-1">
                  You now have <strong>60 uploads per month</strong> with no daily limit.
                  Your plan renews automatically each month.
                </p>
              </div>
              <ul className="text-left text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  60 AI study plans per month
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  No daily limit — study as much as you want
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Priority processing
                </li>
              </ul>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="font-semibold text-blue-800 text-lg">Extra Upload Ready! ⚡</p>
                <p className="text-blue-600 text-sm mt-1">
                  You have <strong>1 additional AI study plan</strong> available.
                  It never expires — use it whenever you need it.
                </p>
              </div>
            </>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <strong>Note:</strong> Your account upgrade may take up to 1 minute to activate.
            If you still see the limit after 2 minutes, please contact us on WhatsApp.
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/upload"
              className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-md text-center"
            >
              Start Uploading Now →
            </Link>
            <Link
              href="/history"
              className="block w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition text-center"
            >
              View My History
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-3 text-xs text-gray-400 text-center">
          A receipt has been sent to your email by Stripe.
        </div>
      </div>
    </main>
  )
}
