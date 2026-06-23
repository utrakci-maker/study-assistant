/**
 * app/page.tsx — Landing Page (route: /)
 * Full design coming Day 8.
 */
export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Study Assistant</h1>
        <p className="text-xl text-gray-600 mb-2">Landing page — coming Day 8</p>
        <p className="text-gray-400 text-sm">
          The full landing page with Arabic/Kurdish/English support will be built here.
        </p>
        <div className="mt-8 space-x-4">
          <a
            href="/upload"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
          >
            Try Upload (Day 2)
          </a>
          <a
            href="/pricing"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-100 inline-block"
          >
            Pricing (Day 8)
          </a>
        </div>
      </div>
    </main>
  )
}
