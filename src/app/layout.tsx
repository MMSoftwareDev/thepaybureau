// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  style: ['normal', 'italic'],
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'ThePayBureau - Professional Payroll Management',
  description: 'Professional payroll bureau management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${dmSerif.variable} ${plusJakarta.variable} ${inter.className}`}
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme="light" storageKey="thepaybureau-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}