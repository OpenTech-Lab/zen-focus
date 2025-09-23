import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'ZenFocus - Minimalistic Focus & Wellness',
  description:
    'A minimalistic focus and wellness web application with customizable Pomodoro-style timers',
  keywords: 'pomodoro, focus, meditation, timer, productivity, wellness',
  authors: [{ name: 'ZenFocus Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10B981',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  )
}
