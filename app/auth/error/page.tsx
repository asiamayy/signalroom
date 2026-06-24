import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <Logo href="/" size="lg" />
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-8">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 6v4m0 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-lg font-serif tracking-tight text-neutral-900 mb-2">
            Link expired
          </h1>
          <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
            This confirmation link has expired or already been used. Sign up again or try logging in.
          </p>
          <div className="space-y-2">
            <Link
              href="/signup"
              className="block w-full bg-neutral-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-neutral-700 transition-colors text-center"
            >
              Sign up again
            </Link>
            <Link
              href="/login"
              className="block w-full border border-neutral-200 text-neutral-700 text-sm py-2.5 rounded-lg hover:border-neutral-300 transition-colors text-center"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
