'use client'

/**
 * app/upload/page.tsx — Upload Page (route: /upload)
 *
 * WHY 'use client' AT THE TOP:
 * This page needs to react to what the user does (typing, clicking,
 * selecting a photo). In Next.js, any page that does that must be a
 * "client component" — meaning it runs in the browser, not just on the server.
 */

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validatePhone = (value: string) => {
    const normalized = value.replace(/[\s\-\(\)\.]/g, '')
    if (!normalized) return ''
    if (!/^\+?[0-9]{7,15}$/.test(normalized)) {
      return 'Invalid number — use digits only, 7 to 15 digits (e.g. 07501234567)'
    }
    return ''
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // When a student picks a photo, show a preview of it
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) { setError('Please enter your phone number.'); return }
    const pErr = validatePhone(phone)
    if (pErr) { setPhoneError(pErr); return }
    if (!imageFile) { setError('Please select or take a photo.'); return }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('phone', phone.trim())
      formData.append('image', imageFile)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (res.status === 429) {
        // 429 means "too many requests" — they hit their limit
        setError(data.message || 'Upload limit reached. Please upgrade to continue.')
        return
      }

      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.')
        return
      }

      // Success — go to the results page
      router.push(`/results/${data.submissionId}`)

    } catch {
      setError('Network error. Please check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-2xl font-bold text-gray-900">AI Study Assistant</h1>
          <p className="text-gray-500 mt-1 text-sm">مساعد الدراسة الذكي</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Phone number input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-gray-400 font-normal">/ رقم الهاتف</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value)
                  setPhoneError(validatePhone(e.target.value))
                }}
                placeholder="+964 750 XXX XXXX"
                disabled={loading}
                className={`w-full border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 ${
                  phoneError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500'
                }`}
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1">⚠️ {phoneError}</p>
              )}
              {!phoneError && (
                <p className="text-xs text-gray-400 mt-1">Used to track your free uploads — no account needed</p>
              )}
            </div>

            {/* Image upload area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Study Material <span className="text-gray-400 font-normal">/ مادة الدراسة</span>
              </label>

              {/* Hidden file input — triggered by the button below */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
                disabled={loading}
              />

              {imagePreview ? (
                /* Show the selected image with a remove button */
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Selected study material"
                    className="w-full object-cover max-h-72"
                  />
                  {!loading && (
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null) }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                /* Tap/click area to open camera or file picker */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
                >
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-gray-600 text-sm font-medium">Take photo or choose image</p>
                  <p className="text-gray-400 text-xs mt-1">اضغط لالتقاط صورة أو اختيار صورة</p>
                  <p className="text-gray-300 text-xs mt-3">Textbook page • Slide • Handwritten notes</p>
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !phone.trim() || !!phoneError || !imageFile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing with AI… جاري التحليل
                </span>
              ) : (
                'Generate Study Plan / إنشاء خطة دراسة'
              )}
            </button>

            {/* Free tier note */}
            <p className="text-center text-xs text-gray-400">
              Free: 2 uploads/day &nbsp;•&nbsp; مجاني: رفعان يومياً
            </p>

          </form>
        </div>

        {/* Pricing link */}
        <p className="text-center mt-4 text-sm text-gray-500">
          Need more?{' '}
          <a href="/pricing" className="text-blue-600 hover:underline">
            See plans
          </a>
        </p>

      </div>
    </main>
  )
}
