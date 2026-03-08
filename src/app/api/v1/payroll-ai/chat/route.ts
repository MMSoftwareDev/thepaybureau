import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiExternalChatSchema } from '@/lib/validations'
import { generateRagResponse } from '@/lib/ai/rag'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createHash } from 'crypto'

/**
 * Validate an API key and return the associated key record.
 */
async function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) return null

  const keyHash = createHash('sha256').update(apiKey).digest('hex')
  const supabase = createServerSupabaseClient()

  const { data: keyRecord } = await supabase
    .from('ai_api_keys')
    .select('id, tenant_id, rate_limit, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single()

  if (!keyRecord) return null
  if (!keyRecord.is_active) return null
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) return null

  // Update last_used_at
  await supabase
    .from('ai_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id)

  return keyRecord
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate via API key
    const keyRecord = await validateApiKey(request)
    if (!keyRecord) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    // Rate limit based on API key
    const ip = getClientIp(request)
    const rateLimitResult = await rateLimit(`ai_api:${keyRecord.id}:${ip}`, {
      limit: keyRecord.rate_limit,
      windowSeconds: 3600, // per hour
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retry_after: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(keyRecord.rate_limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetAt / 1000)),
          },
        }
      )
    }

    const body = await request.json()
    const { message, conversation_id } = aiExternalChatSchema.parse(body)

    const supabase = createServerSupabaseClient()

    // Optionally load conversation history
    let conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
    if (conversation_id) {
      const { data: messages } = await supabase
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })
        .limit(10)

      conversationHistory = (messages || []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    }

    // Generate response (non-streaming for external API)
    const result = await generateRagResponse(message, conversationHistory)

    // Track usage
    await supabase.from('ai_api_usage').insert({
      api_key_id: keyRecord.id,
      tenant_id: keyRecord.tenant_id,
      endpoint: '/api/v1/payroll-ai/chat',
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
      status: 200,
    })

    return NextResponse.json({
      answer: result.answer,
      citations: result.citations.map(c => ({
        document: c.document_title,
        section: c.section_title,
        source_url: c.source_url,
      })),
      conversation_id: conversation_id || null,
      usage: result.usage,
    }, {
      headers: {
        'X-RateLimit-Limit': String(keyRecord.rate_limit),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error in POST /api/v1/payroll-ai/chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
