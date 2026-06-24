'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

const WHATSAPP = 'https://wa.me/9647754822210'

interface DashboardData {
  profile: { display_name: string; phone: string; email: string }
  usage: {
    tier: string
    uploads_today: number
    uploads_this_month: number
    pro_expires_at: string | null
    daily_limit: number
    monthly_limit: number
  } | null
  streak: number
  top_topics: { topic: string; count: number }[]
  submissions: unknown[]
}

const TIER_INFO: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  free:          { label: 'Free Plan',     icon: '🆓', color: 'text-gray-700',   bg: 'bg-gray-100'   },
  single_unlock: { label: 'Single Unlock', icon: '⚡', color: 'text-blue-700',   bg: 'bg-blue-100'   },
  pro_monthly:   { label: 'Pro Monthly',   icon: '👑', color: 'text-purple-700', bg: 'bg-purple-100' },
}

export default function AccountPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const meta = session.user.user_metadata ?? {}
      setAvatar(meta.avatar_url ?? meta.picture ?? '')

      const res = await fetch('/api/dashboard/data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.status === 401) { router.replace('/login'); return }
      if (res.status === 404) { router.replace('/dashboard'); return }
      if (!res.ok) { setError('Failed to load account info.'); setLoading(false); return }

      const json = await res.json()
      setData(json)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-4xl animate-pulse">⚙️</div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full">
          <p className="text-red-500 mb-4 text-sm">{error || 'Something went wrong.'}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">Back to Dashboard</Link>
        </div>
      </main>
    )
  }

  const tier = data.usage?.tier ?? 'free'
  const tierInfo = TIER_INFO[tier] ?? TIER_INFO.free
  const proExpiry = data.usage?.pro_expires_at
  const uploadsMonth = data.usage?.uploads_this_month ?? 0
  const monthlyLimit = data.usage?.monthly_limit ?? 6
  const monthlyPct = monthlyLimit >= 999 ? Math.min(100, Math.round((uploadsMonth / 60) * 100)) : Math.min(100, Math.round((uploadsMonth / monthlyLimit) * 100))

  const daysUntilExpiry = tier === 'pro_monthly' && proExpiry
    ? Math.ceil((new Date(proExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const now = new Date()
  const nextMonthReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const nextResetStr = nextMonthReset.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const upgradeMsg = encodeURIComponent(
    `Hi, I want to upgrade to Pro Monthly (25,000 IQD/month).\nEmail: ${data.profile.email}\nPlease help me upgrade. Thank you!`
  )
  const renewMsg = daysUntilExpiry !== null
    ? encodeURIComponent(
        `Hi, I need to renew my Pro subscription.\nEmail: ${data.profile.email}\nMy Pro expires in ${daysUntilExpiry} day(s). Please help me renew. Thank you!`
      )
    : encodeURIComponent(`Hi, I need to renew my Pro subscription.\nEmail: ${data.profile.email}`)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 transition text-sm flex items-center gap-1.5">
            ← Dashboard
          </Link>
          <span className="text-gray-200">|</span>
          <h1 className="font-bold text-gray-900 text-sm">Account &amp; Plan</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="" className="w-14 h-14 rounded-full border border-gray-200 flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">
              🎓
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{data.profile.display_name}</p>
            <p className="text-gray-500 text-sm truncate">{data.profile.email}</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {data.profile.phone.slice(0, 4)}****{data.profile.phone.slice(-3)}
            </p>
          </div>
          <span className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${tierInfo.bg} ${tierInfo.color}`}>
            {tierInfo.icon} {tierInfo.label}
          </span>
        </div>

        {/* Plan details card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Your Plan</h2>

          {tier === 'pro_monthly' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <span className="text-3xl">👑</span>
                <div>
                  <p className="font-bold text-purple-900">Pro Monthly — Active</p>
                  {proExpiry && (
                    <p className={`text-sm mt-0.5 ${daysUntilExpiry !== null && daysUntilExpiry <= 7 ? 'text-amber-600 font-semibold' : 'text-purple-700'}`}>
                      Expires {new Date(proExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {daysUntilExpiry !== null && (
                        <span className="ml-1">
                          ({daysUntilExpiry <= 0 ? 'expired' : `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left`})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-gray-900">∞</p>
                  <p className="text-xs text-gray-500 mt-0.5">Daily uploads</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-gray-900">60</p>
                  <p className="text-xs text-gray-500 mt-0.5">Monthly uploads</p>
                </div>
              </div>
            </div>
          )}

          {tier === 'single_unlock' && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <span className="text-3xl">⚡</span>
              <div>
                <p className="font-bold text-blue-900">Single Unlock</p>
                <p className="text-blue-700 text-sm mt-0.5">1 extra upload · no expiry</p>
              </div>
            </div>
          )}

          {tier === 'free' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-3xl">🆓</span>
                <div>
                  <p className="font-bold text-gray-900">Free Plan</p>
                  <p className="text-gray-600 text-sm mt-0.5">2 uploads/day · 6/month</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Usage this month */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">This Month&apos;s Usage</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Uploads used</span>
            <span className={`font-bold ${monthlyLimit < 999 && uploadsMonth >= monthlyLimit ? 'text-red-500' : 'text-gray-800'}`}>
              {uploadsMonth} / {monthlyLimit >= 999 ? '60' : monthlyLimit}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all ${monthlyPct >= 100 ? 'bg-red-400' : monthlyPct >= 75 ? 'bg-amber-400' : 'bg-blue-500'}`}
              style={{ width: `${monthlyPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">Resets on {nextResetStr}</p>
        </div>

        {/* Upgrade / Renew card */}
        {tier === 'free' && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
            <p className="font-bold text-lg mb-1">Ready to go Pro?</p>
            <p className="text-blue-100 text-sm mb-4">
              60 uploads/month · No daily limit · Priority access
            </p>
            <div className="bg-white/20 rounded-xl p-3 mb-4 text-center">
              <p className="font-extrabold text-2xl">25,000 IQD</p>
              <p className="text-blue-200 text-xs">per month</p>
            </div>
            <a
              href={`${WHATSAPP}?text=${upgradeMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition"
            >
              <span className="text-lg">📱</span> Message Admin to Upgrade
            </a>
          </div>
        )}

        {tier === 'single_unlock' && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
            <p className="font-bold text-lg mb-1">Upgrade to Pro Monthly</p>
            <p className="text-blue-100 text-sm mb-4">
              Unlimited daily uploads · 60/month · No expiry worry
            </p>
            <a
              href={`${WHATSAPP}?text=${upgradeMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition"
            >
              <span className="text-lg">📱</span> Message Admin to Upgrade
            </a>
          </div>
        )}

        {tier === 'pro_monthly' && daysUntilExpiry !== null && daysUntilExpiry <= 14 && (
          <div className={`rounded-2xl p-5 text-white ${daysUntilExpiry <= 3 ? 'bg-red-600' : 'bg-amber-500'}`}>
            <p className="font-bold text-lg mb-1">
              {daysUntilExpiry <= 0 ? 'Pro Expired' : `Pro expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}
            </p>
            <p className="text-white/80 text-sm mb-4">
              Renew now to keep unlimited access to your study plans.
            </p>
            <a
              href={`${WHATSAPP}?text=${renewMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition"
            >
              <span className="text-lg">📱</span> Message Admin to Renew
            </a>
          </div>
        )}

        {tier === 'pro_monthly' && (daysUntilExpiry === null || daysUntilExpiry > 14) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Need to renew early or have a question?</p>
            <a
              href={`${WHATSAPP}?text=${encodeURIComponent(`Hi, I have a question about my Pro subscription.\nEmail: ${data.profile.email}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-semibold transition"
            >
              📱 Contact Admin on WhatsApp
            </a>
          </div>
        )}

        {/* Stats mini row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-xl font-bold text-gray-900">{(data.submissions as unknown[]).length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Uploads</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-xl font-bold text-gray-900">{data.top_topics.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Subjects</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-xl font-bold text-gray-900 flex items-center justify-center gap-1">
              {data.streak}<span className="text-sm">🔥</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Streak</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 text-sm text-gray-400 pb-8 pt-2">
          <Link href="/dashboard" className="hover:text-blue-600 transition">Dashboard</Link>
          <span>·</span>
          <Link href="/upload" className="hover:text-blue-600 transition">Upload</Link>
        </div>
      </div>
    </main>
  )
}
