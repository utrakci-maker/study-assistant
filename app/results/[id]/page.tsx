/**
 * app/results/[id]/page.tsx
 * Server component — fetches submission + usage stats, renders results.
 */

import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QuizSection from '@/app/components/QuizSection'
import CopyButton from '@/app/components/CopyButton'
import PrintButton from '@/app/components/PrintButton'
import WhatsAppShareButton from '@/app/components/WhatsAppShareButton'

const SITE_URL = 'https://study-assistant-ashy.vercel.app'

interface Submission {
  id: string
  user_phone: string
  topic_title: string
  detected_language: string
  study_plan: string[]
  summary: string
  explanation: string
  quiz: Array<{ question: string; options: string[]; correct: string; explanation: string; difficulty?: 'easy' | 'medium' | 'hard' }>
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

// ── Parses structured AI explanation into visual sections ──────────────
// The new AI prompt returns sections separated by emoji headers.
// If the old plain-text format is detected, returns null (falls back to plain text).
interface ExplainSection {
  emoji: string
  title: string
  titleAr: string
  content: string
  bg: string
  border: string
  headerBg: string
  textColor: string
}

function parseExplanation(text: string): ExplainSection[] | null {
  const MARKERS = [
    { emoji: '🔑', title: 'Core Concept',        titleAr: 'المفهوم الأساسي',     bg: 'bg-blue-50',   border: 'border-blue-200',  headerBg: 'bg-blue-100',   textColor: 'text-blue-900' },
    { emoji: '📚', title: 'Key Principles',       titleAr: 'المبادئ الرئيسية',    bg: 'bg-purple-50', border: 'border-purple-200', headerBg: 'bg-purple-100', textColor: 'text-purple-900' },
    { emoji: '⚠️', title: 'Common Mistakes',      titleAr: 'الأخطاء الشائعة',     bg: 'bg-red-50',    border: 'border-red-200',    headerBg: 'bg-red-100',    textColor: 'text-red-900' },
    { emoji: '🌍', title: 'Real-World Application', titleAr: 'التطبيق الواقعي',   bg: 'bg-green-50',  border: 'border-green-200',  headerBg: 'bg-green-100',  textColor: 'text-green-900' },
    { emoji: '💡', title: 'Memory Tip',           titleAr: 'نصيحة للحفظ',         bg: 'bg-amber-50',  border: 'border-amber-200',  headerBg: 'bg-amber-100',  textColor: 'text-amber-900' },
  ]

  // Only parse if structured format detected
  const hasStructure = MARKERS.some(m => text.includes(m.emoji))
  if (!hasStructure) return null

  const sections: ExplainSection[] = []
  const lines = text.split('\n')
  let currentMarker: typeof MARKERS[0] | null = null
  let currentContent: string[] = []

  const flush = () => {
    if (currentMarker && currentContent.length > 0) {
      sections.push({
        ...currentMarker,
        content: currentContent.join('\n').trim(),
      })
    }
  }

  for (const line of lines) {
    const found = MARKERS.find(m => line.includes(m.emoji))
    if (found) {
      flush()
      currentMarker = found
      currentContent = []
      // Include any text on the same line after the header
      const afterHeader = line.replace(/.*?:/, '').trim()
      if (afterHeader) currentContent.push(afterHeader)
    } else if (currentMarker) {
      currentContent.push(line)
    }
  }
  flush()

  return sections.length > 0 ? sections : null
}

export default async function ResultsPage({ params }: { params: { id: string } }) {

  const [{ data: submission, error }, ] = await Promise.all([
    supabaseAdmin.from('submissions').select('*').eq('id', params.id).single(),
  ])

  if (error || !submission) return notFound()

  const { data: usage } = await supabaseAdmin
    .from('usage_tracking')
    .select('uploads_today, uploads_this_month, tier')
    .eq('user_phone', submission.user_phone)
    .single()

  if (submission.status === 'failed') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-sm p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Failed</h1>
          <p className="text-gray-500 mb-6">The AI could not read the image clearly. Please try again with a well-lit, clear photo of text or diagrams.</p>
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

  const s = submission as Submission
  const isRTL = s.detected_language === 'ar' || s.detected_language === 'ku'
  const stats = usage as UsageStats | null
  const dailyLimit = DAILY_LIMITS[stats?.tier ?? 'free'] ?? 2
  const usedToday = stats?.uploads_today ?? 0
  const remainingToday = Math.max(0, dailyLimit - usedToday)
  const isAtLimit = remainingToday === 0
  const isFree = (stats?.tier ?? 'free') === 'free'

  const langLabel =
    s.detected_language === 'ar' ? 'Arabic / عربي'
    : s.detected_language === 'ku' ? 'Kurdish / کوردی'
    : 'English'

  const explainSections = parseExplanation(s.explanation || '')

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white print:bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── Nav bar (hidden on print) ── */}
        <div className="flex items-center justify-between py-2 print:hidden">
          <div className="flex items-center gap-3">
            <Link href="/upload" className="text-sm text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
              {isRTL ? '← رفع جديد' : '← Upload'}
            </Link>
            <span className="text-gray-300 text-xs">·</span>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition">
              {isRTL ? 'لوحتي' : 'Dashboard'}
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <WhatsAppShareButton topicTitle={s.topic_title} resultUrl={`${SITE_URL}/results/${s.id}`} isRTL={isRTL} />
            <CopyButton topicTitle={s.topic_title} summary={s.summary} studyPlan={s.study_plan} isRTL={isRTL} />
            <PrintButton isRTL={isRTL} />
          </div>
        </div>

        {/* ── Print-only header ── */}
        <div className="hidden print:block border-b border-gray-200 pb-5 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🎓</span>
            <span className="font-extrabold text-xl text-gray-900">StudyAI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{s.topic_title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}{langLabel}
          </p>
        </div>

        {/* ── Limit banner (hidden on print) ── */}
        {isFree && isAtLimit && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 print:hidden">
            <span className="text-2xl flex-shrink-0">🔒</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 text-sm">
                {isRTL ? 'وصلت إلى الحد اليومي المجاني' : "You've reached today's free limit"}
              </p>
              <p className="text-amber-700 text-xs mt-0.5 mb-3">
                {isRTL ? 'تواصل معنا عبر واتساب للحصول على رفعة إضافية' : 'Contact us on WhatsApp to get more uploads.'}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Link href="/unlock" className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition">
                  {isRTL ? 'فتح مقابل $0.99' : 'Unlock — $0.99'}
                </Link>
                <Link href="/pricing" className="border border-amber-400 text-amber-800 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-100 transition">
                  {isRTL ? 'ترقية إلى Pro' : 'See Pro Plan — $10/mo'}
                </Link>
              </div>
            </div>
          </div>
        )}

        {isFree && !isAtLimit && (
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm print:hidden">
            <span className="text-sm text-gray-500">
              {isRTL ? 'الرفعات المتبقية اليوم' : 'Free uploads left today'}
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: dailyLimit }).map((_, i) => (
                <span key={i} className={`w-3 h-3 rounded-full transition-colors ${i < remainingToday ? 'bg-green-400' : 'bg-gray-200'}`} />
              ))}
              <span className="text-sm font-bold text-gray-700 ml-1">{remainingToday}/{dailyLimit}</span>
            </div>
          </div>
        )}

        {/* ── Topic card ── */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">📖</span>
            <div className="flex-1 min-w-0">
              <p className="text-blue-200 text-xs uppercase tracking-widest mb-1">
                {isRTL ? 'الموضوع' : 'Topic'}
              </p>
              <h1 className="text-xl font-bold leading-snug">{s.topic_title}</h1>
              <span className="inline-block mt-2 text-xs bg-white/20 text-white px-3 py-1 rounded-full">
                {langLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ── Summary ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>📝</span> {isRTL ? 'الملخص' : 'Summary'}
          </h2>
          <p className="text-gray-800 leading-relaxed text-base">{s.summary}</p>
        </div>

        {/* ── Study Plan ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🗺️</span> {isRTL ? 'خطة الدراسة' : 'Study Plan'}
          </h2>
          <ol className="space-y-3">
            {(s.study_plan || []).map((step, i) => {
              // Highlight the action verb (text before first space or dash)
              const dashIdx = step.indexOf(' — ')
              const hasDash = dashIdx !== -1
              const mainPart = hasDash ? step.slice(0, dashIdx) : step
              const reasonPart = hasDash ? step.slice(dashIdx + 3) : null

              return (
                <li key={i} className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm group-hover:bg-blue-700 transition-colors">
                    {i + 1}
                  </span>
                  <div className="pt-1 flex-1 min-w-0">
                    <span className="text-gray-900 font-semibold text-sm">{mainPart}</span>
                    {reasonPart && (
                      <span className="text-gray-500 text-sm"> — {reasonPart}</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        {/* ── Explanation — structured or plain ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2 px-1">
            <span>💡</span> {isRTL ? 'الشرح التفصيلي' : 'Full Explanation'}
          </h2>

          {explainSections ? (
            // ── New structured format ─────────────────────────────
            <div className="space-y-3">
              {explainSections.map((sec, i) => (
                <div key={i} className={`rounded-2xl border ${sec.border} ${sec.bg} overflow-hidden`}>
                  <div className={`${sec.headerBg} px-5 py-3 flex items-center gap-2`}>
                    <span className="text-lg">{sec.emoji}</span>
                    <h3 className={`font-bold text-sm ${sec.textColor}`}>
                      {isRTL ? sec.titleAr : sec.title}
                    </h3>
                  </div>
                  <div className={`px-5 py-4 text-sm ${sec.textColor} leading-relaxed whitespace-pre-line`}>
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ── Old plain-text format (cached content) ─────────────
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{s.explanation}</p>
            </div>
          )}
        </div>

        {/* ── Interactive Quiz (hidden on print — not print-friendly) ── */}
        <div className="print:hidden">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center justify-between px-1">
            <span className="flex items-center gap-2">
              <span>🧠</span>
              {isRTL ? 'اختبر نفسك' : 'Test Yourself'}
            </span>
            <span className="text-xs font-normal text-gray-400 normal-case">
              {(s.quiz || []).length} {isRTL ? 'أسئلة' : 'questions'}
            </span>
          </h2>
          <QuizSection quiz={s.quiz || []} isRTL={isRTL} />
        </div>

        {/* ── Bottom CTA (hidden on print) ── */}
        <div className="text-center pb-8 pt-4 space-y-3 print:hidden">
          <Link
            href="/upload"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 inline-block font-semibold shadow-sm hover:shadow-md transition-all"
          >
            {isRTL ? '← رفع مادة أخرى' : 'Upload Another Subject →'}
          </Link>
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-gray-600 transition">{isRTL ? 'لوحتي' : 'Dashboard'}</Link>
            <span>·</span>
            <Link href="/" className="hover:text-gray-600 transition">{isRTL ? 'الرئيسية' : 'Home'}</Link>
          </div>
        </div>

        {/* ── Print footer ── */}
        <div className="hidden print:block border-t border-gray-200 pt-4 mt-4 text-center text-xs text-gray-400">
          StudyAI · study-assistant-ashy.vercel.app · Powered by Claude AI
        </div>

      </div>
    </main>
  )
}
