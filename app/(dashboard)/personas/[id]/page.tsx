import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { INTERVIEW_TYPE_LABELS } from '@/lib/utils'
import { MessageSquare, ChevronRight } from 'lucide-react'
import { PersonaAvatar } from '@/components/persona/PersonaAvatar'
import type { Interview } from '@/types'

export default async function PersonaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single()

  if (!persona) notFound()

  const { data: interviews } = await supabase
    .from('interviews')
    .select('*')
    .eq('persona_id', id)
    .order('created_at', { ascending: false })

  const t = persona.traits

  const incomeMap: Record<string, string> = {
    under_50k: 'Under $50k',
    '50k_100k': '$50k–$100k',
    '100k_200k': '$100k–$200k',
    over_200k: 'Over $200k',
  }

  const educationMap: Record<string, string> = {
    high_school: 'High School',
    bachelors: "Bachelor's",
    masters: "Master's",
    phd: 'PhD',
  }

  const pills = [
    t?.location,
    t?.age ? `Age ${t.age}` : null,
    t?.income ? incomeMap[t.income] : null,
    t?.education ? educationMap[t.education] : null,
  ].filter(Boolean) as string[]

  return (
    <div style={{ background: '#F4F6F8', minHeight: '100%' }}>

      {/* ── Hero banner ── */}
      <div className="p-6 pb-0">
        <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(115deg, #0A4F3A 0%, #147A5C 40%, #2BAE86 75%, #7DE0C0 100%)' }}>

          {/* Wave SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,80 C200,160 400,0 600,100 C750,170 850,60 800,80 L800,220 L0,220Z" fill="white"/>
            <path d="M0,130 C150,60 350,190 550,110 C700,50 800,140 800,100 L800,220 L0,220Z" fill="white" opacity="0.5"/>
          </svg>

          {/* Floating stat cards + Start interview — top right */}
          <div className="absolute top-4 right-5 z-20 flex flex-col items-end gap-2">
            <Link href={`/interviews/new?persona_id=${persona.id}`}>
              <button
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.95)', color: '#0D5C45', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                <MessageSquare size={13} />
                Start interview
              </button>
            </Link>
            <div className="flex gap-2">
              <div className="text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="text-lg font-bold text-white leading-none">{interviews?.length ?? 0}</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Interviews</div>
              </div>
              <div className="text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="text-lg font-bold text-white leading-none">Today</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Last active</div>
              </div>
            </div>
          </div>

          {/* Main hero content */}
          <div className="relative z-10 flex items-center gap-6 px-8 pt-8 pb-7" style={{ paddingRight: '240px' }}>
            <div className="flex-shrink-0" style={{ border: '3px solid rgba(255,255,255,0.4)', borderRadius: '50%', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
              <PersonaAvatar
                avatarUrl={persona.avatar_url}
                avatarInitials={persona.avatar_initials}
                avatarColor={persona.avatar_color}
                name={persona.name}
                size="xl"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-3xl text-white tracking-tight mb-1" style={{ letterSpacing: '-0.5px' }}>
                {persona.name}
              </h1>
              <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {t?.job_title}{t?.industry ? ` · ${t.industry}` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {pills.map((val, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full font-medium text-white" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    {val}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Score bars */}
          <div className="relative z-10 flex gap-10 px-8 py-5" style={{ background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Tech savviness</p>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className="w-5 h-1 rounded-full" style={{ background: n <= (t?.tech_savviness ?? 0) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }} />
                ))}
                <span className="text-xs font-semibold ml-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{t?.tech_savviness ?? 0}/5</span>
              </div>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Risk tolerance</p>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className="w-5 h-1 rounded-full" style={{ background: n <= (t?.risk_tolerance ?? 0) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }} />
                ))}
                <span className="text-xs font-semibold ml-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{t?.risk_tolerance ?? 0}/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card grid ── */}
      <div className="p-6 grid grid-cols-3 gap-4">

        {/* Demographics */}
        <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Demographics</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Age', value: t?.age },
              { label: 'Gender', value: t?.gender },
              { label: 'Location', value: t?.location },
              { label: 'Education', value: t?.education ? educationMap[t.education] : null },
              { label: 'Income', value: t?.income ? incomeMap[t.income] : null },
              { label: 'Industry', value: t?.industry },
            ].filter(item => item.value).map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-neutral-400 mb-0.5 font-medium">{label}</dt>
                <dd className="text-sm font-medium text-neutral-800">{value}</dd>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        {t?.goals?.filter(Boolean).length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <h2 className="text-sm font-bold text-neutral-900 mb-4">Goals</h2>
            <ul className="space-y-2.5">
              {t.goals.filter(Boolean).map((g: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: '#1A8C6A' }}>→</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Frustrations */}
        {t?.frustrations?.filter(Boolean).length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <h2 className="text-sm font-bold text-neutral-900 mb-4">Frustrations</h2>
            <ul className="space-y-2.5">
              {t.frustrations.filter(Boolean).map((f: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }}>→</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Buying behavior */}
        {t?.buying_behavior && (
          <div className="col-span-2 rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <h2 className="text-sm font-bold text-neutral-900 mb-3">Buying Behavior</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">{t.buying_behavior}</p>
          </div>
        )}

        {/* Interviews */}
        <div className="rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-900">Interviews</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
              {interviews?.length ?? 0}
            </span>
          </div>
          {(!interviews || interviews.length === 0) ? (
            <div className="text-center py-4">
              <p className="text-xs text-neutral-400 mb-3">No interviews yet</p>
              <Link href={`/interviews/new?persona_id=${persona.id}`} className="text-xs font-semibold" style={{ color: '#1A8C6A' }}>
                Start first interview →
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
              {interviews.map((iv: Interview) => (
                <Link
                  key={iv.id}
                  href={`/interviews/${iv.id}`}
                  className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-neutral-800 truncate">{iv.title}</p>
                    <p className="text-xs text-neutral-400">{INTERVIEW_TYPE_LABELS[iv.type]}</p>
                  </div>
                  <ChevronRight size={12} className="text-neutral-300 group-hover:text-neutral-500 flex-shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Additional context */}
        {t?.additional_context && (
          <div className="col-span-2 rounded-2xl p-5" style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
            <h2 className="text-sm font-bold text-neutral-900 mb-3">Additional Context</h2>
            <p className="text-sm text-neutral-700 leading-relaxed">{t.additional_context}</p>
          </div>
        )}

      </div>
    </div>
  )
}
