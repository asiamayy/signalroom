'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, MessageSquare, FileText, Settings, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/personas', label: 'Personas', icon: Users },
  { href: '/interviews', label: 'Interviews', icon: MessageSquare },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showSignOut, setShowSignOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  const initials = userEmail
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase()
    : 'AS'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen" style={{ background: '#F4F6F8' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: 'white', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
        {/* Logo */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <Logo href="/personas" size="md" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all',
                  active
                    ? ''
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                )}
                style={active ? { background: '#E8F5F1', color: '#0D5C45' } : {}}
              >
                <Icon size={15} strokeWidth={1.75} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="relative">
            <button
              onClick={() => setShowSignOut(o => !o)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-neutral-50 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A8C6A, #2BAE86)' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-semibold text-neutral-800 truncate">{userEmail?.split('@')[0] ?? 'Account'}</div>
                <div className="text-[11px] text-neutral-400 truncate">{userEmail ?? ''}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showSignOut && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden" style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
