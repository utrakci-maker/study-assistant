/**
 * app/unlock/page.tsx — Unlock Page (route: /unlock)
 * Full design coming Day 5.
 * Students who hit their daily free limit come here to pay $0.99
 * for one extra upload, or upgrade to Pro.
 */
export default function UnlockPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-lg">
        <div className="text-6xl mb-4">🔓</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Unlock More Uploads</h1>
        <p className="text-xl text-orange-500 font-medium mb-2">Coming Day 5</p>
        <p className="text-gray-500 mb-4">
          When students reach their daily limit of 2 free uploads, they land here
          to purchase a single unlock ($0.99) or upgrade to Pro ($4.99/month).
        </p>
        <div className="mt-6 p-4 bg-orange-50 rounded-lg text-sm text-orange-700">
          Day 5 will add: payment integration (Stripe/local payment), unlock code generation,
          and automatic tier upgrade.
        </div>
      </div>
    </main>
  )
}
