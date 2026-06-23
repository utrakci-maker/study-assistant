'use client'

/**
 * app/history/page.tsx — History Page (route: /history)
 *
 * Students enter their phone + email to see all their past uploads.
 * Requires both identifiers so one student can't view another's history.
 */

import { useState } from 'react'
import Link from 'next/link'
import { validateEmail } from '@/lib/emailUtils'

interface Submission {
  id: string
  topic_title: string
  detected_language: string
  status: string
  created_at: string
  tier_used: string
}

interface UsageStats {
  tier: string
  uploadsToday: number
  uploadsThisMonth: number
}

const LANG_LABELS: Record<string, string> = {
  ar: 'Arabic / عربي',
  ku: 'Kurdish / كوردی',
  en: 'English',
}

const STATUS_STYLES: Record<string, string> = {
  processed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  failed:    'bg-red-100 text-red-700',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function HistoryPage() {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submissions, setSubmissions] = useState<Submission[] | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)

  const validatePhone = (v: string) => {
    const n = v.replace(/[\s\-\(\)\.]/g, '')
    if (!n) return ''
    return /^\+?[0-9]{7,15}$/.test(n) ? '' : 'Invalid phone — digits only, 7–15 digits'
  }

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || !email.trim()) { setError('Both fields are required.'); return }
    const pErr = validatePhone(phone); if (pErr) { setPhoneError(pErr); return }
    const eErr = validateEmail(email);  if (eErr) { setEmailError(eErr); return }

    setLoading(true)
    setError('')
    setSubmissions(null)

    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), email: email.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Something went wrong.')
        return
      }

      setSubmissions(data.submissions)
      setUsage(data.usage)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const DAILY_LIMIT = usage?.tier === 'pro_monthly' ? 999 : 2
  const remaining = Math.max(0, DAILY_LIMIT - (usage?.uploadsToday ?? 0))

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <h1 className="text-2xl font-bold text-gray-900">Your Study History</h1>
          <p className="text-gray-500 text-sm mt-1">سجل دراستك</p>
        </div>

        {/* Lookup form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number / رقم الهاتف
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setPhoneError(validatePhone(e.target.value)) }}
                placeholder="+964 750 XXX XXXX"
                disabled={loading}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 ${phoneError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'}`}
              />
              {phoneError && <p className="text-xs text-red-500 mt-1">⚠️ {phoneError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address / البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(validateEmail(e.target.value)) }}
                placeholder="you@gmail.com"
                disabled={loading}
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 ${emailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'}`}
              />
              {emailError && <p className="text-xs text-red-500 mt-1">⚠️ {emailError}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phone.trim() || !!phoneError || !email.trim() || !!emailError}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading…
                </span>
              ) : 'View My History / عرض سجلي'}
            </button>
          </form>
        </div>

        {/* Results */}
        {submissions !== null && (
          <>
            {/* Usage stats */}
            {usage && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 capitalize">
                    {usage.tier === 'pro_monthly' ? '⭐ Pro Plan' : usage.tier === 'single_unlock' ? '🔓 Single Unlock' : '🆓 Free Plan'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{usage.uploadsThisMonth} uploads this month</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{remaining === 999 ? '∞' : remaining} left today</p>
                  <Link href="/upload" className="text-xs text-blue-600 hover:underline">Upload now →</Link>
                </div>
              </div>
            )}

            {/* Submissions list */}
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-500 font-medium">No uploads yet</p>
                <p className="text-gray-400 text-sm mt-1">لا توجد رفعات بعد</p>
                <Link href="/upload" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
                  Upload Your First Subject
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 px-1">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
                {submissions.map(s => (
                  <Link
                    key={s.id}
                    href={s.status === 'processed' ? `/results/${s.id}` : '#'}
                    className={`block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all ${s.status !== 'processed' ? 'opacity-60 cursor-default' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {s.topic_title || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(s.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] || 'bg-gray-100 text-gray-500'}`}>
                          {s.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {LANG_LABELS[s.detected_language] || s.detected_language}
                        </span>
                      </div>
                    </div>
                    {s.status === 'processed' && (
                      <p className="text-xs text-blue-600 mt-2">View study plan & quiz →</p>
                    )}
                    {s.status === 'failed' && (
                      <p className="text-xs text-red-500 mt-2">Processing failed — try uploading again</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-center gap-4 text-sm text-gray-500 pt-2 pb-8">
          <Link href="/upload" className="hover:text-blue-600 hover:underline">Upload</Link>
          <span>·</span>
          <Link href="/pricing" className="hover:text-blue-600 hover:underline">Pricing</Link>
        </div>

      </div>
    </main>
  )
}
