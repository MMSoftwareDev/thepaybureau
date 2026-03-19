import { verifyCronSecret } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 minutes

/**
 * GET /api/cron/hmrc-scraper
 *
 * Vercel Cron job that triggers the HMRC guidance scraper weekly.
 * Calls the scrape endpoint internally with the cron secret.
 *
 * Schedule: Every day at midnight UTC (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cronSecret = process.env.CRON_SECRET

  try {
    // Get the base URL from the request
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    // Call the scrape endpoint
    const res = await fetch(`${baseUrl}/api/ai-assistant/documents/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('HMRC cron scrape failed:', data)
      return NextResponse.json({ error: 'Scrape failed', details: data }, { status: 500 })
    }

    console.log('HMRC cron scrape completed:', data)

    return NextResponse.json({
      ok: true,
      trigger: 'cron',
      timestamp: new Date().toISOString(),
      ...data,
    })
  } catch (error) {
    console.error('HMRC cron error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
