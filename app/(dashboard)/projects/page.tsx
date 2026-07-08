'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Plus, Loader2 } from 'lucide-react'
import type { Project } from '@/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const loadProjects = () => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(json => setProjects(json.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        setName('')
        loadProjects()
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-4 sm:p-8" style={{ background: '#F9F9F9', minHeight: '100%' }}>
      <div className="mb-6">
        <h1 className="heading-editorial text-2xl text-neutral-900">Projects</h1>
        <p className="text-sm mt-1" style={{ color: '#5F6368' }}>Group personas, interviews, and reports into research projects.</p>
      </div>

      <div className="rounded-2xl p-5 mb-6" style={{ background: '#FFFFFF', border: '1px solid #E0E2E4' }}>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#202124' }}>New project</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Sustainable Skincare Launch"
            className="flex-1 px-3 py-2 text-sm rounded-md placeholder:text-neutral-400 focus:outline-none focus:ring-2"
            style={{ background: '#FFFFFF', border: '1px solid #E0E2E4', color: '#202124' }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md text-white disabled:opacity-50"
            style={{ background: '#1C3D2E', border: 'none', cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: '#5F6368' }}>Loading…</p>
      ) : projects.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl py-16" style={{ background: '#FFFFFF', border: '1px dashed #E0E2E4' }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#E8F3EF' }}>
              <Briefcase size={20} style={{ color: '#1C3D2E' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#202124' }}>No projects yet</p>
            <p className="text-xs mt-1" style={{ color: '#5F6368' }}>Create your first project above.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E0E2E4' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#E8F3EF' }}>
                <Briefcase size={16} style={{ color: '#1C3D2E' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#202124' }}>{project.name}</p>
              <p className="text-xs mt-1" style={{ color: '#5F6368' }}>
                Created {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
