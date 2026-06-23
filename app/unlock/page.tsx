'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function UnlockPage() {
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled')

  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  function validatePhone(value: string) {
    const normalized = value.replace(/[\s\-\(\)\.]/g, '')
    if (!normalized) { setPhoneError('Phone number is required.'); return false }
    if (!/^\+?[0-9]{7,15}$/.test(normalized)) { setPhoneError('Enter a valid phone number (7–15 digits).'); return false }
    setPhoneError(''); return true
  }

  function validateEmailLocal(value: string) {
    if (!value) { setEmailError('Email is required.'); return false }
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value)) {
      setEmailError('Enter a valid email address.'); return false
    }
    setEmailError(''); return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validatePhone(phone) || !validateEmailLocal(email)) return
    if (!code.trim()) { setMessage({ text: 'Please enter a code.', ok: false }); return }

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/unlock/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/[\s\-\(\)\.]/g, ''),
          email: email.trim().toLowerCase(),
          code: code.trim(),
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setMessage({ text: data.message || 'Unlock applied! You can now upload again.', ok: true })
        setCode('')
      } else {
        setMessage({ text: data.message || 'Invalid code. Please check and try again.', ok: false })
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', ok: false })
    } finally {
      setLoading(false)
    }
  }

  const whatsappNumber = '+9647700000000' // TODO: replace with your real WhatsApp number
  const whatsappMsg = encodeURIComponent(
    `Hello! I want to purchase more uploads for the study assistant. My phone: ${phone || '(enter above)'}`
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${whatsappMsg}`

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <div className="text-4xl mb-2">🔓</div>
          <h1 className="text-2xl font-bold">Get More Uploads</h1>
          <p className="text-blue-100 mt-1 text-sm">
            Contact us to pay, then enter the code we send you
          </p>
        </div>

        <div className="p-6 space-y-6">

          {/* Your details */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Your account details</p>
            <div>
              <input
                type="tel"
                placeholder="Phone number (e.g. +964 770 123 4567)"
                value={phone}
                onChange={e => { setPhone(e.target.value); if (phoneError) validatePhone(e.target.value) }}
                onBlur={() => validatePhone(phone)}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                  phoneError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) validateEmailLocal(e.target.value) }}
                onBlur={() => validateEmailLocal(email)}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                  emailError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Step 1: Contact on WhatsApp */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              Contact us to pay
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-3 text-sm text-gray-600 space-y-1">
              <p>⚡ <strong>1 extra upload</strong> — $0.99 (IQD equivalent)</p>
              <p>👑 <strong>Pro monthly</strong> — $4.99/mo — 60 uploads/month</p>
              <p className="text-xs text-gray-400 pt-1">Pay via ZainCash, FIB, bank transfer, or any method we agree on</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition shadow-md"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Message us on WhatsApp
            </a>
          </div>

          <hr className="border-gray-100" />

          {/* Step 2: Enter code */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              Enter the code we send you
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your unlock code (e.g. STUDY2024)"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                maxLength={20}
              />
              {message && (
                <div className={`rounded-xl p-3 text-sm text-center font-medium ${
                  message.ok
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  {message.ok ? '✅ ' : '❌ '}{message.text}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Checking...' : 'Apply Code'}
              </button>
            </form>
          </div>

        </div>

        <div className="bg-gray-50 px-6 py-4 text-center">
          <a href="/upload" className="text-sm text-blue-600 hover:underline">← Back to upload</a>
        </div>
      </div>
    </main>
  )
}
