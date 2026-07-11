'use client'

import { useEffect, useState } from 'react'

// Time-of-day greeting has to be computed in the browser — a server
// component sees the server's clock, not the visitor's, which is why this
// was previously saying "good evening" in the middle of someone's afternoon.
// Renders a neutral fallback until mount so there's no hydration mismatch.
export function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  return <>{greeting ?? 'Welcome back'}, {firstName}</>
}
