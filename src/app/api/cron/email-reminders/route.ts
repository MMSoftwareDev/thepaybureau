import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/resend'
import { complianceDeadlineEmail, payrollIncompleteEmail } from '@/lib/email-templates'
import { verifyCronSecret } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically)
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const results = { compliance: 0, payrollIncomplete: 0, errors: 0 }

  // ─── Email 1: Declaration of Compliance deadline in 3 days ────────

  try {
    // Calculate the date 3 days from now
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 3)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    // Find clients with deadline matching target date
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, declaration_of_compliance_deadline, tenant_id')
      .eq('declaration_of_compliance_deadline', targetDateStr)

    if (clients && clients.length > 0) {
      // Get users for each tenant
      const tenantIds = [...new Set(clients.map(c => c.tenant_id))]
      const { data: users } = await supabase
        .from('users')
        .select('email, name, tenant_id')
        .in('tenant_id', tenantIds)

      for (const client of clients) {
        const tenantUsers = users?.filter(u => u.tenant_id === client.tenant_id) || []

        for (const user of tenantUsers) {
          // Dedup check
          const { data: existing } = await supabase
            .from('email_logs')
            .select('id')
            .eq('email_type', 'compliance_deadline')
            .eq('reference_id', client.id)
            .eq('recipient_email', user.email)
            .gte('sent_at', `${today}T00:00:00Z`)
            .limit(1)

          if (existing && existing.length > 0) continue

          const { subject, html } = complianceDeadlineEmail({
            userName: user.name || user.email.split('@')[0],
            clientName: client.name,
            deadlineDate: client.declaration_of_compliance_deadline!,
          })

          const result = await sendEmail({ to: user.email, subject, html })

          if (result.success) {
            await supabase.from('email_logs').insert({
              email_type: 'compliance_deadline',
              recipient_email: user.email,
              reference_id: client.id,
            })
            results.compliance++
          } else {
            console.error(`Failed to send compliance email to ${user.email}:`, result.error)
            results.errors++
          }
        }
      }
    }
  } catch (err) {
    console.error('Compliance deadline check failed:', err)
    results.errors++
  }

  // ─── Email 2: Payroll not completed on pay day ────────────────────

  try {
    // Find payroll runs where pay_date is today
    const { data: payrollRuns } = await supabase
      .from('payroll_runs')
      .select('id, pay_date, client_id, tenant_id')
      .eq('pay_date', today)

    if (payrollRuns && payrollRuns.length > 0) {
      // Get client names
      const clientIds = [...new Set(payrollRuns.map(pr => pr.client_id))]
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds)
      const clientMap = new Map(clients?.map(c => [c.id, c.name]) || [])

      // Get users for each tenant
      const tenantIds = [...new Set(payrollRuns.map(pr => pr.tenant_id))]
      const { data: users } = await supabase
        .from('users')
        .select('email, name, tenant_id')
        .in('tenant_id', tenantIds)

      for (const run of payrollRuns) {
        // Check checklist completion
        const { data: items } = await supabase
          .from('checklist_items')
          .select('is_completed')
          .eq('payroll_run_id', run.id)

        const totalItems = items?.length || 0
        const completedItems = items?.filter(i => i.is_completed).length || 0

        // Skip if complete or no items
        if (totalItems === 0 || completedItems === totalItems) continue

        const tenantUsers = users?.filter(u => u.tenant_id === run.tenant_id) || []

        for (const user of tenantUsers) {
          // Dedup check
          const { data: existing } = await supabase
            .from('email_logs')
            .select('id')
            .eq('email_type', 'payroll_incomplete')
            .eq('reference_id', run.id)
            .eq('recipient_email', user.email)
            .gte('sent_at', `${today}T00:00:00Z`)
            .limit(1)

          if (existing && existing.length > 0) continue

          const { subject, html } = payrollIncompleteEmail({
            userName: user.name || user.email.split('@')[0],
            clientName: clientMap.get(run.client_id) || 'Unknown Client',
            payDate: run.pay_date,
            completedItems,
            totalItems,
          })

          const result = await sendEmail({ to: user.email, subject, html })

          if (result.success) {
            await supabase.from('email_logs').insert({
              email_type: 'payroll_incomplete',
              recipient_email: user.email,
              reference_id: run.id,
            })
            results.payrollIncomplete++
          } else {
            console.error(`Failed to send payroll email to ${user.email}:`, result.error)
            results.errors++
          }
        }
      }
    }
  } catch (err) {
    console.error('Payroll incomplete check failed:', err)
    results.errors++
  }

  return NextResponse.json({
    ok: true,
    date: today,
    sent: {
      compliance_deadline: results.compliance,
      payroll_incomplete: results.payrollIncomplete,
    },
    errors: results.errors,
  })
}
