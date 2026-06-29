import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SignalRoom — AI market research for founders and marketers',
  description: 'Build AI personas that represent your target customer. Interview them. Get structured research insights in minutes — not weeks, not $8,000.',
  openGraph: {
    title: 'SignalRoom — AI market research for founders and marketers',
    description: 'Build AI personas that represent your target customer. Interview them. Get structured research insights in minutes — not weeks, not $8,000.',
    url: 'https://www.getsignalroom.com',
    siteName: 'SignalRoom',
    type: 'website',
    images: [
      {
        url: 'https://www.getsignalroom.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SignalRoom — AI market research',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SignalRoom — AI market research for founders and marketers',
    description: 'Build AI personas that represent your target customer. Interview them. Get structured research insights in minutes — not weeks, not $8,000.',
    images: ['https://www.getsignalroom.com/og-image.png'],
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
