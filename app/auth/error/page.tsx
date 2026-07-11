import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#FCFCFB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <Link href="/" className="inline-flex">
            <img
              src="/signalroom-logo.svg"
              alt="SignalRoom Logo"
              width="94"
              height="55"
              className="h-14 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="bg-white border border-[#E3E5E3] rounded-[12px] p-8">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 6v4m0 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl tracking-tight text-[#121314] mb-2 font-normal" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Link expired
          </h1>
          <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
            This confirmation link has expired or already been used. Sign up again or try logging in.
          </p>
          <div className="space-y-2">
            <Link
              href="/signup"
              className="block w-full bg-[#1A3024] text-white text-[11px] font-medium uppercase tracking-[0.2em] py-3 rounded-[4px] hover:bg-[#5A7973] transition-all duration-300 text-center"
            >
              Sign up again
            </Link>
            <Link
              href="/login"
              className="block w-full border border-[#E3E5E3] text-[#454947] text-[11px] font-medium uppercase tracking-[0.2em] py-3 rounded-[4px] hover:border-[#1A3024]/40 hover:text-[#121314] transition-colors text-center"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
