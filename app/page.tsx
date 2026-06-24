import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-gray-900">StudyAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition">Pricing</Link>
          <Link href="/history" className="text-sm text-gray-500 hover:text-gray-900 transition">My History</Link>
          <Link href="/upload" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium">
            Try Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <span>✨</span> Works in Arabic, Kurdish & English
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Turn Your Textbook Photos<br />
          Into Complete Study Plans
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-3">
          Take a photo of any textbook page or handwritten notes.
          Our AI creates a full study plan, explanation, and quiz in seconds.
        </p>
        <div className="flex items-center justify-center gap-2 mb-8 text-sm text-gray-400">
          <span dir="rtl" className="font-arabic">حوّل صورة كتابك إلى خطة دراسية كاملة</span>
          <span>·</span>
          <span>وێنەی کتێبەکەت بکە پلانی خوێندنەوەی تەواو</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg shadow-blue-200"
          >
            Try Free — No Sign-Up Needed →
          </Link>
          <Link
            href="/pricing"
            className="border border-gray-200 hover:border-gray-300 text-gray-600 font-medium px-8 py-4 rounded-xl text-lg transition"
          >
            See Pricing
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free: 2 uploads/day · No registration · Works on mobile</p>
      </section>

      {/* Screenshot placeholder / demo card */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center shadow-2xl shadow-blue-200">
          <div className="text-5xl mb-4">📸 → 📚</div>
          <p className="text-blue-100 text-lg font-medium mb-2">Upload any photo of your study material</p>
          <p className="text-blue-200 text-sm">Textbook pages · Handwritten notes · Exam papers · Any subject</p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl mb-1">📝</div>
              <div className="text-xs text-blue-100">Study Plan</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl mb-1">💡</div>
              <div className="text-xs text-blue-100">Explanation</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-xs text-blue-100">Quiz</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">How It Works</h2>
          <p className="text-center text-gray-500 mb-10">Three steps. Under 30 seconds.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Step
              number="1"
              icon="📷"
              title="Take a Photo"
              desc="Photograph your textbook page, handwritten notes, or any study material. Works with any subject, any language."
            />
            <Step
              number="2"
              icon="🤖"
              title="AI Analyses It"
              desc="Our AI (powered by Claude) reads the image and understands the topic. Takes 10–30 seconds."
            />
            <Step
              number="3"
              icon="📚"
              title="Get Your Study Plan"
              desc="Receive a complete study plan, detailed explanation, and an interactive quiz to test your knowledge."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Everything You Need to Study Smarter</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Feature icon="🌍" title="3 Languages" desc="Fully supports Arabic (العربية), Kurdish (کوردی), and English. The AI detects your language automatically." />
          <Feature icon="⚡" title="Instant Results" desc="Most study plans are ready in under 30 seconds. No waiting around." />
          <Feature icon="🧠" title="Interactive Quiz" desc="After every upload, test yourself with an auto-generated quiz. See your score and what you got wrong." />
          <Feature icon="📋" title="Copy & Share" desc="Copy your full study plan to WhatsApp, Telegram, or your notes app with one tap." />
          <Feature icon="📂" title="Your History" desc="All your past study plans are saved. Look up any topic you have studied before." />
          <Feature icon="📱" title="Works on Mobile" desc="Designed for phone use. Take a photo and get your study plan without touching a laptop." />
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-6 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Simple, Fair Pricing</h2>
          <p className="text-gray-300 mb-8">Start free. Pay only when you need more.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <PricingCard
              name="Free"
              price="$0"
              period=""
              features={['2 uploads per day', '6 uploads per month', 'Full study plan', 'Arabic, Kurdish, English']}
              highlight={false}
            />
            <PricingCard
              name="Single Unlock"
              price="$0.99"
              period="per upload"
              features={['1 extra upload', 'No subscription', 'Never expires', 'Pay when you need']}
              highlight={true}
            />
            <PricingCard
              name="Pro Monthly"
              price="$4.99"
              period="per month"
              features={['60 uploads/month', 'No daily limit', 'All features', 'Cancel anytime']}
              highlight={false}
            />
          </div>
          <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm underline">
            See full pricing details →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to Study Smarter?</h2>
        <p className="text-gray-500 mb-6">Join students across Iraq and the MENA region. Free to start.</p>
        <Link
          href="/upload"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl text-lg transition shadow-lg shadow-blue-200"
        >
          Upload Your First Photo →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/upload" className="hover:text-gray-600">Upload</Link>
          <Link href="/history" className="hover:text-gray-600">History</Link>
          <Link href="/pricing" className="hover:text-gray-600">Pricing</Link>
          <Link href="/unlock" className="hover:text-gray-600">Unlock</Link>
        </div>
        <p>© 2024 StudyAI · Built for students in Iraq & MENA · Powered by Claude AI</p>
      </footer>

    </main>
  )
}

function Step({ number, icon, title, desc }: { number: string; icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
        {number}
      </div>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
      <div className="text-3xl flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function PricingCard({ name, price, period, features, highlight }: {
  name: string; price: string; period: string; features: string[]; highlight: boolean
}) {
  return (
    <div className={`rounded-xl p-5 text-left ${highlight ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
      <p className="font-semibold text-sm mb-1 opacity-80">{name}</p>
      <p className="text-3xl font-bold mb-0.5">{price}</p>
      {period && <p className="text-xs opacity-60 mb-3">{period}</p>}
      <ul className="space-y-1 mt-3">
        {features.map(f => (
          <li key={f} className="text-xs flex items-start gap-1.5">
            <span className="opacity-70 mt-0.5">✓</span>{f}
          </li>
        ))}
      </ul>
    </div>
  )
}
