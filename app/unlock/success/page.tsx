import Link from 'next/link'

export default function UnlockSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden text-center">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white">
          <div className="text-6xl mb-3">✅</div>
          <h1 className="text-2xl font-bold">Code Applied!</h1>
          <p className="text-green-100 mt-1 text-sm">Your account has been unlocked</p>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-gray-600 text-sm">
            You can now upload again. Your extra upload is ready to use.
          </p>
          <Link
            href="/upload"
            className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-md text-center"
          >
            Upload Now →
          </Link>
          <Link
            href="/history"
            className="block w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition text-center"
          >
            View My History
          </Link>
        </div>
      </div>
    </main>
  )
}
