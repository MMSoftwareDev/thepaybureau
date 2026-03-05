// src/app/(dashboard)/dashboard/admin/email-preview/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Mail, Send, Eye, ChevronDown } from 'lucide-react'

type EmailType = 'compliance_deadline' | 'payroll_incomplete'

const EMAIL_TYPES: { value: EmailType; label: string; description: string }[] = [
  {
    value: 'compliance_deadline',
    label: 'Compliance Deadline Reminder',
    description: 'Sent 3 days before a client\'s Declaration of Compliance deadline',
  },
  {
    value: 'payroll_incomplete',
    label: 'Payroll Not Completed',
    description: 'Sent on pay day if the payroll checklist is incomplete',
  },
]

export default function EmailPreviewPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeEmail, setActiveEmail] = useState<EmailType>('compliance_deadline')
  const [previewHtml, setPreviewHtml] = useState<Record<EmailType, string>>({
    compliance_deadline: '',
    payroll_incomplete: '',
  })
  const [previewSubject, setPreviewSubject] = useState<Record<EmailType, string>>({
    compliance_deadline: '',
    payroll_incomplete: '',
  })
  const [sendingTest, setSendingTest] = useState(false)

  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => r.json())
      .then(d => {
        setIsAdmin(d.isAdmin)
        if (d.isAdmin) {
          fetchPreviews()
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const fetchPreviews = async () => {
    try {
      const res = await fetch('/api/admin/email-preview')
      if (res.ok) {
        const data = await res.json()
        setPreviewHtml({
          compliance_deadline: data.compliance_deadline.html,
          payroll_incomplete: data.payroll_incomplete.html,
        })
        setPreviewSubject({
          compliance_deadline: data.compliance_deadline.subject,
          payroll_incomplete: data.payroll_incomplete.subject,
        })
      }
    } catch {
      toast('Failed to load previews', 'error')
    }
  }

  const handleSendTest = async () => {
    setSendingTest(true)
    try {
      const res = await fetch('/api/admin/email-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailType: activeEmail }),
      })
      if (res.ok) {
        toast('Test email sent! Check your inbox.')
      } else {
        const data = await res.json()
        toast(data.error || 'Failed to send test email', 'error')
      }
    } catch {
      toast('Failed to send test email', 'error')
    } finally {
      setSendingTest(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: colors.border }} />
        <div className="h-[500px] rounded-xl animate-pulse" style={{ background: colors.border }} />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Admin access required.
        </p>
      </div>
    )
  }

  const currentType = EMAIL_TYPES.find(t => t.value === activeEmail)!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${colors.primary}15` }}
          >
            <Mail className="w-5 h-5" style={{ color: colors.primary }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
              Email Preview
            </h1>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Preview and test automated email templates
            </p>
          </div>
        </div>
        <Button
          onClick={handleSendTest}
          disabled={sendingTest || !previewHtml[activeEmail]}
          style={{
            background: colors.primary,
            color: '#fff',
            opacity: sendingTest || !previewHtml[activeEmail] ? 0.5 : 1,
          }}
        >
          <Send className="w-4 h-4 mr-1.5" />
          {sendingTest ? 'Sending...' : 'Send Test to Me'}
        </Button>
      </div>

      {/* Email type selector */}
      <div className="flex gap-2">
        {EMAIL_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setActiveEmail(type.value)}
            className="flex-1 text-left px-4 py-3 rounded-xl border transition-all"
            style={{
              background: activeEmail === type.value
                ? `${colors.primary}08`
                : isDark ? 'rgba(255,255,255,0.02)' : '#fff',
              borderColor: activeEmail === type.value ? `${colors.primary}40` : colors.border,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-3.5 h-3.5" style={{
                color: activeEmail === type.value ? colors.primary : colors.text.muted,
              }} />
              <span className="text-sm font-semibold" style={{
                color: activeEmail === type.value ? colors.primary : colors.text.primary,
              }}>
                {type.label}
              </span>
            </div>
            <p className="text-xs" style={{ color: colors.text.muted }}>
              {type.description}
            </p>
          </button>
        ))}
      </div>

      {/* Subject line */}
      {previewSubject[activeEmail] && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border"
          style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderColor: colors.border }}
        >
          <span className="text-xs font-medium" style={{ color: colors.text.muted }}>Subject:</span>
          <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
            {previewSubject[activeEmail]}
          </span>
        </div>
      )}

      {/* Email preview iframe */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: colors.border }}
      >
        {previewHtml[activeEmail] ? (
          <iframe
            srcDoc={previewHtml[activeEmail]}
            className="w-full border-0"
            style={{ height: '600px', background: '#F5F3FF' }}
            title={`${currentType.label} preview`}
          />
        ) : (
          <div
            className="flex items-center justify-center h-[400px]"
            style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa' }}
          >
            <p className="text-sm" style={{ color: colors.text.muted }}>Loading preview...</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-lg border text-xs"
        style={{
          background: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAF9',
          borderColor: colors.border,
          color: colors.text.muted,
        }}
      >
        <ChevronDown className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 rotate-[-90deg]" />
        <div>
          <p className="font-medium mb-1" style={{ color: colors.text.secondary }}>How automated emails work</p>
          <p>Emails are checked and sent daily at 7:00 AM UTC via a scheduled job. Each email is only sent once per day per recipient (deduplication via email_logs table). Emails are sent from <strong>noreply@mail.thepaybureau.com</strong> via Resend.</p>
        </div>
      </div>
    </div>
  )
}
