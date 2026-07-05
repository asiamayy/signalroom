'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, MessageSquare, FileText, Settings, GitCompare, Menu, X, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/personas', label: 'Personas', icon: Users },
  { href: '/interviews', label: 'Interviews', icon: MessageSquare },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/audience-panel', label: 'Audience Panel', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showSignOut, setShowSignOut] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  const initials = userEmail
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase()
    : 'AS'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = (
    <>
      {/* Logo */}
      <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <Logo href="/personas" size="md" />
        {/* Close button - mobile only */}
        <button
          onClick={() => setMobileNavOpen(false)}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
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
                'flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-lg text-sm font-semibold transition-all',
                active ? '' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
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
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F4F6F8' }}>

      {/* Desktop sidebar — always visible at md+ */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col" style={{ background: 'white', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
        {SidebarContent}
      </aside>

      {/* Mobile sidebar — slide-out drawer */}
      {mobileNavOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Drawer */}
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col" style={{ background: 'white' }}>
            {SidebarContent}
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar — hamburger + logo */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <button
            onClick={() => setMobileNavOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 flex-shrink-0"
            style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer' }}
          >
            <Menu size={18} />
          </button>
          <Logo href="/personas" size="sm" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
