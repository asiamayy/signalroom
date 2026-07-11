import Link from 'next/link'

export function SiteNav() {
  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#1A3024]/10 bg-white/80 px-6 sm:px-12 backdrop-blur-xl">
      <Link href="/" className="flex items-center focus:outline-none">
        <img
          src="/signalroom-logo.svg"
          alt="SignalRoom Logo"
          width="75"
          height="44"
          className="h-11 w-auto object-contain"
        />
      </Link>
      <div className="flex items-center gap-4 sm:gap-6">
        <Link
          href="/login"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#454947] hover:text-[#121314] transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="bg-[#1A3024] text-white px-4 sm:px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] hover:bg-[#5A7973] transition-all duration-300 rounded-[4px] whitespace-nowrap"
        >
          Start Free
        </Link>
      </div>
    </nav>
  )
}
