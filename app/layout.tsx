import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SignalRoom — AI market research for founders and marketers',
  description: 'Build AI personas that represent your target customer. Interview them. Get structured research insights in minutes — not weeks, not $8,000.',
  openGraph: {
    title: 'SignalRoom',
    description: 'AI-powered market research for founders and marketers.',
    url: 'https://signalroom.io',
    siteName: 'SignalRoom',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  )
}
