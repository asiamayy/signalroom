import { SiteNav } from '@/components/SiteNav'
import { SiteFooter } from '@/components/SiteFooter'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FCFCFB] text-[#121314]">
      <SiteNav />

      <div className="max-w-2xl mx-auto px-6 pt-32 sm:pt-40 pb-16">
        <span className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#5A7973] mb-4 block">Legal</span>
        <h1 className="text-[34px] sm:text-[44px] tracking-tighter font-normal text-[#121314] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-neutral-500 mb-10">Last updated June 24, 2026</p>

        <div className="space-y-8 text-sm text-[#454947] leading-relaxed">
          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Overview</h2>
            <p>SignalRoom ("we", "us", or "our") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights regarding your data.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Information we collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-[#121314]">Account information:</strong> Your name and email address when you sign up.</li>
              <li><strong className="text-[#121314]">Usage data:</strong> Personas you create, interviews you run, and reports you generate.</li>
              <li><strong className="text-[#121314]">Payment information:</strong> Processed securely through Stripe. We never store your card details.</li>
              <li><strong className="text-[#121314]">Technical data:</strong> Browser type, IP address, and usage patterns to improve the product.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">How we use your information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and improve the SignalRoom service</li>
              <li>To process payments and manage your subscription</li>
              <li>To send product updates and account-related emails</li>
              <li>To respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">AI and data processing</h2>
            <p>SignalRoom uses Anthropic's Claude AI to power persona interviews and report generation. Content you submit is processed through their API. We do not use your interview content to train AI models. Please review <a href="https://www.anthropic.com/privacy" className="text-[#1A3024] font-medium hover:text-[#5A7973] transition-colors" target="_blank" rel="noopener noreferrer">Anthropic's privacy policy</a> for details on how they handle data.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Data sharing</h2>
            <p>We do not sell your personal data. We share data only with the third-party services required to operate SignalRoom — including Supabase (database), Anthropic (AI), Stripe (payments), and fal.ai (image generation).</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Data retention</h2>
            <p>We retain your data for as long as your account is active. You can request deletion of your account and data at any time by emailing us.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Your rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1A3024] mb-2">Contact</h2>
            <p>Questions about this policy? Email us at <a href="mailto:privacy@signalroom.io" className="text-[#1A3024] font-medium hover:text-[#5A7973] transition-colors">privacy@signalroom.io</a></p>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
