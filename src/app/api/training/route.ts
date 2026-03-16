// src/app/api/training/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { writeAuditLog } from '@/lib/audit'
import { hasPaidFeature } from '@/lib/stripe'

const CATEGORIES = ['hmrc_webinar', 'cipp_webinar', 'online_course', 'conference', 'workshop', 'self_study', 'other'] as const
const STATUSES = ['not_started', 'in_progress', 'completed'] as const

const createSchema = z.object({
  title: z.string().min(1).max(500),
  provider: z.string().max(255).optional().nullable(),
  category: z.enum(CATEGORIES).optional().nullable(),
  url: z.string().url().max(2000).optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable(),
  completed: z.boolean().optional(),
  completed_date: z.string().optional().nullable(),
  cpd_hours: z.number().min(0).max(999).optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  certificate_url: z.string().url().max(2000).optional().nullable().or(z.literal('')),
  status: z.enum(STATUSES).optional(),
})

const updateSchema = createSchema.partial().extend({
  id: z.string().uuid(),
})

const PLAN_ERROR = { error: 'Training & CPD tracking requires an Unlimited plan. Please upgrade to access this feature.' }

const SELECT_COLUMNS = 'id, tenant_id, created_by, title, provider, category, url, notes, completed, completed_date, cpd_hours, expiry_date, certificate_url, status, created_at, updated_at'

async function checkTrainingAccess(supabase: ReturnType<typeof createServerSupabaseClient>, tenantId: string): Promise<boolean> {
  const { data: tenant } = await supabase.from('tenants').select('plan').eq('id', tenantId).single()
  return hasPaidFeature(tenant?.plan)
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

    if (!(await checkTrainingAccess(supabase, user.tenant_id))) {
      return NextResponse.json(PLAN_ERROR, { status: 403 })
    }

    const { data: records, error } = await supabase
      .from('training_records')
      .select(SELECT_COLUMNS)
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error in GET /api/training:', error)
      return NextResponse.json({ error: 'Failed to fetch training records' }, { status: 400 })
    }

    return NextResponse.json(records || [])
  } catch (error) {
    console.error('Unexpected error in GET /api/training:', error)
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

    if (!(await checkTrainingAccess(supabase, user.tenant_id))) {
      return NextResponse.json(PLAN_ERROR, { status: 403 })
    }

    const body = await request.json()
    const validated = createSchema.parse(body)

    // Derive completed boolean from status for backward compatibility
    const status = validated.status || (validated.completed ? 'completed' : 'not_started')
    const completed = status === 'completed'
    const completedDate = completed && validated.completed_date ? validated.completed_date : (completed ? new Date().toISOString().split('T')[0] : null)

    const { data: record, error } = await supabase
      .from('training_records')
      .insert({
        title: validated.title,
        provider: validated.provider || null,
        category: validated.category || null,
        url: validated.url || null,
        notes: validated.notes || null,
        cpd_hours: validated.cpd_hours ?? null,
        expiry_date: validated.expiry_date || null,
        certificate_url: validated.certificate_url || null,
        status,
        completed,
        completed_date: completedDate,
        tenant_id: user.tenant_id,
        created_by: authUser.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error in POST /api/training:', error)
      return NextResponse.json({ error: 'Failed to save training record' }, { status: 400 })
    }

    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'CREATE',
      resourceType: 'training_record',
      resourceId: record.id,
      resourceName: record.title,
      request,
    })

    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/training:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    if (!(await checkTrainingAccess(supabase, user.tenant_id))) {
      return NextResponse.json(PLAN_ERROR, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = updateSchema.parse(body)

    // Verify record belongs to tenant
    const { data: existing } = await supabase
      .from('training_records')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Sync completed boolean with status
    const updateData: Record<string, unknown> = {
      ...updates,
      url: updates.url || null,
      certificate_url: updates.certificate_url || null,
      updated_at: new Date().toISOString(),
    }

    if (updates.status !== undefined) {
      updateData.completed = updates.status === 'completed'
      if (updates.status === 'completed' && !updates.completed_date) {
        updateData.completed_date = new Date().toISOString().split('T')[0]
      }
      if (updates.status !== 'completed') {
        updateData.completed_date = null
      }
    }

    const { data: record, error } = await supabase
      .from('training_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error in PUT /api/training:', error)
      return NextResponse.json({ error: 'Failed to save training record' }, { status: 400 })
    }

    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'UPDATE',
      resourceType: 'training_record',
      resourceId: id,
      resourceName: record.title,
      request,
    })

    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in PUT /api/training:', error)
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

    if (!(await checkTrainingAccess(supabase, user.tenant_id))) {
      return NextResponse.json(PLAN_ERROR, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { data: record } = await supabase
      .from('training_records')
      .select('title')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('training_records')
      .delete()
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)

    if (error) {
      console.error('Database error in DELETE /api/training:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 400 })
    }

    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'DELETE',
      resourceType: 'training_record',
      resourceId: id,
      resourceName: record.title,
      request,
    })

    return NextResponse.json({ message: 'Deleted', id })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/training:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
