import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-gray-900">StudyAI</span>
        </Link>
        <Link href="/upload" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium">
          Try Free
        </Link>
      </nav>

      {/* Header */}
      <section className="text-center py-14 px-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Simple, Fair Pricing</h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          Start free. Pay only when you need more uploads.
          No registration. No subscription required.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

          {/* Free */}
          <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
            <div className="text-3xl mb-3">🆓</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Free</h2>
            <p className="text-gray-500 text-sm mb-4">Perfect for trying it out</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-gray-900">$0</span>
              <span className="text-gray-400 text-sm ml-1">forever</span>
            </div>
            <ul className="space-y-3 mb-8">
              <PricingFeature text="2 uploads per day" />
              <PricingFeature text="6 uploads per month" />
              <PricingFeature text="Full AI study plan" />
              <PricingFeature text="Interactive quiz" />
              <PricingFeature text="Arabic, Kurdish & English" />
              <PricingFeature text="History saved" />
            </ul>
            <Link
              href="/upload"
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition"
            >
              Start for Free →
            </Link>
          </div>

          {/* Single Unlock — highlighted */}
          <div className="bg-blue-600 rounded-2xl p-7 shadow-xl shadow-blue-200 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
              Most Popular
            </div>
            <div className="text-3xl mb-3">⚡</div>
            <h2 className="text-xl font-bold text-white mb-1">Single Unlock</h2>
            <p className="text-blue-200 text-sm mb-4">Pay only when you need more</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-white">$0.99</span>
              <span className="text-blue-300 text-sm ml-1">per upload</span>
            </div>
            <ul className="space-y-3 mb-8">
              <PricingFeature text="1 extra upload" light />
              <PricingFeature text="No subscription needed" light />
              <PricingFeature text="Never expires" light />
              <PricingFeature text="All free features included" light />
              <PricingFeature text="Pay via WhatsApp / ZainCash / FIB" light />
            </ul>
            <Link
              href="/unlock"
              className="block w-full text-center bg-white hover:bg-blue-50 text-blue-700 font-bold py-3 rounded-xl transition shadow-md"
            >
              Get Extra Upload →
            </Link>
          </div>

          {/* Pro Monthly */}
          <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm">
            <div className="text-3xl mb-3">👑</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Pro Monthly</h2>
            <p className="text-gray-500 text-sm mb-4">For serious students</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-gray-900">$10</span>
              <span className="text-gray-400 text-sm ml-1">per month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <PricingFeature text="60 uploads per month" />
              <PricingFeature text="No daily limit" />
              <PricingFeature text="Priority processing" />
              <PricingFeature text="All free features included" />
              <PricingFeature text="Cancel anytime" />
              <PricingFeature text="Pay via WhatsApp / ZainCash / FIB" />
            </ul>
            <Link
              href="/unlock"
              className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition"
            >
              Go Pro →
            </Link>
          </div>

        </div>
      </section>

      {/* Payment methods */}
      <section className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">How to Pay</h2>
          <p className="text-gray-500 text-sm mb-6">
            We accept local Iraqi and international payment methods.
            Contact us on WhatsApp, pay, and we send you an unlock code instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['💳 Visa / Mastercard', '📱 ZainCash', '🏦 FIB', '💰 Bank Transfer', '💬 WhatsApp'].map(method => (
              <span key={method} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full">
                {method}
              </span>
            ))}
          </div>
          <Link
            href="/unlock"
            className="inline-flex items-center gap-2 mt-6 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition shadow-md"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contact us on WhatsApp to pay
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Common Questions</h2>
        <div className="space-y-4">
          <FAQ
            q="Do I need to create an account?"
            a="No. Just enter your phone number and email when you upload. That's it — no password, no registration."
          />
          <FAQ
            q="What subjects does it work with?"
            a="Any subject — Biology, Chemistry, Physics, History, Math, Geography, and more. If it's written on paper, it works."
          />
          <FAQ
            q="Does it work with Arabic text?"
            a="Yes. The AI fully supports Arabic, Kurdish (Sorani), and English. It detects the language automatically from your photo."
          />
          <FAQ
            q="What if I run out of free uploads?"
            a="You can contact us on WhatsApp to buy a Single Unlock ($0.99) or a Pro monthly plan ($10). We'll send you a code to enter on the unlock page."
          />
          <FAQ
            q="Is my data private?"
            a="Your uploaded images and study plans are stored securely and only accessible using your phone number and email."
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-blue-600 py-12 px-6 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Start with the Free Plan</h2>
        <p className="text-blue-200 mb-6">2 uploads per day. No registration. No credit card.</p>
        <Link
          href="/upload"
          className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition shadow-lg"
        >
          Upload Your First Photo →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-6 text-center text-sm text-gray-400">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <Link href="/upload" className="hover:text-gray-600">Upload</Link>
          <Link href="/history" className="hover:text-gray-600">History</Link>
          <Link href="/unlock" className="hover:text-gray-600">Unlock</Link>
        </div>
        <p>© 2024 StudyAI · Powered by Claude AI</p>
      </footer>

    </main>
  )
}

function PricingFeature({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <li className={`flex items-start gap-2 text-sm ${light ? 'text-blue-100' : 'text-gray-600'}`}>
      <span className={`mt-0.5 flex-shrink-0 ${light ? 'text-blue-200' : 'text-green-500'}`}>✓</span>
      {text}
    </li>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
    </div>
  )
}
