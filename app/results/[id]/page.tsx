/**
 * app/results/[id]/page.tsx — Results Page (route: /results/[id])
 *
 * WHY THIS IS A SERVER COMPONENT (no 'use client'):
 * This page fetches data from the database and displays it.
 * In Next.js, pages without 'use client' run on the server — they load
 * the data before sending anything to the browser, which is faster and
 * better for SEO. The student sees the full page immediately.
 *
 * The interactive quiz will be added in Day 3.
 */

import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Submission {
  id: string
  topic_title: string
  detected_language: string
  study_plan: string[]
  summary: string
  explanation: string
  quiz: Array<{ question: string; options: string[]; correct: string; explanation: string }>
  status: string
  tier_used: string
  created_at: string
}

export default async function ResultsPage({ params }: { params: { id: string } }) {

  // Fetch the submission from the database
  const { data: submission, error } = await supabaseAdmin
    .from('submissions')
    .select('*')
    .eq('id', params.id)
    .single()

  // If not found or failed, show 404
  if (error || !submission) return notFound()
  if (submission.status === 'failed') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Failed</h1>
          <p className="text-gray-500 mb-6">The AI could not read your image clearly. Please try again with a better-lit, clearer photo.</p>
          <Link href="/upload" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 inline-block">
            Try Again
          </Link>
        </div>
      </main>
    )
  }

  if (submission.status === 'pending') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Still Processing…</h1>
          <p className="text-gray-500">Please wait a moment and refresh the page.</p>
        </div>
      </main>
    )
  }

  const s = submission as Submission
  const isRTL = s.detected_language === 'ar' || s.detected_language === 'ku'

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Back link */}
        <Link href="/upload" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
          ← {isRTL ? 'رفع صورة جديدة' : 'Upload another'}
        </Link>

        {/* Topic title */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📖</span>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Topic / الموضوع</p>
              <h1 className="text-xl font-bold text-gray-900">{s.topic_title}</h1>
              <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {s.detected_language === 'ar' ? 'Arabic / عربي' : s.detected_language === 'ku' ? 'Kurdish / كوردی' : 'English'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>📝</span> {isRTL ? 'الملخص' : 'Summary'}
          </h2>
          <p className="text-gray-700 leading-relaxed">{s.summary}</p>
        </div>

        {/* Study Plan */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🗺️</span> {isRTL ? 'خطة الدراسة' : 'Study Plan'}
          </h2>
          <ol className="space-y-3">
            {(s.study_plan || []).map((step: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-700 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Explanation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>💡</span> {isRTL ? 'الشرح التفصيلي' : 'Full Explanation'}
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{s.explanation}</p>
        </div>

        {/* Quiz preview — full interactive version Day 3 */}
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
          <h2 className="text-base font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <span>🧠</span> {isRTL ? 'الاختبار القصير' : 'Quiz'}{' '}
            <span className="text-xs font-normal text-amber-600">(Interactive version — Day 3)</span>
          </h2>
          <div className="space-y-4">
            {(s.quiz || []).map((q, i: number) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-amber-100">
                <p className="font-medium text-gray-800 mb-2">
                  {i + 1}. {q.question}
                </p>
                <ul className="space-y-1">
                  {q.options.map((opt: string, j: number) => (
                    <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        opt.startsWith(q.correct) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {['A','B','C','D'][j]}
                      </span>
                      {opt.replace(/^[A-D]\)\s*/, '')}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-green-700 mt-2 bg-green-50 rounded-lg p-2">
                  ✓ {q.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Upload another */}
        <div className="text-center pb-8">
          <Link
            href="/upload"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 inline-block font-medium"
          >
            {isRTL ? 'رفع مادة أخرى' : 'Upload Another Subject'}
          </Link>
        </div>

      </div>
    </main>
  )
}
