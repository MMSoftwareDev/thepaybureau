'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

// CSV column mapping: header name -> field key
const COLUMN_MAP: Record<string, string> = {
  'company name': 'name',
  'name': 'name',
  'client name': 'name',
  'client': 'name',
  'paye reference': 'paye_reference',
  'paye ref': 'paye_reference',
  'paye': 'paye_reference',
  'accounts office ref': 'accounts_office_ref',
  'accounts office reference': 'accounts_office_ref',
  'ao ref': 'accounts_office_ref',
  'pay frequency': 'pay_frequency',
  'frequency': 'pay_frequency',
  'payroll frequency': 'pay_frequency',
  'pay day': 'pay_day',
  'payday': 'pay_day',
  'employee count': 'employee_count',
  'employees': 'employee_count',
  'no of employees': 'employee_count',
  'number of employees': 'employee_count',
  'contact name': 'contact_name',
  'contact': 'contact_name',
  'contact email': 'contact_email',
  'contact phone': 'contact_phone',
  'email': 'email',
  'company email': 'email',
  'phone': 'phone',
  'company phone': 'phone',
  'telephone': 'phone',
  'payroll software': 'payroll_software',
  'software': 'payroll_software',
  'pension provider': 'pension_provider',
  'pension': 'pension_provider',
  'notes': 'notes',
}

const PAY_FREQUENCY_MAP: Record<string, string> = {
  'weekly': 'weekly',
  'fortnightly': 'two_weekly',
  'two weekly': 'two_weekly',
  'two-weekly': 'two_weekly',
  'bi-weekly': 'two_weekly',
  'biweekly': 'two_weekly',
  '2 weekly': 'two_weekly',
  'four weekly': 'four_weekly',
  'four-weekly': 'four_weekly',
  '4 weekly': 'four_weekly',
  '4-weekly': 'four_weekly',
  'monthly': 'monthly',
  'quarterly': 'quarterly',
  'biannually': 'biannually',
  'annually': 'annually',
  'annual': 'annually',
  'yearly': 'annually',
}

const VALID_FREQUENCIES = ['weekly', 'two_weekly', 'four_weekly', 'monthly', 'quarterly', 'biannually', 'annually']

interface ParsedClient {
  name: string
  paye_reference?: string
  accounts_office_ref?: string
  pay_frequency: string
  pay_day?: string
  employee_count?: number | null
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  email?: string
  phone?: string
  payroll_software?: string
  pension_provider?: string
  notes?: string
}

interface RowValidation {
  row: number
  data: ParsedClient
  errors: string[]
  warnings: string[]
}

interface ImportResult {
  row: number
  name: string
  success: boolean
  error?: string
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)

  return { headers, rows }
}

function mapHeaders(headers: string[]): { fieldIndex: Map<string, number>; unmapped: string[] } {
  const fieldIndex = new Map<string, number>()
  const unmapped: string[] = []

  headers.forEach((header, idx) => {
    const normalised = header.toLowerCase().trim()
    const field = COLUMN_MAP[normalised]
    if (field && !fieldIndex.has(field)) {
      fieldIndex.set(field, idx)
    } else if (!field) {
      unmapped.push(header)
    }
  })

  return { fieldIndex, unmapped }
}

function validateRow(data: ParsedClient, rowNum: number): RowValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Company name is required')
  }

  if (data.pay_frequency && !VALID_FREQUENCIES.includes(data.pay_frequency)) {
    errors.push(`Invalid pay frequency: "${data.pay_frequency}"`)
  }

  if (data.contact_email && data.contact_email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.contact_email)) {
      warnings.push('Contact email may be invalid')
    }
  }

  if (data.email && data.email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      warnings.push('Company email may be invalid')
    }
  }

  if (!data.pay_frequency) {
    warnings.push('No pay frequency — will default to Monthly')
  }

  return { row: rowNum, data, errors, warnings }
}

export default function ImportClientsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const colors = getThemeColors(isDark)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState<string | null>(null)
  const [validated, setValidated] = useState<RowValidation[]>([])
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null)

  const totalErrors = validated.filter((r) => r.errors.length > 0).length
  const totalWarnings = validated.filter((r) => r.warnings.length > 0 && r.errors.length === 0).length
  const validCount = validated.filter((r) => r.errors.length === 0).length

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast('Please select a CSV file', 'error')
      return
    }

    setFileName(file.name)
    setImportResults(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const { headers, rows } = parseCSV(text)

      if (headers.length === 0 || rows.length === 0) {
        toast('CSV file is empty or has no data rows', 'error')
        return
      }

      const { fieldIndex, unmapped } = mapHeaders(headers)
      setUnmappedColumns(unmapped)

      if (!fieldIndex.has('name')) {
        toast('CSV must have a "Name" or "Company Name" column', 'error')
        return
      }

      const parsedRows: RowValidation[] = rows
        .filter((row) => row.some((cell) => cell.trim()))
        .map((row, idx) => {
          const getValue = (field: string) => {
            const colIdx = fieldIndex.get(field)
            return colIdx !== undefined ? row[colIdx]?.trim() || '' : ''
          }

          const empCount = getValue('employee_count')

          const data: ParsedClient = {
            name: getValue('name'),
            paye_reference: getValue('paye_reference'),
            accounts_office_ref: getValue('accounts_office_ref'),
            pay_frequency: PAY_FREQUENCY_MAP[getValue('pay_frequency').toLowerCase()] || getValue('pay_frequency').toLowerCase() || 'monthly',
            pay_day: getValue('pay_day') || 'last_day_of_month',
            employee_count: empCount ? parseInt(empCount, 10) || null : null,
            contact_name: getValue('contact_name'),
            contact_email: getValue('contact_email'),
            contact_phone: getValue('contact_phone'),
            email: getValue('email'),
            phone: getValue('phone'),
            payroll_software: getValue('payroll_software'),
            pension_provider: getValue('pension_provider'),
            notes: getValue('notes'),
          }

          return validateRow(data, idx + 1)
        })

      setValidated(parsedRows)
    }
    reader.readAsText(file)
  }, [toast])

  const handleRemoveRow = (rowIdx: number) => {
    setValidated((prev) => prev.filter((_, i) => i !== rowIdx))
  }

  const handleImport = async () => {
    const validRows = validated.filter((r) => r.errors.length === 0)
    if (validRows.length === 0) {
      toast('No valid rows to import', 'error')
      return
    }

    setImporting(true)
    try {
      const res = await fetch('/api/clients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clients: validRows.map((r) => r.data),
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast(result.error || 'Import failed', 'error')
        return
      }

      setImportResults(result.results)
      toast(`Imported ${result.successful} of ${result.total} clients`, result.failed > 0 ? 'error' : 'success')
    } catch {
      toast('An unexpected error occurred', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const headers = [
      'Company Name',
      'PAYE Reference',
      'Accounts Office Ref',
      'Pay Frequency',
      'Pay Day',
      'Employee Count',
      'Contact Name',
      'Contact Email',
      'Contact Phone',
      'Email',
      'Phone',
      'Payroll Software',
      'Pension Provider',
      'Notes',
    ]
    const example = [
      'Acme Ltd',
      '123/AB456',
      '123PA00012345',
      'Monthly',
      'last_day_of_month',
      '25',
      'John Smith',
      'john@acme.co.uk',
      '01onal 123456',
      'payroll@acme.co.uk',
      '01onal 654321',
      'Sage',
      'NEST',
      'Key client',
    ]
    const csv = [headers.join(','), example.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'client_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const isComplete = importResults !== null

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/clients')}
          style={{ color: colors.text.muted }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
            Import Clients from CSV
          </h1>
          <p className="text-[0.82rem] mt-0.5" style={{ color: colors.text.muted }}>
            Bulk add clients by uploading a CSV file. Each client gets the default checklist and first payroll run.
          </p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {!isComplete && (
        <Card
          className="border-0"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px' }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2" style={{ color: colors.text.primary }}>
              <Upload className="w-4 h-4" />
              {validated.length > 0 ? 'File Loaded' : 'Upload CSV File'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="text-[0.85rem]"
                style={{ borderColor: colors.border, color: colors.text.primary }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {fileName ? 'Change File' : 'Choose CSV File'}
              </Button>
              {fileName && (
                <span className="text-[0.82rem]" style={{ color: colors.text.muted }}>
                  {fileName}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadTemplate}
                className="text-[0.82rem] ml-auto"
                style={{ color: colors.primary }}
              >
                <Download className="w-4 h-4 mr-1" />
                Download Template
              </Button>
            </div>

            {unmappedColumns.length > 0 && (
              <div
                className="text-[0.8rem] rounded-lg p-3"
                style={{ backgroundColor: isDark ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.08)', color: colors.text.muted }}
              >
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 text-yellow-500" />
                Ignored columns: {unmappedColumns.join(', ')}
              </div>
            )}

            <div className="text-[0.78rem] space-y-1" style={{ color: colors.text.muted }}>
              <p><strong>Required column:</strong> Company Name (or Name, Client Name, Client)</p>
              <p><strong>Optional columns:</strong> PAYE Reference, Accounts Office Ref, Pay Frequency, Pay Day, Employee Count, Contact Name, Contact Email, Contact Phone, Email, Phone, Payroll Software, Pension Provider, Notes</p>
              <p><strong>Pay Frequency values:</strong> Weekly, Fortnightly, Two Weekly, Four Weekly, Monthly, Quarterly, Annually</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview & Validate */}
      {validated.length > 0 && !isComplete && (
        <>
          {/* Stats bar */}
          <div className="flex flex-wrap gap-3">
            <Badge
              className="text-[0.8rem] px-3 py-1.5"
              style={{
                backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                color: isDark ? '#6ee7b7' : '#059669',
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              {validCount} valid
            </Badge>
            {totalWarnings > 0 && (
              <Badge
                className="text-[0.8rem] px-3 py-1.5"
                style={{
                  backgroundColor: isDark ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.1)',
                  color: isDark ? '#fde68a' : '#b45309',
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                {totalWarnings} warnings
              </Badge>
            )}
            {totalErrors > 0 && (
              <Badge
                className="text-[0.8rem] px-3 py-1.5"
                style={{
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                  color: isDark ? '#fca5a5' : '#dc2626',
                }}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                {totalErrors} errors (will be skipped)
              </Badge>
            )}
          </div>

          {/* Preview table */}
          <Card
            className="border-0 overflow-hidden"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px' }}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: colors.border }}>
                    <TableHead className="w-12 text-[0.78rem]" style={{ color: colors.text.muted }}>Row</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Status</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Company Name</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>PAYE Ref</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Frequency</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Employees</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Contact</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Issues</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validated.map((row, idx) => {
                    const hasErrors = row.errors.length > 0
                    const hasWarnings = row.warnings.length > 0

                    return (
                      <TableRow
                        key={idx}
                        style={{
                          borderColor: colors.border,
                          opacity: hasErrors ? 0.5 : 1,
                        }}
                      >
                        <TableCell className="text-[0.82rem] font-mono" style={{ color: colors.text.muted }}>
                          {row.row}
                        </TableCell>
                        <TableCell>
                          {hasErrors ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : hasWarnings ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-[0.82rem] font-medium" style={{ color: colors.text.primary }}>
                          {row.data.name || <span className="italic text-red-400">Missing</span>}
                        </TableCell>
                        <TableCell className="text-[0.82rem]" style={{ color: colors.text.secondary }}>
                          {row.data.paye_reference || '-'}
                        </TableCell>
                        <TableCell className="text-[0.82rem]" style={{ color: colors.text.secondary }}>
                          {row.data.pay_frequency}
                        </TableCell>
                        <TableCell className="text-[0.82rem]" style={{ color: colors.text.secondary }}>
                          {row.data.employee_count || '-'}
                        </TableCell>
                        <TableCell className="text-[0.82rem]" style={{ color: colors.text.secondary }}>
                          {row.data.contact_name || '-'}
                        </TableCell>
                        <TableCell className="text-[0.78rem] max-w-[200px]">
                          {hasErrors && (
                            <span className="text-red-500">{row.errors.join('; ')}</span>
                          )}
                          {hasWarnings && !hasErrors && (
                            <span className="text-yellow-600 dark:text-yellow-400">{row.warnings.join('; ')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRow(idx)}
                            className="h-7 w-7 p-0"
                            style={{ color: colors.text.muted }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Import button */}
          <div className="flex items-center justify-between">
            <p className="text-[0.82rem]" style={{ color: colors.text.muted }}>
              {validCount} client{validCount !== 1 ? 's' : ''} will be imported
              {totalErrors > 0 ? `, ${totalErrors} skipped due to errors` : ''}.
              Each will get the default checklist and first payroll run.
            </p>
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="text-white font-semibold py-2 px-6 rounded-lg border-0 text-[0.85rem]"
              style={{
                background: validCount > 0
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  : undefined,
              }}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {validCount} Client{validCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Results */}
      {isComplete && importResults && (
        <Card
          className="border-0"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px' }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2" style={{ color: colors.text.primary }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge
                className="text-[0.82rem] px-3 py-1.5"
                style={{
                  backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                  color: isDark ? '#6ee7b7' : '#059669',
                }}
              >
                {importResults.filter((r) => r.success).length} imported successfully
              </Badge>
              {importResults.some((r) => !r.success) && (
                <Badge
                  className="text-[0.82rem] px-3 py-1.5"
                  style={{
                    backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                    color: isDark ? '#fca5a5' : '#dc2626',
                  }}
                >
                  {importResults.filter((r) => !r.success).length} failed
                </Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: colors.border }}>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Row</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Client</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Status</TableHead>
                    <TableHead className="text-[0.78rem]" style={{ color: colors.text.muted }}>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((result, idx) => (
                    <TableRow key={idx} style={{ borderColor: colors.border }}>
                      <TableCell className="text-[0.82rem] font-mono" style={{ color: colors.text.muted }}>
                        {result.row}
                      </TableCell>
                      <TableCell className="text-[0.82rem] font-medium" style={{ color: colors.text.primary }}>
                        {result.name}
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[0.78rem]">
                            Imported
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[0.78rem]">
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[0.78rem]" style={{ color: result.success ? colors.text.muted : undefined }}>
                        {result.success ? 'Created with default checklist & first payroll run' : result.error}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setValidated([])
                  setFileName(null)
                  setImportResults(null)
                  setUnmappedColumns([])
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-[0.85rem]"
                style={{ borderColor: colors.border, color: colors.text.primary }}
              >
                Import More
              </Button>
              <Button
                onClick={() => router.push('/dashboard/clients')}
                className="text-white font-semibold px-5 rounded-lg border-0 text-[0.85rem]"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                View Clients
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
