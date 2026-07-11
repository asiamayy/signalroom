'use client'

import { useMemo, useState } from 'react'
import { Activity } from 'lucide-react'
import { SignalCard } from '@/components/signals/SignalCard'
import { SIGNAL_TYPE_LABELS } from '@/types'
import type { Signal, SignalType } from '@/types'

interface SignalsClientProps {
  initialSignals: Signal[]
  projects: { id: string; name: string }[]
  personas: { id: string; name: string }[]
  interviews: { id: string; title: string }[]
}

const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

const selectStyle = {
  background: 'white',
  border: '1px solid #E0E2E4',
}

export function SignalsClient({ initialSignals, projects, personas, interviews }: SignalsClientProps) {
  const [projectId, setProjectId] = useState('')
  const [personaId, setPersonaId] = useState('')
  const [interviewId, setInterviewId] = useState('')
  const [type, setType] = useState<SignalType | ''>('')
  const [minConfidence, setMinConfidence] = useState(0)
  const [dateRange, setDateRange] = useState('all')

  const filtered = useMemo(() => {
    const since = dateRange === 'all' ? null : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000
    return initialSignals.filter(s => {
      if (projectId && s.project_id !== projectId) return false
      if (personaId && !s.related_persona_ids.includes(personaId)) return false
      if (interviewId && !s.related_interview_ids.includes(interviewId)) return false
      if (type && s.type !== type) return false
      if (s.confidence_score < minConfidence) return false
      if (since && new Date(s.created_at).getTime() < since) return false
      return true
    })
  }, [initialSignals, projectId, personaId, interviewId, type, minConfidence, dateRange])

  // Cross-cutting views, not a strict partition — a signal can land in more
  // than one section (e.g. high-confidence AND still growing).
  const highConfidence = filtered.filter(s => s.confidence_score >= 80)
  const growing = filtered.filter(s => s.status === 'growing')
  const emerging = filtered.filter(s => s.status === 'emerging')

  return (
    <div style={{ background: '#F4F6F8', minHeight: '100%' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-7 py-4 sm:py-5" style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div>
          <h1 className="heading-editorial text-2xl text-neutral-900">Signals</h1>
          <p className="text-sm text-neutral-400 mt-0.5">What we've learned across all research — synthesized by AI, not written by hand</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-7 py-4">
        <select value={projectId} onChange={e => setProjectId(e.target.value)} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={personaId} onChange={e => setPersonaId(e.target.value)} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
          <option value="">All personas</option>
          {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={interviewId} onChange={e => setInterviewId(e.target.value)} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
          <option value="">All interviews</option>
          {interviews.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value as SignalType | '')} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
          <option value="">All types</option>
          {Object.entries(SIGNAL_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="text-xs rounded-lg px-3 py-2" style={selectStyle}>
          {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-neutral-500 ml-1">
          Min confidence
          <input
            type="range" min={0} max={100} step={10}
            value={minConfidence}
            onChange={e => setMinConfidence(Number(e.target.value))}
            className="w-24 accent-[#1C3D2E]"
          />
          <span className="w-8 text-neutral-700 font-medium">{minConfidence}%</span>
        </label>
      </div>

      <div className="px-4 sm:px-7 pb-8 space-y-8">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center rounded-2xl py-24" style={{ background: 'white', border: '1px dashed #E0E2E4' }}>
            <div className="text-center max-w-sm px-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#E8F3EF' }}>
                <Activity size={22} style={{ color: '#1C3D2E' }} />
              </div>
              <h2 className="heading-editorial text-xl text-neutral-900 mb-2">No signals yet</h2>
              <p className="text-sm" style={{ color: '#5F6368' }}>
                Signals are synthesized automatically from interview reports within a project. Run interviews inside a project and generate a report to start building intelligence here.
              </p>
            </div>
          </div>
        )}

        {highConfidence.length > 0 && (
          <SignalSection title="High Confidence" description="Signals with strong, repeated evidence behind them" signals={highConfidence} />
        )}
        {growing.length > 0 && (
          <SignalSection title="Growing Signals" description="Gaining supporting evidence across more interviews" signals={growing} />
        )}
        {emerging.length > 0 && (
          <SignalSection title="Emerging Opportunities" description="Newly discovered — worth watching" signals={emerging} />
        )}
      </div>
    </div>
  )
}

function SignalSection({ title, description, signals }: { title: string; description: string; signals: Signal[] }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        <p className="text-xs text-neutral-400">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {signals.map(signal => <SignalCard key={signal.id} signal={signal} />)}
      </div>
    </section>
  )
}
