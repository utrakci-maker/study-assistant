/**
 * app/results/[id]/page.tsx — Results Page (route: /results/[submissionId])
 * Full design coming Day 3.
 * The [id] in the folder name is a "dynamic route" — it means any URL like
 * /results/abc-123 will load this page, and "abc-123" is the submission ID.
 */
export default function ResultsPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-lg">
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Study Results</h1>
        <p className="text-xl text-green-600 font-medium mb-2">Coming Day 3</p>
        <p className="text-gray-500 mb-4">
          This page will show the AI-generated study plan, summary, explanation,
          and quiz for submission: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{params.id}</code>
        </p>
        <div className="mt-6 p-4 bg-green-50 rounded-lg text-sm text-green-700">
          Day 3 will add: study plan display, summary, full explanation, interactive quiz, and the tier unlock prompt.
        </div>
      </div>
    </main>
  )
}
