'use client'

/**
 * app/components/QuizSection.tsx
 *
 * WHY THIS IS A SEPARATE FILE:
 * The results page (page.tsx) is a "server component" — it runs on the server
 * and can't respond to clicks. The quiz needs clicks, so it lives here as a
 * "client component" ('use client' at the top). The results page imports this
 * and passes in the quiz data as props.
 *
 * Think of it like: the server page is a printed paper, and this component is
 * a sticky interactive widget glued on top of it.
 */

import { useState } from 'react'

interface QuizItem {
  question: string
  options: string[]
  correct: string
  explanation: string
}

interface Props {
  quiz: QuizItem[]
  isRTL: boolean
}

export default function QuizSection({ quiz, isRTL }: Props) {
  // Track which answer the student picked for each question (index → letter)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showScore, setShowScore] = useState(false)

  const handleAnswer = (questionIndex: number, letter: string) => {
    // Once answered, lock it in — no changing
    if (answers[questionIndex]) return

    const newAnswers = { ...answers, [questionIndex]: letter }
    setAnswers(newAnswers)

    // Show the score card once every question is answered
    if (Object.keys(newAnswers).length === quiz.length) {
      setTimeout(() => setShowScore(true), 600)
    }
  }

  const score = quiz.filter((q, i) => answers[i] === q.correct).length
  const allAnswered = Object.keys(answers).length === quiz.length

  const labels = ['A', 'B', 'C', 'D']

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-4">
        {quiz.map((q, i) => {
          const userAnswer = answers[i]
          const answered = !!userAnswer
          const gotItRight = userAnswer === q.correct

          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              {/* Question */}
              <p className="font-semibold text-gray-800 mb-4 leading-snug">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mr-2 flex-shrink-0">
                  {i + 1}
                </span>
                {q.question}
              </p>

              {/* Answer options */}
              <div className="space-y-2">
                {q.options.map((opt, j) => {
                  const letter = labels[j]
                  const isCorrect = letter === q.correct
                  const isChosen = userAnswer === letter

                  // Color logic after answering:
                  // - Correct answer → green (whether chosen or not)
                  // - Wrong chosen answer → red
                  // - Other options → faded
                  let btnStyle = 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                  if (answered) {
                    if (isCorrect) {
                      btnStyle = 'border-green-400 bg-green-50 text-green-800 cursor-default'
                    } else if (isChosen && !isCorrect) {
                      btnStyle = 'border-red-400 bg-red-50 text-red-800 cursor-default'
                    } else {
                      btnStyle = 'border-gray-100 text-gray-400 cursor-default'
                    }
                  }

                  return (
                    <button
                      key={j}
                      onClick={() => handleAnswer(i, letter)}
                      disabled={answered}
                      className={`w-full text-left border-2 rounded-xl px-4 py-3 text-sm transition-all flex items-center gap-3 ${btnStyle}`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                        answered && isCorrect ? 'bg-green-500 border-green-500 text-white'
                        : answered && isChosen ? 'bg-red-400 border-red-400 text-white'
                        : 'border-current'
                      }`}>
                        {answered && isCorrect ? '✓' : answered && isChosen ? '✗' : letter}
                      </span>
                      <span>{opt.replace(/^[A-D]\)\s*/i, '')}</span>
                    </button>
                  )
                })}
              </div>

              {/* Explanation — shown after answering */}
              {answered && (
                <div className={`mt-3 text-sm rounded-xl p-3 leading-relaxed ${
                  gotItRight
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-orange-50 text-orange-800 border border-orange-200'
                }`}>
                  <span className="font-semibold">
                    {gotItRight ? '✓ Correct! ' : `✗ The answer is ${q.correct}. `}
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Score card — appears when all questions answered */}
      {showScore && (
        <div className={`mt-6 rounded-2xl p-8 text-center border-2 transition-all ${
          score === quiz.length
            ? 'bg-green-50 border-green-300'
            : score >= Math.ceil(quiz.length / 2)
            ? 'bg-blue-50 border-blue-300'
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="text-5xl mb-3">
            {score === quiz.length ? '🎉' : score >= Math.ceil(quiz.length / 2) ? '👍' : '📖'}
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">
            {score} / {quiz.length}
          </p>
          <p className="text-gray-600 font-medium">
            {score === quiz.length
              ? 'Perfect score! You mastered this topic.'
              : score >= Math.ceil(quiz.length / 2)
              ? 'Good work! Review the ones you missed.'
              : 'Keep studying — re-read the explanation above and try again.'}
          </p>
          {isRTL && (
            <p className="text-gray-400 text-sm mt-1">
              {score === quiz.length ? 'ممتاز! أتقنت هذا الموضوع' : 'راجع الشرح أعلاه وحاول مجدداً'}
            </p>
          )}
        </div>
      )}

      {/* Prompt if not yet started */}
      {Object.keys(answers).length === 0 && (
        <p className="text-center text-sm text-gray-400 mt-2">
          👆 Tap an answer to begin &nbsp;·&nbsp; اضغط على إجابة للبدء
        </p>
      )}
    </div>
  )
}
