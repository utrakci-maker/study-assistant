'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  async function signInWithGoogle() {
    setLoading(true)
    await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    // Page will redirect — no need to setLoading(false)
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading…</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-start justify-center p-4 pt-16">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <span className="text-3xl">🎓</span>
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">StudyAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Student Login</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your personal dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

          {/* Google Sign In button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          <div className="pt-4 border-t border-gray-100 text-center space-y-1.5">
            <p className="text-xs text-gray-500 font-medium">First time here?</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Sign in with Google, then message us on{' '}
              <a
                href="https://wa.me/9647754822210"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 font-semibold hover:underline"
              >
                WhatsApp
              </a>{' '}
              to activate your account.
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4 text-sm text-gray-400">
          <Link href="/upload" className="hover:text-blue-600 transition">Upload</Link>
          <span>·</span>
          <Link href="/pricing" className="hover:text-blue-600 transition">Pricing</Link>
          <span>·</span>
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
        </div>
      </div>
    </main>
  )
}
