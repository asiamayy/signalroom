import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-6 px-6 sm:px-12 py-16 sm:py-20 w-full bg-white border-t border-[#1A3024]/10 relative z-10">
      <div className="sm:col-span-2 md:col-span-4">
        <Link href="/" className="inline-flex items-center gap-3 mb-6">
          <img
            src="/signalroom-logo.svg"
            alt="SignalRoom Logo"
            width="109"
            height="64"
            className="h-16 w-auto object-contain"
          />
        </Link>
        <p className="text-[14px] sm:text-[15px] text-[#454947] max-w-xs mb-6 sm:mb-10 leading-relaxed opacity-90">
          Customer intelligence infrastructure for modern teams.
        </p>
      </div>
      <div className="md:col-start-6 md:col-span-2 space-y-3 sm:space-y-4">
        <span className="text-[11px] uppercase tracking-[0.4em] text-neutral-700 font-medium block mb-4 sm:mb-6">Legal</span>
        <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1A3024] transition-colors font-medium" href="/privacy">Privacy</Link>
        <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1A3024] transition-colors font-medium" href="/terms">Terms</Link>
      </div>
      <div className="md:col-span-2 space-y-3 sm:space-y-4">
        <span className="text-[11px] uppercase tracking-[0.4em] text-neutral-700 font-medium block mb-4 sm:mb-6">Support</span>
        <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1A3024] transition-colors font-medium" href="/faq">FAQ</Link>
        <Link className="block text-[9px] uppercase tracking-[0.3em] text-[#454947] hover:text-[#1A3024] transition-colors font-medium" href="/contact">Contact</Link>
      </div>
      <div className="sm:col-span-2 md:col-span-4 text-left sm:text-right flex flex-col justify-end mt-8 sm:mt-12 md:mt-0">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-medium leading-loose">
          © 2026 SignalRoom. All rights reserved. SignalRoom™ is a proprietary product and trademark.
        </p>
      </div>
    </footer>
  )
}
