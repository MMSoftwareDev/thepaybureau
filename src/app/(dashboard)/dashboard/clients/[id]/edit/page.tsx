'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { calculateNextPayDate, calculatePeriodDates } from '@/lib/hmrc-deadlines'
import type { PayFrequency } from '@/lib/hmrc-deadlines'
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Settings,
  Shield,
  Phone,
  ClipboardList,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface ChecklistTemplate {
  id: string
  name: string
  sort_order: number
}

interface ClientData {
  id: string
  name: string
  paye_reference: string | null
  accounts_office_ref: string | null
  address: { street?: string; city?: string; postcode?: string } | null
  employee_count: number | null
  pay_frequency: string | null
  pay_day: string | null
  payroll_software: string | null
  period_start: string | null
  period_end: string | null
  employment_allowance: boolean | null
  pension_provider: string | null
  pension_staging_date: string | null
  pension_reenrolment_date: string | null
  declaration_of_compliance_deadline: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  email: string | null
  phone: string | null
  notes: string | null
  status: 'active' | 'inactive' | 'prospect'
  checklist_templates: ChecklistTemplate[]
}

interface FormData {
  name: string
  paye_reference: string
  accounts_office_ref: string
  address: { street: string; city: string; postcode: string }
  employee_count: string
  pay_frequency: string
  pay_day: string
  payroll_software: string
  period_start: string
  period_end: string
  employment_allowance: string
  pension_provider: string
  pension_staging_date: string
  pension_reenrolment_date: string
  declaration_of_compliance_deadline: string
  contact_name: string
  contact_email: string
  contact_phone: string
  notes: string
  status: 'active' | 'inactive' | 'prospect'
}

const TABS = [
  { key: 'company', label: 'Company Details', icon: Building2 },
  { key: 'payroll', label: 'Payroll Config', icon: Settings },
  { key: 'pension', label: 'Pension', icon: Shield },
  { key: 'contact', label: 'Contact Info', icon: Phone },
  { key: 'checklist', label: 'Checklist Template', icon: ClipboardList },
]

const WEEKDAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

const MONTHLY_PAY_DAYS = [
  { value: 'last_day_of_month', label: 'Last Day of the Month' },
  { value: 'last_working_day', label: 'Last Working Day of the Month' },
  { value: 'last_monday', label: 'Last Monday of the Month' },
  { value: 'last_tuesday', label: 'Last Tuesday of the Month' },
  { value: 'last_wednesday', label: 'Last Wednesday of the Month' },
  { value: 'last_thursday', label: 'Last Thursday of the Month' },
  { value: 'last_friday', label: 'Last Friday of the Month' },
  { value: 'last_saturday', label: 'Last Saturday of the Month' },
  { value: 'last_sunday', label: 'Last Sunday of the Month' },
  { value: '2nd_from_last_working_day', label: '2nd from Last Working Day of the Month' },
  { value: '3rd_from_last_working_day', label: '3rd from Last Working Day of the Month' },
  { value: '2nd_from_last_friday', label: '2nd from Last Friday of the Month' },
  ...Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}${i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : i + 1 === 3 ? 'rd' : i + 1 === 21 ? 'st' : i + 1 === 22 ? 'nd' : i + 1 === 23 ? 'rd' : i + 1 === 31 ? 'st' : 'th'} of the Month`,
  })),
]

const PENSION_PROVIDERS = [
  'Exempt',
  'NEST',
  'NOW Pensions',
  'Smart Pension',
  "People's Pension",
  'Aviva',
  'Scottish Widows',
  'Royal London',
  'Penfold',
  'Legal & General',
  'Standard Life',
  'LGPS',
  'Cushon',
  'Creative',
  'True Potential',
]

// ─── Component ───────────────────────────────────────────────────────

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('company')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    name: '',
    paye_reference: '',
    accounts_office_ref: '',
    address: { street: '', city: '', postcode: '' },
    employee_count: '',
    pay_frequency: '',
    pay_day: '',
    payroll_software: '',
    period_start: '',
    period_end: '',
    employment_allowance: '',
    pension_provider: '',
    pension_staging_date: '',
    pension_reenrolment_date: '',
    declaration_of_compliance_deadline: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
    status: 'active',
  })

  const [checklistItems, setChecklistItems] = useState<{ name: string }[]>([])

  // Named templates from tenant settings
  const [availableTemplates, setAvailableTemplates] = useState<
    { id: string; name: string; is_default: boolean; steps: { name: string; sort_order: number }[] }[]
  >([])

  useEffect(() => {
    setMounted(true)
    fetchClient()
    // Fetch saved checklist templates from settings
    fetch('/api/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.templates?.length) {
          setAvailableTemplates(data.templates)
        }
      })
      .catch(() => { /* ignore */ })
  }, [])

  // ─── Fetch existing client ─────────────────────────────────────────

  const fetchClient = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/clients/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Client not found')
          return
        }
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to load client')
      }

      const client: ClientData = await res.json()

      setFormData({
        name: client.name || '',
        paye_reference: client.paye_reference || '',
        accounts_office_ref: client.accounts_office_ref || '',
        address: {
          street: client.address?.street || '',
          city: client.address?.city || '',
          postcode: client.address?.postcode || '',
        },
        employee_count: client.employee_count != null ? String(client.employee_count) : '',
        pay_frequency: client.pay_frequency || '',
        pay_day: client.pay_day || '',
        payroll_software: client.payroll_software || '',
        period_start: client.period_start || '',
        period_end: client.period_end || '',
        employment_allowance: client.employment_allowance === true ? 'yes' : client.employment_allowance === false ? 'no' : '',
        pension_provider: client.pension_provider || '',
        pension_staging_date: client.pension_staging_date || '',
        pension_reenrolment_date: client.pension_reenrolment_date || '',
        declaration_of_compliance_deadline: client.declaration_of_compliance_deadline || '',
        contact_name: client.contact_name || '',
        contact_email: client.contact_email || '',
        contact_phone: client.contact_phone || '',
        notes: client.notes || '',
        status: client.status,
      })

      if (client.checklist_templates?.length) {
        setChecklistItems(
          client.checklist_templates
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((t) => ({ name: t.name }))
        )
      }
    } catch (err) {
      console.error('Error fetching client:', err)
      setError(err instanceof Error ? err.message : 'Failed to load client')
    } finally {
      setLoading(false)
    }
  }

  // ─── Auto-fill pay period dates when frequency + pay day change ──

  useEffect(() => {
    if (!formData.pay_frequency || !formData.pay_day) return

    try {
      const freq = formData.pay_frequency as PayFrequency
      const today = new Date()
      const nextPayDate = calculateNextPayDate(freq, formData.pay_day, today)
      const { periodStart, periodEnd } = calculatePeriodDates(freq, nextPayDate)

      const formatDate = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }

      setFormData((prev) => ({
        ...prev,
        period_start: formatDate(periodStart),
        period_end: formatDate(periodEnd),
      }))
    } catch {
      // Ignore calculation errors for unsupported combos
    }
  }, [formData.pay_frequency, formData.pay_day])

  // ─── Helpers ─────────────────────────────────────────────────────

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const updateAddress = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }))
  }

  // ─── Checklist operations ────────────────────────────────────────

  const addChecklistItem = () => setChecklistItems((prev) => [...prev, { name: '' }])

  const removeChecklistItem = (index: number) =>
    setChecklistItems((prev) => prev.filter((_, i) => i !== index))

  const updateChecklistItem = (index: number, name: string) =>
    setChecklistItems((prev) => prev.map((item, i) => (i === index ? { name } : item)))

  const moveChecklistItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= checklistItems.length) return
    setChecklistItems((prev) => {
      const items = [...prev]
      const temp = items[index]
      items[index] = items[newIndex]
      items[newIndex] = temp
      return items
    })
  }

  // ─── Submit ──────────────────────────────────────────────────────

  const handleSave = async () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Company name is required'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setActiveTab('company')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        paye_reference: formData.paye_reference || undefined,
        accounts_office_ref: formData.accounts_office_ref || undefined,
        address:
          formData.address.street || formData.address.city || formData.address.postcode
            ? {
                street: formData.address.street || undefined,
                city: formData.address.city || undefined,
                postcode: formData.address.postcode || undefined,
              }
            : undefined,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : undefined,
        pay_frequency: formData.pay_frequency || undefined,
        pay_day: formData.pay_day || undefined,
        payroll_software: formData.payroll_software || undefined,
        period_start: formData.period_start || undefined,
        period_end: formData.period_end || undefined,
        employment_allowance: formData.employment_allowance === 'yes' ? true : formData.employment_allowance === 'no' ? false : undefined,
        pension_provider: formData.pension_provider || undefined,
        pension_staging_date: formData.pension_staging_date || undefined,
        pension_reenrolment_date: formData.pension_reenrolment_date || undefined,
        declaration_of_compliance_deadline: formData.declaration_of_compliance_deadline || undefined,
        contact_name: formData.contact_name || undefined,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
        checklist_templates: checklistItems.map((item, index) => ({
          name: item.name,
          sort_order: index,
        })),
      }

      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast('Client updated successfully')
        router.push('/dashboard/clients')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update client')
        toast(data.error || 'Failed to update client', 'error')
      }
    } catch {
      setError('An unexpected error occurred')
      toast('An unexpected error occurred', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ─── Shared styles ────────────────────────────────────────────────

  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
    color: colors.text.primary,
    border: `1px solid ${colors.border}`,
  }

  const inputClassName = 'mt-2 rounded-lg border-0'

  const renderFieldError = (key: string) =>
    fieldErrors[key] ? (
      <p className="mt-1 text-sm font-medium" style={{ color: colors.error }}>
        {fieldErrors[key]}
      </p>
    ) : null

  // ─── Tab content ──────────────────────────────────────────────────

  const renderCompanyTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name" className="font-semibold" style={{ color: colors.text.primary }}>
            Company Name <span style={{ color: colors.error }}>*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={inputClassName}
            style={inputStyle}
          />
          {renderFieldError('name')}
        </div>
        <div>
          <Label htmlFor="status" className="font-semibold" style={{ color: colors.text.primary }}>
            Status
          </Label>
          <Select value={formData.status} onValueChange={(v) => updateField('status', v as FormData['status'])}>
            <SelectTrigger className={inputClassName} style={inputStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="paye_reference" className="font-semibold" style={{ color: colors.text.primary }}>
            PAYE Reference
          </Label>
          <Input
            id="paye_reference"
            value={formData.paye_reference}
            onChange={(e) => updateField('paye_reference', e.target.value)}
            placeholder="123/AB45678"
            className={inputClassName}
            style={inputStyle}
          />
        </div>
        <div>
          <Label htmlFor="accounts_office_ref" className="font-semibold" style={{ color: colors.text.primary }}>
            Accounts Office Reference
          </Label>
          <Input
            id="accounts_office_ref"
            value={formData.accounts_office_ref}
            onChange={(e) => {
              if (e.target.value.length <= 13) updateField('accounts_office_ref', e.target.value)
            }}
            placeholder="123PA00012345"
            maxLength={13}
            className={inputClassName}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wide" style={{ color: colors.text.muted }}>
          Address
        </h4>
        <div>
          <Label htmlFor="street" className="font-semibold" style={{ color: colors.text.primary }}>
            Street
          </Label>
          <Input
            id="street"
            value={formData.address.street}
            onChange={(e) => updateAddress('street', e.target.value)}
            className={inputClassName}
            style={inputStyle}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="city" className="font-semibold" style={{ color: colors.text.primary }}>
              City
            </Label>
            <Input
              id="city"
              value={formData.address.city}
              onChange={(e) => updateAddress('city', e.target.value)}
              className={inputClassName}
              style={inputStyle}
            />
          </div>
          <div>
            <Label htmlFor="postcode" className="font-semibold" style={{ color: colors.text.primary }}>
              Postcode
            </Label>
            <Input
              id="postcode"
              value={formData.address.postcode}
              onChange={(e) => updateAddress('postcode', e.target.value)}
              className={inputClassName}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="employee_count" className="font-semibold" style={{ color: colors.text.primary }}>
          Employee Count
        </Label>
        <Input
          id="employee_count"
          type="number"
          min="1"
          value={formData.employee_count}
          onChange={(e) => updateField('employee_count', e.target.value)}
          className={inputClassName}
          style={inputStyle}
        />
      </div>
    </div>
  )

  const renderPayrollTab = () => {
    const showMonthlyOptions = ['monthly', 'quarterly', 'biannually', 'annually'].includes(formData.pay_frequency)
    return (
      <div className="space-y-6">
        <div>
          <Label className="font-semibold" style={{ color: colors.text.primary }}>
            Pay Frequency
          </Label>
          <Select
            value={formData.pay_frequency}
            onValueChange={(value) => {
              updateField('pay_frequency', value)
              updateField('pay_day', '')
              updateField('period_start', '')
              updateField('period_end', '')
            }}
          >
            <SelectTrigger className={inputClassName} style={inputStyle}>
              <SelectValue placeholder="Select pay frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="two_weekly">Two Weekly</SelectItem>
              <SelectItem value="four_weekly">Four Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="biannually">Biannually</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.pay_frequency && (
          <div>
            <Label className="font-semibold" style={{ color: colors.text.primary }}>
              Pay Date <span style={{ color: colors.error }}>*</span>
            </Label>
            <Select value={formData.pay_day} onValueChange={(value) => updateField('pay_day', value)}>
              <SelectTrigger className={inputClassName} style={inputStyle}>
                <SelectValue placeholder={showMonthlyOptions ? 'Select pay date' : 'Select day of week'} />
              </SelectTrigger>
              <SelectContent>
                {showMonthlyOptions
                  ? MONTHLY_PAY_DAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))
                  : WEEKDAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="period_start" className="font-semibold" style={{ color: colors.text.primary }}>
              Pay Period Start
            </Label>
            <Input
              id="period_start"
              type="date"
              value={formData.period_start}
              onChange={(e) => updateField('period_start', e.target.value)}
              className={inputClassName}
              style={inputStyle}
            />
          </div>
          <div>
            <Label htmlFor="period_end" className="font-semibold" style={{ color: colors.text.primary }}>
              Pay Period End
            </Label>
            <Input
              id="period_end"
              type="date"
              value={formData.period_end}
              onChange={(e) => updateField('period_end', e.target.value)}
              className={inputClassName}
              style={inputStyle}
            />
          </div>
        </div>

        {formData.pay_frequency && formData.pay_day && (() => {
          try {
            const referenceDate = formData.period_start
              ? new Date(formData.period_start + 'T00:00:00')
              : new Date()
            const adjustedRef = new Date(referenceDate)
            adjustedRef.setDate(adjustedRef.getDate() - 1)
            const nextDate = calculateNextPayDate(
              formData.pay_frequency as PayFrequency,
              formData.pay_day,
              adjustedRef
            )
            return (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{
                  background: `${colors.primary}08`,
                  border: `1px solid ${colors.primary}25`,
                }}
              >
                <span className="font-medium" style={{ color: colors.text.secondary }}>
                  Next Pay Date:
                </span>
                <span className="font-bold" style={{ color: colors.primary }}>
                  {nextDate.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )
          } catch {
            return null
          }
        })()}

        <div>
          <Label htmlFor="payroll_software" className="font-semibold" style={{ color: colors.text.primary }}>
            Payroll Software
          </Label>
          <Input
            id="payroll_software"
            value={formData.payroll_software}
            onChange={(e) => updateField('payroll_software', e.target.value)}
            placeholder="e.g. BrightPay, Sage, Moneysoft, IRIS..."
            list="payroll-software-list"
            className={inputClassName}
            style={inputStyle}
          />
          <datalist id="payroll-software-list">
            {['BrightPay', 'Sage 50', 'Moneysoft', 'IRIS', 'Xero Payroll', 'QuickBooks Payroll', 'Staffology', 'Paycircle', 'Brain', 'Buddy', 'FreeAgent'].map((sw) => (
              <option key={sw} value={sw} />
            ))}
          </datalist>
        </div>

        <div>
          <Label className="font-semibold" style={{ color: colors.text.primary }}>
            Entitled to Employment Allowance
          </Label>
          <Select value={formData.employment_allowance} onValueChange={(value) => updateField('employment_allowance', value)}>
            <SelectTrigger className={inputClassName} style={inputStyle}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  const renderPensionTab = () => {
    const isPensionExempt = formData.pension_provider.toLowerCase() === 'exempt'
    return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="pension_provider" className="font-semibold" style={{ color: colors.text.primary }}>
          Pension Provider
        </Label>
        <Input
          id="pension_provider"
          value={formData.pension_provider}
          onChange={(e) => updateField('pension_provider', e.target.value)}
          placeholder="Start typing to see suggestions..."
          list="pension-providers"
          className={inputClassName}
          style={inputStyle}
        />
        <datalist id="pension-providers">
          {PENSION_PROVIDERS.map((provider) => (
            <option key={provider} value={provider} />
          ))}
        </datalist>
        {isPensionExempt && (
          <p className="mt-2 text-sm font-medium" style={{ color: colors.text.muted }}>
            Client is exempt from pension — date fields are hidden.
          </p>
        )}
      </div>

      {!isPensionExempt && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="pension_staging_date" className="font-semibold" style={{ color: colors.text.primary }}>
            Pension Staging Date
          </Label>
          <Input
            id="pension_staging_date"
            type="date"
            value={formData.pension_staging_date}
            onChange={(e) => updateField('pension_staging_date', e.target.value)}
            className={inputClassName}
            style={inputStyle}
          />
        </div>

        <div>
          <Label htmlFor="pension_reenrolment_date" className="font-semibold" style={{ color: colors.text.primary }}>
            Re-Enrolment Date
          </Label>
          <Input
            id="pension_reenrolment_date"
            type="date"
            value={formData.pension_reenrolment_date}
            onChange={(e) => updateField('pension_reenrolment_date', e.target.value)}
            className={inputClassName}
            style={inputStyle}
          />
        </div>

        <div>
          <Label htmlFor="declaration_of_compliance_deadline" className="font-semibold" style={{ color: colors.text.primary }}>
            Declaration of Compliance
          </Label>
          <Input
            id="declaration_of_compliance_deadline"
            type="date"
            value={formData.declaration_of_compliance_deadline}
            onChange={(e) => updateField('declaration_of_compliance_deadline', e.target.value)}
            className={inputClassName}
            style={inputStyle}
          />
          <p className="mt-1 text-xs" style={{ color: colors.text.muted }}>
            TPR deadline for declaration
          </p>
        </div>
      </div>
      )}
    </div>
    )
  }

  const renderContactTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="contact_name" className="font-semibold" style={{ color: colors.text.primary }}>
            Primary Contact Name
          </Label>
          <Input
            id="contact_name"
            value={formData.contact_name}
            onChange={(e) => updateField('contact_name', e.target.value)}
            placeholder="Jane Smith"
            className={inputClassName}
            style={inputStyle}
          />
        </div>
        <div>
          <Label htmlFor="contact_email" className="font-semibold" style={{ color: colors.text.primary }}>
            Contact Email
          </Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => updateField('contact_email', e.target.value)}
            placeholder="jane@company.com"
            className={inputClassName}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contact_phone" className="font-semibold" style={{ color: colors.text.primary }}>
          Contact Phone
        </Label>
        <Input
          id="contact_phone"
          value={formData.contact_phone}
          onChange={(e) => updateField('contact_phone', e.target.value)}
          placeholder="+44 7700 900000"
          className={inputClassName}
          style={inputStyle}
        />
      </div>

      <div>
        <Label htmlFor="notes" className="font-semibold" style={{ color: colors.text.primary }}>
          Notes
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Any additional information about this client..."
          rows={4}
          className={cn(inputClassName, 'resize-none')}
          style={inputStyle}
        />
      </div>
    </div>
  )

  const handleApplyTemplate = (templateId: string) => {
    const tpl = availableTemplates.find((t) => t.id === templateId)
    if (tpl) {
      setChecklistItems(tpl.steps.map((s) => ({ name: s.name })))
    }
  }

  const renderChecklistTab = () => (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: colors.text.secondary }}>
        The default checklist template for this client. Changes here will apply to future payroll runs.
      </p>

      {availableTemplates.length > 0 && (
        <div>
          <Label className="font-semibold text-sm" style={{ color: colors.text.primary }}>
            Apply from Template
          </Label>
          <Select onValueChange={handleApplyTemplate}>
            <SelectTrigger
              className="mt-1.5 rounded-lg border-0"
              style={inputStyle}
            >
              <SelectValue placeholder="Choose a saved template..." />
            </SelectTrigger>
            <SelectContent>
              {availableTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}{t.is_default ? ' (Default)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs" style={{ color: colors.text.muted }}>
            Selecting a template will replace the current checklist steps below.
          </p>
        </div>
      )}

      {checklistItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2 group">
          <span
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: colors.text.muted,
              border: `1px solid ${colors.border}`,
            }}
          >
            {index + 1}
          </span>
          <Input
            value={item.name}
            onChange={(e) => updateChecklistItem(index, e.target.value)}
            placeholder="Step name..."
            className="flex-1 rounded-lg border-0"
            style={inputStyle}
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === 0}
              onClick={() => moveChecklistItem(index, 'up')}
              className="h-8 w-8 rounded-lg"
              style={{ color: colors.text.muted }}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === checklistItems.length - 1}
              onClick={() => moveChecklistItem(index, 'down')}
              className="h-8 w-8 rounded-lg"
              style={{ color: colors.text.muted }}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeChecklistItem(index)}
              className="h-8 w-8 rounded-lg hover:text-red-500"
              style={{ color: colors.text.muted }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addChecklistItem}
        className="w-full rounded-lg font-semibold text-[0.85rem]"
        style={{
          borderColor: colors.border,
          color: colors.text.secondary,
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Step
      </Button>
    </div>
  )

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'company': return renderCompanyTab()
      case 'payroll': return renderPayrollTab()
      case 'pension': return renderPensionTab()
      case 'contact': return renderContactTab()
      case 'checklist': return renderChecklistTab()
      default: return null
    }
  }

  // ─── Loading / error states ────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-16 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
        <div className="h-14 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
        <div className="h-80 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          >
            <Building2 className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-[0.9rem] font-medium" style={{ color: colors.text.secondary }}>
            Loading client...
          </p>
        </div>
      </div>
    )
  }

  if (error && !formData.name) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card
          className="max-w-sm border-0"
          style={{
            backgroundColor: colors.surface,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
          }}
        >
          <CardContent className="p-6 text-center">
            <h3 className="text-base font-bold mb-2" style={{ color: colors.text.primary }}>
              {error}
            </h3>
            <Button
              onClick={() => router.push('/dashboard/clients')}
              className="text-white font-semibold px-5 py-2 rounded-lg border-0 text-[0.85rem]"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              }}
            >
              Back to Clients
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────

  const currentTabInfo = TABS.find((t) => t.key === activeTab)!
  const CurrentIcon = currentTabInfo.icon

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
            Edit Client
          </h1>
          <p className="text-[0.82rem] mt-0.5" style={{ color: colors.text.muted }}>
            {formData.name}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/clients')}
          className="font-semibold py-2 px-4 rounded-lg text-[0.85rem]"
          style={{ borderColor: colors.border, color: colors.text.primary }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
      </div>

      {/* Tab navigation */}
      <Card
        className="border-0"
        style={{
          backgroundColor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
        }}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.82rem] font-semibold"
                  style={{
                    backgroundColor: isActive ? colors.primary : 'transparent',
                    color: isActive ? '#FFFFFF' : colors.text.secondary,
                    border: `1px solid ${isActive ? colors.primary : colors.border}`,
                  }}
                >
                  <TabIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card
        className="border-0"
        style={{
          backgroundColor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
        }}
      >
        <CardHeader className="pb-4">
          <CardTitle
            className="flex items-center text-base md:text-lg font-bold"
            style={{ color: colors.text.primary }}
          >
            <div
              className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center mr-3"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <CurrentIcon className="w-4 h-4 md:w-5 md:h-5" style={{ color: colors.primary }} />
            </div>
            {currentTabInfo.label}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {error && formData.name && (
            <div
              className="mb-6 p-4 rounded-xl text-sm font-medium"
              style={{
                background: `${colors.error}15`,
                color: colors.error,
                border: `1px solid ${colors.error}30`,
              }}
            >
              {error}
            </div>
          )}

          {renderActiveTab()}

          {/* Save button */}
          <div
            className="flex justify-end items-center gap-4 pt-6 mt-6 border-t"
            style={{ borderColor: colors.border }}
          >
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-white font-semibold py-2 px-5 rounded-lg border-0 text-[0.85rem]"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
