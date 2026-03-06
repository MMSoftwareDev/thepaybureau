// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/toast'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import CookieConsent from '@/components/CookieConsent'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thepaybureau.com'

export const metadata: Metadata = {
  title: {
    default: 'ThePayBureau - Professional Payroll Management',
    template: '%s | ThePayBureau',
  },
  description: 'Never miss another payroll deadline. Professional payroll bureau management platform for UK payroll specialists — HMRC deadline tracking, client checklists, pension compliance.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: APP_URL,
    siteName: 'ThePayBureau',
    title: 'ThePayBureau - Never Miss Another Payroll Deadline',
    description: 'Professional payroll bureau management platform for UK payroll specialists. Track HMRC deadlines, manage client checklists, and stay compliant.',
    images: [
      {
        url: `${APP_URL}/logo-full.png`,
        width: 1200,
        height: 630,
        alt: 'ThePayBureau - Professional Payroll Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThePayBureau - Never Miss Another Payroll Deadline',
    description: 'Professional payroll bureau management for UK specialists. HMRC deadlines, checklists, pension tracking.',
    images: [`${APP_URL}/logo-full.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@100..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme="light" storageKey="thepaybureau-theme">
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
        <CookieConsent />
        <SpeedInsights />
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </body>
    </html>
  )
}