'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      supabaseBrowser.auth
        .exchangeCodeForSession(code)
        .then(() => router.replace('/dashboard'))
        .catch(() => router.replace('/login'))
    } else {
      supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
        router.replace(session ? '/dashboard' : '/login')
      })
    }
  }, [router])

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-5xl animate-spin">⏳</div>
        <p className="text-gray-500 text-sm">Signing you in…</p>
      </div>
    </main>
  )
}
