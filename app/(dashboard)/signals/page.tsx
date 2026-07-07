import { Activity } from 'lucide-react'
import { ComingSoon } from '@/components/ui/ComingSoon'

export default function SignalsPage() {
  return (
    <ComingSoon
      icon={Activity}
      title="Signals"
      description="Emerging patterns and trends across your personas and interviews will surface here."
    />
  )
}
