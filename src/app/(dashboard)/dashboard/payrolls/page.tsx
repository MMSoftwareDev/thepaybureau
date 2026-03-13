'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { usePayrolls, useClients } from '@/lib/swr'
import { useDebounce } from '@/hooks/useDebounce'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { format, parseISO } from 'date-fns'
import {
  ClipboardCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  CalendarDays,
  FileText,
  Landmark,
  Shield,
  ListChecks,
  Eye,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { mutate } from 'swr'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PayrollClient {
  name: string
}

interface LatestRun {
  id: string
  pay_date: string
  status: string
}

interface Payroll {
  id: string
  tenant_id: string
  client_id: string
  name: string
  paye_reference: string | null
  accounts_office_ref: string | null
  pay_frequency: string | null
  pay_day: string | null
  period_start: string | null
  period_end: string | null
  payroll_software: string | null
  employment_allowance: boolean | null
  pension_provider: string | null
  pension_staging_date: string | null
  pension_reenrolment_date: string | null
  declaration_of_compliance_deadline: string | null
  status: string
  created_at: string | null
  clients: PayrollClient
  latestRun: LatestRun | null
}

interface ClientOption {
  id: string
  name: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatFrequency = (freq: string | null | undefined): string => {
  if (!freq) return '-'
  const map: Record<string, string> = {
    weekly: 'Weekly',
    two_weekly: 'Fortnightly',
    four_weekly: '4-Weekly',
    monthly: 'Monthly',
    annually: 'Annually',
  }
  return map[freq] || freq
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return '-'
  }
}

const formatPayDay = (payDay: string | null | undefined): string => {
  if (!payDay) return '-'
  if (payDay === 'last_day_of_month') return 'Last day'
  if (payDay === 'last_working_day') return 'Last working day'
  if (payDay.startsWith('last_')) return `Last ${payDay.replace('last_', '').replace(/_/g, ' ')}`
  if (payDay.includes('from_last')) return payDay.replace(/_/g, ' ')
  const num = parseInt(payDay)
  if (!isNaN(num)) {
    const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'
    return `${num}${suffix}`
  }
  return payDay.charAt(0).toUpperCase() + payDay.slice(1)
}

const PENSION_PROVIDERS = [
  'NEST', 'NOW Pensions', 'Smart Pension', 'The People\'s Pension',
  'Aviva', 'Royal London', 'Scottish Widows', 'Legal & General',
  'Aegon', 'Standard Life', 'Hargreaves Lansdown', 'AJ Bell',
  'Fidelity', 'Other', 'Exempt',
]

const DEFAULT_CHECKLIST = [
  { name: 'Receive payroll changes', sort_order: 0 },
  { name: 'Process payroll', sort_order: 1 },
  { name: 'Review & approve', sort_order: 2 },
  { name: 'Send payslips', sort_order: 3 },
  { name: 'Submit RTI to HMRC', sort_order: 4 },
  { name: 'BACS payment', sort_order: 5 },
  { name: 'Pension submission', sort_order: 6 },
]

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// ── Collapsible Section ────────────────────────────────────────────────────────

function FormSection({
  title,
  icon: Icon,
  defaultOpen = true,
  colors,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  colors: ReturnType<typeof getThemeColors>
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid ${colors.border}` }}>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-semibold font-[family-name:var(--font-inter)] transition-colors"
        style={{ color: colors.text.primary }}
        onClick={() => setOpen(!open)}
      >
        <Icon className="w-4 h-4" />
        {title}
        <span className="ml-auto">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      </button>
      {open && <div className="px-5 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function PayrollsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Data
  const { data: payrolls, isLoading } = usePayrolls()
  const { data: clientsData } = useClients()
  const clientOptions: ClientOption[] = useMemo(() => {
    if (!clientsData) return []
    return (clientsData as ClientOption[]).map((c) => ({ id: c.id, name: c.name }))
  }, [clientsData])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Sidebar state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formClientId, setFormClientId] = useState('')
  const [formPayFrequency, setFormPayFrequency] = useState('')
  const [formPayDay, setFormPayDay] = useState('')
  const [formPayeReference, setFormPayeReference] = useState('')
  const [formAccountsOfficeRef, setFormAccountsOfficeRef] = useState('')
  const [formPayrollSoftware, setFormPayrollSoftware] = useState('')
  const [formEmploymentAllowance, setFormEmploymentAllowance] = useState(false)
  const [formPensionProvider, setFormPensionProvider] = useState('')
  const [formPensionStagingDate, setFormPensionStagingDate] = useState('')
  const [formPensionReenrolmentDate, setFormPensionReenrolmentDate] = useState('')
  const [formDocDeadline, setFormDocDeadline] = useState('')
  const [formChecklist, setFormChecklist] = useState(DEFAULT_CHECKLIST)
  const [newStepName, setNewStepName] = useState('')

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormName('')
    setFormClientId('')
    setFormPayFrequency('')
    setFormPayDay('')
    setFormPayeReference('')
    setFormAccountsOfficeRef('')
    setFormPayrollSoftware('')
    setFormEmploymentAllowance(false)
    setFormPensionProvider('')
    setFormPensionStagingDate('')
    setFormPensionReenrolmentDate('')
    setFormDocDeadline('')
    setFormChecklist(DEFAULT_CHECKLIST)
    setNewStepName('')
    setEditingPayroll(null)
  }, [])

  const openAdd = useCallback(() => {
    resetForm()
    setSheetOpen(true)
  }, [resetForm])

  const openEdit = useCallback((payroll: Payroll) => {
    setEditingPayroll(payroll)
    setFormName(payroll.name || '')
    setFormClientId(payroll.client_id || '')
    setFormPayFrequency(payroll.pay_frequency || '')
    setFormPayDay(payroll.pay_day || '')
    setFormPayeReference(payroll.paye_reference || '')
    setFormAccountsOfficeRef(payroll.accounts_office_ref || '')
    setFormPayrollSoftware(payroll.payroll_software || '')
    setFormEmploymentAllowance(payroll.employment_allowance || false)
    setFormPensionProvider(payroll.pension_provider || '')
    setFormPensionStagingDate(payroll.pension_staging_date || '')
    setFormPensionReenrolmentDate(payroll.pension_reenrolment_date || '')
    setFormDocDeadline(payroll.declaration_of_compliance_deadline || '')
    setSheetOpen(true)
  }, [])

  // Pay day options based on frequency
  const payDayOptions = useMemo(() => {
    if (formPayFrequency === 'monthly') {
      const days = Array.from({ length: 31 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      }))
      return [
        ...days,
        { value: 'last_day_of_month', label: 'Last day of month' },
        { value: 'last_working_day', label: 'Last working day' },
      ]
    }
    if (formPayFrequency === 'annually') {
      return [] // Uses date picker
    }
    // weekly, two_weekly, four_weekly
    return WEEKDAYS.map((d) => ({
      value: d,
      label: d.charAt(0).toUpperCase() + d.slice(1),
    }))
  }, [formPayFrequency])

  const handleSave = async () => {
    if (!formName.trim()) {
      toast('Payroll name is required', 'error')
      return
    }
    if (!editingPayroll && !formClientId) {
      toast('Please select a client', 'error')
      return
    }
    if (!formPayFrequency) {
      toast('Pay frequency is required', 'error')
      return
    }
    if (!formPayDay) {
      toast('Pay day is required', 'error')
      return
    }

    setSaving(true)
    try {
      if (editingPayroll) {
        const payload = {
          name: formName.trim(),
          pay_frequency: formPayFrequency,
          pay_day: formPayDay,
          paye_reference: formPayeReference.trim() || undefined,
          accounts_office_ref: formAccountsOfficeRef.trim() || undefined,
          payroll_software: formPayrollSoftware.trim() || undefined,
          employment_allowance: formEmploymentAllowance,
          pension_provider: formPensionProvider || undefined,
          pension_staging_date: formPensionStagingDate || undefined,
          pension_reenrolment_date: formPensionReenrolmentDate || undefined,
          declaration_of_compliance_deadline: formDocDeadline || undefined,
        }

        const res = await fetch(`/api/payrolls/${editingPayroll.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to update payroll')
        }
      } else {
        const payload = {
          name: formName.trim(),
          client_id: formClientId,
          pay_frequency: formPayFrequency,
          pay_day: formPayDay,
          paye_reference: formPayeReference.trim() || undefined,
          accounts_office_ref: formAccountsOfficeRef.trim() || undefined,
          payroll_software: formPayrollSoftware.trim() || undefined,
          employment_allowance: formEmploymentAllowance,
          pension_provider: formPensionProvider || undefined,
          pension_staging_date: formPensionStagingDate || undefined,
          pension_reenrolment_date: formPensionReenrolmentDate || undefined,
          declaration_of_compliance_deadline: formDocDeadline || undefined,
          checklist_items: formChecklist,
        }

        const res = await fetch('/api/payrolls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create payroll')
        }
      }

      toast(editingPayroll ? 'Payroll updated' : 'Payroll created')
      mutate('/api/payrolls')
      setSheetOpen(false)
      resetForm()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (payroll: Payroll) => {
    if (!confirm(`Delete "${payroll.name}"? This will also delete all payroll runs.`)) return
    setDeletingId(payroll.id)
    try {
      const res = await fetch(`/api/payrolls/${payroll.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast('Payroll deleted')
      mutate('/api/payrolls')
    } catch {
      toast('Failed to delete payroll', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const addChecklistStep = () => {
    if (!newStepName.trim()) return
    setFormChecklist([...formChecklist, { name: newStepName.trim(), sort_order: formChecklist.length }])
    setNewStepName('')
  }

  const removeChecklistStep = (index: number) => {
    setFormChecklist(formChecklist.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i })))
  }

  // Filtered data
  const payrollList: Payroll[] = useMemo(() => {
    if (!payrolls) return []
    let filtered = payrolls as Payroll[]

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.clients?.name?.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [payrolls, debouncedSearch])

  // KPI counts
  const counts = useMemo(() => {
    const all = (payrolls || []) as Payroll[]
    return {
      total: all.length,
      weekly: all.filter((p) => p.pay_frequency === 'weekly').length,
      monthly: all.filter((p) => p.pay_frequency === 'monthly').length,
      other: all.filter((p) => p.pay_frequency && !['weekly', 'monthly'].includes(p.pay_frequency)).length,
    }
  }, [payrolls])

  // ── Skeleton ───────────────────────────────────────────────────────────────

  if (!mounted || isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
          <div className="h-9 w-36 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: `${colors.border}60` }} />
          ))}
        </div>
        <div className="h-96 rounded-xl animate-pulse" style={{ backgroundColor: `${colors.border}60` }} />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1
          className="text-xl md:text-2xl font-bold tracking-tight font-[family-name:var(--font-inter)]"
          style={{ color: colors.text.primary }}
        >
          Payrolls
        </h1>
        <Button
          onClick={openAdd}
          className="text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Payroll
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Payrolls', count: counts.total, icon: ClipboardCheck, color: colors.primary },
          { label: 'Weekly', count: counts.weekly, icon: CalendarDays, color: colors.success },
          { label: 'Monthly', count: counts.monthly, icon: CalendarDays, color: colors.accent },
          { label: 'Other', count: counts.other, icon: CalendarDays, color: colors.text.muted },
        ].map((kpi) => (
          <Card
            key={kpi.label}
            className="rounded-xl shadow-sm"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                    {kpi.count}
                  </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${kpi.color}12` }}>
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
        <Input
          placeholder="Search payrolls or clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-sm"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
        />
      </div>

      {/* Table */}
      {payrollList.length === 0 ? (
        <Card className="rounded-xl shadow-sm" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${colors.primary}12` }}>
              <ClipboardCheck className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-sm font-semibold mb-1 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              No payrolls found
            </h3>
            <p className="text-xs mb-4 font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              {debouncedSearch ? 'Try a different search term.' : 'Add a payroll to start managing pay runs.'}
            </p>
            {!debouncedSearch && (
              <Button
                onClick={openAdd}
                size="sm"
                className="text-white text-xs"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Payroll
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: colors.border }}>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Payroll Name</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Client</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden md:table-cell" style={{ color: colors.text.muted }}>Frequency</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden md:table-cell" style={{ color: colors.text.muted }}>Pay Day</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden lg:table-cell" style={{ color: colors.text.muted }}>PAYE Ref</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden lg:table-cell" style={{ color: colors.text.muted }}>Next Pay Date</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollList.map((payroll) => (
                <TableRow
                  key={payroll.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderColor: colors.border }}
                  onClick={() => openEdit(payroll)}
                >
                  <TableCell className="font-medium text-sm font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.primary}12` }}>
                        <ClipboardCheck className="w-4 h-4" style={{ color: colors.primary }} />
                      </div>
                      {payroll.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {payroll.clients?.name || '-'}
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell">
                    <Badge className="text-xs" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary, border: `1px solid ${colors.primary}30` }}>
                      {formatFrequency(payroll.pay_frequency)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {formatPayDay(payroll.pay_day)}
                  </TableCell>
                  <TableCell className="text-sm hidden lg:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {payroll.paye_reference || '-'}
                  </TableCell>
                  <TableCell className="text-sm hidden lg:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {payroll.latestRun ? formatDate(payroll.latestRun.pay_date) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View Runs"
                        onClick={() => router.push(`/dashboard/payrolls/runs?payroll=${payroll.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(payroll)}
                      >
                        <Edit className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={deletingId === payroll.id}
                        onClick={() => handleDelete(payroll)}
                      >
                        {deletingId === payroll.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: colors.text.muted }} />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" style={{ color: colors.error }} />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Sidebar */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm() }}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0" style={{ backgroundColor: colors.surface }}>
          <SheetHeader className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <SheetTitle className="text-lg font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              {editingPayroll ? 'Edit Payroll' : 'Add Payroll'}
            </SheetTitle>
            <SheetDescription className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              {editingPayroll ? 'Update the payroll configuration below.' : 'Set up a new payroll for a client.'}
            </SheetDescription>
          </SheetHeader>

          <div className="divide-y" style={{ borderColor: colors.border }}>
            {/* Payroll Details */}
            <FormSection title="Payroll Details" icon={FileText} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Payroll Name <span style={{ color: colors.error }}>*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Weekly Staff Payroll"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              {!editingPayroll && (
                <div>
                  <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                    Client <span style={{ color: colors.error }}>*</span>
                  </Label>
                  <Select value={formClientId} onValueChange={setFormClientId}>
                    <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </FormSection>

            {/* Pay Schedule */}
            <FormSection title="Pay Schedule" icon={CalendarDays} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Pay Frequency <span style={{ color: colors.error }}>*</span>
                </Label>
                <Select value={formPayFrequency} onValueChange={(v) => { setFormPayFrequency(v); setFormPayDay('') }}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue placeholder="Select frequency..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="two_weekly">Fortnightly</SelectItem>
                    <SelectItem value="four_weekly">4-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Pay Day <span style={{ color: colors.error }}>*</span>
                </Label>
                {formPayFrequency === 'annually' ? (
                  <Input
                    type="date"
                    value={formPayDay}
                    onChange={(e) => setFormPayDay(e.target.value)}
                    className="mt-1 text-sm"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                  />
                ) : payDayOptions.length > 0 ? (
                  <Select value={formPayDay} onValueChange={setFormPayDay}>
                    <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                      <SelectValue placeholder="Select pay day..." />
                    </SelectTrigger>
                    <SelectContent>
                      {payDayOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-xs" style={{ color: colors.text.muted }}>Select a frequency first</p>
                )}
              </div>
            </FormSection>

            {/* HMRC */}
            <FormSection title="HMRC" icon={Landmark} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>PAYE Reference</Label>
                <Input
                  value={formPayeReference}
                  onChange={(e) => setFormPayeReference(e.target.value)}
                  placeholder="e.g. 123/AB45678"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Accounts Office Reference</Label>
                <Input
                  value={formAccountsOfficeRef}
                  onChange={(e) => setFormAccountsOfficeRef(e.target.value)}
                  placeholder="e.g. 123PA00012345"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Payroll Software</Label>
                <Input
                  value={formPayrollSoftware}
                  onChange={(e) => setFormPayrollSoftware(e.target.value)}
                  placeholder="e.g. Sage, BrightPay"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="employment-allowance"
                  checked={formEmploymentAllowance}
                  onChange={(e) => setFormEmploymentAllowance(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="employment-allowance" className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Employment Allowance
                </Label>
              </div>
            </FormSection>

            {/* Pension */}
            <FormSection title="Pension" icon={Shield} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Pension Provider</Label>
                <Select value={formPensionProvider} onValueChange={setFormPensionProvider}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue placeholder="Select provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PENSION_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Pension Staging Date</Label>
                <Input
                  type="date"
                  value={formPensionStagingDate}
                  onChange={(e) => setFormPensionStagingDate(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Re-enrolment Date</Label>
                <Input
                  type="date"
                  value={formPensionReenrolmentDate}
                  onChange={(e) => setFormPensionReenrolmentDate(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Declaration of Compliance Deadline</Label>
                <Input
                  type="date"
                  value={formDocDeadline}
                  onChange={(e) => setFormDocDeadline(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
            </FormSection>

            {/* Checklist Template — only for new payrolls */}
            {!editingPayroll && (
              <FormSection title="Checklist Template" icon={ListChecks} defaultOpen={false} colors={colors}>
                <div className="space-y-2">
                  {formChecklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-5 text-center font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>{i + 1}</span>
                      <span className="flex-1 text-sm font-[family-name:var(--font-body)]" style={{ color: colors.text.primary }}>{item.name}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistStep(i)}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3 h-3" style={{ color: colors.error }} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={newStepName}
                    onChange={(e) => setNewStepName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistStep() } }}
                    placeholder="Add a step..."
                    className="text-sm flex-1"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                  />
                  <Button variant="outline" size="sm" onClick={addChecklistStep} disabled={!newStepName.trim()}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </FormSection>
            )}
          </div>

          {/* Save Button */}
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formPayFrequency || !formPayDay}
              className="w-full text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : editingPayroll ? 'Update Payroll' : 'Add Payroll'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
