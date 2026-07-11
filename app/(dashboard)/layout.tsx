'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Inter, Playfair_Display, Source_Serif_4, Hanken_Grotesk } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Briefcase, Users, MessageSquare, Settings, ArrowLeftRight, Menu, X,
  BarChart2, UsersRound, Activity, LogOut, Search, HelpCircle, ChevronDown, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HOME_COLORS, HOME_FONT_BODY } from '@/lib/home-theme'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import type { Project } from '@/types'
import { SearchProvider, useSearch } from '@/lib/search-context'

// Dashboard-only logo lockup (icon + wordmark + "AI Market Research" tagline
// baked in). Scoped to the dashboard so the landing page's logo is untouched.
function DashboardLogo({ width = 140 }: { width?: number }) {
  return (
    <Link href="/home" className="inline-flex focus:outline-none">
      <Image
        src="/signalroom-logo-dashboard.svg"
        alt="Signalroom — AI Market Research"
        width={width}
        height={Math.round(width / 1.702)}
        style={{ width: `${width}px`, height: 'auto' }}
        priority
        unoptimized
      />
    </Link>
  )
}

// Dashboard-only typography — loaded here (not the root layout) so the
// marketing/landing page is never touched by this font.
const inter = Inter({ subsets: ['latin'], variable: '--nf-inter', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500', '600'], variable: '--nf-playfair', display: 'swap' })
// Home page only — its editorial redesign uses this serif/grotesk pairing
// instead of Playfair/Inter, matching the reference mockup exactly.
const sourceSerif = Source_Serif_4({ subsets: ['latin'], weight: ['600'], variable: '--nf-source-serif', display: 'swap' })
const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--nf-hanken', display: 'swap' })

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/projects', label: 'Projects', icon: Briefcase },
  { href: '/personas', label: 'Personas', icon: Users },
  { href: '/interviews', label: 'Interviews', icon: MessageSquare },
  { href: '/compare', label: 'Compare', icon: ArrowLeftRight },
  { href: '/audience-panel', label: 'Audience Panel', icon: UsersRound },
  { href: '/signals', label: 'Signals', icon: BarChart2 },
  { href: '/reports', label: 'Insights', icon: Activity },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SearchProvider>
  )
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const { query: search, setQuery: setSearch } = useSearch()
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const closeMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUserEmail(data.user?.email ?? null)
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, plan')
          .eq('id', data.user.id)
          .single()
        setFullName(profile?.full_name ?? null)
        setAvatarUrl(profile?.avatar_url ?? null)
        setPlan(profile?.plan ?? null)
      }
    })
  }, [])

  // Recent projects for the sidebar
  useEffect(() => {
    fetch('/api/projects?limit=5')
      .then(r => r.json())
      .then(json => setRecentProjects(json.data ?? []))
      .catch(() => {})
  }, [])

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  // Close account dropdown on outside click
  useEffect(() => {
    if (!showAccountMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAccountMenu])

  const nameParts = fullName?.trim().split(/\s+/) ?? []
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : nameParts.length === 1 && nameParts[0]
    ? nameParts[0].slice(0, 2).toUpperCase()
    : userEmail
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
      <div className="relative px-5 py-5 flex items-center justify-center">
        <DashboardLogo width={128} />
        {/* Close button - mobile only */}
        <button
          onClick={() => setMobileNavOpen(false)}
          className="md:hidden absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 flex-shrink-0"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" style={{ fontFamily: HOME_FONT_BODY }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm transition-all',
                active ? 'font-semibold shadow-sm' : 'font-medium hover:bg-[#eae7e7]'
              )}
              style={active ? { background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.onSecondaryContainer } : { color: HOME_COLORS.onSurfaceVariant }}
            >
              <Icon size={18} strokeWidth={1.75} style={{ color: active ? HOME_COLORS.onSecondaryContainer : HOME_COLORS.onSurfaceVariant }} />
              {label}
            </Link>
          )
        })}

        {/* Recent projects */}
        <div className="pt-4 mt-2" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}66` }}>
          <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Recent Projects
          </p>
          {recentProjects.length === 0 ? (
            <p className="px-4 text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>No projects yet</p>
          ) : (
            <div className="space-y-0.5">
              {recentProjects.map((project, i) => (
                <Link
                  key={project.id}
                  href="/projects"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm transition-colors hover:bg-[#eae7e7]"
                  style={{ color: i === 0 ? HOME_COLORS.onSurface : HOME_COLORS.onSurfaceVariant }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: i === 0 ? HOME_COLORS.primary : HOME_COLORS.outlineVariant }} />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Footer — New Project */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}66`, fontFamily: HOME_FONT_BODY }}>
        <Link
          href="/projects"
          className="w-full flex items-center gap-2 text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors hover:bg-[#eae7e7]"
          style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
        >
          <Plus size={15} />
          New Project
        </Link>
      </div>
    </>
  )

  return (
    <div className={cn('dashboard-shell flex h-screen overflow-hidden', inter.variable, playfair.variable, sourceSerif.variable, hanken.variable)} style={{ background: '#FCF9F8' }}>

      {/* Desktop sidebar — always visible at md+ */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col" style={{ background: HOME_COLORS.surfaceContainerLowest, borderRight: `1px solid ${HOME_COLORS.outlineVariant}` }}>
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
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col" style={{ background: HOME_COLORS.surfaceContainerLowest }}>
            {SidebarContent}
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar — search, help, settings, profile (desktop + mobile) */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 flex-shrink-0" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          {/* Mobile hamburger + logo */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 flex-shrink-0"
            style={{ background: '#F3F4F6', border: 'none', cursor: 'pointer' }}
          >
            <Menu size={18} />
          </button>
          <div className="md:hidden">
            <DashboardLogo width={100} />
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2.5 rounded-xl px-4 py-2.5 flex-1" style={{ background: '#FFFFFF', border: '1px solid #E0E2E4' }}>
            <Search size={16} style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search personas, projects, insights, and more..."
              className="text-sm bg-transparent outline-none w-full placeholder:text-neutral-400"
              style={{ color: '#202124' }}
            />
          </div>

          <div className="flex-1 md:hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/help"
              className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center transition-colors hover:bg-neutral-50"
              style={{ border: '1px solid #E0E2E4', color: '#5F6368' }}
              title="Help"
            >
              <HelpCircle size={16} />
            </Link>
            <Link
              href="/settings"
              className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center transition-colors hover:bg-neutral-50"
              style={{ border: '1px solid #E0E2E4', color: '#5F6368' }}
              title="Settings"
            >
              <Settings size={16} />
            </Link>

            {/* Profile dropdown — hover-activated */}
            <div
              className="relative"
              ref={accountMenuRef}
              onMouseEnter={() => {
                if (closeMenuTimer.current) clearTimeout(closeMenuTimer.current)
                setShowAccountMenu(true)
              }}
              onMouseLeave={() => {
                closeMenuTimer.current = setTimeout(() => setShowAccountMenu(false), 200)
              }}
            >
              <button
                onClick={() => setShowAccountMenu(o => !o)}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full transition-colors hover:bg-neutral-50"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName ?? 'Account'} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#1C3D2E' }}>
                    {initials}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold leading-tight truncate max-w-[140px]" style={{ color: '#202124' }}>{fullName ?? userEmail?.split('@')[0] ?? 'Account'}</div>
                  {plan && <div className="text-xs leading-tight truncate max-w-[140px]" style={{ color: '#9CA3AF' }}>{plan.charAt(0).toUpperCase() + plan.slice(1)} plan</div>}
                </div>
                <ChevronDown size={13} style={{ color: '#9CA3AF' }} className={cn('transition-transform duration-200 hidden sm:block', showAccountMenu ? 'rotate-180' : '')} />
              </button>

              <AnimatePresence>
                {showAccountMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 top-full pt-2 z-50"
                    style={{ minWidth: '110px' }}
                  >
                    <div style={{ background: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', border: '1px solid #E3E3DA' }}>
                      <div className="px-3 py-2 text-center">
                        <button
                          onClick={handleSignOut}
                          className="text-xs transition-colors text-[#9CA3AF] hover:text-[#4B5563]"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Sign out →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Page content */}
        {/* scrollbar-gutter: stable reserves the scrollbar's width whether or not
            it's needed, so header controls don't shift horizontally when filtering
            (e.g. search) changes content height enough to toggle the scrollbar. */}
        <main className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
