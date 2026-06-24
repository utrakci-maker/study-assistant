'use client'

import { useState, useEffect, useCallback } from 'react'

const SITE_URL = 'https://study-assistant-ashy.vercel.app'

interface Stats {
  totalSubmissions: number
  todaySubmissions: number
  totalUsers: number
  freeUsers: number
  proUsers: number
  totalCacheHits: number
  cachedItems: number
  codesTotal: number
  codesUsed: number
  recentSubmissions: {
    id: string
    user_phone: string
    user_email: string
    topic_title: string
    status: string
    tier_used: string
    cost_usd: number
    created_at: string
  }[]
}

interface UnlockCode {
  id: string
  code: string
  type: string
  created_at: string
  expires_at: string | null
  used_at: string | null
  used_by_phone: string | null
  used_by_email: string | null
}

interface Student {
  id: string
  display_name: string
  phone: string
  email: string
  tier: string
  uploads_this_month: number
  pro_expires_at: string | null
  created_at: string
}

interface PendingStudent {
  id: string
  email: string
  name: string
  avatar_url: string
  signed_up_at: string
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [codes, setCodes] = useState<UnlockCode[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'submissions' | 'students'>('overview')

  // Unlock codes form
  const [newCode, setNewCode] = useState('')
  const [newType, setNewType] = useState('single')
  const [newExpiry, setNewExpiry] = useState(30)
  const [createLoading, setCreateLoading] = useState(false)
  const [createMsg, setCreateMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Students
  const [pending, setPending] = useState<PendingStudent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoaded, setStudentsLoaded] = useState(false)
  // Which pending student is being activated
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [activateForm, setActivateForm] = useState({ displayName: '', phone: '', tier: 'free', proExpiry: '' })
  const [activateLoading, setActivateLoading] = useState(false)
  const [activateMsg, setActivateMsg] = useState<{ text: string; ok: boolean; id: string } | null>(null)

  const loadData = useCallback(async (pw: string) => {
    setLoading(true)
    const authHeader = { 'Authorization': `Bearer ${pw}` }
    try {
      const [statsRes, codesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: authHeader }),
        fetch('/api/admin/codes', { headers: authHeader }),
      ])
      if (statsRes.status === 401) { setAuthError('Wrong password.'); setAuthed(false); return }
      const statsData = await statsRes.json()
      const codesData = await codesRes.json()
      setStats(statsData)
      setCodes(codesData.codes || [])
      setAuthed(true)
      setAuthError('')
    } catch {
      setAuthError('Failed to load. Try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStudents = useCallback(async (pw: string) => {
    const res = await fetch('/api/auth/students', { headers: { 'Authorization': `Bearer ${pw}` } })
    const data = await res.json()
    setPending(data.pending || [])
    setStudents(data.students || [])
    setStudentsLoaded(true)
  }, [])

  useEffect(() => {
    if (activeTab === 'students' && authed && !studentsLoaded) {
      loadStudents(password)
    }
  }, [activeTab, authed, studentsLoaded, password, loadStudents])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    loadData(password)
  }

  async function handleCreateCode(e: React.FormEvent) {
    e.preventDefault()
    if (!newCode.trim()) { setCreateMsg({ text: 'Enter a code.', ok: false }); return }
    setCreateLoading(true)
    setCreateMsg(null)
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({ type: newType, code: newCode, expiryDays: newExpiry }),
      })
      const data = await res.json()
      if (res.ok) {
        setCreateMsg({ text: `Code "${newCode.toUpperCase()}" created!`, ok: true })
        setNewCode('')
        loadData(password)
      } else {
        setCreateMsg({ text: data.message || 'Error creating code.', ok: false })
      }
    } catch {
      setCreateMsg({ text: 'Network error.', ok: false })
    } finally {
      setCreateLoading(false)
    }
  }

  function startActivating(student: PendingStudent) {
    setActivatingId(student.id)
    setActivateForm({
      displayName: student.name,
      phone: '',
      tier: 'free',
      proExpiry: '',
    })
    setActivateMsg(null)
  }

  async function handleActivate(studentId: string) {
    const { displayName, phone, tier, proExpiry } = activateForm
    if (!displayName.trim() || !phone.trim()) {
      setActivateMsg({ text: 'Name and phone are required.', ok: false, id: studentId })
      return
    }
    setActivateLoading(true)
    try {
      const res = await fetch('/api/auth/activate-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({
          userId: studentId,
          displayName: displayName.trim(),
          phone: phone.trim(),
          tier,
          ...(tier === 'pro_monthly' && proExpiry ? { proExpiry } : {}),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setActivateMsg({ text: 'Student activated!', ok: true, id: studentId })
        setActivatingId(null)
        setStudentsLoaded(false)
        loadStudents(password)
      } else {
        setActivateMsg({ text: data.message || 'Failed to activate.', ok: false, id: studentId })
      }
    } catch {
      setActivateMsg({ text: 'Network error.', ok: false, id: studentId })
    } finally {
      setActivateLoading(false)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function formatShortDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function maskPhone(phone: string) {
    if (!phone || phone.length < 6) return phone
    return phone.slice(0, 4) + '****' + phone.slice(-3)
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  // Login screen
  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Study Assistant — Owner Only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Enter Dashboard'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h1 className="font-bold text-lg leading-none">Admin Dashboard</h1>
            <p className="text-gray-400 text-xs mt-0.5">Study Assistant</p>
          </div>
        </div>
        <button
          onClick={() => loadData(password)}
          className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {(['overview', 'codes', 'submissions', 'students'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab === 'overview' ? '📈 Overview'
               : tab === 'codes' ? '🔑 Unlock Codes'
               : tab === 'submissions' ? '📋 Submissions'
               : `👨‍🎓 Students${pending.length > 0 ? ` (${pending.length} pending)` : ''}`}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Uploads" value={stats.totalSubmissions} icon="📤" color="blue" />
              <StatCard label="Today" value={stats.todaySubmissions} icon="📅" color="green" />
              <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="purple" />
              <StatCard label="Pro Users" value={stats.proUsers} icon="👑" color="amber" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Cache Hits" value={stats.totalCacheHits} icon="⚡" color="cyan" subtitle="AI calls saved" />
              <StatCard label="Cached Topics" value={stats.cachedItems} icon="💾" color="teal" subtitle="unique topics" />
              <StatCard label="Codes Issued" value={`${stats.codesUsed}/${stats.codesTotal}`} icon="🔑" color="orange" subtitle="used / total" />
            </div>
            <div className="bg-gray-800 rounded-xl p-5">
              <h2 className="font-semibold text-gray-200 mb-4">User Breakdown</h2>
              <div className="space-y-3">
                <TierBar label="Free" count={stats.freeUsers} total={stats.totalUsers} color="bg-gray-500" />
                <TierBar label="Pro Monthly" count={stats.proUsers} total={stats.totalUsers} color="bg-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* CODES TAB */}
        {activeTab === 'codes' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-5">
              <h2 className="font-semibold text-gray-200 mb-4">Create Unlock Code</h2>
              <form onSubmit={handleCreateCode} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Code (you choose)</label>
                    <input
                      type="text"
                      placeholder="e.g. STUDY2024"
                      value={newCode}
                      onChange={e => setNewCode(e.target.value.toUpperCase())}
                      maxLength={20}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Type</label>
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="single">Single Upload ($0.99)</option>
                      <option value="pro_30day">Pro 30 Days ($10)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Expires in (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={newExpiry}
                      onChange={e => setNewExpiry(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                {createMsg && (
                  <p className={`text-sm font-medium ${createMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {createMsg.ok ? '✅ ' : '❌ '}{createMsg.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                >
                  {createLoading ? 'Creating...' : '+ Create Code'}
                </button>
              </form>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-700">
                <h2 className="font-semibold text-gray-200">All Codes ({codes.length})</h2>
              </div>
              {codes.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No codes yet. Create one above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs border-b border-gray-700">
                        <th className="text-left px-5 py-3">Code</th>
                        <th className="text-left px-5 py-3">Type</th>
                        <th className="text-left px-5 py-3">Status</th>
                        <th className="text-left px-5 py-3">Used by</th>
                        <th className="text-left px-5 py-3">Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map(c => (
                        <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                          <td className="px-5 py-3 font-mono font-bold text-white tracking-wider">{c.code}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              c.type === 'pro_30day' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'
                            }`}>
                              {c.type === 'pro_30day' ? '👑 Pro 30d' : '⚡ Single'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {c.used_at ? (
                              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full">Used</span>
                            ) : c.expires_at && new Date(c.expires_at) < new Date() ? (
                              <span className="text-xs bg-red-900 text-red-400 px-2 py-1 rounded-full">Expired</span>
                            ) : (
                              <span className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded-full">Active</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-400 text-xs">
                            {c.used_by_phone ? maskPhone(c.used_by_phone) : '—'}
                            {c.used_at && <div className="text-gray-500">{formatDate(c.used_at)}</div>}
                          </td>
                          <td className="px-5 py-3 text-gray-400 text-xs">
                            {c.expires_at ? formatDate(c.expires_at) : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBMISSIONS TAB */}
        {activeTab === 'submissions' && stats && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700">
              <h2 className="font-semibold text-gray-200">Recent Submissions (last 20)</h2>
            </div>
            {stats.recentSubmissions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No submissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs border-b border-gray-700">
                      <th className="text-left px-5 py-3">Topic</th>
                      <th className="text-left px-5 py-3">Phone</th>
                      <th className="text-left px-5 py-3">Tier</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSubmissions.map(s => (
                      <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-5 py-3 text-white max-w-xs truncate">
                          {s.topic_title || <span className="text-gray-500">Processing...</span>}
                        </td>
                        <td className="px-5 py-3 text-gray-400 font-mono text-xs">{maskPhone(s.user_phone)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            s.tier_used === 'pro_monthly' ? 'bg-purple-900 text-purple-300' :
                            s.tier_used === 'single_unlock' ? 'bg-blue-900 text-blue-300' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {s.tier_used || 'free'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            s.status === 'complete' ? 'bg-green-900 text-green-400' :
                            s.status === 'error' ? 'bg-red-900 text-red-400' :
                            'bg-yellow-900 text-yellow-400'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(s.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="space-y-6">

            {/* ── Pending Activation ── */}
            {!studentsLoaded ? (
              <p className="text-gray-400 text-sm text-center py-12 animate-pulse">Loading students…</p>
            ) : (
              <>
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-200">
                        🟡 Pending Activation
                        {pending.length > 0 && (
                          <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
                        )}
                      </h2>
                      <p className="text-gray-400 text-xs mt-0.5">Students who signed in with Google and need activation</p>
                    </div>
                    <button
                      onClick={() => { setStudentsLoaded(false); loadStudents(password) }}
                      className="text-xs text-gray-400 hover:text-gray-200 transition"
                    >
                      ↻ Reload
                    </button>
                  </div>

                  {pending.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-gray-500 text-sm">No pending students.</p>
                      <p className="text-gray-600 text-xs mt-1">When a student signs in with Google, they appear here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700/50">
                      {pending.map(p => (
                        <div key={p.id} className="p-5">
                          {/* Student info row */}
                          <div className="flex items-center gap-3 mb-3">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full border border-gray-600 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-lg flex-shrink-0">
                                {p.name?.[0]?.toUpperCase() ?? p.email?.[0]?.toUpperCase() ?? '?'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm">{p.name || '(no name)'}</p>
                              <p className="text-gray-400 text-xs truncate">{p.email}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-gray-500 text-xs">{timeAgo(p.signed_up_at)}</p>
                              {activatingId !== p.id && (
                                <button
                                  onClick={() => startActivating(p)}
                                  className="mt-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  Activate →
                                </button>
                              )}
                            </div>
                          </div>

                          {/* WhatsApp quick link */}
                          {activatingId !== p.id && (
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`✅ Your StudyAI account is activated!\n\nGo to: ${SITE_URL}/login\nSign in with your Google account (${p.email})\n\nWelcome aboard! 🎓`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-[#25D366] hover:underline"
                            >
                              📱 Send WhatsApp after activation
                            </a>
                          )}

                          {/* Inline activation form */}
                          {activatingId === p.id && (
                            <div className="mt-3 bg-gray-700/50 rounded-xl p-4 space-y-3 border border-gray-600">
                              <p className="text-xs text-gray-300 font-medium">Activate account for <span className="text-white">{p.email}</span></p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">Display Name</label>
                                  <input
                                    type="text"
                                    placeholder="Ahmed Mohammed"
                                    value={activateForm.displayName}
                                    onChange={e => setActivateForm(f => ({ ...f, displayName: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
                                  <input
                                    type="tel"
                                    placeholder="+9647501234567"
                                    value={activateForm.phone}
                                    onChange={e => setActivateForm(f => ({ ...f, phone: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">Plan / Tier</label>
                                  <select
                                    value={activateForm.tier}
                                    onChange={e => setActivateForm(f => ({ ...f, tier: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                  >
                                    <option value="free">Free (2/day)</option>
                                    <option value="single_unlock">Single Unlock</option>
                                    <option value="pro_monthly">Pro Monthly</option>
                                  </select>
                                </div>
                                {activateForm.tier === 'pro_monthly' && (
                                  <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Pro Expiry (optional)</label>
                                    <input
                                      type="date"
                                      value={activateForm.proExpiry}
                                      onChange={e => setActivateForm(f => ({ ...f, proExpiry: e.target.value }))}
                                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                    />
                                  </div>
                                )}
                              </div>

                              {activateMsg?.id === p.id && (
                                <p className={`text-xs font-medium ${activateMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                                  {activateMsg.ok ? '✅ ' : '❌ '}{activateMsg.text}
                                </p>
                              )}

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handleActivate(p.id)}
                                  disabled={activateLoading}
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                                >
                                  {activateLoading ? 'Activating…' : '✓ Confirm Activation'}
                                </button>
                                <button
                                  onClick={() => { setActivatingId(null); setActivateMsg(null) }}
                                  className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-4 py-2 rounded-lg transition text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Activated Students ── */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-700">
                    <h2 className="font-semibold text-gray-200">✅ Activated Students ({students.length})</h2>
                  </div>
                  {students.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No activated students yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 text-xs border-b border-gray-700">
                            <th className="text-left px-5 py-3">Name</th>
                            <th className="text-left px-5 py-3">Email</th>
                            <th className="text-left px-5 py-3">Phone</th>
                            <th className="text-left px-5 py-3">Plan</th>
                            <th className="text-left px-5 py-3">Uploads/mo</th>
                            <th className="text-left px-5 py-3">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(s => (
                            <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                              <td className="px-5 py-3 text-white font-medium">{s.display_name}</td>
                              <td className="px-5 py-3 text-gray-300 text-xs">{s.email}</td>
                              <td className="px-5 py-3 text-gray-400 font-mono text-xs">{maskPhone(s.phone)}</td>
                              <td className="px-5 py-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  s.tier === 'pro_monthly' ? 'bg-purple-900 text-purple-300' :
                                  s.tier === 'single_unlock' ? 'bg-blue-900 text-blue-300' :
                                  'bg-gray-700 text-gray-400'
                                }`}>
                                  {s.tier === 'pro_monthly' ? '👑 Pro' : s.tier === 'single_unlock' ? '⚡ Single' : '🆓 Free'}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-gray-400">{s.uploads_this_month}</td>
                              <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatShortDate(s.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </main>
  )
}

function StatCard({ label, value, icon, color, subtitle }: {
  label: string; value: number | string; icon: string; color: string; subtitle?: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-900/40 border-blue-800',
    green: 'bg-green-900/40 border-green-800',
    purple: 'bg-purple-900/40 border-purple-800',
    amber: 'bg-amber-900/40 border-amber-800',
    cyan: 'bg-cyan-900/40 border-cyan-800',
    teal: 'bg-teal-900/40 border-teal-800',
    orange: 'bg-orange-900/40 border-orange-800',
  }
  return (
    <div className={`rounded-xl p-4 border ${colors[color] || colors.blue}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  )
}

function TierBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
