'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Briefcase, Users, MessageSquare, Activity, FileText, Folder, Clock,
  Plus, Trash2, Pencil, Copy, Search, Upload, Download, Archive, ArchiveRestore,
} from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import { SignalCard } from '@/components/signals/SignalCard'
import { DownloadReportButton } from '@/components/ui/DownloadReportButton'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { buildTimelineEvents, type TimelineEvent } from '@/lib/utils/timeline'
import { FUNNEL_STAGE_LABELS } from '@/types'
import type { Project, Persona, Interview, Signal, Report, ProjectFile } from '@/types'

const TABS = ['Overview', 'Personas', 'Interviews', 'Signals', 'Reports', 'Files', 'Timeline', 'Settings'] as const
type Tab = typeof TABS[number]

const cardStyle = { background: 'white', boxShadow: '0 1px 2px rgba(31,36,32,0.04)', border: '1px solid #E0E2E4' }

interface ProjectDetailClientProps {
  project: Project
  allPersonas: Persona[]
  allInterviews: (Interview & { persona: Persona })[]
  signals: Signal[]
  reports: (Report & { interview: Interview })[]
  files: ProjectFile[]
  initialTab?: string
}

export function ProjectDetailClient({ project: initialProject, allPersonas, allInterviews, signals, reports, files: initialFiles, initialTab }: ProjectDetailClientProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>((TABS as readonly string[]).includes(initialTab ?? '') ? (initialTab as Tab) : 'Overview')
  const [project, setProject] = useState(initialProject)
  const [personas, setPersonas] = useState(allPersonas)
  const [interviews, setInterviews] = useState(allInterviews)
  const [files, setFiles] = useState(initialFiles)

  const projectPersonas = personas.filter(p => p.project_id === project.id)
  const projectInterviews = interviews.filter(iv => iv.project_id === project.id)

  const timelineEvents = useMemo(
    () => buildTimelineEvents({ personas: projectPersonas, interviews: projectInterviews, reports, signals, files }),
    [projectPersonas, projectInterviews, reports, signals, files]
  )

  const avgConfidence = signals.length > 0
    ? Math.round(signals.reduce((sum, s) => sum + s.confidence_score, 0) / signals.length)
    : 0

  // v1 heuristic, not a black-box score: weighted blend of signal confidence
  // and interview volume, capped so a single interview can't max it out.
  const healthScore = Math.round(0.7 * avgConfidence + 0.3 * Math.min(projectInterviews.length / 10, 1) * 100)

  return (
    <div style={{ background: '#F9F9F9', minHeight: '100%' }} className="p-4 sm:p-8">
      <Link href="/projects" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-6 transition-colors w-fit">
        <ArrowLeft size={14} /> All projects
      </Link>

      <div className="rounded-2xl p-5 sm:p-6 mb-6" style={cardStyle}>
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#E8F3EF' }}>
            <Briefcase size={20} style={{ color: '#1C3D2E' }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="heading-editorial text-2xl text-neutral-900 truncate">{project.name}</h1>
              {project.archived && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Archived</span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: '#5F6368' }}>Created {formatDate(project.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto mb-6" style={{ borderBottom: '1px solid #E0E2E4' }}>
        {TABS.map(tabName => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className="px-4 py-2.5 text-xs font-medium transition-colors flex-shrink-0"
            style={{
              color: tab === tabName ? '#1C3D2E' : '#757575',
              borderBottom: tab === tabName ? '2px solid #1C3D2E' : '2px solid transparent',
              background: 'none', border: 'none', borderBottomWidth: '2px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {tabName}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <OverviewTab
          healthScore={healthScore}
          interviewCount={projectInterviews.length}
          signalCount={signals.length}
          avgConfidence={avgConfidence}
          events={timelineEvents.slice(0, 5)}
        />
      )}

      {tab === 'Personas' && (
        <PersonasTab
          project={project}
          projectPersonas={projectPersonas}
          availablePersonas={personas.filter(p => p.project_id !== project.id)}
          onLink={async (personaId) => {
            await fetch('/api/personas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: personaId, action: 'set_project', project_id: project.id }) })
            setPersonas(prev => prev.map(p => p.id === personaId ? { ...p, project_id: project.id } : p))
          }}
          onUnlink={async (personaId) => {
            await fetch('/api/personas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: personaId, action: 'set_project', project_id: null }) })
            setPersonas(prev => prev.map(p => p.id === personaId ? { ...p, project_id: null } : p))
          }}
          onDelete={async (personaId) => {
            if (!confirm('Delete this persona? This cannot be undone.')) return
            await fetch('/api/personas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: personaId }) })
            setPersonas(prev => prev.filter(p => p.id !== personaId))
          }}
          onDuplicate={async (persona) => {
            const res = await fetch('/api/personas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: project.id,
                name: `${persona.name} (copy)`,
                traits: persona.traits,
                tags: persona.tags,
              }),
            })
            const json = await res.json()
            if (json.data) setPersonas(prev => [json.data, ...prev])
          }}
        />
      )}

      {tab === 'Interviews' && (
        <InterviewsTab
          project={project}
          projectInterviews={projectInterviews}
          availableInterviews={interviews.filter(iv => iv.project_id !== project.id)}
          onLink={async (interviewId) => {
            await fetch('/api/interviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: interviewId, action: 'set_project', project_id: project.id }) })
            setInterviews(prev => prev.map(iv => iv.id === interviewId ? { ...iv, project_id: project.id } : iv))
          }}
          onDelete={async (interviewId) => {
            if (!confirm('Delete this interview? This cannot be undone.')) return
            await fetch('/api/interviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: interviewId }) })
            setInterviews(prev => prev.filter(iv => iv.id !== interviewId))
          }}
        />
      )}

      {tab === 'Signals' && <SignalsTab signals={signals} />}

      {tab === 'Reports' && <ReportsTab reports={reports} />}

      {tab === 'Files' && (
        <FilesTab
          project={project}
          files={files}
          onUploaded={(file) => setFiles(prev => [file, ...prev])}
          onDeleted={(fileId) => setFiles(prev => prev.filter(f => f.id !== fileId))}
        />
      )}

      {tab === 'Timeline' && <TimelineTab events={timelineEvents} />}

      {tab === 'Settings' && (
        <SettingsTab
          project={project}
          onRenamed={(name) => setProject(prev => ({ ...prev, name }))}
          onArchiveToggled={(archived) => setProject(prev => ({ ...prev, archived, archived_at: archived ? new Date().toISOString() : null }))}
          onDeleted={() => router.push('/projects')}
        />
      )}
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-4" style={cardStyle}>
      <p className="text-2xl font-semibold text-neutral-900" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#5F6368' }}>{label}</p>
    </div>
  )
}

function OverviewTab({ healthScore, interviewCount, signalCount, avgConfidence, events }: {
  healthScore: number; interviewCount: number; signalCount: number; avgConfidence: number; events: TimelineEvent[]
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Research Health" value={`${healthScore}%`} />
        <StatTile label="Interviews" value={interviewCount} />
        <StatTile label="Signals Found" value={signalCount} />
        <StatTile label="Avg Confidence" value={`${avgConfidence}%`} />
      </div>

      <div className="rounded-2xl p-5" style={cardStyle}>
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">Recent activity</h2>
        {events.length === 0 ? (
          <p className="text-xs" style={{ color: '#5F6368' }}>Nothing yet — create a persona or run an interview to get started.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-neutral-700">{e.title}{e.detail ? ` — ${e.detail}` : ''}</span>
                <span className="text-neutral-400 flex-shrink-0">{formatRelativeTime(e.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Personas ─────────────────────────────────────────────────────────────────

function PersonasTab({ project, projectPersonas, availablePersonas, onLink, onUnlink, onDelete, onDuplicate }: {
  project: Project
  projectPersonas: Persona[]
  availablePersonas: Persona[]
  onLink: (id: string) => void
  onUnlink: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (persona: Persona) => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPicker(v => !v)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: 'white', border: '1px solid #E0E2E4', color: '#1C3D2E' }}>
            <Plus size={13} /> Add existing
          </button>
          <Link href={`/personas/new?project_id=${project.id}`} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ background: '#1C3D2E' }}>
            <Plus size={13} /> Create persona
          </Link>
        </div>
      </div>

      {showPicker && (
        <div className="rounded-2xl p-4 mb-4" style={cardStyle}>
          <p className="text-xs font-semibold text-neutral-700 mb-2">Link an existing persona</p>
          {availablePersonas.length === 0 ? (
            <p className="text-xs" style={{ color: '#5F6368' }}>No other personas to add.</p>
          ) : (
            <div className="space-y-1.5">
              {availablePersonas.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-700">{p.name}</span>
                  <button onClick={() => onLink(p.id)} className="text-[11px] font-semibold px-2 py-1 rounded-md" style={{ background: '#E8F3EF', color: '#1C3D2E' }}>Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {projectPersonas.length === 0 ? (
        <EmptyState icon={Users} title="No personas linked yet" description="Create a new persona or link an existing one." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectPersonas.map(persona => (
            <div key={persona.id} className="rounded-2xl p-4" style={cardStyle}>
              <div className="flex items-start gap-3 mb-3">
                <PersonaAvatar avatarUrl={persona.avatar_url} avatarInitials={persona.avatar_initials} avatarColor={persona.avatar_color} name={persona.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{persona.name}</p>
                  {persona.funnel_stage && <p className="text-[11px] text-neutral-400">{FUNNEL_STAGE_LABELS[persona.funnel_stage]}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Link href={`/personas/${persona.id}`} className="flex-1 text-center text-[11px] font-semibold px-2 py-1.5 rounded-lg" style={{ background: '#F4F6F8', color: '#374151' }}>Open</Link>
                <button onClick={() => onDuplicate(persona)} title="Duplicate" className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: '#F4F6F8', color: '#374151' }}><Copy size={12} /></button>
                <button onClick={() => onUnlink(persona.id)} title="Remove from project" className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: '#F4F6F8', color: '#374151' }}><Folder size={12} /></button>
                <button onClick={() => onDelete(persona.id)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500" style={{ background: '#FEF2F2' }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Interviews ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: '#E8F5F1', color: '#2A5C4E' },
  completed: { bg: '#F3F4F6', color: '#6B7280' },
  draft: { bg: '#FFFBEB', color: '#92400E' },
}

function InterviewsTab({ project, projectInterviews, availableInterviews, onLink, onDelete }: {
  project: Project
  projectInterviews: (Interview & { persona: Persona })[]
  availableInterviews: (Interview & { persona: Persona })[]
  onLink: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = projectInterviews.filter(iv => iv.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search interviews…" className="pl-8 pr-3 py-2 text-xs rounded-lg w-full sm:w-56" style={{ background: 'white', border: '1px solid #E0E2E4' }} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPicker(v => !v)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: 'white', border: '1px solid #E0E2E4', color: '#1C3D2E' }}>
            <Plus size={13} /> Add existing
          </button>
          <Link href={`/interviews/new?project_id=${project.id}`} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ background: '#1C3D2E' }}>
            <Plus size={13} /> Run interview
          </Link>
        </div>
      </div>

      {showPicker && (
        <div className="rounded-2xl p-4 mb-4" style={cardStyle}>
          <p className="text-xs font-semibold text-neutral-700 mb-2">Link an existing interview</p>
          {availableInterviews.length === 0 ? (
            <p className="text-xs" style={{ color: '#5F6368' }}>No other interviews to add.</p>
          ) : (
            <div className="space-y-1.5">
              {availableInterviews.map(iv => (
                <div key={iv.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-700">{iv.title}</span>
                  <button onClick={() => onLink(iv.id)} className="text-[11px] font-semibold px-2 py-1 rounded-md" style={{ background: '#E8F3EF', color: '#1C3D2E' }}>Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No interviews linked yet" description="Run a new interview or link an existing one." />
      ) : (
        <div className="space-y-3">
          {filtered.map(iv => {
            const statusStyle = STATUS_STYLES[iv.status] ?? STATUS_STYLES.completed
            return (
              <div key={iv.id} className="relative group">
                <Link href={`/interviews/${iv.id}`} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl block hover:border-neutral-300 transition-colors" style={cardStyle}>
                  <PersonaAvatar avatarUrl={iv.persona?.avatar_url} avatarInitials={iv.persona?.avatar_initials} avatarColor={iv.persona?.avatar_color} name={iv.persona?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{iv.title}</p>
                    <p className="text-xs text-neutral-400 truncate">{iv.persona?.name ?? 'Unknown'}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={statusStyle}>{iv.status}</span>
                  <span className="text-xs text-neutral-400 flex-shrink-0 hidden sm:inline pr-8">{formatRelativeTime(iv.updated_at)}</span>
                </Link>
                <button onClick={() => onDelete(iv.id)} className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500" style={{ background: 'white', border: '1px solid #E0E2E4' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Signals ──────────────────────────────────────────────────────────────────

function SignalsTab({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return <EmptyState icon={Activity} title="No signals yet" description="Generate a report from an interview in this project to start synthesizing signals." />
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {signals.map(signal => <SignalCard key={signal.id} signal={signal} />)}
    </div>
  )
}

// ─── Reports ──────────────────────────────────────────────────────────────────

function ReportsTab({ reports }: { reports: (Report & { interview: Interview })[] }) {
  if (reports.length === 0) {
    return <EmptyState icon={FileText} title="No reports yet" description="Generate a report from a completed interview in this project." />
  }
  return (
    <div className="space-y-3">
      {reports.map(report => (
        <div key={report.id} className="rounded-2xl p-4 flex items-center justify-between gap-3" style={cardStyle}>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">{report.interview?.title ?? 'Untitled interview'}</p>
            <p className="text-xs text-neutral-400 mt-0.5 truncate">{report.executive_summary}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold" style={{ color: '#1C3D2E' }}>{report.confidence_score}%</span>
            <DownloadReportButton />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Files ────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FilesTab({ project, files, onUploaded, onDeleted }: {
  project: Project
  files: ProjectFile[]
  onUploaded: (file: ProjectFile) => void
  onDeleted: (id: string) => void
}) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/projects/${project.id}/files`, { method: 'POST', body: formData })
      const json = await res.json()
      if (json.data) onUploaded(json.data)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (file: ProjectFile) => {
    const res = await fetch(`/api/projects/${project.id}/files/${file.id}`)
    const json = await res.json()
    if (json.data?.url) window.open(json.data.url, '_blank')
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file?')) return
    await fetch(`/api/projects/${project.id}/files/${fileId}`, { method: 'DELETE' })
    onDeleted(fileId)
  }

  return (
    <div>
      <label className="flex flex-col items-center justify-center rounded-2xl py-10 mb-6 cursor-pointer transition-colors hover:border-neutral-300" style={{ background: 'white', border: '2px dashed #E0E2E4' }}>
        <Upload size={20} className="mb-2" style={{ color: uploading ? '#1C3D2E' : '#9CA3AF' }} />
        <p className="text-sm font-semibold text-neutral-800">{uploading ? 'Uploading…' : 'Upload a file'}</p>
        <p className="text-xs mt-1" style={{ color: '#5F6368' }}>PDFs, notes, competitor docs, images — anything supporting this research</p>
        <input type="file" className="hidden" disabled={uploading} onChange={e => handleUpload(e.target.files)} />
      </label>

      {files.length === 0 ? (
        <EmptyState icon={Folder} title="No files yet" description="Upload research to keep it alongside this project." />
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={cardStyle}>
              <div className="min-w-0 flex items-center gap-3">
                <FileText size={16} style={{ color: '#9CA3AF' }} className="flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
                  <p className="text-[11px] text-neutral-400">{formatBytes(file.size_bytes)} · {formatRelativeTime(file.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => handleDownload(file)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: '#F4F6F8', color: '#374151' }}><Download size={12} /></button>
                <button onClick={() => handleDelete(file.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500" style={{ background: '#FEF2F2' }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <EmptyState icon={Clock} title="Nothing has happened yet" description="Activity across this project will show up here." />
  }
  return (
    <div className="rounded-2xl p-5" style={cardStyle}>
      <ul className="space-y-4">
        {events.map((e, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#1C3D2E' }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-neutral-800">{e.title}</p>
                <span className="text-[11px] text-neutral-400 flex-shrink-0">{formatRelativeTime(e.timestamp)}</span>
              </div>
              {e.detail && <p className="text-xs text-neutral-400 mt-0.5">{e.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsTab({ project, onRenamed, onArchiveToggled, onDeleted }: {
  project: Project
  onRenamed: (name: string) => void
  onArchiveToggled: (archived: boolean) => void
  onDeleted: () => void
}) {
  const [name, setName] = useState(project.name)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleRename = async () => {
    if (!name.trim() || name === project.name) return
    setSaving(true)
    try {
      await fetch(`/api/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rename', name }) })
      onRenamed(name.trim())
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveToggle = async () => {
    setArchiving(true)
    try {
      const action = project.archived ? 'restore' : 'archive'
      await fetch(`/api/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      onArchiveToggled(!project.archived)
    } finally {
      setArchiving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone. Personas and interviews inside it will become unassigned, not deleted.`)) return
    setDeleting(true)
    try {
      await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-2xl p-5" style={cardStyle}>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Project name</label>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg" style={{ background: 'white', border: '1px solid #E0E2E4' }} />
          <button onClick={handleRename} disabled={saving || !name.trim() || name === project.name} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white disabled:opacity-50" style={{ background: '#1C3D2E' }}>
            <Pencil size={12} /> Save
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-5 flex items-center justify-between gap-3" style={cardStyle}>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{project.archived ? 'Archived' : 'Archive this project'}</p>
          <p className="text-xs mt-0.5" style={{ color: '#5F6368' }}>{project.archived ? 'Restore it to make it active again.' : 'Hide it from the active projects list without deleting anything.'}</p>
        </div>
        <button onClick={handleArchiveToggle} disabled={archiving} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0" style={{ background: '#F4F6F8', color: '#374151' }}>
          {project.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
          {project.archived ? 'Restore' : 'Archive'}
        </button>
      </div>

      <div className="rounded-2xl p-5 flex items-center justify-between gap-3" style={{ background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
        <div>
          <p className="text-sm font-semibold text-red-700">Delete this project</p>
          <p className="text-xs mt-0.5 text-red-500">Permanent. Linked personas/interviews are unassigned, not deleted.</p>
        </div>
        <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white flex-shrink-0" style={{ background: '#DC2626' }}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description }: { icon: typeof Users; title: string; description: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl py-16" style={{ background: 'white', border: '1px dashed #E0E2E4' }}>
      <div className="text-center max-w-sm px-6">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#E8F3EF' }}>
          <Icon size={20} style={{ color: '#1C3D2E' }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: '#202124' }}>{title}</p>
        <p className="text-xs mt-1" style={{ color: '#5F6368' }}>{description}</p>
      </div>
    </div>
  )
}
