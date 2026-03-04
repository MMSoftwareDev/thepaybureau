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
  tax_period_start: string | null
  pension_provider: string | null
  pension_staging_date: string | null
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
  tax_period_start: string
  pension_provider: string
  pension_staging_date: string
  contact_name: string
  contact_email: string
  contact_phone: string
  email: string
  phone: string
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
  ...Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  })),
  { value: 'last_monday', label: 'Last Monday' },
  { value: 'last_tuesday', label: 'Last Tuesday' },
  { value: 'last_wednesday', label: 'Last Wednesday' },
  { value: 'last_thursday', label: 'Last Thursday' },
  { value: 'last_friday', label: 'Last Friday' },
  { value: 'last_saturday', label: 'Last Saturday' },
  { value: 'last_sunday', label: 'Last Sunday' },
]

const PENSION_PROVIDERS = [
  'NEST',
  'NOW Pensions',
  'Smart Pension',
  "People's Pension",
  'Aviva',
  'Scottish Widows',
  'Royal London',
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
    tax_period_start: '',
    pension_provider: '',
    pension_staging_date: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    email: '',
    phone: '',
    notes: '',
    status: 'active',
  })

  const [checklistItems, setChecklistItems] = useState<{ name: string }[]>([])

  useEffect(() => {
    setMounted(true)
    fetchClient()
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
        tax_period_start: client.tax_period_start || '',
        pension_provider: client.pension_provider || '',
        pension_staging_date: client.pension_staging_date || '',
        contact_name: client.contact_name || '',
        contact_email: client.contact_email || '',
        contact_phone: client.contact_phone || '',
        email: client.email || '',
        phone: client.phone || '',
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
        tax_period_start: formData.tax_period_start || undefined,
        pension_provider: formData.pension_provider || undefined,
        pension_staging_date: formData.pension_staging_date || undefined,
        contact_name: formData.contact_name || undefined,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
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
    background: colors.glass.surface,
    color: colors.text.primary,
    border: `1px solid ${colors.borderElevated}`,
  }

  const inputClassName = 'mt-2 rounded-xl border-0 shadow-lg transition-all duration-300'

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
            onChange={(e) => updateField('accounts_office_ref', e.target.value)}
            placeholder="123PA00012345"
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
    const isMonthly = formData.pay_frequency === 'monthly'
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
            }}
          >
            <SelectTrigger className={inputClassName} style={inputStyle}>
              <SelectValue placeholder="Select pay frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="fortnightly">Fortnightly</SelectItem>
              <SelectItem value="four_weekly">4-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.pay_frequency && (
          <div>
            <Label className="font-semibold" style={{ color: colors.text.primary }}>
              {isMonthly ? 'Pay Day (day of month or last weekday)' : 'Pay Day (day of week)'}
            </Label>
            <Select value={formData.pay_day} onValueChange={(value) => updateField('pay_day', value)}>
              <SelectTrigger className={inputClassName} style={inputStyle}>
                <SelectValue placeholder={isMonthly ? 'Select day of month' : 'Select day of week'} />
              </SelectTrigger>
              <SelectContent>
                {isMonthly
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

        <div className="max-w-xs">
          <Label htmlFor="tax_period_start" className="font-semibold" style={{ color: colors.text.primary }}>
            Tax Period Start
          </Label>
          <Input
            id="tax_period_start"
            type="date"
            value={formData.tax_period_start}
            onChange={(e) => updateField('tax_period_start', e.target.value)}
            className={inputClassName}
            style={inputStyle}
          />
        </div>
      </div>
    )
  }

  const renderPensionTab = () => (
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
        <p className="mt-1 text-xs" style={{ color: colors.text.muted }}>
          Common providers: {PENSION_PROVIDERS.join(', ')}
        </p>
      </div>

      <div className="max-w-xs">
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
    </div>
  )

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

      <div className="pt-6 border-t space-y-6" style={{ borderColor: colors.borderElevated }}>
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

  const renderChecklistTab = () => (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: colors.text.secondary }}>
        The default checklist template for this client. Changes here will apply to future payroll runs.
      </p>

      {checklistItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2 group">
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
      <div className="space-y-8 animate-pulse max-w-4xl mx-auto">
        <div className="h-20 rounded-xl bg-gray-200" />
        <div className="h-16 rounded-xl bg-gray-200" />
        <div className="h-96 rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: isDark
                ? `0 25px 50px ${colors.shadow.heavy}`
                : `0 20px 40px ${colors.primary}30`,
            }}
          >
            <Building2 className="w-10 h-10 text-white animate-pulse" />
          </div>
          <p className="text-xl font-semibold" style={{ color: colors.text.primary }}>
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
          className="max-w-md border-0 shadow-2xl"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
          }}
        >
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-3" style={{ color: colors.text.primary }}>
              {error}
            </h3>
            <Button
              onClick={() => router.push('/dashboard/clients')}
              className="text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-3xl md:text-4xl font-bold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            Edit Client
          </h1>
          <p
            className="text-base md:text-lg transition-colors duration-300 mt-2"
            style={{ color: colors.text.secondary }}
          >
            {formData.name}
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

      {/* Tab navigation */}
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
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const TabIcon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                  isActive ? 'shadow-lg' : 'hover:shadow-md'
                )}
                style={{
                  backgroundColor: isActive ? colors.primary : colors.glass.surface,
                  color: isActive ? '#FFFFFF' : colors.text.secondary,
                  border: `1px solid ${isActive ? colors.primary : colors.borderElevated}`,
                  boxShadow: isActive ? `0 4px 15px ${colors.primary}40` : 'none',
                }}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
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
              <CurrentIcon className="w-6 h-6 text-white" />
            </div>
            {currentTabInfo.label}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
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
            className="flex justify-end items-center gap-4 pt-8 mt-8 border-t"
            style={{ borderColor: colors.borderElevated }}
          >
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: `0 10px 25px ${colors.primary}30`,
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
