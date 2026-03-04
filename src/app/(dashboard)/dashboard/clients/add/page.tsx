'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Settings,
  Shield,
  Phone,
  ClipboardList,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface ChecklistItem {
  name: string
}

interface FormData {
  // Step 1
  name: string
  paye_reference: string
  accounts_office_ref: string
  address: {
    street: string
    city: string
    postcode: string
  }
  employee_count: string
  // Step 2
  pay_frequency: string
  pay_day: string
  period_start: string
  period_end: string
  payroll_software: string
  employment_allowance: string
  // Step 3
  pension_provider: string
  pension_staging_date: string
  pension_reenrolment_date: string
  declaration_of_compliance_deadline: string
  // Step 4
  contact_name: string
  contact_email: string
  contact_phone: string
  email: string
  phone: string
  notes: string
}

const STEPS = [
  { label: 'Company Details', icon: Building2 },
  { label: 'Payroll Config', icon: Settings },
  { label: 'Pension', icon: Shield },
  { label: 'Contact Info', icon: Phone },
  { label: 'Checklist Template', icon: ClipboardList },
]

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { name: 'Receive payroll changes' },
  { name: 'Process payroll' },
  { name: 'Review & approve' },
  { name: 'Send payslips' },
  { name: 'Submit RTI to HMRC' },
  { name: 'BACS payment' },
  { name: 'Pension submission' },
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

export default function AddClientPage() {
  return (
    <Suspense>
      <AddClientContent />
    </Suspense>
  )
}

function AddClientContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [duplicating, setDuplicating] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    paye_reference: '',
    accounts_office_ref: '',
    address: { street: '', city: '', postcode: '' },
    employee_count: '',
    pay_frequency: '',
    pay_day: '',
    period_start: '',
    period_end: '',
    payroll_software: '',
    employment_allowance: '',
    pension_provider: '',
    pension_staging_date: '',
    pension_reenrolment_date: '',
    declaration_of_compliance_deadline: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    email: '',
    phone: '',
    notes: '',
  })

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pre-fill form when duplicating an existing client
  useEffect(() => {
    const duplicateId = searchParams.get('duplicate')
    if (!duplicateId) return

    const fetchSource = async () => {
      setDuplicating(true)
      try {
        const res = await fetch(`/api/clients/${duplicateId}`)
        if (!res.ok) return
        const data = await res.json()
        const client = data.client ?? data

        setFormData({
          name: `${client.name || ''} (Copy)`,
          paye_reference: client.paye_reference || '',
          accounts_office_ref: client.accounts_office_ref || '',
          address: client.address || { street: '', city: '', postcode: '' },
          employee_count: client.employee_count != null ? String(client.employee_count) : '',
          pay_frequency: client.pay_frequency || '',
          pay_day: client.pay_day || '',
          period_start: '',
          period_end: '',
          payroll_software: client.payroll_software || '',
          employment_allowance: client.employment_allowance != null ? String(client.employment_allowance) : '',
          pension_provider: client.pension_provider || '',
          pension_staging_date: client.pension_staging_date || '',
          pension_reenrolment_date: client.pension_reenrolment_date || '',
          declaration_of_compliance_deadline: client.declaration_of_compliance_deadline || '',
          contact_name: client.contact_name || '',
          contact_email: client.contact_email || '',
          contact_phone: client.contact_phone || '',
          email: client.email || '',
          phone: client.phone || '',
          notes: client.notes || '',
        })

        // Pre-fill checklist from source client's templates
        if (client.checklist_templates?.length) {
          const sorted = [...client.checklist_templates].sort(
            (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
          )
          setChecklistItems(sorted.map((t: { name: string }) => ({ name: t.name })))
        }
      } catch {
        // Silently fall back to empty form
      } finally {
        setDuplicating(false)
      }
    }

    fetchSource()
  }, [searchParams])

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

  // ─── Validation ──────────────────────────────────────────────────

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 0) {
      if (!formData.name.trim()) {
        errors.name = 'Company name is required'
      }
    }

    if (step === 1) {
      if (!formData.pay_frequency) {
        errors.pay_frequency = 'Pay frequency is required'
      }
      if (!formData.pay_day) {
        errors.pay_day = 'Pay day is required'
      }
    }

    if (step === 4) {
      const validItems = checklistItems.filter((item) => item.name.trim())
      if (validItems.length === 0) {
        errors.checklist = 'At least one checklist item with a name is required'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ─── Navigation ──────────────────────────────────────────────────

  const goNext = () => {
    if (!validateStep(currentStep)) return
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setFieldErrors({})
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  // ─── Checklist operations ────────────────────────────────────────

  const addChecklistItem = () => {
    setChecklistItems((prev) => [...prev, { name: '' }])
  }

  const removeChecklistItem = (index: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.checklist
      return next
    })
  }

  const updateChecklistItem = (index: number, name: string) => {
    setChecklistItems((prev) =>
      prev.map((item, i) => (i === index ? { name } : item))
    )
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.checklist
      return next
    })
  }

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

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setSubmitting(true)
    setError('')
    try {
      const payload = {
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
        employee_count: formData.employee_count
          ? parseInt(formData.employee_count)
          : undefined,
        pay_frequency: formData.pay_frequency,
        pay_day: formData.pay_day,
        period_start: formData.period_start || undefined,
        period_end: formData.period_end || undefined,
        payroll_software: formData.payroll_software || undefined,
        employment_allowance: formData.employment_allowance === 'yes' ? true : formData.employment_allowance === 'no' ? false : undefined,
        pension_provider: formData.pension_provider || undefined,
        pension_staging_date: formData.pension_staging_date || undefined,
        pension_reenrolment_date: formData.pension_reenrolment_date || undefined,
        declaration_of_compliance_deadline: formData.declaration_of_compliance_deadline || undefined,
        contact_name: formData.contact_name || undefined,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
        checklist_items: checklistItems
          .filter((item) => item.name.trim())
          .map((item, idx) => ({
            name: item.name.trim(),
            sort_order: idx,
          })),
      }

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push('/dashboard/clients')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create client')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Shared input styles ────────────────────────────────────────

  const inputStyle = {
    background: colors.glass.surface,
    color: colors.text.primary,
    border: `1px solid ${colors.borderElevated}`,
  }

  const inputClassName = 'mt-2 rounded-xl border-0 shadow-lg transition-all duration-300'

  // ─── Render helpers ──────────────────────────────────────────────

  const renderFieldError = (key: string) =>
    fieldErrors[key] ? (
      <p className="mt-1 text-sm font-medium" style={{ color: colors.error }}>
        {fieldErrors[key]}
      </p>
    ) : null

  // ─── Step 1: Company Details ─────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name" className="font-semibold" style={{ color: colors.text.primary }}>
          Company Name <span style={{ color: colors.error }}>*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="ABC Company Ltd"
          className={inputClassName}
          style={inputStyle}
        />
        {renderFieldError('name')}
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
          <p className="mt-1 text-xs" style={{ color: colors.text.muted }}>
            {formData.accounts_office_ref.length}/13 characters
          </p>
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
            placeholder="123 Business Street"
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
              placeholder="London"
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
              placeholder="SW1A 1AA"
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
          placeholder="25"
          className={inputClassName}
          style={inputStyle}
        />
      </div>
    </div>
  )

  // ─── Step 2: Payroll Configuration ───────────────────────────────

  const renderStep2 = () => {
    const showMonthlyOptions = ['monthly', 'quarterly', 'biannually', 'annually'].includes(formData.pay_frequency)

    return (
      <div className="space-y-6">
        <div>
          <Label className="font-semibold" style={{ color: colors.text.primary }}>
            Pay Frequency <span style={{ color: colors.error }}>*</span>
          </Label>
          <Select
            value={formData.pay_frequency}
            onValueChange={(value) => {
              updateField('pay_frequency', value)
              updateField('pay_day', '')
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
          {renderFieldError('pay_frequency')}
        </div>

        {formData.pay_frequency && (
          <div>
            <Label className="font-semibold" style={{ color: colors.text.primary }}>
              Pay Date <span style={{ color: colors.error }}>*</span>
            </Label>
            <Select
              value={formData.pay_day}
              onValueChange={(value) => updateField('pay_day', value)}
            >
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
            {renderFieldError('pay_day')}
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

  // ─── Step 3: Pension ─────────────────────────────────────────────

  const renderStep3 = () => {
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

  // ─── Step 4: Contact Info ────────────────────────────────────────

  const renderStep4 = () => (
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

      <div
        className="pt-6 border-t space-y-6"
        style={{ borderColor: colors.borderElevated }}
      >
        <h4 className="text-sm font-bold uppercase tracking-wide" style={{ color: colors.text.muted }}>
          Company Contact Details
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="email" className="font-semibold" style={{ color: colors.text.primary }}>
              Company Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="info@company.com"
              className={inputClassName}
              style={inputStyle}
            />
          </div>
          <div>
            <Label htmlFor="phone" className="font-semibold" style={{ color: colors.text.primary }}>
              Company Phone
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+44 20 1234 5678"
              className={inputClassName}
              style={inputStyle}
            />
          </div>
        </div>
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

  // ─── Step 5: Checklist Template ──────────────────────────────────

  const renderStep5 = () => (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: colors.text.secondary }}>
        Define the payroll processing steps for this client. These will be used as a checklist for each pay run.
      </p>

      {checklistItems.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-2 group"
        >
          <span
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: colors.glass.surfaceActive,
              color: colors.text.muted,
              border: `1px solid ${colors.borderElevated}`,
            }}
          >
            {index + 1}
          </span>
          <Input
            value={item.name}
            onChange={(e) => updateChecklistItem(index, e.target.value)}
            placeholder="Step name..."
            className="flex-1 rounded-xl border-0 shadow-lg transition-all duration-300"
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

      {renderFieldError('checklist')}

      <Button
        type="button"
        variant="outline"
        onClick={addChecklistItem}
        className="w-full rounded-xl font-semibold transition-all duration-300 hover:scale-[1.01]"
        style={{
          borderColor: colors.borderElevated,
          color: colors.text.secondary,
          backgroundColor: colors.glass.surface,
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Step
      </Button>
    </div>
  )

  // ─── Step content renderer ───────────────────────────────────────

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep1()
      case 1:
        return renderStep2()
      case 2:
        return renderStep3()
      case 3:
        return renderStep4()
      case 4:
        return renderStep5()
      default:
        return null
    }
  }

  // ─── Loading state ───────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse max-w-4xl mx-auto">
        <div className="h-20 rounded-xl bg-gray-200" />
        <div className="h-16 rounded-xl bg-gray-200" />
        <div className="h-96 rounded-xl bg-gray-200" />
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-3xl md:text-4xl font-bold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            {searchParams.get('duplicate') ? 'Duplicate Client' : 'Onboard New Client'}
          </h1>
          <p
            className="text-base md:text-lg transition-colors duration-300 mt-2"
            style={{ color: colors.text.secondary }}
          >
            {duplicating
              ? 'Loading client data...'
              : <>Step {currentStep + 1} of {STEPS.length} &mdash; {STEPS[currentStep].label}</>
            }
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/clients')}
          className="rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg self-start sm:self-auto"
          style={{
            borderColor: colors.borderElevated,
            color: colors.text.secondary,
            backgroundColor: colors.glass.surface,
            backdropFilter: 'blur(10px)',
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
      </div>

      {/* Step Indicator */}
      <div
        className="rounded-2xl p-4 md:p-6 shadow-xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark
            ? `0 10px 25px ${colors.shadow.medium}`
            : `0 6px 15px ${colors.shadow.light}`,
        }}
      >
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep

            return (
              <div key={index} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg',
                      isCurrent && 'scale-110'
                    )}
                    style={{
                      background: isCompleted || isCurrent
                        ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                        : colors.glass.surfaceActive,
                      boxShadow:
                        isCompleted || isCurrent
                          ? `0 6px 20px ${colors.primary}40`
                          : 'none',
                      border:
                        !isCompleted && !isCurrent
                          ? `1px solid ${colors.borderElevated}`
                          : 'none',
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    ) : (
                      <StepIcon
                        className="w-5 h-5 md:w-6 md:h-6"
                        style={{
                          color: isCurrent ? '#FFFFFF' : colors.text.muted,
                        }}
                      />
                    )}
                  </div>
                  <span
                    className="mt-2 text-xs md:text-sm font-medium text-center hidden sm:block"
                    style={{
                      color: isCurrent
                        ? colors.text.primary
                        : isCompleted
                        ? colors.primary
                        : colors.text.muted,
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2 md:mx-4 rounded-full mt-[-20px] sm:mt-[-28px]"
                    style={{
                      background:
                        index < currentStep
                          ? `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
                          : colors.borderElevated,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Card */}
      <Card
        className="border-0 shadow-xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark
            ? `0 15px 35px ${colors.shadow.medium}`
            : `0 10px 25px ${colors.shadow.light}`,
        }}
      >
        <CardHeader className="pb-6">
          <CardTitle
            className="flex items-center text-xl md:text-2xl font-bold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 8px 25px ${colors.primary}30`,
              }}
            >
              {(() => {
                const CurrentIcon = STEPS[currentStep].icon
                return <CurrentIcon className="w-6 h-6 text-white" />
              })()}
            </div>
            {STEPS[currentStep].label}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          {/* Global error */}
          {error && (
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

          {renderCurrentStep()}

          {/* Navigation */}
          <div
            className="flex justify-between items-center gap-4 pt-8 mt-8 border-t"
            style={{ borderColor: colors.borderElevated }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={currentStep === 0}
              className="rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]"
              style={{
                borderColor: colors.borderElevated,
                color: currentStep === 0 ? colors.text.muted : colors.text.secondary,
                backgroundColor: colors.glass.surface,
                opacity: currentStep === 0 ? 0.5 : 1,
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={goNext}
                className="text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  boxShadow: `0 10px 25px ${colors.primary}30`,
                }}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  boxShadow: `0 10px 25px ${colors.primary}30`,
                }}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Client...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Client
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
