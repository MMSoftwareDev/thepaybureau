// src/app/api/training/export-pdf/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { hasPaidFeature } from '@/lib/stripe'
import jsPDF from 'jspdf'

const CATEGORY_LABELS: Record<string, string> = {
  hmrc_webinar: 'HMRC Webinar',
  cipp_webinar: 'CIPP Webinar',
  online_course: 'Online Course',
  conference: 'Conference',
  workshop: 'Workshop',
  self_study: 'Self Study',
  other: 'Other',
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface TrainingRecord {
  id: string
  title: string
  provider: string | null
  category: string | null
  cpd_hours: number | null
  status: string
  completed_date: string | null
  expiry_date: string | null
  certificate_url: string | null
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`training-export-pdf:${ip}`, { limit: 5, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id, name, title')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check plan access
    const { data: tenant } = await supabase.from('tenants').select('plan, name').eq('id', user.tenant_id).single()
    if (!hasPaidFeature(tenant?.plan)) {
      return NextResponse.json({ error: 'Training & CPD requires an Unlimited plan.' }, { status: 403 })
    }

    const { data: records, error } = await supabase
      .from('training_records')
      .select('id, title, provider, category, cpd_hours, status, completed_date, expiry_date, certificate_url, created_at')
      .eq('tenant_id', user.tenant_id)
      .eq('created_by', authUser.id)
      .order('completed_date', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Database error in training PDF export:', error)
      return NextResponse.json({ error: 'Failed to export training data' }, { status: 400 })
    }

    const allRecords = (records || []) as TrainingRecord[]
    const pdf = generateCPDReport(allRecords, {
      userName: user.name || authUser.email || 'Unknown',
      userTitle: user.title || null,
      companyName: tenant?.name || 'The Pay Bureau',
    })

    const pdfBuffer = Buffer.from(pdf)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cpd-record-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Unexpected error in training PDF export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateCPDReport(
  records: TrainingRecord[],
  info: { userName: string; userTitle: string | null; companyName: string }
): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // ── Brand colors ──
  const purple = { r: 64, g: 29, b: 108 }   // #401D6C
  const darkText = { r: 26, g: 18, b: 37 }   // #1A1225
  const mutedText = { r: 142, g: 132, b: 154 } // #8E849A
  const lightBg = { r: 250, g: 247, b: 255 }  // #FAF7FF

  // ── Helper: add page if needed ──
  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = margin
    }
  }

  // ── Header ──
  doc.setFillColor(purple.r, purple.g, purple.b)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('CPD Record', margin, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${info.userName}${info.userTitle ? ` — ${info.userTitle}` : ''}`, margin, 26)
  doc.text(info.companyName, margin, 32)

  const today = new Date()
  const yearStart = new Date(today.getFullYear(), 0, 1)
  const dateRange = `${formatDate(yearStart.toISOString())} — ${formatDate(today.toISOString())}`
  doc.text(dateRange, pageWidth - margin, 18, { align: 'right' })
  doc.text(`Generated ${formatDate(today.toISOString())}`, pageWidth - margin, 26, { align: 'right' })

  y = 50

  // ── Summary stats ──
  const completedRecords = records.filter(r => r.status === 'completed')
  const inProgressRecords = records.filter(r => r.status === 'in_progress')
  const thisYear = records.filter(r => {
    if (!r.completed_date) return false
    return new Date(r.completed_date).getFullYear() === today.getFullYear()
  })
  const totalHoursThisYear = thisYear.reduce((sum, r) => sum + (r.cpd_hours || 0), 0)
  const totalHoursAllTime = records.reduce((sum, r) => sum + (r.cpd_hours || 0), 0)

  const expiredCount = records.filter(r => {
    if (!r.expiry_date) return false
    return new Date(r.expiry_date) < today
  }).length

  const expiringSoonCount = records.filter(r => {
    if (!r.expiry_date) return false
    const exp = new Date(r.expiry_date)
    const in90 = new Date(today)
    in90.setDate(in90.getDate() + 90)
    return exp >= today && exp <= in90
  }).length

  // Summary box
  doc.setFillColor(lightBg.r, lightBg.g, lightBg.b)
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F')

  const statWidth = contentWidth / 4
  const stats = [
    { label: 'Total Records', value: String(records.length) },
    { label: 'Completed', value: String(completedRecords.length) },
    { label: 'CPD Hours (Year)', value: totalHoursThisYear.toFixed(1) },
    { label: 'CPD Hours (All)', value: totalHoursAllTime.toFixed(1) },
  ]

  stats.forEach((stat, i) => {
    const x = margin + statWidth * i + statWidth / 2
    doc.setTextColor(purple.r, purple.g, purple.b)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x, y + 12, { align: 'center' })
    doc.setTextColor(mutedText.r, mutedText.g, mutedText.b)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x, y + 18, { align: 'center' })
  })

  y += 33

  // Status line
  doc.setFontSize(9)
  if (expiredCount > 0) {
    doc.setTextColor(217, 48, 37) // error red
    doc.text(`⚠ ${expiredCount} expired certification${expiredCount > 1 ? 's' : ''}`, margin, y)
    y += 5
  }
  if (expiringSoonCount > 0) {
    doc.setTextColor(217, 119, 6) // amber
    doc.text(`${expiringSoonCount} certification${expiringSoonCount > 1 ? 's' : ''} expiring within 90 days`, margin, y)
    y += 5
  }
  if (inProgressRecords.length > 0) {
    doc.setTextColor(purple.r, purple.g, purple.b)
    doc.text(`${inProgressRecords.length} training${inProgressRecords.length > 1 ? 's' : ''} in progress`, margin, y)
    y += 5
  }

  y += 5

  // ── Category breakdown ──
  const categoryCounts = new Map<string, { count: number; hours: number }>()
  for (const r of records) {
    const cat = r.category || 'other'
    const existing = categoryCounts.get(cat) || { count: 0, hours: 0 }
    existing.count++
    existing.hours += r.cpd_hours || 0
    categoryCounts.set(cat, existing)
  }

  if (categoryCounts.size > 0) {
    checkPage(20)
    doc.setTextColor(darkText.r, darkText.g, darkText.b)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('By Category', margin, y)
    y += 6

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    for (const [cat, data] of categoryCounts) {
      doc.setTextColor(mutedText.r, mutedText.g, mutedText.b)
      doc.text(`${CATEGORY_LABELS[cat] || cat}: ${data.count} record${data.count > 1 ? 's' : ''}, ${data.hours.toFixed(1)} hrs`, margin + 2, y)
      y += 4.5
    }
    y += 5
  }

  // ── Training records table ──
  checkPage(30)
  doc.setTextColor(darkText.r, darkText.g, darkText.b)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Training Records', margin, y)
  y += 7

  // Table header
  const colWidths = [60, 30, 30, 18, 22, 20]
  const colHeaders = ['Title', 'Provider', 'Category', 'Hours', 'Completed', 'Status']

  doc.setFillColor(purple.r, purple.g, purple.b)
  doc.rect(margin, y - 4, contentWidth, 7, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  let colX = margin + 2
  colHeaders.forEach((h, i) => {
    doc.text(h, colX, y)
    colX += colWidths[i]
  })
  y += 6

  // Table rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)

  for (const record of records) {
    checkPage(8)

    // Alternating row background
    const rowIdx = records.indexOf(record)
    if (rowIdx % 2 === 0) {
      doc.setFillColor(lightBg.r, lightBg.g, lightBg.b)
      doc.rect(margin, y - 3.5, contentWidth, 6, 'F')
    }

    doc.setTextColor(darkText.r, darkText.g, darkText.b)
    colX = margin + 2

    // Title (truncate to fit)
    const title = record.title.length > 40 ? record.title.substring(0, 37) + '...' : record.title
    doc.text(title, colX, y)
    colX += colWidths[0]

    // Provider
    const provider = (record.provider || '-').substring(0, 20)
    doc.text(provider, colX, y)
    colX += colWidths[1]

    // Category
    doc.text(CATEGORY_LABELS[record.category || ''] || '-', colX, y)
    colX += colWidths[2]

    // CPD Hours
    doc.text(record.cpd_hours ? record.cpd_hours.toFixed(1) : '-', colX, y)
    colX += colWidths[3]

    // Completed date
    doc.text(record.completed_date ? formatDate(record.completed_date) : '-', colX, y)
    colX += colWidths[4]

    // Status
    const statusLabel = STATUS_LABELS[record.status] || record.status
    if (record.status === 'completed') {
      doc.setTextColor(24, 128, 56) // green
    } else if (record.status === 'in_progress') {
      doc.setTextColor(purple.r, purple.g, purple.b)
    } else {
      doc.setTextColor(mutedText.r, mutedText.g, mutedText.b)
    }
    doc.text(statusLabel, colX, y)

    y += 6
  }

  if (records.length === 0) {
    doc.setTextColor(mutedText.r, mutedText.g, mutedText.b)
    doc.setFontSize(9)
    doc.text('No training records found.', margin + 2, y + 5)
    y += 15
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.getHeight()
    doc.setTextColor(mutedText.r, mutedText.g, mutedText.b)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Generated from The Pay Bureau — thepaybureau.com', margin, pageH - 8)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageH - 8, { align: 'right' })

    // Thin line above footer
    doc.setDrawColor(232, 226, 240) // --login-border light
    doc.setLineWidth(0.3)
    doc.line(margin, pageH - 12, pageWidth - margin, pageH - 12)
  }

  return doc.output('arraybuffer')
}
