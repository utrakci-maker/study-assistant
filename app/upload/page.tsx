'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { validateEmail } from '@/lib/emailUtils'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

const LOADING_STAGES = [
  { msg: 'Uploading your image…',         msgAr: 'جاري رفع الصورة…',          pct: 15 },
  { msg: 'AI is reading the content…',    msgAr: 'الذكاء الاصطناعي يقرأ المحتوى…', pct: 40 },
  { msg: 'Building your study plan…',     msgAr: 'جاري إنشاء خطة الدراسة…',   pct: 70 },
  { msg: 'Generating quiz questions…',    msgAr: 'جاري إعداد الأسئلة…',        pct: 88 },
  { msg: 'Almost done…',                  msgAr: 'تقريباً انتهينا…',            pct: 96 },
]

interface AuthUser {
  name: string
  email: string
  avatar: string
  token: string
}

export default function UploadPage() {
  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Anonymous form state
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [returning, setReturning] = useState(false)

  // Shared state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Check for logged-in student session
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const meta = session.user.user_metadata ?? {}
        setAuthUser({
          name: meta.name ?? meta.full_name ?? session.user.email ?? '',
          email: session.user.email ?? '',
          avatar: meta.avatar_url ?? meta.picture ?? '',
          token: session.access_token,
        })
      } else {
        // Anonymous user — load saved phone/email
        const savedPhone = localStorage.getItem('studyai_phone') || ''
        const savedEmail = localStorage.getItem('studyai_email') || ''
        if (savedPhone) { setPhone(savedPhone); setReturning(true) }
        if (savedEmail) setEmail(savedEmail)
      }
      setAuthLoading(false)
    })
  }, [])

  const validatePhone = (value: string) => {
    const normalized = value.replace(/[\s\-\(\)\.]/g, '')
    if (!normalized) return ''
    if (!/^\+?[0-9]{7,15}$/.test(normalized)) return 'Use digits only, 7–15 digits (e.g. 07501234567)'
    return ''
  }

  const applyImage = (file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) applyImage(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) applyImage(file)
  }, [])

  useEffect(() => {
    if (!loading) { setLoadingStage(0); return }
    const timers = LOADING_STAGES.map((_, i) =>
      setTimeout(() => setLoadingStage(i), i === 0 ? 0 : i * 4500)
    )
    return () => timers.forEach(clearTimeout)
  }, [loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!authUser) {
      const pErr = validatePhone(phone)
      if (!phone.trim()) { setError('Please enter your phone number.'); return }
      if (pErr) { setPhoneError(pErr); return }
      const eErr = validateEmail(email)
      if (!email.trim()) { setError('Please enter your email address.'); return }
      if (eErr) { setEmailError(eErr); return }
    }

    if (!imageFile) { setError('Please select or take a photo.'); return }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('image', imageFile)

    const headers: Record<string, string> = {}

    if (authUser) {
      headers['X-Student-Token'] = authUser.token
    } else {
      localStorage.setItem('studyai_phone', phone.trim())
      localStorage.setItem('studyai_email', email.trim())
      formData.append('phone', phone.trim())
      formData.append('email', email.trim())
    }

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, headers })
      const data = await res.json()

      if (res.status === 401) {
        // Session expired — sign out and reload
        await supabaseBrowser.auth.signOut()
        setAuthUser(null)
        setAuthLoading(false)
        setError('Your session expired. Please sign in again.')
        setLoading(false)
        return
      }
      if (res.status === 403) {
        setError('Your account is not yet activated. Please contact admin on WhatsApp.')
        setLoading(false)
        return
      }
      if (res.status === 429) {
        setError(data.message || 'Upload limit reached. Visit /unlock to continue.')
        setLoading(false)
        return
      }
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      router.push(`/results/${data.submissionId}`)
    } catch {
      setError('Network error. Please check your internet connection and try again.')
      setLoading(false)
    }
  }

  const stage = LOADING_STAGES[Math.min(loadingStage, LOADING_STAGES.length - 1)]

  // Show spinner while checking auth
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-4xl animate-pulse">📚</div>
      </main>
    )
  }

  const isSubmitDisabled = loading || !imageFile || (
    !authUser && (!phone.trim() || !!phoneError || !email.trim() || !!emailError)
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🎓</span>
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">StudyAI</span>
          </a>
          <h1 className="text-2xl font-bold text-gray-900">Upload Study Material</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {authUser
              ? 'Your account is linked — just pick your photo and go!'
              : returning
                ? 'Welcome back! Your details are pre-filled below.'
                : 'Get a full study plan + quiz in 30 seconds'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Logged-in student banner */}
          {authUser && (
            <div className="bg-blue-50 border-b border-blue-100 px-5 py-4 flex items-center gap-3">
              {authUser.avatar && (
                <img src={authUser.avatar} alt="" className="w-10 h-10 rounded-full border border-blue-200 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-blue-900 font-semibold text-sm truncate">{authUser.name}</p>
                <p className="text-blue-600 text-xs truncate">{authUser.email}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await supabaseBrowser.auth.signOut()
                  router.push('/login')
                }}
                className="text-xs text-blue-400 hover:text-blue-600 transition flex-shrink-0"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Anonymous returning user banner */}
          {!authUser && returning && (
            <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center gap-2 text-sm text-blue-700">
              <span>👋</span>
              <span>Welcome back — your phone and email are pre-filled.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Phone + Email — only shown to anonymous users */}
            {!authUser && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone Number <span className="text-gray-400 font-normal text-xs">/ رقم الهاتف</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneError(validatePhone(e.target.value)) }}
                    placeholder="+964 750 XXX XXXX"
                    disabled={loading}
                    className={`w-full border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400 ${
                      phoneError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {phoneError
                    ? <p className="text-xs text-red-500 mt-1.5">⚠️ {phoneError}</p>
                    : <p className="text-xs text-gray-400 mt-1.5">Tracks your free uploads — no account needed</p>
                  }
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-gray-400 font-normal text-xs">/ البريد الإلكتروني</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(validateEmail(e.target.value)) }}
                    placeholder="you@gmail.com"
                    disabled={loading}
                    className={`w-full border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400 ${
                      emailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  />
                  {emailError
                    ? <p className="text-xs text-red-500 mt-1.5">⚠️ {emailError}</p>
                    : <p className="text-xs text-gray-400 mt-1.5">Used alongside your phone to prevent limit bypassing</p>
                  }
                </div>
              </>
            )}

            {/* Image upload area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Study Material <span className="text-gray-400 font-normal text-xs">/ مادة الدراسة</span>
              </label>

              <input ref={fileInputRef}   type="file" accept="image/*"                  onChange={handleImageChange} className="hidden" disabled={loading} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" disabled={loading} />

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <img src={imagePreview} alt="Selected study material" className="w-full object-cover max-h-72" />
                  {!loading && (
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null) }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors shadow-lg"
                    >
                      ✕
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-xs text-center">✓ Ready to analyse</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-4xl mb-2">{isDragging ? '📥' : '📄'}</div>
                    <p className="text-gray-700 text-sm font-semibold">
                      {isDragging ? 'Drop your image here' : 'Drag & drop or click to choose'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">اسحب وأفلت أو اضغط لاختيار ملف</p>
                    <p className="text-gray-300 text-xs mt-3">Textbook · Slide · Handwritten notes · Max 5MB</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={loading}
                    className="mt-2 w-full flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-700 font-semibold py-3 rounded-xl transition-all text-sm"
                  >
                    <span className="text-xl">📷</span>
                    Take Photo with Camera &nbsp;·&nbsp; التقط صورة بالكاميرا
                  </button>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-start gap-2">
                <span className="flex-shrink-0">⚠️</span>
                <div>
                  <span>{error}</span>
                  {error.includes('not yet activated') && (
                    <a
                      href="https://wa.me/9647754822210"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-green-600 font-semibold hover:underline"
                    >
                      📱 Message admin on WhatsApp →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-4 font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">{stage.msg}</span>
                  </div>
                  <div className="h-1 bg-blue-500/40 rounded-full mx-4 overflow-hidden">
                    <div
                      className="h-full bg-white/70 rounded-full transition-all duration-1000"
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                </div>
              ) : (
                'Generate Study Plan / إنشاء خطة دراسة'
              )}
            </button>

            {!authUser && (
              <p className="text-center text-xs text-gray-400">
                Free: 2 uploads/day &nbsp;·&nbsp; مجاني: رفعان يومياً
              </p>
            )}

          </form>
        </div>

        {/* Footer links */}
        <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
          {authUser ? (
            <Link href="/dashboard" className="hover:text-blue-600 hover:underline">← My Dashboard</Link>
          ) : (
            <a href="/history" className="hover:text-blue-600 hover:underline">My History</a>
          )}
          <span>·</span>
          <a href="/pricing" className="hover:text-blue-600 hover:underline">Pricing</a>
          <span>·</span>
          <a href="/" className="hover:text-blue-600 hover:underline">Home</a>
        </div>
      </div>
    </main>
  )
}
