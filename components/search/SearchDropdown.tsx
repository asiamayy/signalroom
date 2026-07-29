'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Folder, MessageSquare, FileText, Activity, Loader2 } from 'lucide-react'
import { HOME_COLORS } from '@/lib/home-theme'

interface SearchResultItem {
  id: string
  label: string
  sublabel: string | null
  href: string
}

interface SearchResults {
  personas: SearchResultItem[]
  projects: SearchResultItem[]
  interviews: SearchResultItem[]
  reports: SearchResultItem[]
  signals: SearchResultItem[]
}

const GROUPS: { key: keyof SearchResults; label: string; icon: typeof Users }[] = [
  { key: 'personas', label: 'Personas', icon: Users },
  { key: 'projects', label: 'Projects', icon: Folder },
  { key: 'interviews', label: 'Interviews', icon: MessageSquare },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'signals', label: 'Signals', icon: Activity },
]

interface SearchDropdownProps {
  query: string
  open: boolean
  onNavigate: () => void
}

export function SearchDropdown({ query, open, onNavigate }: SearchDropdownProps) {
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed.length < 2) { setResults(null); return }
    setLoading(true)
    const handle = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        .then(r => r.json())
        .then(json => setResults(json.data ?? null))
        .catch(() => setResults(null))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(handle)
  }, [trimmed])

  const show = open && trimmed.length >= 2
  const totalCount = results ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0) : 0

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 right-0 top-full mt-2 max-h-[70vh] overflow-y-auto rounded-2xl"
          style={{ background: 'white', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.18)', border: '1px solid #E3E5E3' }}
        >
          {loading && !results ? (
            <div className="flex items-center gap-2 px-5 py-6 text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>
              <Loader2 size={14} className="animate-spin" /> Searching...
            </div>
          ) : totalCount === 0 ? (
            <div className="px-5 py-6 text-sm" style={{ color: HOME_COLORS.onSurfaceVariant }}>
              No results for &ldquo;{trimmed}&rdquo;
            </div>
          ) : (
            <div className="py-2">
              {GROUPS.map(g => {
                const items = results?.[g.key] ?? []
                if (items.length === 0) return null
                const Icon = g.icon
                return (
                  <div key={g.key} className="px-2 py-1.5">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>{g.label}</p>
                    {items.map(item => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={onNavigate}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[#f0eded]"
                      >
                        <Icon size={15} style={{ color: HOME_COLORS.onSurfaceVariant }} className="flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium" style={{ color: HOME_COLORS.onSurface }}>{item.label}</p>
                          {item.sublabel && <p className="truncate text-xs" style={{ color: HOME_COLORS.onSurfaceVariant }}>{item.sublabel}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
