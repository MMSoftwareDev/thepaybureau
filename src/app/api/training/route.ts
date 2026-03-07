// src/app/api/training/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { writeAuditLog } from '@/lib/audit'

const createSchema = z.object({
  title: z.string().min(1).max(500),
  provider: z.string().max(255).optional().nullable(),
  category: z.enum(['hmrc_webinar', 'cipp_webinar', 'online_course', 'conference', 'workshop', 'self_study', 'other']).optional().nullable(),
  url: z.string().url().max(2000).optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable(),
  completed: z.boolean().optional(),
  completed_date: z.string().optional().nullable(),
})

const updateSchema = createSchema.partial().extend({
  id: z.string().uuid(),
})

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

    const { data: records, error } = await supabase
      .from('training_records')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })
      .limit(500)

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

    if (!authUser.email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
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
    const validated = createSchema.parse(body)

    const { data: record, error } = await supabase
      .from('training_records')
      .insert({
        ...validated,
        url: validated.url || null,
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
      userEmail: authUser.email,
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

    if (!authUser.email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
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

    const { data: record, error } = await supabase
      .from('training_records')
      .update({
        ...updates,
        url: updates.url || null,
        updated_at: new Date().toISOString(),
      })
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
      userEmail: authUser.email,
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

    if (!authUser.email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
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
      userEmail: authUser.email,
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
