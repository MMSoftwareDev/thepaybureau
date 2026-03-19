'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/toast'
import { format, parseISO } from 'date-fns'
import { getPayrollStatus, parseDateString } from '@/lib/hmrc-deadlines'
import {
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Settings,
  Shield,
  ClipboardList,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ExternalLink,
} from 'lucide-react'

interface ChecklistTemplate {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

interface PayrollRun {
  id: string
  period_start: string
  period_end: string
  pay_date: string
  status: string
  rti_due_date: string | null
  eps_due_date: string | null
  created_at: string
  updated_at: string
}

interface ClientDetail {
  id: string
  name: string
  company_number: string | null
  email: string | null
  phone: string | null
  address: { street?: string; city?: string; postcode?: string } | null
  employee_count: number | null
  status: 'active' | 'inactive'
  notes: string | null
  paye_reference: string | null
  accounts_office_ref: string | null
  pay_frequency: string | null
  pay_day: string | null
  tax_period_start: string | null
  pension_provider: string | null
  pension_staging_date: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
  checklist_templates: ChecklistTemplate[]
  payroll_runs: PayrollRun[]
}

const PAY_FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  four_weekly: '4-Weekly',
  monthly: 'Monthly',
}

const STATUS_CONFIG: Record<string, { label: string; color: (c: ReturnType<typeof getThemeColors>) => string }> = {
  active: { label: 'Active', color: (c) => c.success },
  inactive: { label: 'Inactive', color: (c) => c.text.muted },
}

const PAYROLL_STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: (c: ReturnType<typeof getThemeColors>) => string }> = {
  complete: { label: 'Complete', icon: CheckCircle2, color: (c) => c.success },
  in_progress: { label: 'In Progress', icon: Clock, color: (c) => c.warning },
  not_started: { label: 'Not Started', icon: Clock, color: (c) => c.text.muted },
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string
  value: string | null | undefined
  colors: ReturnType<typeof getThemeColors>
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2.5" style={{ borderBottom: `1px solid ${colors.border}` }}>
      <span className="text-[0.78rem] font-semibold w-40 flex-shrink-0 mb-0.5 sm:mb-0" style={{ color: colors.text.muted }}>
        {label}
      </span>
      <span className="text-[0.85rem]" style={{ color: value ? colors.text.primary : colors.text.muted }}>
        {value || '—'}
      </span>
    </div>
  )
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/clients/${id}`)
        if (res.ok) {
          setClient(await res.json())
        } else if (res.status === 404) {
          toast('Client not found', 'error')
          router.push('/dashboard/clients')
        } else {
          toast('Failed to load client', 'error')
        }
      } catch {
        toast('Failed to load client', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchClient()
  }, [id, router, toast])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast('Client deleted successfully', 'success')
        router.push('/dashboard/clients')
      } else {
        toast('Failed to delete client', 'error')
      }
    } catch {
      toast('Failed to delete client', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleGenerateNextRun = async () => {
    try {
      const res = await fetch('/api/payroll-runs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: id }),
      })
      if (res.ok) {
        toast('Next payroll run generated', 'success')
        // Refresh data
        const refreshRes = await fetch(`/api/clients/${id}`)
        if (refreshRes.ok) setClient(await refreshRes.json())
      } else {
        const data = await res.json()
        toast(data.error || 'Failed to generate payroll run', 'error')
      }
    } catch {
      toast('Failed to generate payroll run', 'error')
    }
  }

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  }

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-64 rounded-xl" style={{ background: colors.border }} />
        <div className="h-32 rounded-lg" style={{ background: colors.border }} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl animate-pulse" style={{ background: colors.border }} />
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: colors.border }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-lg animate-pulse" style={{ background: colors.border }} />
          ))}
        </div>
      </div>
    )
  }

  if (!client) return null

  const statusConfig = STATUS_CONFIG[client.status] || STATUS_CONFIG.active
  const statusColor = statusConfig.color(colors)

  const addressStr = client.address
    ? [client.address.street, client.address.city, client.address.postcode].filter(Boolean).join(', ')
    : null

  const activeTemplates = client.checklist_templates?.filter((t) => t.is_active) || []
  const payrollRuns = client.payroll_runs || []

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/clients')}
          className="self-start rounded-lg px-3"
          style={{ color: colors.text.secondary }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold truncate" style={{ color: colors.text.primary }}>
              {client.name}
            </h1>
            <Badge
              className="font-bold text-[0.72rem] border-0 px-3 py-1"
              style={{
                backgroundColor: `${statusColor}18`,
                color: statusColor,
              }}
            >
              {statusConfig.label}
            </Badge>
          </div>
          {client.company_number && (
            <p className="text-[0.82rem] mt-1" style={{ color: colors.text.muted }}>
              Company #{client.company_number}
            </p>
          )}
        </div>
        <div className="flex gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clients/${id}/edit`)}
            className="rounded-lg font-semibold"
            style={{
              borderColor: colors.border,
              color: colors.text.primary,
              backgroundColor: colors.surface,
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg font-semibold"
            style={{
              borderColor: colors.error,
              color: colors.error,
              backgroundColor: 'transparent',
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Company Details */}
        <Card className="border-0" style={cardStyle}>
          <CardHeader className="pb-2 px-5 md:px-6">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
              <Building2 className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 md:px-6 pt-0">
            <InfoRow label="PAYE Reference" value={client.paye_reference} colors={colors} />
            <InfoRow label="Accounts Office Ref" value={client.accounts_office_ref} colors={colors} />
            <InfoRow label="Employees" value={client.employee_count?.toString()} colors={colors} />
            <InfoRow
              label="Address"
              value={addressStr}
              colors={colors}
            />
            <InfoRow
              label="Added"
              value={format(parseISO(client.created_at), 'd MMM yyyy')}
              colors={colors}
            />
          </CardContent>
        </Card>

        {/* Payroll Configuration */}
        <Card className="border-0" style={cardStyle}>
          <CardHeader className="pb-2 px-5 md:px-6">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
              <Settings className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
              Payroll Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 md:px-6 pt-0">
            <InfoRow
              label="Pay Frequency"
              value={client.pay_frequency ? PAY_FREQUENCY_LABELS[client.pay_frequency] || client.pay_frequency : null}
              colors={colors}
            />
            <InfoRow
              label="Pay Day"
              value={client.pay_day ? client.pay_day.charAt(0).toUpperCase() + client.pay_day.slice(1) : null}
              colors={colors}
            />
            <InfoRow
              label="Tax Period Start"
              value={client.tax_period_start ? format(parseISO(client.tax_period_start), 'd MMM yyyy') : null}
              colors={colors}
            />
          </CardContent>
        </Card>

        {/* Pension */}
        <Card className="border-0" style={cardStyle}>
          <CardHeader className="pb-2 px-5 md:px-6">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
              <Shield className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
              Pension
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 md:px-6 pt-0">
            <InfoRow label="Provider" value={client.pension_provider} colors={colors} />
            <InfoRow
              label="Staging Date"
              value={client.pension_staging_date ? format(parseISO(client.pension_staging_date), 'd MMM yyyy') : null}
              colors={colors}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-0" style={cardStyle}>
          <CardHeader className="pb-2 px-5 md:px-6">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
              <Phone className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 md:px-6 pt-0">
            <InfoRow label="Contact Name" value={client.contact_name} colors={colors} />
            <InfoRow label="Contact Email" value={client.contact_email} colors={colors} />
            <InfoRow label="Contact Phone" value={client.contact_phone} colors={colors} />
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {client.notes && (
        <Card className="border-0" style={cardStyle}>
          <CardHeader className="pb-2 px-5 md:px-6">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
              <FileText className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 md:px-6 pt-0">
            <p className="text-[0.85rem] whitespace-pre-wrap leading-relaxed" style={{ color: colors.text.secondary }}>
              {client.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payroll Run History */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-2 px-5 md:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
              <Calendar className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
              Payroll Run History
            </CardTitle>
            <Button
              onClick={handleGenerateNextRun}
              className="text-white font-semibold py-2 px-4 rounded-lg border-0 text-[0.82rem]"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Generate Next Run
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 md:px-6 pt-2">
          {payrollRuns.length > 0 ? (
            <div className="overflow-x-auto -mx-5 md:-mx-6">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {['Pay Date', 'Period', 'Status', 'RTI Due', 'EPS Due', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-4 text-[0.72rem] font-bold uppercase tracking-[0.06em]"
                        style={{ color: colors.text.muted }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payrollRuns.map((run, index) => {
                    const payDate = parseDateString(run.pay_date)
                    const computedStatus = getPayrollStatus(payDate, 1, run.status === 'complete' ? 1 : 0)
                    const isOverdue = computedStatus === 'overdue'
                    const statusInfo = isOverdue
                      ? { label: 'Overdue', color: colors.error, icon: AlertTriangle }
                      : PAYROLL_STATUS_CONFIG[run.status] || PAYROLL_STATUS_CONFIG.not_started

                    return (
                      <tr
                        key={run.id}
                        style={{
                          borderBottom: index < payrollRuns.length - 1 ? `1px solid ${colors.border}` : undefined,
                        }}
                      >
                        <td className="py-3 px-4 text-[0.82rem] font-semibold" style={{ color: colors.text.primary }}>
                          {format(payDate, 'd MMM yyyy')}
                        </td>
                        <td className="py-3 px-4 text-[0.82rem]" style={{ color: colors.text.secondary }}>
                          {format(parseISO(run.period_start), 'd MMM')} – {format(parseISO(run.period_end), 'd MMM yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className="font-bold text-[0.68rem] border-0 px-2.5 py-0.5"
                            style={{
                              backgroundColor: `${typeof statusInfo.color === 'function' ? statusInfo.color(colors) : statusInfo.color}18`,
                              color: typeof statusInfo.color === 'function' ? statusInfo.color(colors) : statusInfo.color,
                            }}
                          >
                            {typeof statusInfo.label === 'string' ? statusInfo.label : run.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-[0.82rem]" style={{ color: colors.text.secondary }}>
                          {run.rti_due_date ? format(parseISO(run.rti_due_date), 'd MMM yyyy') : '—'}
                        </td>
                        <td className="py-3 px-4 text-[0.82rem]" style={{ color: colors.text.secondary }}>
                          {run.eps_due_date ? format(parseISO(run.eps_due_date), 'd MMM yyyy') : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard/payrolls')}
                            className="rounded-lg text-[0.78rem] px-2"
                            style={{ color: colors.primary }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: colors.text.muted }} />
              <p className="text-[0.88rem] font-medium mb-3" style={{ color: colors.text.secondary }}>
                No payroll runs yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Templates */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-2 px-5 md:px-6">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
            <ClipboardList className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
            Checklist Template
            {activeTemplates.length > 0 && (
              <span className="text-[0.75rem] font-medium ml-1" style={{ color: colors.text.muted }}>
                ({activeTemplates.length} steps)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 md:px-6 pt-2">
          {activeTemplates.length > 0 ? (
            <div className="space-y-1">
              {activeTemplates
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((template, index) => (
                  <div
                    key={template.id}
                    className="flex items-center gap-3 py-2.5"
                    style={{
                      borderBottom: index < activeTemplates.length - 1 ? `1px solid ${colors.border}` : undefined,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[0.72rem] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: `${colors.primary}12`,
                        color: colors.primary,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-[0.85rem]" style={{ color: colors.text.primary }}>
                      {template.name}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <ClipboardList className="w-8 h-8 mx-auto mb-2" style={{ color: colors.text.muted }} />
              <p className="text-[0.88rem] font-medium" style={{ color: colors.text.secondary }}>
                No checklist steps configured
              </p>
              <Button
                variant="ghost"
                onClick={() => router.push(`/dashboard/clients/${id}/edit`)}
                className="mt-2 text-[0.82rem] rounded-lg"
                style={{ color: colors.primary }}
              >
                Add steps in edit mode
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
