'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Already installed or dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in window.navigator && (window.navigator as Record<string, unknown>).standalone === true)

    setIsIOS(ios)
    setIsStandalone(standalone)

    if (standalone) return // Already installed

    if (ios) {
      // Show iOS instructions after 3 seconds
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    else dismiss()
    setDeferredPrompt(null)
  }

  if (!show || isStandalone) return null

  // iOS — show share instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-sm mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">🎓</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Add to Home Screen</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-snug">
                  Tap <span className="font-semibold text-blue-600">Share</span>{' '}
                  <span className="text-base">⎙</span> then{' '}
                  <span className="font-semibold text-blue-600">Add to Home Screen</span>
                </p>
              </div>
            </div>
            <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none mt-0.5">×</button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Chrome — use native install prompt
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">🎓</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">Install StudyAI</p>
            <p className="text-gray-500 text-xs mt-0.5">Quick access from your home screen</p>
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none">×</button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={install}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition"
          >
            Install App
          </button>
          <button
            onClick={dismiss}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl transition"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
