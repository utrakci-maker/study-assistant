'use client'

import { useState, useEffect, useCallback } from 'react'

const SITE_URL = 'https://study-assistant-ashy.vercel.app'

interface Stats {
  totalSubmissions: number
  todaySubmissions: number
  totalUsers: number
  freeUsers: number
  proUsers: number
  singleUsers: number
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
  notes: string | null
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

interface SelfRegStudent {
  id: string
  display_name: string
  phone: string
  email: string
  created_at: string
}

interface StudentAnalytics {
  totals: { total: number; complete: number; failed: number; this_week: number; this_month: number }
  activity: { date: string; count: number }[]
  top_topics: { topic: string; count: number }[]
  language_mix: { lang: string; count: number }[]
  streak: number
  last_upload_at: string | null
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
  const [selfRegPending, setSelfRegPending] = useState<SelfRegStudent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoaded, setStudentsLoaded] = useState(false)
  const [selfRegActivatingId, setSelfRegActivatingId] = useState<string | null>(null)
  const [selfRegTier, setSelfRegTier] = useState<Record<string, string>>({})
  const [selfRegProExpiry, setSelfRegProExpiry] = useState<Record<string, string>>({})
  const [selfRegMsg, setSelfRegMsg] = useState<{ text: string; ok: boolean; id: string } | null>(null)
  const [selfRegLoading, setSelfRegLoading] = useState(false)
  // Which pending student is being activated
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [activateForm, setActivateForm] = useState({ displayName: '', phone: '', tier: 'free', proExpiry: '' })
  const [activateLoading, setActivateLoading] = useState(false)
  const [activateMsg, setActivateMsg] = useState<{ text: string; ok: boolean; id: string } | null>(null)
  // Which activated student is being edited
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', tier: 'free', proExpiry: '', notes: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editMsg, setEditMsg] = useState<{ text: string; ok: boolean } | null>(null)
  // Which activated student's analytics panel is open
  const [viewingAnalyticsId, setViewingAnalyticsId] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<StudentAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

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
    setSelfRegPending(data.selfRegPending || [])
    setStudents(data.students || [])
    setStudentsLoaded(true)
  }, [])

  async function toggleAnalytics(s: Student) {
    if (viewingAnalyticsId === s.id) {
      setViewingAnalyticsId(null)
      return
    }
    setViewingAnalyticsId(s.id)
    setAnalyticsData(null)
    setAnalyticsLoading(true)
    const params = new URLSearchParams({ email: s.email, phone: s.phone })
    const res = await fetch(`/api/admin/student-analytics?${params}`, {
      headers: { 'Authorization': `Bearer ${password}` },
    })
    if (res.ok) setAnalyticsData(await res.json())
    setAnalyticsLoading(false)
  }

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

  async function handleActivateSelfReg(student: SelfRegStudent) {
    const tier = selfRegTier[student.id] ?? 'free'
    const proExpiry = selfRegProExpiry[student.id] ?? ''
    setSelfRegLoading(true)
    try {
      const res = await fetch('/api/auth/activate-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({
          userId: student.id,
          displayName: student.display_name,
          phone: student.phone,
          tier,
          ...(tier === 'pro_monthly' && proExpiry ? { proExpiry } : {}),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSelfRegMsg({ text: 'Activated!', ok: true, id: student.id })
        setSelfRegActivatingId(null)
        setStudentsLoaded(false)
        loadStudents(password)
      } else {
        setSelfRegMsg({ text: data.message || 'Failed to activate.', ok: false, id: student.id })
      }
    } catch {
      setSelfRegMsg({ text: 'Network error.', ok: false, id: student.id })
    } finally {
      setSelfRegLoading(false)
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

  function startEditing(s: Student) {
    setEditingId(s.id)
    setEditForm({
      displayName: s.display_name,
      phone: s.phone,
      tier: s.tier,
      proExpiry: s.pro_expires_at ? s.pro_expires_at.slice(0, 10) : '',
      notes: s.notes ?? '',
    })
    setEditMsg(null)
  }

  async function handleEditSave(studentId: string) {
    const { displayName, phone, tier, proExpiry, notes } = editForm
    if (!displayName.trim() || !phone.trim()) {
      setEditMsg({ text: 'Name and phone are required.', ok: false })
      return
    }
    setEditLoading(true)
    try {
      const res = await fetch('/api/auth/update-student', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` },
        body: JSON.stringify({
          userId: studentId,
          displayName: displayName.trim(),
          phone: phone.trim(),
          tier,
          proExpiry: tier === 'pro_monthly' && proExpiry ? proExpiry : null,
          notes: notes.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setEditMsg({ text: 'Changes saved!', ok: true })
        setEditingId(null)
        setStudentsLoaded(false)
        loadStudents(password)
      } else {
        setEditMsg({ text: data.message || 'Failed to save.', ok: false })
      }
    } catch {
      setEditMsg({ text: 'Network error.', ok: false })
    } finally {
      setEditLoading(false)
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
               : `👨‍🎓 Students${(pending.length + selfRegPending.length) > 0 ? ` (${pending.length + selfRegPending.length} pending)` : ''}`}
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
                <TierBar label="Single Unlock" count={stats.singleUsers ?? 0} total={stats.totalUsers} color="bg-blue-500" />
                <TierBar label="Pro Monthly" count={stats.proUsers} total={stats.totalUsers} color="bg-purple-500" />
              </div>
            </div>

            {/* Revenue estimate */}
            <div className="bg-gray-800 rounded-xl p-5">
              <h2 className="font-semibold text-gray-200 mb-4">💰 Revenue Estimate</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-700">
                  <div>
                    <p className="text-purple-300 font-medium">👑 Pro Monthly ({stats.proUsers} students)</p>
                    <p className="text-gray-400 text-xs">25,000 IQD × {stats.proUsers}/mo</p>
                  </div>
                  <p className="text-white font-bold">{(stats.proUsers * 25000).toLocaleString()} IQD</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-700">
                  <div>
                    <p className="text-blue-300 font-medium">⚡ Single Unlock ({stats.singleUsers ?? 0} students)</p>
                    <p className="text-gray-400 text-xs">5,000 IQD × {stats.singleUsers ?? 0} (one-time)</p>
                  </div>
                  <p className="text-white font-bold">{((stats.singleUsers ?? 0) * 5000).toLocaleString()} IQD</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-gray-300 font-semibold">Est. Monthly Revenue</p>
                  <p className="text-green-400 font-extrabold text-lg">{(stats.proUsers * 25000).toLocaleString()} IQD</p>
                </div>
                <p className="text-gray-500 text-xs">≈ ${(stats.proUsers * 25000 / 1310).toFixed(0)} USD · Based on activated student tiers</p>
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

                {/* ── Self-Registered Pending ── */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-700">
                    <h2 className="font-semibold text-gray-200">
                      📝 Self-Registered — Pending Activation
                      {selfRegPending.length > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{selfRegPending.length}</span>
                      )}
                    </h2>
                    <p className="text-gray-400 text-xs mt-0.5">Students who registered via the sign-up form and are waiting for you to activate them</p>
                  </div>

                  {selfRegPending.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-gray-500 text-sm">No self-registered students pending.</p>
                      <p className="text-gray-600 text-xs mt-1">When a student registers at /register, they appear here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700/50">
                      {selfRegPending.map(s => (
                        <div key={s.id} className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-lg flex-shrink-0 font-bold text-blue-200">
                              {s.display_name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm">{s.display_name}</p>
                              <p className="text-gray-400 text-xs">{s.email}</p>
                              <p className="text-gray-500 text-xs font-mono mt-0.5">{s.phone}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-gray-500 text-xs">{timeAgo(s.created_at)}</p>
                              {selfRegActivatingId !== s.id && (
                                <button
                                  onClick={() => { setSelfRegActivatingId(s.id); setSelfRegMsg(null) }}
                                  className="mt-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  Activate →
                                </button>
                              )}
                            </div>
                          </div>

                          {selfRegActivatingId === s.id && (
                            <div className="mt-3 bg-gray-700/50 rounded-xl p-4 space-y-3 border border-gray-600">
                              <p className="text-xs text-gray-300 font-medium">
                                Activate <span className="text-white">{s.display_name}</span> ({s.email})
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">Plan / Tier</label>
                                  <select
                                    value={selfRegTier[s.id] ?? 'free'}
                                    onChange={e => setSelfRegTier(t => ({ ...t, [s.id]: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  >
                                    <option value="free">Free (2/day)</option>
                                    <option value="single_unlock">Single Unlock</option>
                                    <option value="pro_monthly">Pro Monthly</option>
                                  </select>
                                </div>
                                {(selfRegTier[s.id] ?? 'free') === 'pro_monthly' && (
                                  <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Pro Expiry (optional)</label>
                                    <input
                                      type="date"
                                      value={selfRegProExpiry[s.id] ?? ''}
                                      onChange={e => setSelfRegProExpiry(t => ({ ...t, [s.id]: e.target.value }))}
                                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                )}
                              </div>

                              {selfRegMsg?.id === s.id && (
                                <p className={`text-xs font-medium ${selfRegMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                                  {selfRegMsg.ok ? '✅ ' : '❌ '}{selfRegMsg.text}
                                </p>
                              )}

                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <button
                                  onClick={() => handleActivateSelfReg(s)}
                                  disabled={selfRegLoading}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                                >
                                  {selfRegLoading ? 'Activating…' : '✓ Confirm Activation'}
                                </button>
                                <button
                                  onClick={() => { setSelfRegActivatingId(null); setSelfRegMsg(null) }}
                                  className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-4 py-2 rounded-lg transition text-sm"
                                >
                                  Cancel
                                </button>
                                <a
                                  href={`https://wa.me/${s.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`✅ Your StudyAI account is now active!\n\nGo to: ${SITE_URL}/login\nSign in with your email: ${s.email}\n\nWelcome aboard! 🎓`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#25D366] hover:underline"
                                >
                                  📱 WhatsApp after activation
                                </a>
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
                  <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-200">✅ Activated Students ({students.length})</h2>
                    {students.length > 0 && (
                      <button
                        onClick={() => {
                          const rows = [
                            ['Name', 'Phone', 'Email', 'Tier', 'Uploads This Month', 'Pro Expires', 'Notes', 'Joined'],
                            ...students.map(s => [
                              s.display_name,
                              s.phone,
                              s.email,
                              s.tier,
                              String(s.uploads_this_month),
                              s.pro_expires_at ? new Date(s.pro_expires_at).toLocaleDateString('en-GB') : '',
                              s.notes ?? '',
                              new Date(s.created_at).toLocaleDateString('en-GB'),
                            ]),
                          ]
                          const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
                          const blob = new Blob([csv], { type: 'text/csv' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition font-medium"
                      >
                        ⬇️ Export CSV
                      </button>
                    )}
                  </div>
                  {students.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No activated students yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-700/50">
                      {students.map(s => (
                        <div key={s.id}>
                          {/* Student row */}
                          <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-700/20">
                            <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-2 items-center text-sm">
                              <div>
                                <p className="text-white font-medium truncate">{s.display_name}</p>
                                <p className="text-gray-400 text-xs truncate">{s.email}</p>
                              </div>
                              <p className="text-gray-400 font-mono text-xs hidden md:block">{maskPhone(s.phone)}</p>
                              <div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  s.tier === 'pro_monthly' ? 'bg-purple-900 text-purple-300' :
                                  s.tier === 'single_unlock' ? 'bg-blue-900 text-blue-300' :
                                  'bg-gray-700 text-gray-400'
                                }`}>
                                  {s.tier === 'pro_monthly' ? '👑 Pro' : s.tier === 'single_unlock' ? '⚡ Single' : '🆓 Free'}
                                </span>
                                {s.pro_expires_at && s.tier === 'pro_monthly' && (
                                  <p className="text-gray-500 text-xs mt-0.5">until {formatShortDate(s.pro_expires_at)}</p>
                                )}
                              </div>
                              <p className="text-gray-400 text-xs hidden md:block">{s.uploads_this_month} uploads/mo</p>
                              {s.notes && (
                                <p className="text-yellow-400 text-xs truncate hidden md:block" title={s.notes}>
                                  💰 {s.notes}
                                </p>
                              )}
                            </div>
                            {editingId !== s.id && (
                              <div className="flex-shrink-0 flex gap-2">
                                <button
                                  onClick={() => toggleAnalytics(s)}
                                  className={`text-xs px-3 py-1.5 rounded-lg transition ${
                                    viewingAnalyticsId === s.id
                                      ? 'bg-blue-600 text-white'
                                      : 'text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600'
                                  }`}
                                >
                                  📊 Analytics
                                </button>
                                <button
                                  onClick={() => startEditing(s)}
                                  className="text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Analytics panel */}
                          {viewingAnalyticsId === s.id && (
                            <StudentAnalyticsPanel
                              student={s}
                              data={analyticsData}
                              loading={analyticsLoading}
                            />
                          )}

                          {/* Inline edit form */}
                          {editingId === s.id && (
                            <div className="px-5 pb-5 pt-2 bg-gray-700/30 border-t border-gray-700">
                              <p className="text-xs text-gray-300 font-medium mb-3">Editing: <span className="text-white">{s.display_name}</span></p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">Display Name</label>
                                  <input
                                    type="text"
                                    value={editForm.displayName}
                                    onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                                  <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400 mb-1 block">Plan / Tier</label>
                                  <select
                                    value={editForm.tier}
                                    onChange={e => setEditForm(f => ({ ...f, tier: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  >
                                    <option value="free">Free (2/day)</option>
                                    <option value="single_unlock">Single Unlock</option>
                                    <option value="pro_monthly">Pro Monthly</option>
                                  </select>
                                </div>
                                {editForm.tier === 'pro_monthly' && (
                                  <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Pro Expiry Date</label>
                                    <input
                                      type="date"
                                      value={editForm.proExpiry}
                                      onChange={e => setEditForm(f => ({ ...f, proExpiry: e.target.value }))}
                                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                )}
                                <div className="sm:col-span-2">
                                  <label className="text-xs text-gray-400 mb-1 block">Payment Notes (internal)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Paid 25,000 IQD — June 2026"
                                    value={editForm.notes}
                                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  />
                                </div>
                              </div>
                              {editMsg && (
                                <p className={`text-xs font-medium mb-2 ${editMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                                  {editMsg.ok ? '✅ ' : '❌ '}{editMsg.text}
                                </p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditSave(s.id)}
                                  disabled={editLoading}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                                >
                                  {editLoading ? 'Saving…' : '💾 Save Changes'}
                                </button>
                                <button
                                  onClick={() => { setEditingId(null); setEditMsg(null) }}
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
              </>
            )}
          </div>
        )}

      </div>
    </main>
  )
}

const ANALYTICS_LANG_LABELS: Record<string, string> = {
  ar: '🇮🇶 Arabic', ku: '🏔️ Kurdish', en: '🇬🇧 English',
}

function StudentAnalyticsPanel({ student, data, loading }: {
  student: Student
  data: StudentAnalytics | null
  loading: boolean
}) {
  return (
    <div className="px-5 pb-5 pt-4 bg-gray-900/40 border-t border-gray-700 space-y-4">
      <p className="text-xs text-gray-300 font-medium">
        Progress analytics: <span className="text-white">{student.display_name}</span>
      </p>

      {loading && (
        <p className="text-xs text-gray-400 py-6 text-center">Loading analytics…</p>
      )}

      {!loading && !data && (
        <p className="text-xs text-red-400 py-6 text-center">Failed to load analytics.</p>
      )}

      {!loading && data && (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Total Uploads', value: data.totals.total },
              { label: 'This Week', value: data.totals.this_week },
              { label: 'This Month', value: data.totals.this_month },
              { label: 'Day Streak', value: `${data.streak}🔥` },
            ].map(t => (
              <div key={t.label} className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                <div className="text-lg font-bold text-white">{t.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.label}</div>
              </div>
            ))}
          </div>

          {/* Activity chart — last 30 days */}
          {data.totals.total > 0 ? (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Activity — Last 30 Days
              </h4>
              <ActivityBarChart activity={data.activity} />
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
              <p className="text-gray-500 text-xs">No uploads yet — nothing to show.</p>
            </div>
          )}

          {/* Top topics + language mix */}
          {data.totals.total > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.top_topics.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Top Topics</h4>
                  <div className="space-y-2">
                    {data.top_topics.map(t => {
                      const maxCount = data.top_topics[0]?.count ?? 1
                      const pct = Math.round((t.count / maxCount) * 100)
                      return (
                        <div key={t.topic}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-300 truncate flex-1 mr-2">{t.topic}</span>
                            <span className="text-gray-500 flex-shrink-0">{t.count}×</span>
                          </div>
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {data.language_mix.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Language Mix</h4>
                  <div className="space-y-2">
                    {data.language_mix.map(l => {
                      const maxCount = data.language_mix[0]?.count ?? 1
                      const pct = Math.round((l.count / maxCount) * 100)
                      return (
                        <div key={l.lang}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-300">{ANALYTICS_LANG_LABELS[l.lang] ?? l.lang}</span>
                            <span className="text-gray-500 flex-shrink-0">{l.count}×</span>
                          </div>
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ActivityBarChart({ activity }: { activity: { date: string; count: number }[] }) {
  const maxCount = Math.max(1, ...activity.map(a => a.count))
  return (
    <div className="flex items-end gap-[3px] h-16 overflow-x-auto">
      {activity.map(a => {
        const heightPct = Math.round((a.count / maxCount) * 100)
        const label = new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        return (
          <div
            key={a.date}
            className="flex-1 min-w-[6px] h-full flex items-end"
            title={`${label}: ${a.count} upload${a.count === 1 ? '' : 's'}`}
          >
            <div
              className={`w-full rounded-t-[3px] transition-all ${a.count > 0 ? 'bg-blue-500' : 'bg-gray-700'}`}
              style={{ height: a.count > 0 ? `${Math.max(heightPct, 8)}%` : '3px' }}
            />
          </div>
        )
      })}
    </div>
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
