import { Lightbulb } from 'lucide-react'
import { ComingSoon } from '@/components/ui/ComingSoon'

export default function InsightsPage() {
  return (
    <ComingSoon
      icon={Lightbulb}
      title="Insights"
      description="Cross-persona insights distilled from your interviews and reports will live here."
    />
  )
}
