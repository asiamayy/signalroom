'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, MessageSquare, FileText, Settings, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
          <button
            onClick={handleSignOut}
            className="w-full text-left text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-2 py-1.5"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
