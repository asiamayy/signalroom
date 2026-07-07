import { Home } from 'lucide-react'
import { ComingSoon } from '@/components/ui/ComingSoon'

export default function HomePage() {
  return (
    <ComingSoon
      icon={Home}
      title="Home"
      description="Your personalized overview is on the way — a snapshot of recent activity across personas, interviews, and projects."
    />
  )
}
