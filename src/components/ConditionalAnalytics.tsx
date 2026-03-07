'use client'

import { useEffect, useState } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

export default function ConditionalAnalytics() {
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    setConsented(localStorage.getItem('thepaybureau-cookie-consent') === 'accepted')
  }, [])

  if (!consented) return null

  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  )
}
