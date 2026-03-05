// src/app/api/audit-logs/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const resourceType = searchParams.get('resource_type')
    const action = searchParams.get('action')
    const search = searchParams.get('search')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (search) {
      // Sanitize search to prevent PostgREST filter injection
      const sanitized = search.replace(/[,%().*]/g, '')
      if (sanitized) {
        query = query.or(`resource_name.ilike.%${sanitized}%,user_email.ilike.%${sanitized}%`)
      }
    }
    if (from) {
      query = query.gte('created_at', from)
    }
    if (to) {
      query = query.lte('created_at', to)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Database error in GET /api/audit-logs:', error)
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 400 })
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/audit-logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
