'use client'

/**
 * app/components/CopyButton.tsx
 *
 * A button that copies the student's study notes to their clipboard
 * so they can paste them into WhatsApp, Telegram, or their own notes app.
 * Needs 'use client' because it accesses the browser's clipboard API.
 */

import { useState } from 'react'

interface Props {
  topicTitle: string
  summary: string
  studyPlan: string[]
  isRTL: boolean
}

export default function CopyButton({ topicTitle, summary, studyPlan, isRTL }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const steps = studyPlan.map((s, i) => `${i + 1}. ${s}`).join('\n')
    const text = `📚 ${topicTitle}\n\n📝 Summary:\n${summary}\n\n🗺️ Study Plan:\n${steps}\n\n— AI Study Assistant`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for browsers that block clipboard access
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-300 transition-all"
    >
      {copied ? (
        <>
          <span>✓</span>
          <span>{isRTL ? 'تم النسخ!' : 'Copied!'}</span>
        </>
      ) : (
        <>
          <span>📋</span>
          <span>{isRTL ? 'نسخ الملاحظات' : 'Copy Study Notes'}</span>
        </>
      )}
    </button>
  )
}
