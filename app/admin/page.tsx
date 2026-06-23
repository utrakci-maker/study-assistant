/**
 * app/admin/page.tsx — Admin Dashboard (route: /admin)
 * Full design coming Day 7.
 * This is the secret page where YOU (the business owner) can see stats,
 * manage users, check costs, and monitor the system.
 */
export default function AdminPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center p-8 max-w-lg">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h1>
        <p className="text-xl text-yellow-400 font-medium mb-2">Coming Day 7</p>
        <p className="text-gray-400 mb-4">
          The admin dashboard will show real-time stats on uploads, costs,
          tier usage, cache hit rates, and allow you to manage students.
        </p>
        <div className="mt-6 p-4 bg-gray-800 rounded-lg text-sm text-gray-300">
          Day 7 will add: revenue dashboard, usage analytics, student management, and cost tracking.
        </div>
      </div>
    </main>
  )
}
