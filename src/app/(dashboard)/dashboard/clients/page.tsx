'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useClients } from '@/lib/swr'
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
import { Textarea } from '@/components/ui/textarea'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Building2,
  UserCheck,
  UserX,
  UserPlus,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { mutate } from 'swr'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  company_number?: string | null
  email?: string | null
  phone?: string | null
  address?: { street?: string; city?: string; postcode?: string } | null
  industry?: string | null
  employee_count?: number | null
  status: string
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  notes?: string | null
  created_at: string
}

type StatusFilter = 'all' | 'active' | 'prospect' | 'inactive'

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

export default function ClientsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Data
  const { data: clients, isLoading } = useClients()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Sidebar state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formCompanyNumber, setFormCompanyNumber] = useState('')
  const [formIndustry, setFormIndustry] = useState('')
  const [formEmployeeCount, setFormEmployeeCount] = useState('')
  const [formStatus, setFormStatus] = useState('active')
  const [formStreet, setFormStreet] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formPostcode, setFormPostcode] = useState('')
  const [formContactName, setFormContactName] = useState('')
  const [formContactEmail, setFormContactEmail] = useState('')
  const [formContactPhone, setFormContactPhone] = useState('')
  const [formNotes, setFormNotes] = useState('')

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormName('')
    setFormCompanyNumber('')
    setFormIndustry('')
    setFormEmployeeCount('')
    setFormStatus('active')
    setFormStreet('')
    setFormCity('')
    setFormPostcode('')
    setFormContactName('')
    setFormContactEmail('')
    setFormContactPhone('')
    setFormNotes('')
    setEditingClient(null)
  }, [])

  const openAdd = useCallback(() => {
    resetForm()
    setSheetOpen(true)
  }, [resetForm])

  const openEdit = useCallback((client: Client) => {
    setEditingClient(client)
    setFormName(client.name || '')
    setFormCompanyNumber(client.company_number || '')
    setFormIndustry(client.industry || '')
    setFormEmployeeCount(client.employee_count?.toString() || '')
    setFormStatus(client.status || 'active')
    const addr = client.address as { street?: string; city?: string; postcode?: string } | null
    setFormStreet(addr?.street || '')
    setFormCity(addr?.city || '')
    setFormPostcode(addr?.postcode || '')
    setFormContactName(client.contact_name || '')
    setFormContactEmail(client.contact_email || '')
    setFormContactPhone(client.contact_phone || '')
    setFormNotes(client.notes || '')
    setSheetOpen(true)
  }, [])

  const handleSave = async () => {
    if (!formName.trim()) {
      toast('Company name is required', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        company_number: formCompanyNumber.trim() || undefined,
        industry: formIndustry.trim() || undefined,
        employee_count: formEmployeeCount ? parseInt(formEmployeeCount) : undefined,
        status: formStatus,
        address: (formStreet || formCity || formPostcode) ? {
          street: formStreet.trim() || undefined,
          city: formCity.trim() || undefined,
          postcode: formPostcode.trim() || undefined,
        } : undefined,
        contact_name: formContactName.trim() || undefined,
        contact_email: formContactEmail.trim() || undefined,
        contact_phone: formContactPhone.trim() || undefined,
        notes: formNotes.trim() || undefined,
      }

      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save client')
      }

      toast(editingClient ? 'Client updated' : 'Client created')
      mutate('/api/clients')
      setSheetOpen(false)
      resetForm()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (client: Client) => {
    if (!confirm(`Delete "${client.name}"? This will also delete all their payrolls and payroll runs.`)) return
    setDeletingId(client.id)
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast('Client deleted')
      mutate('/api/clients')
    } catch {
      toast('Failed to delete client', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered data
  const clientList: Client[] = useMemo(() => {
    if (!clients) return []
    let filtered = clients as Client[]

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.contact_email?.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [clients, statusFilter, debouncedSearch])

  // KPI counts
  const counts = useMemo(() => {
    const all = (clients || []) as Client[]
    return {
      total: all.length,
      active: all.filter((c) => c.status === 'active').length,
      prospect: all.filter((c) => c.status === 'prospect').length,
      inactive: all.filter((c) => c.status === 'inactive').length,
    }
  }, [clients])

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.success}20`, color: colors.success, border: `1px solid ${colors.success}40` }}>Active</Badge>
      case 'prospect':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.accent}20`, color: colors.accent, border: `1px solid ${colors.accent}40` }}>Prospect</Badge>
      case 'inactive':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.text.muted}20`, color: colors.text.muted, border: `1px solid ${colors.text.muted}40` }}>Inactive</Badge>
      default:
        return <Badge className="text-xs">{status}</Badge>
    }
  }

  // ── Skeleton ───────────────────────────────────────────────────────────────

  if (!mounted || isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: `${colors.border}` }} />
          <div className="h-9 w-32 rounded-lg animate-pulse" style={{ backgroundColor: `${colors.border}` }} />
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
          Clients
        </h1>
        <Button
          onClick={openAdd}
          className="text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Client
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Clients', count: counts.total, icon: Users, color: colors.primary },
          { label: 'Active', count: counts.active, icon: UserCheck, color: colors.success },
          { label: 'Prospect', count: counts.prospect, icon: UserPlus, color: colors.accent },
          { label: 'Inactive', count: counts.inactive, icon: UserX, color: colors.text.muted },
        ].map((kpi) => (
          <Card
            key={kpi.label}
            className="rounded-xl shadow-sm cursor-pointer transition-colors"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${statusFilter === kpi.label.toLowerCase().replace('total clients', 'all') ? kpi.color : colors.border}`,
            }}
            onClick={() => {
              const filter = kpi.label === 'Total Clients' ? 'all' : kpi.label.toLowerCase() as StatusFilter
              setStatusFilter(filter === statusFilter ? 'all' : filter)
            }}
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
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-sm"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
        />
      </div>

      {/* Table */}
      {clientList.length === 0 ? (
        <Card className="rounded-xl shadow-sm" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${colors.primary}12` }}>
              <Users className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-sm font-semibold mb-1 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              No clients found
            </h3>
            <p className="text-xs mb-4 font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              {debouncedSearch ? 'Try a different search term.' : 'Add your first client to get started.'}
            </p>
            {!debouncedSearch && (
              <Button
                onClick={openAdd}
                size="sm"
                className="text-white text-xs"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: colors.border }}>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Client Name</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden md:table-cell" style={{ color: colors.text.muted }}>Status</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden lg:table-cell" style={{ color: colors.text.muted }}>Contact</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden lg:table-cell" style={{ color: colors.text.muted }}>Email</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden xl:table-cell" style={{ color: colors.text.muted }}>Phone</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden xl:table-cell" style={{ color: colors.text.muted }}>Employees</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientList.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderColor: colors.border }}
                  onClick={() => openEdit(client)}
                >
                  <TableCell className="font-medium text-sm font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.primary}12` }}>
                        <Building2 className="w-4 h-4" style={{ color: colors.primary }} />
                      </div>
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {statusBadge(client.status)}
                  </TableCell>
                  <TableCell className="text-sm hidden lg:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.contact_name || '-'}
                  </TableCell>
                  <TableCell className="text-sm hidden lg:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.contact_email || '-'}
                  </TableCell>
                  <TableCell className="text-sm hidden xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.contact_phone || '-'}
                  </TableCell>
                  <TableCell className="text-sm hidden xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.employee_count || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(client)}
                      >
                        <Edit className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={deletingId === client.id}
                        onClick={() => handleDelete(client)}
                      >
                        {deletingId === client.id ? (
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
              {editingClient ? 'Edit Client' : 'Add Client'}
            </SheetTitle>
            <SheetDescription className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              {editingClient ? 'Update the client details below.' : 'Fill in the details to add a new client.'}
            </SheetDescription>
          </SheetHeader>

          <div className="divide-y" style={{ borderColor: colors.border }}>
            {/* Company Details */}
            <FormSection title="Company Details" icon={Building2} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Company Name <span style={{ color: colors.error }}>*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Acme Ltd"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Company Number</Label>
                <Input
                  value={formCompanyNumber}
                  onChange={(e) => setFormCompanyNumber(e.target.value)}
                  placeholder="e.g. 12345678"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Industry</Label>
                <Input
                  value={formIndustry}
                  onChange={(e) => setFormIndustry(e.target.value)}
                  placeholder="e.g. Construction"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Employee Count</Label>
                <Input
                  type="number"
                  value={formEmployeeCount}
                  onChange={(e) => setFormEmployeeCount(e.target.value)}
                  placeholder="e.g. 25"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormSection>

            {/* Address */}
            <FormSection title="Address" icon={MapPin} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Street</Label>
                <Input
                  value={formStreet}
                  onChange={(e) => setFormStreet(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>City</Label>
                <Input
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Postcode</Label>
                <Input
                  value={formPostcode}
                  onChange={(e) => setFormPostcode(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
            </FormSection>

            {/* Contact */}
            <FormSection title="Contact" icon={Phone} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Contact Name</Label>
                <Input
                  value={formContactName}
                  onChange={(e) => setFormContactName(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Contact Email</Label>
                <Input
                  type="email"
                  value={formContactEmail}
                  onChange={(e) => setFormContactEmail(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Contact Phone</Label>
                <Input
                  value={formContactPhone}
                  onChange={(e) => setFormContactPhone(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Notes</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="mt-1 text-sm resize-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
            </FormSection>
          </div>

          {/* Save Button */}
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="w-full text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
