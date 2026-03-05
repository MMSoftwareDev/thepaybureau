// src/app/api/status/route.ts
import { NextResponse } from 'next/server'

// UptimeRobot monitor statuses:
// 0 = paused, 1 = not checked yet, 2 = up, 8 = seems down, 9 = down

export async function GET() {
  const apiKey = process.env.UPTIMEROBOT_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'UptimeRobot API key not configured' },
      { status: 503 }
    )
  }

  try {
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        format: 'json',
        logs: 0,
      }),
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error(`UptimeRobot API returned ${response.status}`)
    }

    const data = await response.json()

    if (data.stat !== 'ok') {
      throw new Error(data.error?.message || 'UptimeRobot API error')
    }

    const monitors = (data.monitors || []).map((m: { id: number; friendly_name: string; status: number; url: string }) => ({
      id: m.id,
      name: m.friendly_name,
      status: m.status,
      url: m.url,
    }))

    return NextResponse.json({ monitors })
  } catch (error) {
    console.error('UptimeRobot API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 502 }
    )
  }
}
