'use client'

export default function PrintButton({ isRTL }: { isRTL: boolean }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-300 transition-all print:hidden"
    >
      <span>🖨️</span>
      <span>{isRTL ? 'طباعة / PDF' : 'Print / PDF'}</span>
    </button>
  )
}
