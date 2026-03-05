// src/lib/email-templates.ts — HTML email templates for automated reminders

const BRAND_COLOR = '#7C3AED'
const BRAND_BG = '#F5F3FF'

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:${BRAND_BG};">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:12px;border:1px solid #E9E5F5;overflow:hidden;">
      <div style="background:${BRAND_COLOR};padding:20px 24px;">
        <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">ThePayBureau</span>
      </div>
      <div style="padding:24px;">
        ${content}
      </div>
    </div>
    <p style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:16px;">
      This is an automated reminder from ThePayBureau. Please do not reply to this email.
    </p>
  </div>
</body>
</html>`
}

export function complianceDeadlineEmail({
  userName,
  clientName,
  deadlineDate,
}: {
  userName: string
  clientName: string
  deadlineDate: string
}): { subject: string; html: string } {
  const formatted = new Date(deadlineDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return {
    subject: `Reminder: Declaration of Compliance deadline in 3 days — ${clientName}`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:18px;color:#1F2937;">Compliance Deadline Approaching</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#6B7280;">Hi ${userName},</p>
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">
        The <strong>Declaration of Compliance</strong> deadline for
        <strong style="color:${BRAND_COLOR};">${clientName}</strong>
        is in <strong>3 days</strong>.
      </p>
      <div style="background:${BRAND_BG};border-radius:8px;padding:16px;margin:0 0 16px;">
        <p style="margin:0;font-size:13px;color:#6B7280;">Deadline date</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#1F2937;">${formatted}</p>
      </div>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;">
        Please ensure the declaration is submitted to The Pensions Regulator before this date to avoid penalties.
      </p>
      <a href="https://app.thepaybureau.com/dashboard/clients"
         style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        View Clients
      </a>
    `),
  }
}

export function payrollIncompleteEmail({
  userName,
  clientName,
  payDate,
  completedItems,
  totalItems,
}: {
  userName: string
  clientName: string
  payDate: string
  completedItems: number
  totalItems: number
}): { subject: string; html: string } {
  const formatted = new Date(payDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const remaining = totalItems - completedItems
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return {
    subject: `Alert: Payroll not completed for ${clientName} — pay day is today`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:18px;color:#DC2626;">Payroll Not Completed</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#6B7280;">Hi ${userName},</p>
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">
        Today is <strong>pay day</strong> for
        <strong style="color:${BRAND_COLOR};">${clientName}</strong>,
        but the payroll checklist is <strong>not yet complete</strong>.
      </p>
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:0 0 16px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">Pay date</p>
        <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1F2937;">${formatted}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#6B7280;">Checklist progress</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#DC2626;">
          ${completedItems} of ${totalItems} completed (${pct}%) — ${remaining} remaining
        </p>
      </div>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;">
        Please review and complete the outstanding tasks as soon as possible.
      </p>
      <a href="https://app.thepaybureau.com/dashboard/payrolls"
         style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        View Payroll Runs
      </a>
    `),
  }
}
