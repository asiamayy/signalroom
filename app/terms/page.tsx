import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FCFCFB] text-[#121314]">
      <SiteNav />

      <div className="max-w-2xl mx-auto px-6 pt-32 sm:pt-40 pb-16">
        <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#5A7973] mb-4 block">Legal</span>
        <h1 className="text-[34px] sm:text-[44px] tracking-tighter font-normal text-[#121314] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Terms of Service
        </h1>
        <p className="text-sm text-neutral-500 mb-10">Last updated June 24, 2026</p>

        <div className="space-y-8 text-sm text-[#454947] leading-relaxed">
          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Agreement</h2>
            <p>By creating an account or using SignalRoom, you agree to these Terms of Service. If you do not agree, please do not use the service.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">The service</h2>
            <p>SignalRoom provides an AI-powered market research platform that lets users create synthetic personas and conduct simulated interviews. The outputs are AI-generated and intended as directional research aids, not as substitutes for professional market research or business advice.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Your account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to use SignalRoom.</li>
              <li>One account per person unless you have an Agency plan with team seats.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Acceptable use</h2>
            <p className="mb-3">You agree not to use SignalRoom to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Generate content that is illegal, harmful, or violates the rights of others</li>
              <li>Attempt to reverse engineer or extract our AI models or prompts</li>
              <li>Resell or sublicense access to the service without our permission</li>
              <li>Automate or scrape the platform in ways that exceed normal usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Billing and cancellation</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Subscriptions are billed monthly and renew automatically.</li>
              <li>You can cancel at any time from your settings page. Cancellation takes effect at the end of the billing period.</li>
              <li>We do not offer refunds for partial months.</li>
              <li>We reserve the right to change pricing with 30 days notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Intellectual property</h2>
            <p>You own the content you create using SignalRoom. We own the platform, technology, and brand. You grant us a limited license to process your content solely to provide the service.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Disclaimer</h2>
            <p>SignalRoom is provided "as is." AI-generated outputs may contain errors or inaccuracies. We make no guarantees about the accuracy, reliability, or fitness of the service for any particular purpose. Use outputs as one input among many, not as definitive research.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Limitation of liability</h2>
            <p>To the maximum extent permitted by law, SignalRoom shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Changes to these terms</h2>
            <p>We may update these terms from time to time. We will notify you of significant changes via email. Continued use of the service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Contact</h2>
            <p>Questions about these terms? Email us at <a href="mailto:legal@signalroom.io" className="text-[#1A3024] font-medium hover:text-[#5A7973] transition-colors">legal@signalroom.io</a></p>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
