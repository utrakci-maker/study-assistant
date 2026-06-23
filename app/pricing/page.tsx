/**
 * app/pricing/page.tsx — Pricing Page (route: /pricing)
 * Full design coming Day 8.
 * Shows the 3 tiers: Free, Single Unlock ($0.99), Pro Monthly ($4.99)
 */
export default function PricingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-2xl">
        <div className="text-6xl mb-4">💳</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Pricing Plans</h1>
        <p className="text-xl text-purple-600 font-medium mb-6">Coming Day 8</p>

        <div className="grid grid-cols-3 gap-4 text-left">
          <div className="p-4 border rounded-lg bg-white">
            <h2 className="font-bold text-lg mb-2">Free</h2>
            <p className="text-2xl font-bold mb-2">$0</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ 2 uploads/day</li>
              <li>✓ 6 uploads/month</li>
              <li>✓ Full study plan</li>
            </ul>
          </div>
          <div className="p-4 border-2 border-blue-500 rounded-lg bg-white">
            <h2 className="font-bold text-lg mb-2">Single Unlock</h2>
            <p className="text-2xl font-bold mb-2">$0.99</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ 1 extra upload</li>
              <li>✓ No subscription</li>
              <li>✓ Pay when you need</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg bg-blue-600 text-white">
            <h2 className="font-bold text-lg mb-2">Pro Monthly</h2>
            <p className="text-2xl font-bold mb-2">$4.99/mo</p>
            <ul className="text-sm space-y-1">
              <li>✓ 60 uploads/month</li>
              <li>✓ Priority processing</li>
              <li>✓ All languages</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
