'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, ArrowRight, Calendar, ArrowUp, ArrowDown, Briefcase,
  MoreVertical, ArchiveRestore, Trash2, Loader2, Database,
  Code2, ShoppingBag, HeartPulse, Landmark, UtensilsCrossed, GraduationCap,
  Plane, Home as HomeIcon, Shirt, Car, Film, Zap, Truck, Sparkles,
  PawPrint, Leaf, ShieldCheck, Music, Gamepad2, type LucideIcon,
} from 'lucide-react'
import { HOME_COLORS, HOME_FONT_DISPLAY, HOME_FONT_BODY, DISPLAY_LG_STYLE } from '@/lib/home-theme'
import { CARD_SHADOW } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { useSearch } from '@/lib/search-context'
import type { Project } from '@/types'

export interface ProjectRollup {
  project: Project
  interviewCount: number
  signalCount: number
  reportCount: number
  avgConfidence: number
  topSignalSummary: string | null
}

function confidenceTier(avgConfidence: number, signalCount: number) {
  if (signalCount === 0) return 'No Signals Yet'
  if (avgConfidence >= 80) return 'High Confidence'
  if (avgConfidence >= 60) return 'Developing'
  return 'Early Stage'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Keyword-matched cover icon — no image generation, just a deterministic
// mapping from the project's real name to a relevant Lucide icon so cards
// aren't all the same generic briefcase.
const PROJECT_ICON_RULES: [RegExp, LucideIcon][] = [
  [/health|medical|clinic|wellness|therap|pharma/i, HeartPulse],
  [/fitness|gym|workout|athlet/i, HeartPulse],
  [/financ|banking|invest|fintech|payment|money|budget/i, Landmark],
  [/food|restaurant|recipe|kitchen|culinary|grocery|meal/i, UtensilsCrossed],
  [/educat|learn|school|course|university|tutor|student/i, GraduationCap],
  [/travel|flight|hotel|trip|vacation|tour/i, Plane],
  [/real estate|housing|property|apartment|mortgage/i, HomeIcon],
  [/fashion|apparel|clothing|style|wear/i, Shirt],
  [/mobility|transport|vehicle|ride|auto|car\b/i, Car],
  [/media|entertainment|film|video|streaming|studio/i, Film],
  [/energy|solar|power|electric(?!s)/i, Zap],
  [/logistic|shipping|delivery|supply chain|freight/i, Truck],
  [/beauty|cosmetic|skincare|makeup/i, Sparkles],
  [/pet|animal|dog|cat\b/i, PawPrint],
  [/environ|sustain|climate|eco[- ]?friendly|green/i, Leaf],
  [/security|privacy|cyber|fraud/i, ShieldCheck],
  [/music|audio|sound|podcast/i, Music],
  [/game|gaming|esport/i, Gamepad2],
  [/retail|shop|store|ecommerce|e-commerce|marketplace/i, ShoppingBag],
  [/software|app|saas|platform|api|tech\b|developer/i, Code2],
]

function getProjectIcon(name: string): LucideIcon {
  for (const [pattern, icon] of PROJECT_ICON_RULES) {
    if (pattern.test(name)) return icon
  }
  return Briefcase
}

export function ProjectsClient({ initialRollups }: { initialRollups: ProjectRollup[] }) {
  const [rollups, setRollups] = useState(initialRollups)
  const { query: search, setQuery: setSearch } = useSearch()
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [activeOnly, setActiveOnly] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAllArchive, setShowAllArchive] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const matchesSearch = (r: ProjectRollup) => r.project.name.toLowerCase().includes(search.toLowerCase())

  const activeRollups = rollups.filter(r => !r.project.archived)
  const archivedRollups = rollups.filter(r => r.project.archived)

  const gridRollups = (activeOnly ? activeRollups : rollups)
    .filter(matchesSearch)
    .sort((a, b) => {
      const diff = new Date(a.project.updated_at).getTime() - new Date(b.project.updated_at).getTime()
      return sortDir === 'desc' ? -diff : diff
    })

  const archiveRows = archivedRollups
    .filter(matchesSearch)
    .sort((a, b) => new Date(b.project.archived_at ?? b.project.updated_at).getTime() - new Date(a.project.archived_at ?? a.project.updated_at).getTime())
  const visibleArchiveRows = showAllArchive ? archiveRows : archiveRows.slice(0, 5)

  const handleCreate = async (name: string) => {
    if (!name.trim()) return
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setRollups(prev => [{ project: data, interviewCount: 0, signalCount: 0, reportCount: 0, avgConfidence: 0, topSignalSummary: null }, ...prev])
      setShowCreateModal(false)
    }
  }

  const handleRestore = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      })
      setRollups(prev => prev.map(r => r.project.id === id ? { ...r, project: { ...r.project, archived: false, archived_at: null } } : r))
    } finally {
      setActionLoading(null)
      setOpenMenuId(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone. Personas and interviews inside it will become unassigned, not deleted.`)) return
    setActionLoading(id)
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      setRollups(prev => prev.filter(r => r.project.id !== id))
    } finally {
      setActionLoading(null)
      setOpenMenuId(null)
    }
  }

  return (
    <div style={{ background: HOME_COLORS.surface, fontFamily: HOME_FONT_BODY }} className="min-h-full" onClick={() => openMenuId && setOpenMenuId(null)}>
      {/* Header & primary action */}
      <section className="px-4 sm:px-10 pt-10 sm:pt-12 pb-12 sm:pb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-px" style={{ background: HOME_COLORS.primary }} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: HOME_COLORS.primary }}>Intelligence Hub</span>
          </div>
          <h1 className="mb-4" style={{ ...DISPLAY_LG_STYLE, color: HOME_COLORS.onSurface }}>Projects</h1>
          <p className="text-sm sm:text-base leading-relaxed max-w-xl" style={{ color: HOME_COLORS.onSurfaceVariant }}>
            Manage your research simulations and strategic market signals. Every persona, interview, report, and signal belongs to a project.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="group relative flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 ease-out hover:pr-10 hover:shadow-xl active:scale-95 flex-shrink-0"
          style={{ background: HOME_COLORS.primary, color: HOME_COLORS.onPrimary }}
        >
          <Plus size={20} />
          <span className="text-sm font-semibold">Create New Project</span>
          <ArrowRight size={18} className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out" />
        </button>
      </section>

      {/* Filter & search bar */}
      <section className="px-4 sm:px-10 mb-10 sm:mb-12">
        <div className="rounded-full p-2 flex flex-col md:flex-row items-center gap-2" style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}4d`, boxShadow: CARD_SHADOW }}>
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: HOME_COLORS.onSurfaceVariant }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search research simulations..."
              className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-sm outline-none"
              style={{ color: HOME_COLORS.onSurface }}
            />
          </div>
          <div className="h-8 w-px hidden md:block" style={{ background: HOME_COLORS.outlineVariant }} />
          <div className="flex items-center gap-2 px-2 w-full md:w-auto">
            <button
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap hover:opacity-80"
              style={{ background: HOME_COLORS.surfaceContainerHigh, color: HOME_COLORS.onSurfaceVariant }}
            >
              <Calendar size={14} />
              Date Modified
              {sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
            </button>
            <button
              onClick={() => setActiveOnly(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap"
              style={activeOnly
                ? { background: HOME_COLORS.secondaryContainer, color: HOME_COLORS.onSecondaryContainer }
                : { background: HOME_COLORS.surfaceContainerHigh, color: HOME_COLORS.onSurfaceVariant }}
            >
              <Briefcase size={14} />
              Active Only
            </button>
          </div>
        </div>
      </section>

      {/* Main project grid */}
      <section className="px-4 sm:px-10 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {gridRollups.length === 0 ? (
          <div className="lg:col-span-2 rounded-2xl py-16 flex items-center justify-center" style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px dashed ${HOME_COLORS.outlineVariant}` }}>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>
                {search ? `No projects match "${search}"` : rollups.length === 0 ? 'No projects yet' : 'No active projects'}
              </p>
              <p className="text-xs mt-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                {search ? 'Try a different search term.' : rollups.length === 0 ? 'Create your first project to get started.' : 'All your projects are archived.'}
              </p>
            </div>
          </div>
        ) : (
          gridRollups.map(rollup => (
            <ProjectCard
              key={rollup.project.id}
              rollup={rollup}
              onDelete={() => handleDelete(rollup.project.id, rollup.project.name)}
              deleting={actionLoading === rollup.project.id}
            />
          ))
        )}
      </section>

      {/* Recent archive */}
      {archiveRows.length > 0 && (
        <section className="px-4 sm:px-10 pb-20">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>Recent Archive</h2>
            {archiveRows.length > 5 && (
              <button onClick={() => setShowAllArchive(o => !o)} className="text-[11px] font-semibold uppercase tracking-wider hover:underline" style={{ color: HOME_COLORS.primary }}>
                {showAllArchive ? 'Show less' : 'View all archive'}
              </button>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: HOME_COLORS.surfaceContainerLow, boxShadow: CARD_SHADOW }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead style={{ borderBottom: `1px solid ${HOME_COLORS.outlineVariant}4d` }}>
                  <tr>
                    <th className="px-6 sm:px-8 py-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>Project Name</th>
                    <th className="px-6 sm:px-8 py-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>Confidence</th>
                    <th className="px-6 sm:px-8 py-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: HOME_COLORS.onSurfaceVariant }}>Insights</th>
                    <th className="px-6 sm:px-8 py-4 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {visibleArchiveRows.map(({ project, avgConfidence, reportCount }, i) => (
                    <tr key={project.id} className="transition-colors hover:brightness-[0.98] cursor-pointer group relative" style={i > 0 ? { borderTop: `1px solid ${HOME_COLORS.outlineVariant}1a` } : undefined}>
                      <td className="px-6 sm:px-8 py-5">
                        <Link href={`/projects/${project.id}`} className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${HOME_COLORS.primaryFixedDim}4d`, color: HOME_COLORS.primary }}>
                            <Database size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: HOME_COLORS.onSurface }}>{project.name}</div>
                            <div className="text-[11px] italic" style={{ color: HOME_COLORS.onSurfaceVariant }}>
                              {project.archived_at ? `Concluded ${formatDate(project.archived_at)}` : `Updated ${formatDate(project.updated_at)}`}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 sm:px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: `${HOME_COLORS.outlineVariant}4d` }}>
                            <div className="h-full rounded-full" style={{ width: `${avgConfidence}%`, background: HOME_COLORS.primary }} />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: HOME_COLORS.onSurface }}>{avgConfidence}%</span>
                        </div>
                      </td>
                      <td className="px-6 sm:px-8 py-5 text-sm" style={{ color: HOME_COLORS.onSurface }}>
                        {reportCount} {reportCount === 1 ? 'Insight' : 'Insights'}
                      </td>
                      <td className="px-6 sm:px-8 py-5 text-right relative">
                        <button
                          onClick={e => { e.stopPropagation(); e.preventDefault(); setOpenMenuId(o => o === project.id ? null : project.id) }}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors hover:bg-black/5"
                          style={{ color: HOME_COLORS.onSurfaceVariant }}
                        >
                          {actionLoading === project.id ? <Loader2 size={16} className="animate-spin" /> : <MoreVertical size={16} />}
                        </button>
                        {openMenuId === project.id && (
                          <div
                            onClick={e => e.stopPropagation()}
                            className="absolute right-6 sm:right-8 top-full mt-1 rounded-xl overflow-hidden z-10 text-left"
                            style={{ background: HOME_COLORS.surfaceContainerLowest, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: `1px solid ${HOME_COLORS.outlineVariant}4d`, minWidth: '160px' }}
                          >
                            <button
                              onClick={() => handleRestore(project.id)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-black/5"
                              style={{ color: HOME_COLORS.onSurface }}
                            >
                              <ArchiveRestore size={13} /> Restore
                            </button>
                            <button
                              onClick={() => handleDelete(project.id, project.name)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-black/5"
                              style={{ color: '#BA1A1A' }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Floating ambient decor */}
      <div className="fixed bottom-8 right-8 z-0 pointer-events-none opacity-30 hidden xl:block">
        <div className="relative w-48 h-48">
          <div className="absolute inset-0 rounded-full animate-[spin_20s_linear_infinite]" style={{ border: `1px solid ${HOME_COLORS.primary}33` }} />
          <div className="absolute inset-6 rounded-full animate-[spin_15s_linear_infinite_reverse]" style={{ border: `1px solid ${HOME_COLORS.primary}1a` }} />
          <div className="absolute inset-12 rounded-full animate-[spin_30s_linear_infinite]" style={{ border: `1px solid ${HOME_COLORS.primary}0d` }} />
        </div>
      </div>

      {/* Create project modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal key="create-project-modal" onClose={() => setShowCreateModal(false)} layoutId="create-project-modal" maxWidth={440}>
            <CreateProjectForm onCreate={handleCreate} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProjectCard({ rollup, onDelete, deleting }: { rollup: ProjectRollup; onDelete: () => void; deleting: boolean }) {
  const { project, interviewCount, signalCount, avgConfidence, topSignalSummary } = rollup
  const tier = confidenceTier(avgConfidence, signalCount)
  const CoverIcon = getProjectIcon(project.name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="group rounded-xl overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1"
      style={{ background: HOME_COLORS.surfaceContainerLowest, border: `1px solid ${HOME_COLORS.outlineVariant}00`, boxShadow: CARD_SHADOW }}
    >
      <Link href={`/projects/${project.id}`} className="relative h-40 sm:h-48 overflow-hidden block" style={{ background: `linear-gradient(135deg, ${HOME_COLORS.primaryContainer}, ${HOME_COLORS.primary})` }}>
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
          <CoverIcon size={56} strokeWidth={1} style={{ color: `${HOME_COLORS.primaryFixedDim}66` }} />
        </div>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); if (confirm(`Delete "${project.name}"? This cannot be undone. Personas and interviews inside it will become unassigned, not deleted.`)) onDelete() }}
          title="Delete project"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
        <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
          <div className="px-3 py-1 rounded text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            {tier}
          </div>
        </div>
      </Link>
      <div className="p-6 sm:p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4 gap-3">
          <div className="min-w-0">
            <Link href={`/projects/${project.id}`}>
              <h3 className="text-lg sm:text-xl leading-snug transition-colors group-hover:opacity-80" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.onSurface }}>{project.name}</h3>
            </Link>
            <p className="text-[11px] mt-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>
              Created {formatDate(project.created_at)} • Updated {formatDate(project.updated_at)}
            </p>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase" style={{ color: HOME_COLORS.primary }}>Confidence</span>
            <span className="text-2xl leading-none" style={{ fontFamily: HOME_FONT_DISPLAY, fontWeight: 600, color: HOME_COLORS.primary }}>{avgConfidence}%</span>
          </div>
        </div>

        {topSignalSummary && (
          <p className="text-sm leading-relaxed mb-6 italic line-clamp-3 pl-4" style={{ color: HOME_COLORS.onSurfaceVariant, borderLeft: `2px solid ${HOME_COLORS.primaryFixedDim}` }}>
            &ldquo;{topSignalSummary}&rdquo;
          </p>
        )}

        <div className="mt-auto grid grid-cols-3 gap-4 pt-6" style={{ borderTop: `1px solid ${HOME_COLORS.outlineVariant}4d` }}>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Interviews</span>
            <span className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{interviewCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Signals</span>
            <span className="text-sm font-semibold" style={{ color: HOME_COLORS.onSurface }}>{signalCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase mb-1" style={{ color: HOME_COLORS.onSurfaceVariant }}>Status</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: project.archived ? HOME_COLORS.onSurfaceVariant : HOME_COLORS.primary }}>
              <span className={`w-2 h-2 rounded-full ${project.archived ? '' : 'animate-pulse'}`} style={{ background: project.archived ? HOME_COLORS.outlineVariant : HOME_COLORS.primary }} />
              {project.archived ? 'Archived' : 'Active'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CreateProjectForm({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const submit = async () => {
    if (!name.trim() || creating) return
    setCreating(true)
    try {
      await onCreate(name)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: HOME_COLORS.onSurface }}>Create New Project</h3>
      <p className="text-sm mb-5" style={{ color: HOME_COLORS.onSurfaceVariant }}>Give your research simulation a name. You can add personas, interviews, and files once it&apos;s created.</p>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="e.g. Sustainable Skincare Launch"
        className="w-full px-4 py-3 text-sm rounded-lg outline-none mb-4"
        style={{ background: HOME_COLORS.surfaceContainerLow, border: `1px solid ${HOME_COLORS.outlineVariant}66`, color: HOME_COLORS.onSurface }}
      />
      <button
        onClick={submit}
        disabled={creating || !name.trim()}
        className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-full text-white transition-colors disabled:opacity-50"
        style={{ background: HOME_COLORS.primary, border: 'none', cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
      >
        {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Create Project
      </button>
    </div>
  )
}
