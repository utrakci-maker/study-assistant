/**
 * app/results/[id]/page.tsx — Results Page (route: /results/[id])
 *
 * Server component: fetches the submission and the student's usage stats
 * from the database, then renders everything. Interactive parts (quiz,
 * copy button) are separate client components imported below.
 */

import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QuizSection from '@/app/components/QuizSection'
import CopyButton from '@/app/components/CopyButton'

interface Submission {
  id: string
  user_phone: string
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

interface UsageStats {
  uploads_today: number
  uploads_this_month: number
  tier: string
}

const DAILY_LIMITS: Record<string, number> = {
  free: 2,
  single_unlock: 999,
  pro_monthly: 999,
}

export default async function ResultsPage({ params }: { params: { id: string } }) {

  // Fetch submission and usage stats in parallel (faster than one-by-one)
  const { data: submission, error } = await supabaseAdmin
    .from('submissions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !submission) return notFound()

  // Fetch usage stats using the phone from the submission
  const { data: usage } = await supabaseAdmin
    .from('usage_tracking')
    .select('uploads_today, uploads_this_month, tier')
    .eq('user_phone', submission.user_phone)
    .single()

  // ── Error states ───────────────────────────────────────────────

  if (submission.status === 'failed') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-sm p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Failed</h1>
          <p className="text-gray-500 mb-6">
            The AI could not read the image clearly. Please try again with a well-lit, clear photo.
          </p>
          <Link href="/upload" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 inline-block font-medium">
            Try Again
          </Link>
        </div>
      </main>
    )
  }

  if (submission.status === 'pending') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-sm p-8">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Still Processing…</h1>
          <p className="text-gray-500">Refresh the page in a few seconds.</p>
        </div>
      </main>
    )
  }

  // ── Main results ───────────────────────────────────────────────

  const s = submission as Submission
  const isRTL = s.detected_language === 'ar' || s.detected_language === 'ku'
  const stats = usage as UsageStats | null

  // Calculate remaining uploads for today
  const dailyLimit = DAILY_LIMITS[stats?.tier ?? 'free'] ?? 2
  const usedToday = stats?.uploads_today ?? 0
  const remainingToday = Math.max(0, dailyLimit - usedToday)
  const isAtLimit = remainingToday === 0
  const isFree = (stats?.tier ?? 'free') === 'free'

  const langLabel =
    s.detected_language === 'ar' ? 'Arabic / عربي'
    : s.detected_language === 'ku' ? 'Kurdish / كوردی'
    : 'English'

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Nav row */}
        <div className="flex items-center justify-between">
          <Link href="/upload" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            ← {isRTL ? 'رفع صورة جديدة' : 'Upload another'}
          </Link>
          <CopyButton
            topicTitle={s.topic_title}
            summary={s.summary}
            studyPlan={s.study_plan}
            isRTL={isRTL}
          />
        </div>

        {/* ── Uploads remaining banner ── */}
        {isFree && isAtLimit && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 text-sm">
                {isRTL ? 'وصلت إلى الحد اليومي المجاني' : "You've reached today's free limit"}
              </p>
              <p className="text-amber-700 text-xs mt-0.5">
                {isRTL
                  ? 'ادفع 0.99$ لفتح رفع إضافي أو اشترك بـ Pro'
                  : 'Pay $0.99 for one more upload, or upgrade to Pro for unlimited.'}
              </p>
              <div className="flex gap-2 mt-3">
                <Link href="/unlock" className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                  {isRTL ? 'فتح مقابل 0.99$' : 'Unlock — $0.99'}
                </Link>
                <Link href="/pricing" className="border border-amber-400 text-amber-800 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors">
                  {isRTL ? 'ترقية إلى Pro' : 'Upgrade to Pro'}
                </Link>
              </div>
            </div>
          </div>
        )}

        {isFree && !isAtLimit && (
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm">
            <span className="text-sm text-gray-500">
              {isRTL ? 'الرفعات المتبقية اليوم' : 'Free uploads left today'}
            </span>
            <div className="flex items-center gap-2">
              {Array.from({ length: dailyLimit }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < remainingToday ? 'bg-green-400' : 'bg-gray-200'}`}
                />
              ))}
              <span className="text-sm font-semibold text-gray-700 ml-1">{remainingToday}/{dailyLimit}</span>
            </div>
          </div>
        )}

        {/* ── Topic card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">📖</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                {isRTL ? 'الموضوع' : 'Topic'}
              </p>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{s.topic_title}</h1>
              <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                {langLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ── Summary ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>📝</span> {isRTL ? 'الملخص' : 'Summary'}
          </h2>
          <p className="text-gray-700 leading-relaxed">{s.summary}</p>
        </div>

        {/* ── Study Plan ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🗺️</span> {isRTL ? 'خطة الدراسة' : 'Study Plan'}
          </h2>
          <ol className="space-y-3">
            {(s.study_plan || []).map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-700 pt-0.5 leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Explanation ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>💡</span> {isRTL ? 'الشرح التفصيلي' : 'Full Explanation'}
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{s.explanation}</p>
        </div>

        {/* ── Interactive Quiz ── */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 px-1">
            <span>🧠</span> {isRTL ? 'اختبر نفسك' : 'Test Yourself'}
          </h2>
          <QuizSection quiz={s.quiz || []} isRTL={isRTL} />
        </div>

        {/* ── Bottom CTA ── */}
        <div className="text-center pb-10 pt-4">
          <Link
            href="/upload"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 inline-block font-medium shadow-sm"
          >
            {isRTL ? 'رفع مادة أخرى' : 'Upload Another Subject'}
          </Link>
        </div>

      </div>
    </main>
  )
}
