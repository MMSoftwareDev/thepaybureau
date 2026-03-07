// src/app/api/payroll-runs/actions/route.ts
// Handles checklist toggles, mark-all-complete, notes, and add-step with audit logging

import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { writeAuditLog } from '@/lib/audit'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { updateUserStats, checkAndAwardBadges } from '@/lib/badges'

const toggleItemSchema = z.object({
  action: z.literal('toggle_item'),
  item_id: z.string().uuid(),
  is_completed: z.boolean(),
})

const markAllCompleteSchema = z.object({
  action: z.literal('mark_all_complete'),
  payroll_run_id: z.string().uuid(),
})

const saveNotesSchema = z.object({
  action: z.literal('save_notes'),
  payroll_run_id: z.string().uuid(),
  notes: z.string().max(5000),
})

const addStepSchema = z.object({
  action: z.literal('add_step'),
  payroll_run_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  sort_order: z.number().int().min(0),
})

const actionSchema = z.discriminatedUnion('action', [
  toggleItemSchema,
  markAllCompleteSchema,
  saveNotesSchema,
  addStepSchema,
])

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`payroll-actions:${ip}`, { limit: 30, windowSeconds: 60 })
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

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
    const data = actionSchema.parse(body)

    switch (data.action) {
      case 'toggle_item': {
        // Get item with its parent run info
        const { data: item } = await supabase
          .from('checklist_items')
          .select('id, name, payroll_run_id, is_completed')
          .eq('id', data.item_id)
          .single()

        if (!item) {
          return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }

        // Verify run belongs to tenant
        const { data: run } = await supabase
          .from('payroll_runs')
          .select('id, tenant_id, client_id, clients(name)')
          .eq('id', item.payroll_run_id)
          .eq('tenant_id', user.tenant_id)
          .single()

        if (!run) {
          return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })
        }

        const { error: updateError } = await supabase
          .from('checklist_items')
          .update({
            is_completed: data.is_completed,
            completed_at: data.is_completed ? new Date().toISOString() : null,
            completed_by: data.is_completed ? authUser.id : null,
          })
          .eq('id', data.item_id)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update' }, { status: 400 })
        }

        const clientName = (run as unknown as { clients: { name: string } }).clients?.name || 'Unknown'
        writeAuditLog({
          tenantId: user.tenant_id,
          userId: authUser.id,
          userEmail: authUser.email!,
          action: 'UPDATE',
          resourceType: 'checklist_item',
          resourceId: data.item_id,
          resourceName: `${clientName} — ${item.name}`,
          changes: { is_completed: { from: item.is_completed, to: data.is_completed } },
          request,
        })

        // Track badges — only when completing (not unchecking)
        let newBadges: { badge_key: string; badge_tier: string; badge_name: string; badge_icon: string }[] = []
        if (data.is_completed) {
          try {
            const isEarlyMorning = new Date().getHours() < 9

            // Check if this was the last item — payroll is now complete
            const { data: allItems } = await supabase
              .from('checklist_items')
              .select('id, is_completed')
              .eq('payroll_run_id', item.payroll_run_id)

            const allComplete = allItems && allItems.every(
              (ci) => ci.id === data.item_id ? true : ci.is_completed
            )

            await updateUserStats(supabase, authUser.id, user.tenant_id!, { type: 'step_completed', isEarlyMorning })

            if (allComplete) {
              const { data: payrollRun } = await supabase
                .from('payroll_runs')
                .select('pay_date')
                .eq('id', item.payroll_run_id)
                .single()

              const daysEarly = payrollRun
                ? Math.floor((new Date(payrollRun.pay_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 0

              await updateUserStats(supabase, authUser.id, user.tenant_id!, { type: 'payroll_completed', daysEarly })
            }

            newBadges = await checkAndAwardBadges(supabase, authUser.id, user.tenant_id!)
          } catch (err) {
            console.error('Badge tracking error (non-fatal):', err)
          }
        }

        return NextResponse.json({ success: true, newBadges })
      }

      case 'mark_all_complete': {
        const { data: run } = await supabase
          .from('payroll_runs')
          .select('id, tenant_id, client_id, clients(name)')
          .eq('id', data.payroll_run_id)
          .eq('tenant_id', user.tenant_id)
          .single()

        if (!run) {
          return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })
        }

        const { data: items } = await supabase
          .from('checklist_items')
          .select('id')
          .eq('payroll_run_id', data.payroll_run_id)
          .eq('is_completed', false)

        if (!items || items.length === 0) {
          return NextResponse.json({ success: true, message: 'All already complete' })
        }

        const ids = items.map(i => i.id)
        const { error: updateError } = await supabase
          .from('checklist_items')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
            completed_by: authUser.id,
          })
          .in('id', ids)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update' }, { status: 400 })
        }

        const clientName = (run as unknown as { clients: { name: string } }).clients?.name || 'Unknown'
        writeAuditLog({
          tenantId: user.tenant_id,
          userId: authUser.id,
          userEmail: authUser.email!,
          action: 'UPDATE',
          resourceType: 'payroll_run',
          resourceId: data.payroll_run_id,
          resourceName: `${clientName} — marked all steps complete`,
          changes: { steps_completed: { from: 'partial', to: `all (${ids.length} items)` } },
          request,
        })

        // Track badges — count each step + the payroll completion
        let newBadges: { badge_key: string; badge_tier: string; badge_name: string; badge_icon: string }[] = []
        try {
          const isEarlyMorning = new Date().getHours() < 9

          // Track each individual step
          for (let i = 0; i < ids.length; i++) {
            await updateUserStats(supabase, authUser.id, user.tenant_id!, { type: 'step_completed', isEarlyMorning })
          }

          // Track payroll completion
          const { data: payrollRun } = await supabase
            .from('payroll_runs')
            .select('pay_date')
            .eq('id', data.payroll_run_id)
            .single()

          const daysEarly = payrollRun
            ? Math.floor((new Date(payrollRun.pay_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 0

          await updateUserStats(supabase, authUser.id, user.tenant_id!, { type: 'payroll_completed', daysEarly })
          newBadges = await checkAndAwardBadges(supabase, authUser.id, user.tenant_id!)
        } catch (err) {
          console.error('Badge tracking error (non-fatal):', err)
        }

        return NextResponse.json({ success: true, completed: ids.length, newBadges })
      }

      case 'save_notes': {
        const { data: run } = await supabase
          .from('payroll_runs')
          .select('id, tenant_id, notes, client_id, clients(name)')
          .eq('id', data.payroll_run_id)
          .eq('tenant_id', user.tenant_id)
          .single()

        if (!run) {
          return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })
        }

        const { error: updateError } = await supabase
          .from('payroll_runs')
          .update({ notes: data.notes })
          .eq('id', data.payroll_run_id)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update' }, { status: 400 })
        }

        if (run.notes !== data.notes) {
          const clientName = (run as unknown as { clients: { name: string } }).clients?.name || 'Unknown'
          writeAuditLog({
            tenantId: user.tenant_id,
            userId: authUser.id,
            userEmail: authUser.email!,
            action: 'UPDATE',
            resourceType: 'payroll_run',
            resourceId: data.payroll_run_id,
            resourceName: `${clientName} — notes`,
            changes: { notes: { from: run.notes || '', to: data.notes } },
            request,
          })
        }

        return NextResponse.json({ success: true })
      }

      case 'add_step': {
        const { data: run } = await supabase
          .from('payroll_runs')
          .select('id, tenant_id, client_id, clients(name)')
          .eq('id', data.payroll_run_id)
          .eq('tenant_id', user.tenant_id)
          .single()

        if (!run) {
          return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })
        }

        const { data: newItem, error: insertError } = await supabase
          .from('checklist_items')
          .insert({
            payroll_run_id: data.payroll_run_id,
            name: data.name,
            is_completed: false,
            sort_order: data.sort_order,
          })
          .select()
          .single()

        if (insertError) {
          return NextResponse.json({ error: 'Failed to add step' }, { status: 400 })
        }

        const clientName = (run as unknown as { clients: { name: string } }).clients?.name || 'Unknown'
        writeAuditLog({
          tenantId: user.tenant_id,
          userId: authUser.id,
          userEmail: authUser.email!,
          action: 'CREATE',
          resourceType: 'checklist_item',
          resourceId: newItem.id,
          resourceName: `${clientName} — ${data.name}`,
          request,
        })

        return NextResponse.json(newItem)
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/payroll-runs/actions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
