'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Briefcase, Users, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!data) {
        setError(true)
      } else {
        setProject(data)
      }
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div className="p-4 sm:p-8 max-w-4xl" style={{ background: '#F9F9F9', minHeight: '100%' }}>
      <Link
        href="/projects"
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-6 transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        All projects
      </Link>

      {loading ? (
        <p className="text-sm" style={{ color: '#5F6368' }}>Loading…</p>
      ) : error ? (
        <div className="flex items-center justify-center rounded-2xl py-16" style={{ background: '#FFFFFF', border: '1px dashed #E0E2E4' }}>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: '#202124' }}>Project not found</p>
            <p className="text-xs mt-1" style={{ color: '#5F6368' }}>It may have been deleted, or you don't have access to it.</p>
          </div>
        </div>
      ) : project ? (
        <>
          <div className="rounded-2xl p-5 sm:p-6 mb-6" style={{ background: '#FFFFFF', border: '1px solid #E0E2E4' }}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#E8F3EF' }}>
                <Briefcase size={20} style={{ color: '#1C3D2E' }} />
              </div>
              <div className="min-w-0">
                <h1 className="heading-editorial text-2xl text-neutral-900 truncate">{project.name}</h1>
                <p className="text-sm mt-0.5" style={{ color: '#5F6368' }}>
                  Created {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5 flex items-center justify-center text-center py-10" style={{ background: '#FFFFFF', border: '1px dashed #E0E2E4' }}>
              <div>
                <Users size={20} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                <p className="text-sm font-semibold" style={{ color: '#202124' }}>No personas linked yet</p>
                <p className="text-xs mt-1" style={{ color: '#5F6368' }}>Persona-to-project linking is coming soon.</p>
              </div>
            </div>
            <div className="rounded-2xl p-5 flex items-center justify-center text-center py-10" style={{ background: '#FFFFFF', border: '1px dashed #E0E2E4' }}>
              <div>
                <MessageSquare size={20} className="mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                <p className="text-sm font-semibold" style={{ color: '#202124' }}>No interviews linked yet</p>
                <p className="text-xs mt-1" style={{ color: '#5F6368' }}>Interview-to-project linking is coming soon.</p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
