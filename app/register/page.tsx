'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

const WHATSAPP = 'https://wa.me/9647754822210'

export default function RegisterPage() {
  const [form, setForm] = useState({ displayName: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.displayName.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim()) {
      setError('All fields are required.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading…</div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-start justify-center p-4 pt-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted!</h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Your account is pending admin activation. We&apos;ll contact you on WhatsApp when it&apos;s ready — usually within a few hours.
            </p>
            <a
              href={`${WHATSAPP}?text=${encodeURIComponent(`Hi! I just registered for StudyAI.\nName: ${form.displayName}\nEmail: ${form.email}\nPhone: ${form.phone}\nPlease activate my account. Thank you!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition mb-4"
            >
              <span className="text-lg">📱</span> Message Admin on WhatsApp
            </a>
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-start justify-center p-4 pt-12">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-5">
            <span className="text-3xl">🎓</span>
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">StudyAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-500 mt-1 text-sm">Free to register — admin activates your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ahmed Al-Rashidi"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number (WhatsApp)</label>
              <input
                type="tel"
                placeholder="e.g. +964 770 123 4567"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition"
            >
              {loading ? 'Creating account…' : 'Register Free'}
            </button>
          </form>

          <div className="pt-4 mt-2 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4 text-sm text-gray-400">
          <Link href="/upload" className="hover:text-blue-600 transition">Try Free Upload</Link>
          <span>·</span>
          <Link href="/pricing" className="hover:text-blue-600 transition">Pricing</Link>
          <span>·</span>
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
        </div>
      </div>
    </main>
  )
}
