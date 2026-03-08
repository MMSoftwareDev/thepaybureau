import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiApiKeyCreateSchema } from '@/lib/validations'
import { writeAuditLog } from '@/lib/audit'
import { randomBytes, createHash } from 'crypto'

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString('hex')
  const key = `tpb_live_${raw}`
  const hash = createHash('sha256').update(key).digest('hex')
  const prefix = key.slice(0, 16)
  return { key, hash, prefix }
}

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: keys, error } = await supabase
      .from('ai_api_keys')
      .select('id, name, key_prefix, scopes, rate_limit, is_active, last_used_at, expires_at, created_at')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error in GET /api/ai-assistant/api-keys:', error)
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 400 })
    }

    return NextResponse.json(keys || [])
  } catch (error) {
    console.error('Unexpected error in GET /api/ai-assistant/api-keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, rate_limit, expires_at } = aiApiKeyCreateSchema.parse(body)

    const { key, hash, prefix } = generateApiKey()

    const { data: apiKey, error } = await supabase
      .from('ai_api_keys')
      .insert({
        tenant_id: user.tenant_id,
        name,
        key_hash: hash,
        key_prefix: prefix,
        rate_limit: rate_limit || 100,
        expires_at: expires_at || null,
      })
      .select('id, name, key_prefix, rate_limit, created_at')
      .single()

    if (error || !apiKey) {
      console.error('Failed to create API key:', error)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'CREATE',
      resourceType: 'ai_api_key',
      resourceId: apiKey.id,
      resourceName: name,
      request,
    })

    // Return the full key ONLY on creation — it's never shown again
    return NextResponse.json({
      ...apiKey,
      key, // Full API key — show once to user
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/ai-assistant/api-keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing API key id' }, { status: 400 })
    }

    const { data: apiKey } = await supabase
      .from('ai_api_keys')
      .select('id, name')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('ai_api_keys')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error in DELETE /api/ai-assistant/api-keys:', error)
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 400 })
    }

    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'DELETE',
      resourceType: 'ai_api_key',
      resourceId: id,
      resourceName: apiKey.name,
      request,
    })

    return NextResponse.json({ message: 'Deleted', id })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/ai-assistant/api-keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
