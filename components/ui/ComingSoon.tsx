import type { LucideIcon } from 'lucide-react'

export function ComingSoon({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-center rounded-2xl py-24" style={{ background: '#FFFFFF', border: '1px dashed #E0E2E4' }}>
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#E8F3EF' }}>
            <Icon size={22} style={{ color: '#1C3D2E' }} />
          </div>
          <h1 className="font-serif text-xl text-neutral-900 mb-2">{title}</h1>
          <p className="text-sm" style={{ color: '#5F6368' }}>{description}</p>
        </div>
      </div>
    </div>
  )
}
