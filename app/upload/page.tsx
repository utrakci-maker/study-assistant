/**
 * app/upload/page.tsx — Upload Page (route: /upload)
 * Full design coming Day 2.
 * This is where students will take a photo of their textbook/slide.
 */
export default function UploadPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-lg">
        <div className="text-6xl mb-4">📸</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Study Material</h1>
        <p className="text-xl text-blue-600 font-medium mb-2">Coming Day 2</p>
        <p className="text-gray-500">
          Students will upload a photo of their textbook page, slide, or notes here.
          The AI will generate a full study plan, summary, and quiz automatically.
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          Day 2 will add: image upload, phone number input, language detection, and the results preview.
        </div>
      </div>
    </main>
  )
}
