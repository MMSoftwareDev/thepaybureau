import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const BREVO_API_URL = 'https://api.brevo.com/v3/contacts'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const limiter = await rateLimit(`newsletter:${ip}`, { limit: 5, windowSeconds: 900 })
  if (!limiter.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 }
    )
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('BREVO_API_KEY is not configured')
    return NextResponse.json(
      { error: 'Newsletter service is not configured.' },
      { status: 503 }
    )
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: parsed.data.email,
        updateEnabled: true,
      }),
    })

    // 201 = created, 204 = already exists (updateEnabled: true)
    if (response.ok || response.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Brevo returns 400 for duplicate contacts when updateEnabled is false
    // With updateEnabled: true, duplicates return 204 — but handle edge cases
    if (response.status === 400) {
      const errorData = await response.json().catch(() => null)
      if (errorData?.code === 'duplicate_parameter') {
        return NextResponse.json({ success: true }, { status: 200 })
      }
    }

    const errorData = await response.json().catch(() => null)
    console.error('Brevo API error:', response.status, errorData)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  } catch (err) {
    console.error('Newsletter subscribe error:', err)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }
}
