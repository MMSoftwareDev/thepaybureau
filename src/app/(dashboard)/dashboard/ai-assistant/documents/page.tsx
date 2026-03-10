'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText, Plus, Trash2, RefreshCw, ArrowLeft, Upload, AlertCircle, CheckCircle2, Clock, Loader2, X,
  Globe, Download, BookOpen,
} from 'lucide-react'
import Link from 'next/link'

interface ScrapeStatus {
  total_seed_urls?: number
  scraped_count: number
  ready: number
  processing: number
  errors: number
  last_scrape: string | null
}

interface ManualScrapeStatus {
  total_manuals: number
  manuals: {
    slug: string
    title: string
    scraped_count: number
    ready: number
    errors: number
    last_scrape: string | null
  }[]
  scraped_count: number
  ready: number
  processing: number
  errors: number
  last_scrape: string | null
}

interface AIDocument {
  id: string
  title: string
  source_url: string | null
  category: string | null
  status: 'pending' | 'processing' | 'ready' | 'error'
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

type TabKey = 'guidance' | 'manuals'

const CATEGORIES = [
  { value: '', label: 'Select category...' },
  { value: 'paye', label: 'PAYE' },
  { value: 'nic', label: 'National Insurance' },
  { value: 'statutory_pay', label: 'Statutory Pay' },
  { value: 'pensions', label: 'Pensions' },
  { value: 'rti', label: 'RTI' },
  { value: 'expenses', label: 'Expenses & Benefits' },
  { value: 'general', label: 'General' },
]

function StatusBadge({ status }: { status: AIDocument['status'] }) {
  switch (status) {
    case 'ready':
      return (
        <Badge variant="default" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
          <CheckCircle2 className="w-3 h-3" /> Ready
        </Badge>
      )
    case 'processing':
      return (
        <Badge variant="default" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Processing
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" /> Error
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" /> Pending
        </Badge>
      )
  }
}

function ScrapeResultMessage({
  message,
  errors,
  isDark,
}: {
  message: string
  errors: { url: string; error: string }[]
  isDark: boolean
}) {
  const [showErrors, setShowErrors] = useState(false)
  const isError = message.startsWith('Error')

  return (
    <>
      <div
        className="flex items-center gap-2 p-2.5 rounded-md text-[0.78rem] mb-3"
        style={{
          background: isError
            ? isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)'
            : isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.05)',
          border: `1px solid ${isError ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
          color: isError
            ? isDark ? '#fca5a5' : '#dc2626'
            : isDark ? '#86efac' : '#16a34a',
        }}
      >
        {isError ? (
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span className="flex-1">{message}</span>
        {errors.length > 0 && (
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="text-[0.7rem] underline opacity-70 hover:opacity-100 ml-2 flex-shrink-0"
          >
            {showErrors ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>

      {showErrors && errors.length > 0 && (
        <div
          className="p-2.5 rounded-md text-[0.72rem] mb-3 max-h-60 overflow-y-auto space-y-1.5"
          style={{
            background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.03)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: isDark ? '#fca5a5' : '#dc2626',
          }}
        >
          {errors.map((err, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-mono opacity-60 flex-shrink-0">{new URL(err.url).pathname}</span>
              <span className="opacity-80">{err.error}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function AIDocumentsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [activeTab, setActiveTab] = useState<TabKey>('guidance')
  const [documents, setDocuments] = useState<AIDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Guidance scraper state
  const [guidanceStatus, setGuidanceStatus] = useState<ScrapeStatus | null>(null)
  const [guidanceScraping, setGuidanceScraping] = useState(false)
  const [guidanceMessage, setGuidanceMessage] = useState<string | null>(null)
  const [guidanceErrors, setGuidanceErrors] = useState<{ url: string; error: string }[]>([])

  // Manual scraper state (per-manual)
  const [manualStatus, setManualStatus] = useState<ManualScrapeStatus | null>(null)
  const [manualScraping, setManualScraping] = useState<string | null>(null) // slug of manual being scraped
  const [manualMessages, setManualMessages] = useState<Record<string, string>>({})
  const [manualErrors, setManualErrors] = useState<Record<string, { url: string; error: string }[]>>({})

  const fetchDocuments = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/ai-assistant/documents')
      if (!res.ok) {
        if (res.status === 401) {
          setError('You must be a platform admin to manage AI documents.')
          return
        }
        throw new Error('Failed to fetch documents')
      }
      const data = await safeJson(res)
      setDocuments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  // Safe helper to parse JSON from our API routes — if the server crashes or
  // times out, the response may be HTML rather than JSON.
  const safeJson = async (res: Response) => {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      const preview = text.length > 200 ? text.slice(0, 200) + '...' : text
      throw new Error(
        res.ok
          ? `Server returned non-JSON response: ${preview}`
          : `Server error (${res.status}): ${preview}`
      )
    }
  }

  const fetchStatuses = useCallback(async () => {
    try {
      const [guidanceRes, manualRes] = await Promise.all([
        fetch('/api/ai-assistant/documents/scrape'),
        fetch('/api/ai-assistant/documents/scrape-manuals'),
      ])
      if (guidanceRes.ok) setGuidanceStatus(await safeJson(guidanceRes))
      if (manualRes.ok) setManualStatus(await safeJson(manualRes))
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
    fetchStatuses()
  }, [fetchDocuments, fetchStatuses])

  const handleScrapeGuidance = async () => {
    if (!confirm('This will scrape ~38 HMRC guidance pages from gov.uk, process them into chunks, and generate embeddings. This may take a few minutes. Continue?')) return

    setGuidanceScraping(true)
    setGuidanceMessage(null)
    setGuidanceErrors([])
    try {
      const res = await fetch('/api/ai-assistant/documents/scrape', { method: 'POST' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Scrape failed')

      setGuidanceMessage(
        `Scrape complete: ${data.new} new, ${data.updated} updated, ${data.unchanged} unchanged` +
        (data.errors?.length ? `, ${data.errors.length} errors` : '')
      )
      if (data.errors?.length) setGuidanceErrors(data.errors)
      fetchDocuments()
      fetchStatuses()
    } catch (err) {
      setGuidanceMessage(`Error: ${err instanceof Error ? err.message : 'Scrape failed'}`)
    } finally {
      setGuidanceScraping(false)
    }
  }

  const handleScrapeManual = async (slug: string, title: string) => {
    if (!confirm(`This will smart-crawl the ${title}, filtering for payroll-relevant sections. This may take a few minutes. Continue?`)) return

    setManualScraping(slug)
    setManualMessages(prev => ({ ...prev, [slug]: '' }))
    setManualErrors(prev => ({ ...prev, [slug]: [] }))
    try {
      const res = await fetch(`/api/ai-assistant/documents/scrape-manuals?manual=${slug}`, { method: 'POST' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Manual scrape failed')

      setManualMessages(prev => ({
        ...prev,
        [slug]: `Done: ${data.new} new, ${data.updated} updated, ${data.unchanged} unchanged` +
          (data.errors?.length ? `, ${data.errors.length} errors` : '') +
          ` (${data.sections_relevant} relevant of ${data.sections_found} sections)`,
      }))
      if (data.errors?.length) {
        setManualErrors(prev => ({ ...prev, [slug]: data.errors }))
      }
      fetchDocuments()
      fetchStatuses()
    } catch (err) {
      setManualMessages(prev => ({
        ...prev,
        [slug]: `Error: ${err instanceof Error ? err.message : 'Manual scrape failed'}`,
      }))
    } finally {
      setManualScraping(null)
    }
  }

  // Poll for processing documents
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing')
    if (!hasProcessing) return
    const interval = setInterval(fetchDocuments, 5000)
    return () => clearInterval(interval)
  }, [documents, fetchDocuments])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? All associated chunks and embeddings will be removed.')) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/ai-assistant/documents?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch {
      alert('Failed to delete document. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  // Filter documents by tab
  const guidanceDocs = documents.filter(d => {
    const source = (d.metadata as Record<string, unknown>)?.source
    return source === 'hmrc_scraper' || !source // include manually uploaded docs
  })
  const manualDocs = documents.filter(d => {
    const source = (d.metadata as Record<string, unknown>)?.source
    return source === 'hmrc_manual_scraper'
  })
  const tabDocs = activeTab === 'guidance' ? guidanceDocs : manualDocs

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ai-assistant"
            className="p-1.5 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: colors.text.muted }} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              AI Knowledge Base
            </h1>
            <p className="text-[0.78rem]" style={{ color: colors.text.muted }}>
              HMRC guidance and manuals powering the AI assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setLoading(true); fetchDocuments() }}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {activeTab === 'guidance' && (
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Upload Document
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg text-[0.85rem]"
          style={{
            background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: isDark ? '#fca5a5' : '#dc2626',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-lg"
        style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
      >
        <button
          onClick={() => setActiveTab('guidance')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-[0.82rem] font-medium transition-all"
          style={{
            background: activeTab === 'guidance'
              ? isDark ? 'rgba(255,255,255,0.08)' : '#fff'
              : 'transparent',
            color: activeTab === 'guidance' ? colors.text.primary : colors.text.muted,
            boxShadow: activeTab === 'guidance' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <Globe className="w-3.5 h-3.5" />
          Payroll Guidance
          {guidanceDocs.length > 0 && (
            <Badge variant="secondary" className="text-[0.65rem] h-4 px-1.5">
              {guidanceDocs.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('manuals')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-[0.82rem] font-medium transition-all"
          style={{
            background: activeTab === 'manuals'
              ? isDark ? 'rgba(255,255,255,0.08)' : '#fff'
              : 'transparent',
            color: activeTab === 'manuals' ? colors.text.primary : colors.text.muted,
            boxShadow: activeTab === 'manuals' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <BookOpen className="w-3.5 h-3.5" />
          HMRC Manuals
          {manualDocs.length > 0 && (
            <Badge variant="secondary" className="text-[0.65rem] h-4 px-1.5">
              {manualDocs.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Guidance Tab */}
      {activeTab === 'guidance' && (
        <>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)' }}
                >
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[0.88rem] font-medium mb-0.5" style={{ color: colors.text.primary }}>
                    HMRC Guidance Scraper
                  </h3>
                  <p className="text-[0.78rem] mb-3" style={{ color: colors.text.muted }}>
                    Scrape ~{guidanceStatus?.total_seed_urls || 38} official HMRC payroll guidance pages from gov.uk.
                    Runs weekly to detect changes.
                  </p>

                  {guidanceStatus && (
                    <div className="flex flex-wrap items-center gap-3 mb-3 text-[0.75rem]" style={{ color: colors.text.muted }}>
                      <span>
                        <strong style={{ color: colors.text.secondary }}>{guidanceStatus.scraped_count}</strong> documents scraped
                      </span>
                      {guidanceStatus.ready > 0 && (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[0.7rem] h-5">
                          {guidanceStatus.ready} ready
                        </Badge>
                      )}
                      {guidanceStatus.processing > 0 && (
                        <Badge variant="default" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[0.7rem] h-5">
                          {guidanceStatus.processing} processing
                        </Badge>
                      )}
                      {guidanceStatus.errors > 0 && (
                        <Badge variant="destructive" className="text-[0.7rem] h-5">
                          {guidanceStatus.errors} errors
                        </Badge>
                      )}
                      {guidanceStatus.last_scrape && (
                        <span>
                          Last scraped: {new Date(guidanceStatus.last_scrape).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  )}

                  {guidanceMessage && (
                    <ScrapeResultMessage message={guidanceMessage} errors={guidanceErrors} isDark={isDark} />
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleScrapeGuidance}
                    disabled={guidanceScraping}
                    className="gap-1.5"
                  >
                    {guidanceScraping ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Scraping HMRC...
                      </>
                    ) : guidanceStatus && guidanceStatus.scraped_count > 0 ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Check for Updates
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Scrape All HMRC Guidance
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {showUpload && (
            <UploadForm
              onClose={() => setShowUpload(false)}
              onSuccess={() => {
                setShowUpload(false)
                fetchDocuments()
              }}
              colors={colors}
              isDark={isDark}
            />
          )}
        </>
      )}

      {/* Manuals Tab — one card per manual */}
      {activeTab === 'manuals' && (
        <div className="grid gap-3">
          <p className="text-[0.78rem]" style={{ color: colors.text.muted }}>
            Smart-crawl HMRC internal manuals for payroll-relevant sections. Each manual is scraped independently.
          </p>

          {(manualStatus?.manuals || [
            { slug: 'paye-manual', title: 'PAYE Manual', scraped_count: 0, ready: 0, errors: 0, last_scrape: null },
            { slug: 'national-insurance-manual', title: 'National Insurance Manual', scraped_count: 0, ready: 0, errors: 0, last_scrape: null },
            { slug: 'employment-income-manual', title: 'Employment Income Manual', scraped_count: 0, ready: 0, errors: 0, last_scrape: null },
          ]).map((m) => (
            <Card key={m.slug}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.08)' }}
                  >
                    <BookOpen className="w-5 h-5 text-purple-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[0.88rem] font-medium mb-1" style={{ color: colors.text.primary }}>
                      {m.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 mb-2 text-[0.75rem]" style={{ color: colors.text.muted }}>
                      {m.scraped_count > 0 ? (
                        <>
                          <span>
                            <strong style={{ color: colors.text.secondary }}>{m.scraped_count}</strong> sections
                          </span>
                          {m.ready > 0 && (
                            <Badge variant="default" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[0.7rem] h-5">
                              {m.ready} ready
                            </Badge>
                          )}
                          {m.errors > 0 && (
                            <Badge variant="destructive" className="text-[0.7rem] h-5">
                              {m.errors} errors
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span>Not yet scraped</span>
                      )}
                      {m.last_scrape && (
                        <span>
                          Last: {new Date(m.last_scrape).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    {manualMessages[m.slug] && (
                      <ScrapeResultMessage
                        message={manualMessages[m.slug]}
                        errors={manualErrors[m.slug] || []}
                        isDark={isDark}
                      />
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleScrapeManual(m.slug, m.title)}
                      disabled={manualScraping !== null}
                      className="gap-1.5"
                    >
                      {manualScraping === m.slug ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Crawling...
                        </>
                      ) : m.scraped_count > 0 ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Check for Updates
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Scrape Manual
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documents list */}
      {loading && documents.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.text.muted }} />
        </div>
      ) : tabDocs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 mb-4" style={{ color: colors.text.muted }} />
            <h3 className="text-[0.95rem] font-medium mb-1" style={{ color: colors.text.primary }}>
              {activeTab === 'guidance' ? 'No guidance documents yet' : 'No manual sections yet'}
            </h3>
            <p className="text-[0.82rem] mb-4" style={{ color: colors.text.muted }}>
              {activeTab === 'guidance'
                ? 'Scrape HMRC guidance or upload documents to build the knowledge base.'
                : 'Use the scraper above to crawl HMRC internal manuals for relevant sections.'}
            </p>
            {activeTab === 'guidance' && (
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload First Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tabDocs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${colors.primary}10` }}
                >
                  <FileText className="w-5 h-5" style={{ color: colors.primary }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[0.85rem] font-medium truncate" style={{ color: colors.text.primary }}>
                      {doc.title}
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[0.75rem]" style={{ color: colors.text.muted }}>
                    {doc.category && (
                      <span className="capitalize">{doc.category.replace('_', ' ')}</span>
                    )}
                    {doc.metadata && typeof doc.metadata === 'object' && 'chunk_count' in doc.metadata && (
                      <span>{String(doc.metadata.chunk_count)} chunks</span>
                    )}
                    <span>
                      {new Date(doc.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    {doc.source_url && (
                      <a
                        href={doc.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: colors.primary }}
                      >
                        Source
                      </a>
                    )}
                  </div>
                  {doc.status === 'error' && doc.metadata && typeof doc.metadata === 'object' && 'error' in doc.metadata && (
                    <p className="text-[0.75rem] mt-1 text-red-500">
                      {String(doc.metadata.error)}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {deleting === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function UploadForm({
  onClose,
  onSuccess,
  colors,
  isDark,
}: {
  onClose: () => void
  onSuccess: () => void
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
}) {
  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/ai-assistant/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          source_url: sourceUrl.trim() || undefined,
          category: category || undefined,
          content: content.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to upload document')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await file.text()
      setContent(text)
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
    } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
      const text = await file.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/html')
      setContent(doc.body.textContent || text)
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
    } else {
      setError('Currently only .txt, .md, and .html files are supported for direct upload. For PDFs, copy and paste the text content below.')
    }

    e.target.value = ''
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-[0.95rem]">Upload Document</CardTitle>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
          <X className="w-4 h-4" style={{ color: colors.text.muted }} />
        </button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="flex items-center gap-2 p-2.5 rounded-md text-[0.82rem]"
              style={{
                background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: isDark ? '#fca5a5' : '#dc2626',
              }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[0.78rem] font-medium mb-1" style={{ color: colors.text.secondary }}>
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CWG2 - Employer Further Guide to PAYE"
                className="w-full h-9 px-3 rounded-md text-[0.82rem] outline-none transition-colors"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text.primary,
                }}
                required
              />
            </div>

            <div>
              <label className="block text-[0.78rem] font-medium mb-1" style={{ color: colors.text.secondary }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-md text-[0.82rem] outline-none transition-colors"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text.primary,
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[0.78rem] font-medium mb-1" style={{ color: colors.text.secondary }}>
              Source URL
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.gov.uk/guidance/..."
              className="w-full h-9 px-3 rounded-md text-[0.82rem] outline-none transition-colors"
              style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg,
                border: `1px solid ${colors.border}`,
                color: colors.text.primary,
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[0.78rem] font-medium" style={{ color: colors.text.secondary }}>
                Document Content *
              </label>
              <label
                className="text-[0.75rem] cursor-pointer transition-colors"
                style={{ color: colors.primary }}
              >
                <input
                  type="file"
                  accept=".txt,.md,.html"
                  onChange={handleFileRead}
                  className="hidden"
                />
                Import from file
              </label>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the HMRC guidance text here, or import from a file above..."
              rows={12}
              className="w-full px-3 py-2.5 rounded-md text-[0.82rem] leading-relaxed outline-none transition-colors resize-y font-mono"
              style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg,
                border: `1px solid ${colors.border}`,
                color: colors.text.primary,
              }}
              required
            />
            <p className="text-[0.7rem] mt-1" style={{ color: colors.text.muted }}>
              The content will be automatically split into chunks and embedded for AI retrieval.
              {content && ` (~${Math.ceil(content.length / 4)} tokens estimated)`}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting || !title.trim() || !content.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
