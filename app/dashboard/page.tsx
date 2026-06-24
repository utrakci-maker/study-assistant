'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

const WHATSAPP = 'https://wa.me/9647754822210'

interface Submission {
  id: string
  topic_title: string
  detected_language: string
  status: string
  tier_used: string
  created_at: string
}

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
  submissions: Submission[]
  top_topics: { topic: string; count: number }[]
  streak: number
}

const TIER_INFO: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  free:          { label: 'Free Plan',     bg: 'bg-gray-100',   text: 'text-gray-700',   icon: '🆓' },
  single_unlock: { label: 'Single Unlock', bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '⚡' },
  pro_monthly:   { label: 'Pro Monthly',   bg: 'bg-purple-100', text: 'text-purple-700', icon: '👑' },
}

const LANG_LABELS: Record<string, string> = {
  ar: '🇮🇶 Arabic', ku: '🏔️ Kurdish', en: '🇬🇧 English',
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; avatar: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'failed'>('all')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session) { router.replace('/login'); return }

      // Store Google user info for the pending screen
      const meta = session.user.user_metadata ?? {}
      setGoogleUser({
        name: meta.name ?? meta.full_name ?? session.user.email ?? '',
        email: session.user.email ?? '',
        avatar: meta.avatar_url ?? meta.picture ?? '',
      })

      const res = await fetch('/api/dashboard/data', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })

      if (res.status === 401) { router.replace('/login'); return }

      if (res.status === 404) {
        // Auth user exists but no student_profile yet — pending activation
        setIsPending(true)
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError('Failed to load dashboard. Please try again.')
        setLoading(false)
        return
      }

      const json = await res.json()
      setData(json)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    await supabaseBrowser.auth.signOut()
    router.replace('/login')
  }

  // ── Loading screen ──────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-pulse">📚</div>
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </main>
    )
  }

  // ── Pending activation screen ────────────────────────────────────────
  if (isPending) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-start justify-center p-4 pt-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-7 text-center">
            {googleUser?.avatar && (
              <img
                src={googleUser.avatar}
                alt=""
                className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-amber-200"
              />
            )}
            <div className="text-4xl mb-3">⏳</div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Account Pending Activation</h1>
            <p className="text-gray-500 text-sm mb-1">Signed in as:</p>
            <p className="font-semibold text-gray-800 text-sm mb-5">
              {googleUser?.name && <span>{googleUser.name} · </span>}
              {googleUser?.email}
            </p>

            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Your Google account is linked. The admin needs to activate your student account before you can access the dashboard.
            </p>

            <a
              href={`https://wa.me/9647754822210?text=${encodeURIComponent(`Hi, I just signed up for StudyAI with Google.\nEmail: ${googleUser?.email ?? ''}\nPlease activate my account. Thank you!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition mb-3"
            >
              <span className="text-lg">📱</span> Message Admin on WhatsApp
            </a>

            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Error screen ─────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-500 mb-4 text-sm">{error || 'Something went wrong.'}</p>
          <Link href="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
        </div>
      </main>
    )
  }

  // ── Full dashboard ───────────────────────────────────────────────────
  const tier = data.usage?.tier ?? 'free'
  const tierInfo = TIER_INFO[tier] ?? TIER_INFO.free
  const uploadsToday = data.usage?.uploads_today ?? 0
  const uploadsMonth = data.usage?.uploads_this_month ?? 0
  const proExpiry = data.usage?.pro_expires_at
  const dailyLimit = data.usage?.daily_limit ?? 2
  const monthlyLimit = data.usage?.monthly_limit ?? 6
  const dailyPct = dailyLimit >= 999 ? 100 : Math.min(100, Math.round((uploadsToday / dailyLimit) * 100))
  const monthlyPct = monthlyLimit >= 999 ? 100 : Math.min(100, Math.round((uploadsMonth / monthlyLimit) * 100))
  const daysUntilExpiry = tier === 'pro_monthly' && proExpiry
    ? Math.ceil((new Date(proExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {googleUser?.avatar && (
              <img src={googleUser.avatar} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
            )}
            <div>
              <h1 className="font-bold text-gray-900 leading-none text-sm sm:text-base">
                {data.profile.display_name}
              </h1>
              <p className="text-gray-400 text-xs mt-0.5 hidden sm:block">{data.profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${tierInfo.bg} ${tierInfo.text}`}>
              {tierInfo.icon} {tierInfo.label}
            </span>
            <Link
              href="/account"
              className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
              title="Account Settings"
            >
              ⚙️
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{data.submissions.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Uploads</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{data.top_topics.length}</div>
            <div className="text-xs text-gray-500 mt-1">Subjects</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
              {data.streak}
              <span className="text-base">🔥</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Day Streak</div>
          </div>
        </div>

        {/* Usage limits card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Limits</h3>
            {tier === 'free' && (
              <Link href="/unlock" className="text-xs text-blue-600 font-semibold hover:underline">
                Upgrade →
              </Link>
            )}
          </div>

          {/* Daily */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-600 font-medium">Today</span>
              <span className={`font-bold ${dailyLimit >= 999 ? 'text-green-600' : uploadsToday >= dailyLimit ? 'text-red-500' : 'text-gray-700'}`}>
                {dailyLimit >= 999 ? '∞ unlimited' : `${uploadsToday} / ${dailyLimit}`}
              </span>
            </div>
            {dailyLimit < 999 && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${dailyPct >= 100 ? 'bg-red-400' : dailyPct >= 75 ? 'bg-amber-400' : 'bg-blue-500'}`}
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Monthly */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-600 font-medium">This Month</span>
              <span className={`font-bold ${monthlyLimit >= 999 ? 'text-green-600' : uploadsMonth >= monthlyLimit ? 'text-red-500' : 'text-gray-700'}`}>
                {monthlyLimit >= 999 ? '∞ unlimited' : `${uploadsMonth} / ${monthlyLimit}`}
              </span>
            </div>
            {monthlyLimit < 999 && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${monthlyPct >= 100 ? 'bg-red-400' : monthlyPct >= 75 ? 'bg-amber-400' : 'bg-green-500'}`}
                  style={{ width: `${monthlyPct}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pro expiry warning — shown 7 days before expiry */}
        {daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 text-sm">
                Pro expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}!
              </p>
              <p className="text-amber-700 text-xs mt-0.5">Contact admin now to renew before access is removed.</p>
            </div>
            <a
              href={`${WHATSAPP}?text=${encodeURIComponent(`Hi, I need to renew my Pro subscription.\nEmail: ${data.profile.email}\nExpires in ${daysUntilExpiry} day(s). Please help me renew. Thank you!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-2 rounded-lg transition"
            >
              Renew
            </a>
          </div>
        )}

        {/* Pro expiry banner (shown when more than 7 days left) */}
        {tier === 'pro_monthly' && proExpiry && (daysUntilExpiry === null || daysUntilExpiry > 7) && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div className="flex-1">
              <p className="font-semibold text-purple-900 text-sm">Pro Plan Active</p>
              <p className="text-purple-700 text-xs mt-0.5">
                Expires {new Date(proExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                {daysUntilExpiry !== null && ` · ${daysUntilExpiry} days remaining`}
              </p>
            </div>
          </div>
        )}

        {/* Free limit reached */}
        {tier === 'free' && uploadsToday >= dailyLimit && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <p className="font-semibold text-red-900 text-sm">Daily limit reached</p>
              <p className="text-red-700 text-xs mt-0.5">Resets tomorrow, or upgrade to continue now.</p>
            </div>
            <Link href="/unlock" className="flex-shrink-0 text-xs bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-2 rounded-lg transition">
              Unlock
            </Link>
          </div>
        )}

        {/* Upload CTA */}
        <Link
          href="/upload"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl py-4 font-bold shadow-sm hover:shadow-md transition-all"
        >
          <span className="text-xl">📤</span>
          Upload New Study Material
        </Link>

        {/* Top Topics */}
        {data.top_topics.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Most Studied Topics</h3>
            <div className="space-y-2">
              {data.top_topics.map((t, i) => {
                const maxCount = data.top_topics[0]?.count ?? 1
                const pct = Math.round((t.count / maxCount) * 100)
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
                return (
                  <div key={t.topic}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-700 font-medium truncate flex-1 mr-2">
                        {medals[i]} {t.topic}
                      </span>
                      <span className="text-gray-400 flex-shrink-0">{t.count}×</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Submissions list */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              My Study Sessions ({data.submissions.length})
            </h2>
          </div>

          {/* Search + filter */}
          {data.submissions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                placeholder="Search topics…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
              <div className="flex gap-1.5 flex-shrink-0">
                {(['all', 'complete', 'failed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`text-xs px-3 py-2 rounded-xl font-semibold transition ${
                      statusFilter === f
                        ? f === 'all' ? 'bg-gray-800 text-white' : f === 'complete' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'complete' ? '✓ Done' : '✗ Failed'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const filteredSubs = data.submissions.filter(sub =>
              (!search || sub.topic_title?.toLowerCase().includes(search.toLowerCase())) &&
              (statusFilter === 'all' || sub.status === statusFilter)
            )

            if (data.submissions.length === 0) return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="text-5xl mb-3">📂</div>
                <p className="text-gray-600 font-semibold text-sm">No uploads yet</p>
                <p className="text-gray-400 text-xs mt-1">Upload your first study material to get started.</p>
              </div>
            )

            if (filteredSubs.length === 0) return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-gray-500 text-sm">No sessions match your search.</p>
                <button onClick={() => { setSearch(''); setStatusFilter('all') }} className="text-xs text-blue-600 hover:underline mt-2">Clear filters</button>
              </div>
            )

            return (
            <div className="space-y-2">
              {filteredSubs.map(sub => (
                <Link
                  key={sub.id}
                  href={`/results/${sub.id}`}
                  className="flex items-start justify-between gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                      {sub.topic_title || '⏳ Processing…'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {new Date(sub.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                      {sub.detected_language && (
                        <>
                          <span className="text-gray-300 text-xs">·</span>
                          <span className="text-xs text-gray-400">{LANG_LABELS[sub.detected_language] ?? sub.detected_language}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    {sub.tier_used === 'pro_monthly' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Pro</span>
                    )}
                    <span className={`text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                      sub.status === 'complete' ? 'bg-green-100 text-green-600' :
                      sub.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {sub.status === 'complete' ? '✓' : sub.status === 'failed' ? '✗' : '…'}
                    </span>
                    <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-sm">→</span>
                  </div>
                </Link>
              ))}
            </div>
            )
          })()}
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 text-sm text-gray-400 pb-8 pt-2">
          <Link href="/upload" className="hover:text-blue-600 transition">Upload</Link>
          <span>·</span>
          <Link href="/unlock" className="hover:text-blue-600 transition">Upgrade Plan</Link>
          <span>·</span>
          <button onClick={handleLogout} className="hover:text-red-500 transition">Sign Out</button>
        </div>
      </div>
    </main>
  )
}
