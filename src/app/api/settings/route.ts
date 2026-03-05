// src/app/api/settings/route.ts
// Handles profile updates, password changes, avatar changes, and checklist defaults with audit logging

import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { writeAuditLog } from '@/lib/audit'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { checklistTemplatesSchema } from '@/lib/validations'

const updateProfileSchema = z.object({
  action: z.literal('update_profile'),
  name: z.string().min(1).max(255),
})

const changePasswordSchema = z.object({
  action: z.literal('change_password'),
  password: z.string().min(8).max(128),
})

const updateAvatarSchema = z.object({
  action: z.literal('update_avatar'),
  avatar_url: z.string().nullable(),
})

const saveChecklistDefaultsSchema = z.object({
  action: z.literal('save_checklist_defaults'),
  checklist: z.array(z.object({
    name: z.string().min(1).max(255),
    sort_order: z.number().int().min(0),
  })),
})

const saveChecklistTemplatesSchema = z.object({
  action: z.literal('save_checklist_templates'),
  templates: checklistTemplatesSchema,
})

const actionSchema = z.discriminatedUnion('action', [
  updateProfileSchema,
  changePasswordSchema,
  updateAvatarSchema,
  saveChecklistDefaultsSchema,
  saveChecklistTemplatesSchema,
])

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 settings changes per IP per 15 minutes
    const ip = getClientIp(request)
    const limiter = await rateLimit(`settings:${ip}`, { limit: 20, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id, name, avatar_url')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = actionSchema.parse(body)

    switch (data.action) {
      case 'update_profile': {
        const previousName = user.name

        const { error: updateError } = await supabase
          .from('users')
          .update({ name: data.name })
          .eq('id', authUser.id)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        if (previousName !== data.name) {
          writeAuditLog({
            tenantId: user.tenant_id,
            userId: authUser.id,
            userEmail: authUser.email!,
            action: 'UPDATE',
            resourceType: 'user_profile',
            resourceId: authUser.id,
            resourceName: authUser.email,
            changes: { name: { from: previousName, to: data.name } },
            request,
          })
        }

        return NextResponse.json({ success: true })
      }

      case 'change_password': {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authUser.id,
          { password: data.password }
        )

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        writeAuditLog({
          tenantId: user.tenant_id,
          userId: authUser.id,
          userEmail: authUser.email!,
          action: 'UPDATE',
          resourceType: 'user_password',
          resourceId: authUser.id,
          resourceName: authUser.email,
          request,
        })

        return NextResponse.json({ success: true })
      }

      case 'update_avatar': {
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: data.avatar_url })
          .eq('id', authUser.id)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        writeAuditLog({
          tenantId: user.tenant_id,
          userId: authUser.id,
          userEmail: authUser.email!,
          action: 'UPDATE',
          resourceType: 'user_avatar',
          resourceId: authUser.id,
          resourceName: authUser.email,
          changes: {
            avatar: {
              from: user.avatar_url ? 'set' : 'none',
              to: data.avatar_url ? 'updated' : 'removed',
            },
          },
          request,
        })

        return NextResponse.json({ success: true })
      }

      case 'save_checklist_defaults': {
        // Fetch current tenant settings
        const { data: tenant } = await supabase
          .from('tenants')
          .select('settings')
          .eq('id', user.tenant_id)
          .single()

        const currentSettings = (tenant?.settings || {}) as Record<string, unknown>

        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            settings: {
              ...currentSettings,
              default_checklist: data.checklist,
            },
          })
          .eq('id', user.tenant_id)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        writeAuditLog({
          tenantId: user.tenant_id,
          userId: authUser.id,
          userEmail: authUser.email!,
          action: 'UPDATE',
          resourceType: 'checklist_defaults',
          resourceId: user.tenant_id,
          resourceName: 'Default checklist template',
          changes: {
            steps: {
              from: (currentSettings.default_checklist as unknown[])?.length ?? 'default',
              to: `${data.checklist.length} steps`,
            },
          },
          request,
        })

        return NextResponse.json({ success: true })
      }

      case 'save_checklist_templates': {
        // Validate exactly one default
        const defaultCount = data.templates.filter((t) => t.is_default).length
        if (defaultCount !== 1) {
          return NextResponse.json({ error: 'Exactly one template must be set as default' }, { status: 400 })
        }

        const { data: tenant } = await supabase
          .from('tenants')
          .select('settings')
          .eq('id', user.tenant_id)
          .single()

        const currentSettings = (tenant?.settings || {}) as Record<string, unknown>
        const defaultTemplate = data.templates.find((t) => t.is_default)!

        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            settings: {
              ...currentSettings,
              checklist_templates: data.templates,
              default_checklist: defaultTemplate.steps,
            },
          })
          .eq('id', user.tenant_id)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        writeAuditLog({
          tenantId: user.tenant_id,
          userId: authUser.id,
          userEmail: authUser.email!,
          action: 'UPDATE',
          resourceType: 'checklist_templates',
          resourceId: user.tenant_id,
          resourceName: 'Checklist templates',
          changes: {
            templates: {
              from: ((currentSettings.checklist_templates as unknown[])?.length ?? 1) + ' templates',
              to: `${data.templates.length} templates`,
            },
          },
          request,
        })

        return NextResponse.json({ success: true })
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const DEFAULT_CHECKLIST_STEPS = [
  { name: 'Receive payroll changes', sort_order: 0 },
  { name: 'Process payroll', sort_order: 1 },
  { name: 'Review & approve', sort_order: 2 },
  { name: 'Send payslips', sort_order: 3 },
  { name: 'Submit RTI to HMRC', sort_order: 4 },
  { name: 'BACS payment', sort_order: 5 },
  { name: 'Pension submission', sort_order: 6 },
]

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

    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single()

    const settings = (tenant?.settings || {}) as Record<string, unknown>

    // Return checklist_templates if they exist, else wrap default_checklist as a single template
    if (settings.checklist_templates) {
      return NextResponse.json({ templates: settings.checklist_templates })
    }

    const steps = (settings.default_checklist as { name: string; sort_order: number }[]) || DEFAULT_CHECKLIST_STEPS
    return NextResponse.json({
      templates: [{
        id: 'default',
        name: 'Default',
        is_default: true,
        steps,
      }],
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
