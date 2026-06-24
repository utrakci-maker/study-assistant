'use client'

import { useState } from 'react'

interface QuizItem {
  question: string
  options: string[]
  correct: string
  explanation: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

interface Props {
  quiz: QuizItem[]
  isRTL: boolean
}

const DIFFICULTY_LABEL: Record<string, { label: string; labelAr: string; color: string }> = {
  easy:   { label: 'Easy',   labelAr: 'سهل',   color: 'bg-green-100 text-green-700 border-green-200' },
  medium: { label: 'Medium', labelAr: 'متوسط', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  hard:   { label: 'Hard',   labelAr: 'صعب',   color: 'bg-red-100 text-red-700 border-red-200' },
}

export default function QuizSection({ quiz, isRTL }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showScore, setShowScore] = useState(false)

  const handleAnswer = (questionIndex: number, letter: string) => {
    if (answers[questionIndex]) return
    const newAnswers = { ...answers, [questionIndex]: letter }
    setAnswers(newAnswers)
    if (Object.keys(newAnswers).length === quiz.length) {
      setTimeout(() => setShowScore(true), 600)
    }
  }

  const score = quiz.filter((q, i) => answers[i] === q.correct).length
  const labels = ['A', 'B', 'C', 'D']
  const pct = quiz.length > 0 ? Math.round((score / quiz.length) * 100) : 0

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4">

      {/* Question count + progress bar */}
      {Object.keys(answers).length > 0 && !showScore && (
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(Object.keys(answers).length / quiz.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {Object.keys(answers).length}/{quiz.length}
          </span>
        </div>
      )}

      {quiz.map((q, i) => {
        const userAnswer = answers[i]
        const answered = !!userAnswer
        const gotItRight = userAnswer === q.correct
        const diff = q.difficulty && DIFFICULTY_LABEL[q.difficulty]

        return (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Question header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  {diff && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${diff.color}`}>
                      {isRTL ? diff.labelAr : diff.label}
                    </span>
                  )}
                </div>
                {answered && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    gotItRight ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {gotItRight ? '✓ Correct' : '✗ Wrong'}
                  </span>
                )}
              </div>
              <p className="font-semibold text-gray-800 leading-snug text-sm">{q.question}</p>
            </div>

            {/* Answer options */}
            <div className="px-4 pb-4 space-y-2">
              {q.options.map((opt, j) => {
                const letter = labels[j]
                const isCorrect = letter === q.correct
                const isChosen = userAnswer === letter

                let btnStyle = 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300 cursor-pointer'
                if (answered) {
                  if (isCorrect) btnStyle = 'border-green-400 bg-green-50 text-green-800 cursor-default'
                  else if (isChosen) btnStyle = 'border-red-400 bg-red-50 text-red-800 cursor-default'
                  else btnStyle = 'border-gray-100 text-gray-400 cursor-default opacity-60'
                }

                return (
                  <button
                    key={j}
                    onClick={() => handleAnswer(i, letter)}
                    disabled={answered}
                    className={`w-full text-left border-2 rounded-xl px-4 py-2.5 text-sm transition-all flex items-center gap-3 ${btnStyle}`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      answered && isCorrect ? 'bg-green-500 border-green-500 text-white'
                      : answered && isChosen ? 'bg-red-400 border-red-400 text-white'
                      : 'border-current'
                    }`}>
                      {answered && isCorrect ? '✓' : answered && isChosen && !isCorrect ? '✗' : letter}
                    </span>
                    <span>{opt.replace(/^[A-D]\)\s*/i, '')}</span>
                  </button>
                )
              })}
            </div>

            {/* Explanation — shown after answering */}
            {answered && (
              <div className={`mx-4 mb-4 text-sm rounded-xl p-4 leading-relaxed ${
                gotItRight
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-orange-50 text-orange-800 border border-orange-200'
              }`}>
                <p className="font-semibold mb-1">
                  {gotItRight ? '✓ Correct!' : `✗ The answer is ${q.correct}`}
                </p>
                <p>{q.explanation}</p>
              </div>
            )}
          </div>
        )
      })}

      {/* Score card */}
      {showScore && (
        <div className={`mt-2 rounded-2xl p-8 text-center border-2 ${
          pct === 100 ? 'bg-green-50 border-green-300'
          : pct >= 60  ? 'bg-blue-50 border-blue-300'
          : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="text-5xl mb-3">
            {pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📖'}
          </div>
          <p className="text-5xl font-extrabold text-gray-900 mb-1">{pct}%</p>
          <p className="text-lg font-semibold text-gray-700 mb-1">{score} / {quiz.length} correct</p>
          <p className="text-gray-500 text-sm">
            {pct === 100
              ? 'Perfect! You have fully mastered this topic.'
              : pct >= 80
              ? 'Excellent! Review the ones you missed and you are done.'
              : pct >= 60
              ? 'Good progress. Re-read the explanation and try those questions again.'
              : 'Keep going — re-read the full explanation above before retrying.'}
          </p>

          {/* Difficulty breakdown */}
          {quiz.some(q => q.difficulty) && (
            <div className="mt-4 flex justify-center gap-3 text-xs flex-wrap">
              {(['easy', 'medium', 'hard'] as const).map(d => {
                const qs = quiz.filter(q => q.difficulty === d)
                if (qs.length === 0) return null
                const correct = qs.filter((q, _) => answers[quiz.indexOf(q)] === q.correct).length
                const cfg = DIFFICULTY_LABEL[d]
                return (
                  <span key={d} className={`px-3 py-1 rounded-full border font-medium ${cfg.color}`}>
                    {cfg.label}: {correct}/{qs.length}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Start prompt */}
      {Object.keys(answers).length === 0 && (
        <p className="text-center text-sm text-gray-400 py-2">
          Tap an answer to begin &nbsp;·&nbsp; اضغط على إجابة للبدء &nbsp;·&nbsp; کلیک بکە بۆ دەستپێکردن
        </p>
      )}
    </div>
  )
}
