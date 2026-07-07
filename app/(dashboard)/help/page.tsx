import { HelpCircle } from 'lucide-react'
import { ComingSoon } from '@/components/ui/ComingSoon'

export default function HelpPage() {
  return (
    <ComingSoon
      icon={HelpCircle}
      title="Help & support"
      description="A help center with guides, FAQs, and a way to reach us directly is coming soon."
    />
  )
}
