// src/lib/email-templates.ts — HTML email templates for automated reminders
// Design matches the Supabase auth emails (supabase/templates/*.html)

const BRAND_PINK = '#EC385D'
const BRAND_DEEP = '#401D6C'
const LOGO_URL = 'https://app.thepaybureau.com/logo.png'

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:48px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:44px 48px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <!-- Logo -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <img src="${LOGO_URL}" alt="ThePayBureau" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;" />
                  </td>
                </tr>
                <!-- Content -->
                ${content}
                <!-- Divider + Footer -->
                <tr>
                  <td style="border-top:1px solid #e5e7eb;padding-top:28px;">
                    <p style="margin:0 0 12px;font-size:13px;line-height:1.65;color:#9ca3af;">
                      This is an automated reminder from ThePayBureau. Replace your payroll spreadsheet with something you'll actually enjoy using.
                      <a href="https://thepaybureau.com" style="color:${BRAND_DEEP};text-decoration:none;font-weight:500;">Learn more</a>.
                    </p>
                    <p style="margin:0;font-size:12px;color:#d1d5db;">Designed and built in the UK</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function welcomeEmail({
  userName,
}: {
  userName: string
}): { subject: string; html: string } {
  return {
    subject: 'Welcome to ThePayBureau — let\'s get you organised',
    html: layout(`
                <!-- Headline -->
                <tr>
                  <td style="padding-bottom:12px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.03em;line-height:1.2;">
                      Welcome to ThePayBureau
                    </h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#6b7280;">Hi ${userName},</p>
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
                      Thanks for signing up! You&rsquo;re about to replace spreadsheets and sticky notes with a system built specifically for payroll professionals.
                    </p>
                    <p style="margin:0;font-size:15px;line-height:1.65;color:#374151;">
                      Here&rsquo;s what you can do right away:
                    </p>
                  </td>
                </tr>
                <!-- Steps -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#374151;">
                            <strong style="color:${BRAND_DEEP};">1.</strong> Add your first client and set their pay date
                          </p>
                          <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#374151;">
                            <strong style="color:${BRAND_DEEP};">2.</strong> Watch deadlines auto-generate based on their payroll frequency
                          </p>
                          <p style="margin:0;font-size:14px;line-height:1.65;color:#374151;">
                            <strong style="color:${BRAND_DEEP};">3.</strong> Start checking off tasks and never miss a deadline again
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Message -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;line-height:1.65;color:#374151;">
                      Your dashboard is ready and waiting. Average setup time? 58 seconds.
                    </p>
                  </td>
                </tr>
                <!-- Button -->
                <tr>
                  <td style="padding-bottom:40px;">
                    <a href="https://app.thepaybureau.com/dashboard"
                       style="display:inline-block;background:${BRAND_PINK};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:-0.01em;">
                      Go to My Dashboard
                    </a>
                  </td>
                </tr>
    `),
  }
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
                <!-- Headline -->
                <tr>
                  <td style="padding-bottom:12px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.03em;line-height:1.2;">
                      Compliance Deadline Approaching
                    </h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#6b7280;">Hi ${userName},</p>
                    <p style="margin:0;font-size:15px;line-height:1.65;color:#374151;">
                      The <strong>Declaration of Compliance</strong> deadline for
                      <strong style="color:${BRAND_PINK};">${clientName}</strong>
                      is in <strong>3 days</strong>.
                    </p>
                  </td>
                </tr>
                <!-- Info box -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="margin:0;font-size:13px;color:#6b7280;">Deadline date</p>
                          <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#111827;">${formatted}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Message -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;line-height:1.65;color:#374151;">
                      Please ensure the declaration is submitted to The Pensions Regulator before this date to avoid penalties.
                    </p>
                  </td>
                </tr>
                <!-- Button -->
                <tr>
                  <td style="padding-bottom:40px;">
                    <a href="https://app.thepaybureau.com/dashboard/clients"
                       style="display:inline-block;background:${BRAND_PINK};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:-0.01em;">
                      View Clients
                    </a>
                  </td>
                </tr>
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
                <!-- Headline -->
                <tr>
                  <td style="padding-bottom:12px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#DC2626;letter-spacing:-0.03em;line-height:1.2;">
                      Payroll Not Completed
                    </h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#6b7280;">Hi ${userName},</p>
                    <p style="margin:0;font-size:15px;line-height:1.65;color:#374151;">
                      Today is <strong>pay day</strong> for
                      <strong style="color:${BRAND_PINK};">${clientName}</strong>,
                      but the payroll checklist is <strong>not yet complete</strong>.
                    </p>
                  </td>
                </tr>
                <!-- Alert box -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Pay date</p>
                          <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827;">${formatted}</p>
                          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Checklist progress</p>
                          <p style="margin:0;font-size:16px;font-weight:600;color:#DC2626;">
                            ${completedItems} of ${totalItems} completed (${pct}%) — ${remaining} remaining
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Message -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;line-height:1.65;color:#374151;">
                      Please review and complete the outstanding tasks as soon as possible.
                    </p>
                  </td>
                </tr>
                <!-- Button -->
                <tr>
                  <td style="padding-bottom:40px;">
                    <a href="https://app.thepaybureau.com/dashboard/payrolls"
                       style="display:inline-block;background:${BRAND_PINK};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:-0.01em;">
                      View Payroll Runs
                    </a>
                  </td>
                </tr>
    `),
  }
}

export function feedbackNotificationEmail({
  userName,
  userEmail,
  category,
  message,
  pageUrl,
}: {
  userName: string
  userEmail: string
  category: 'bug' | 'improvement' | 'other'
  message: string
  pageUrl?: string | null
}): { subject: string; html: string } {
  const categoryLabels: Record<string, { label: string; color: string }> = {
    bug: { label: 'Bug Report', color: '#DC2626' },
    improvement: { label: 'Improvement', color: BRAND_DEEP },
    other: { label: 'Other', color: '#6b7280' },
  }
  const cat = categoryLabels[category] || categoryLabels.other

  return {
    subject: `New ${cat.label} from ${userName || userEmail}`,
    html: layout(`
                <!-- Headline -->
                <tr>
                  <td style="padding-bottom:12px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.03em;line-height:1.2;">
                      New Feedback Received
                    </h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
                      <strong>${userName || 'A user'}</strong> (${userEmail}) submitted feedback.
                    </p>
                  </td>
                </tr>
                <!-- Details box -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Category</p>
                          <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:${cat.color};">${cat.label}</p>
                          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Message</p>
                          <p style="margin:0;font-size:14px;line-height:1.65;color:#374151;white-space:pre-wrap;">${message}</p>
                          ${pageUrl ? `<p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Page: <a href="${pageUrl}" style="color:${BRAND_DEEP};text-decoration:none;">${pageUrl}</a></p>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Button -->
                <tr>
                  <td style="padding-bottom:40px;">
                    <a href="https://app.thepaybureau.com/dashboard"
                       style="display:inline-block;background:${BRAND_PINK};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:-0.01em;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
    `),
  }
}

export function featureRequestNotificationEmail({
  userName,
  userEmail,
  title,
  description,
}: {
  userName: string
  userEmail: string
  title: string
  description?: string | null
}): { subject: string; html: string } {
  return {
    subject: `New Feature Request: ${title}`,
    html: layout(`
                <!-- Headline -->
                <tr>
                  <td style="padding-bottom:12px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.03em;line-height:1.2;">
                      New Feature Request
                    </h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
                      <strong>${userName || 'A user'}</strong> (${userEmail}) submitted a feature request.
                    </p>
                  </td>
                </tr>
                <!-- Details box -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Title</p>
                          <p style="margin:0;font-size:16px;font-weight:600;color:${BRAND_DEEP};">${title}</p>
                          ${description ? `<p style="margin:16px 0 8px;font-size:13px;color:#6b7280;">Description</p><p style="margin:0;font-size:14px;line-height:1.65;color:#374151;white-space:pre-wrap;">${description}</p>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Button -->
                <tr>
                  <td style="padding-bottom:40px;">
                    <a href="https://app.thepaybureau.com/dashboard/feature-requests"
                       style="display:inline-block;background:${BRAND_PINK};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:-0.01em;">
                      View Feature Requests
                    </a>
                  </td>
                </tr>
    `),
  }
}
