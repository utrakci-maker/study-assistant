'use client'

interface Props {
  topicTitle: string
  resultUrl: string
  isRTL: boolean
}

export default function WhatsAppShareButton({ topicTitle, resultUrl, isRTL }: Props) {
  const msg = encodeURIComponent(
    `📚 ${topicTitle}\n\nStudy plan on StudyAI:\n${resultUrl}`
  )
  return (
    <a
      href={`https://wa.me/?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 border border-gray-200 hover:border-green-300 rounded-xl px-4 py-2 transition-all print:hidden"
    >
      <span>📱</span>
      <span>{isRTL ? 'مشاركة' : 'Share'}</span>
    </a>
  )
}
