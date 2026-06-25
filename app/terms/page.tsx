import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Nav */}
      <nav className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <Logo href="/" size="md" />
        <Link href="/signup" className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors">
          Start free
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-serif text-3xl tracking-tight text-neutral-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-neutral-400 mb-10">Last updated June 24, 2026</p>

        <div className="space-y-8 text-sm text-neutral-700 leading-relaxed">
          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">Agreement</h2>
            <p>By creating an account or using SignalRoom, you agree to these Terms of Service. If you do not agree, please do not use the service.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">The service</h2>
            <p>SignalRoom provides an AI-powered market research platform that lets users create synthetic personas and conduct simulated interviews. The outputs are AI-generated and intended as directional research aids, not as substitutes for professional market research or business advice.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">Your account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to use SignalRoom.</li>
              <li>One account per person unless you have an Agency plan with team seats.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">Acceptable use</h2>
            <p className="mb-3">You agree not to use SignalRoom to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Generate content that is illegal, harmful, or violates the rights of others</li>
              <li>Attempt to reverse engineer or extract our AI models or prompts</li>
              <li>Resell or sublicense access to the service without our permission</li>
              <li>Automate or scrape the platform in ways that exceed normal usage</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">Billing and cancellation</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Subscriptions are billed monthly and renew automatically.</li>
              <li>You can cancel at any time from your settings page. Cancellation takes effect at the end of the billing period.</li>
              <li>We do not offer refunds for partial months.</li>
              <li>We reserve the right to change pricing with 30 days notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">Intellectual property</h2>
            <p>You own the content you create using SignalRoom. We own the platform, technology, and brand. You grant us a limited license to process your content solely to provide the service.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">Disclaimer</h2>
            <p>SignalRoom is provided "as is." AI-generated outputs may contain errors or inaccuracies. We make no guarantees about the accuracy, reliability, or fitness of the service for any particular purpose. Use outputs as one input among many, not as definitive research.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">Limitation of liability</h2>
            <p>To the maximum extent permitted by law, SignalRoom shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">Changes to these terms</h2>
            <p>We may update these terms from time to time. We will notify you of significant changes via email. Continued use of the service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 mb-2">Contact</h2>
            <p>Questions about these terms? Email us at <a href="mailto:legal@signalroom.io" className="text-emerald-600 hover:underline">legal@signalroom.io</a></p>
          </section>
        </div>
      </div>

      <footer className="border-t border-neutral-200 bg-white mt-16">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <Logo href="/" size="sm" />
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-neutral-400 hover:text-neutral-700">Privacy</Link>
            <Link href="/terms" className="text-xs text-neutral-400 hover:text-neutral-700">Terms</Link>
            <Link href="/contact" className="text-xs text-neutral-400 hover:text-neutral-700">Contact</Link>
          </div>
          <p className="text-xs text-neutral-400">© 2026 SignalRoom</p>
        </div>
      </footer>
    </div>
  )
}
