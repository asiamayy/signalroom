'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, MessageSquare, FileText, Settings, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

const NAV_ITEMS = [
  { href: '/personas', label: 'Personas', icon: Users },
  { href: '/interviews', label: 'Interviews', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-neutral-200 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-neutral-100">
          <Logo href="/personas" size="md" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-neutral-100 text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                )}
              >
                <Icon size={15} strokeWidth={1.75} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Upgrade nudge */}
        <div className="px-3 pb-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={13} className="text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-emerald-600 mb-2 leading-relaxed">Unlimited personas and interviews.</p>
            <Link
              href="/settings"
              className="block text-center text-xs font-medium bg-emerald-600 text-white rounded-md py-1.5 hover:bg-emerald-700 transition-colors"
            >
              View plans
            </Link>
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