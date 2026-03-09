import * as cheerio from 'cheerio'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════
// HMRC Payroll Guidance Scraper
//
// Scrapes official HMRC guidance from gov.uk using:
// 1. The gov.uk Content API (JSON, preferred)
// 2. Fallback to HTML scraping with cheerio
//
// Gov.uk allows scraping — see https://www.gov.uk/help/about-govuk
// ═══════════════════════════════════════════════════════════════

export interface HmrcGuidancePage {
  url: string
  title: string
  content: string
  category: 'paye' | 'nic' | 'statutory_pay' | 'pensions' | 'rti' | 'expenses' | 'general'
  contentHash: string
  lastUpdated: string | null
}

export interface ScrapeResult {
  scraped: number
  new: number
  updated: number
  unchanged: number
  errors: { url: string; error: string }[]
}

// ─── Seed URLs ────────────────────────────────────────────────
// Core HMRC payroll guidance pages that bureau staff need.
// The scraper also discovers linked guidance from these pages.

export const HMRC_GUIDANCE_URLS: { url: string; category: HmrcGuidancePage['category'] }[] = [
  // PAYE
  { url: 'https://www.gov.uk/paye-for-employers', category: 'paye' },
  { url: 'https://www.gov.uk/pay-paye-tax', category: 'paye' },
  { url: 'https://www.gov.uk/new-employee', category: 'paye' },
  { url: 'https://www.gov.uk/employee-leaving', category: 'paye' },
  { url: 'https://www.gov.uk/government/publications/cwg2-further-guide-to-paye-and-national-insurance-contributions/2025-to-2026-employer-further-guide-to-paye-and-national-insurance-contributions', category: 'paye' },
  { url: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026', category: 'paye' },
  { url: 'https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2024-to-2025', category: 'paye' },
  { url: 'https://www.gov.uk/tax-codes', category: 'paye' },
  { url: 'https://www.gov.uk/employee-tax-codes', category: 'paye' },
  { url: 'https://www.gov.uk/guidance/special-rules-for-student-loans', category: 'paye' },
  { url: 'https://www.gov.uk/claim-employment-allowance', category: 'paye' },
  { url: 'https://www.gov.uk/paye-online', category: 'paye' },

  // National Insurance
  { url: 'https://www.gov.uk/national-insurance', category: 'nic' },
  { url: 'https://www.gov.uk/national-insurance-rates-letters', category: 'nic' },
  { url: 'https://www.gov.uk/employee-directors', category: 'nic' },

  // Statutory Pay
  { url: 'https://www.gov.uk/employers-sick-pay', category: 'statutory_pay' },
  { url: 'https://www.gov.uk/statutory-sick-pay', category: 'statutory_pay' },
  { url: 'https://www.gov.uk/employers-maternity-pay-leave', category: 'statutory_pay' },
  { url: 'https://www.gov.uk/statutory-maternity-pay', category: 'statutory_pay' },
  { url: 'https://www.gov.uk/employers-paternity-pay-leave', category: 'statutory_pay' },
  { url: 'https://www.gov.uk/shared-parental-leave-and-pay-employer-guide', category: 'statutory_pay' },
  { url: 'https://www.gov.uk/employers-parental-bereavement-pay-leave', category: 'statutory_pay' },
  { url: 'https://www.gov.uk/recover-statutory-payments', category: 'statutory_pay' },
  { url: 'https://www.gov.uk/guidance/statutory-sick-pay-how-different-employment-types-affect-what-you-pay', category: 'statutory_pay' },

  // Pensions
  { url: 'https://www.gov.uk/workplace-pensions-employers', category: 'pensions' },
  { url: 'https://www.gov.uk/workplace-pensions', category: 'pensions' },
  { url: 'https://www.gov.uk/employers-workplace-pensions-rules', category: 'pensions' },
  { url: 'https://www.gov.uk/guidance/pension-administrators-reporting-to-hmrc', category: 'pensions' },

  // RTI (Real Time Information)
  { url: 'https://www.gov.uk/running-payroll', category: 'rti' },
  { url: 'https://www.gov.uk/guidance/what-payroll-information-to-report-to-hmrc', category: 'rti' },
  { url: 'https://www.gov.uk/payroll-errors', category: 'rti' },

  // Expenses & Benefits
  { url: 'https://www.gov.uk/employer-reporting-expenses-benefits', category: 'expenses' },
  { url: 'https://www.gov.uk/guidance/payrolling-tax-employees-benefits-and-expenses-through-your-payroll', category: 'expenses' },
  { url: 'https://www.gov.uk/expenses-and-benefits-a-to-z', category: 'expenses' },
  { url: 'https://www.gov.uk/guidance/report-end-of-year-expenses-and-benefits-online', category: 'expenses' },

  // General / Year-end
  { url: 'https://www.gov.uk/payroll-annual-reporting', category: 'general' },
  { url: 'https://www.gov.uk/register-employer', category: 'general' },
  { url: 'https://www.gov.uk/guidance/help-and-support-for-employing-people', category: 'general' },
]

// ─── Content API fetching ─────────────────────────────────────

const USER_AGENT = 'ThePayBureau-AI/1.0 (payroll guidance scraper; admin@thepaybureau.com)'
const FETCH_DELAY_MS = 1500 // Be polite — 1.5s between requests

interface GovUkContentResponse {
  title: string
  description?: string
  document_type?: string
  base_path?: string
  details?: {
    body?: string          // HTML body for 'guide' / 'detailed_guide' etc.
    parts?: {              // Multi-part guides
      title: string
      slug: string
      body: string
    }[]
    more_information?: string
    introductory_paragraph?: string  // 'answer' and 'transaction' pages
    external_related_links?: { title: string; url: string }[]
    collection_groups?: {            // 'document_collection' pages
      title: string
      body?: string
      documents?: { title: string; base_path: string; description?: string }[]
    }[]
    change_history?: { note: string; public_timestamp: string }[]
    // 'redirect' document_type
    destination?: string
  }
  public_updated_at?: string
  links?: {
    related?: { base_path: string; title: string }[]
    ordered_related_items?: { base_path: string; title: string }[]
  }
}

const FETCH_TIMEOUT_MS = 10000 // 10s per request
const MAX_RETRIES = 1 // 1 retry (2 attempts total) to stay within 5-min function limit

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch with timeout and retry support.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      const res = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeout)
      return res
    } catch (err) {
      if (attempt === retries) throw err
      const delay = Math.pow(2, attempt + 1) * 1000 // 2s, 4s
      console.warn(`Fetch attempt ${attempt + 1} failed for ${url}, retrying in ${delay}ms`)
      await sleep(delay)
    }
  }
  throw new Error('Unreachable')
}

/**
 * Fetch a gov.uk page using the Content API (returns JSON).
 * Falls back to HTML scraping if the Content API doesn't have the page.
 *
 * Returns an object with content + a `failureReason` field for diagnostics.
 */
export async function fetchGovUkPage(url: string): Promise<{
  title: string
  content: string
  lastUpdated: string | null
  relatedUrls: string[]
} | { failureReason: string } | null> {
  const path = new URL(url).pathname
  let contentApiStatus = ''

  // Try Content API first
  try {
    const apiUrl = `https://www.gov.uk/api/content${path}`
    const res = await fetchWithRetry(apiUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
    })

    contentApiStatus = `status=${res.status}`

    if (res.ok) {
      const data: GovUkContentResponse = await res.json()

      // Handle redirect document type — follow to the destination
      if (data.document_type === 'redirect' && data.details?.destination) {
        const destUrl = data.details.destination.startsWith('/')
          ? `https://www.gov.uk${data.details.destination}`
          : data.details.destination
        contentApiStatus += ` redirect→${data.details.destination}`
        // Recurse once to follow the redirect
        return fetchGovUkPage(destUrl)
      }

      const result = parseContentApiResponse(data, url)
      if (result.content.length >= 50) {
        return result
      }
      // Content API returned thin content — fall through to HTML
      contentApiStatus += ` thin(${result.content.length}ch, type=${data.document_type || 'unknown'})`
    } else if (res.status === 404) {
      // For sub-paths like /workplace-pensions/what-employers-must-do,
      // try fetching the parent path and extracting the relevant part
      const pathParts = path.split('/').filter(Boolean)
      if (pathParts.length >= 2) {
        const parentPath = '/' + pathParts[0]
        const subSlug = pathParts[pathParts.length - 1]
        contentApiStatus += ` 404, trying parent=${parentPath} slug=${subSlug}`

        try {
          const parentRes = await fetchWithRetry(`https://www.gov.uk/api/content${parentPath}`, {
            headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
          })

          if (parentRes.ok) {
            const parentData: GovUkContentResponse = await parentRes.json()
            // Check if parent has parts and find the matching one
            const matchingPart = parentData.details?.parts?.find(p => p.slug === subSlug)
            if (matchingPart) {
              const content = htmlToText(`<h2>${matchingPart.title}</h2>\n${matchingPart.body}`)
              if (content.length >= 50) {
                return {
                  title: `${parentData.title} - ${matchingPart.title}`,
                  content: content.trim(),
                  lastUpdated: parentData.public_updated_at || null,
                  relatedUrls: [],
                }
              }
            }
            // If no matching part, try parsing the whole parent
            const parentResult = parseContentApiResponse(parentData, url)
            if (parentResult.content.length >= 50) {
              return parentResult
            }
            contentApiStatus += ` parent_thin(${parentResult.content.length}ch)`
          }
        } catch {
          contentApiStatus += ' parent_fetch_failed'
        }
      }
    }
  } catch (err) {
    contentApiStatus = `error: ${err instanceof Error ? err.message : String(err)}`
    console.warn(`Content API failed for ${url}, trying HTML:`, err)
  }

  // Fallback: scrape HTML directly
  try {
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
      },
    })

    if (!res.ok) {
      const reason = `API: ${contentApiStatus}; HTML: status=${res.status}`
      return { failureReason: reason }
    }

    const html = await res.text()
    const result = parseHtmlPage(html, url)
    if (result.content.length < 30) {
      const reason = `API: ${contentApiStatus}; HTML: only ${result.content.length} chars`
      return { failureReason: reason }
    }
    return result
  } catch (err) {
    const reason = `API: ${contentApiStatus}; HTML: ${err instanceof Error ? err.message : String(err)}`
    return { failureReason: reason }
  }
}

function parseContentApiResponse(
  data: GovUkContentResponse,
  originalUrl: string
): { title: string; content: string; lastUpdated: string | null; relatedUrls: string[] } {
  let htmlContent = ''

  // Multi-part guides (e.g. /paye-for-employers has parts)
  if (data.details?.parts && data.details.parts.length > 0) {
    htmlContent = data.details.parts
      .map(p => `<h2>${p.title}</h2>\n${p.body}`)
      .join('\n\n')
  } else if (data.details?.body) {
    htmlContent = data.details.body
  } else if (data.details?.more_information) {
    htmlContent = data.details.more_information
  }

  // Answer/transaction pages use introductory_paragraph
  if (data.details?.introductory_paragraph) {
    htmlContent = htmlContent
      ? data.details.introductory_paragraph + '\n\n' + htmlContent
      : data.details.introductory_paragraph
  }

  // Document collection pages — extract group titles and document descriptions
  if (data.details?.collection_groups && data.details.collection_groups.length > 0) {
    const collectionHtml = data.details.collection_groups
      .map(group => {
        const docs = (group.documents || [])
          .map(d => `<li><strong>${d.title}</strong>${d.description ? ': ' + d.description : ''}</li>`)
          .join('\n')
        return `<h2>${group.title}</h2>\n${group.body || ''}\n<ul>${docs}</ul>`
      })
      .join('\n\n')
    htmlContent = htmlContent ? htmlContent + '\n\n' + collectionHtml : collectionHtml
  }

  if (!htmlContent) {
    // Some pages only have a description
    htmlContent = data.description || ''
  }

  // Strip HTML to clean text
  const content = htmlToText(htmlContent)

  // Collect related links
  const relatedUrls: string[] = []
  const related = [
    ...(data.links?.related || []),
    ...(data.links?.ordered_related_items || []),
  ]
  for (const link of related) {
    if (link.base_path) {
      relatedUrls.push(`https://www.gov.uk${link.base_path}`)
    }
  }

  return {
    title: data.title,
    content: content.trim(),
    lastUpdated: data.public_updated_at || null,
    relatedUrls,
  }
}

function parseHtmlPage(
  html: string,
  originalUrl: string
): { title: string; content: string; lastUpdated: string | null; relatedUrls: string[] } {
  const $ = cheerio.load(html)

  // Extract title
  const title = $('h1').first().text().trim() ||
    $('title').text().replace(' - GOV.UK', '').trim() ||
    'Untitled'

  // Extract main content area — try progressively broader selectors
  const mainContent = $(
    '.govuk-govspeak, .gem-c-govspeak, #guide-content, ' +
    '.gem-c-contents-list + *, .govuk-grid-column-two-thirds, ' +
    '.govuk-body, article, main'
  ).first()

  let content: string
  if (mainContent.length) {
    // Remove nav, breadcrumbs, footers, sidebars
    mainContent.find('nav, .gem-c-breadcrumbs, footer, .related-content, .govuk-breadcrumbs, script, style').remove()
    content = htmlToText(mainContent.html() || '')
  } else {
    // Fallback: get all text from main
    const main = $('main').first()
    main.find('nav, footer, script, style').remove()
    content = htmlToText(main.html() || $.root().text())
  }

  // Extract last updated date
  const lastUpdated = $('[data-module="gem-track-click"] time, .gem-c-metadata time, .app-c-published-dates time')
    .first()
    .attr('datetime') || null

  // Extract related links
  const relatedUrls: string[] = []
  $('a[href^="/guidance/"], a[href^="/employers-"], a[href^="/statutory-"], a[href^="/national-insurance"], a[href^="/paye-"], a[href^="/running-payroll"], a[href^="/workplace-pensions"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href && !href.includes('#')) {
      relatedUrls.push(`https://www.gov.uk${href}`)
    }
  })

  return {
    title,
    content: content.trim(),
    lastUpdated,
    relatedUrls: [...new Set(relatedUrls)],
  }
}

/**
 * Convert HTML to clean plain text, preserving structure.
 */
function htmlToText(html: string): string {
  const $ = cheerio.load(html)

  // Convert headings to markdown-style for chunker to detect
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = (el as unknown as { tagName: string }).tagName
    const level = parseInt(tag.charAt(1))
    const prefix = '#'.repeat(level)
    $(el).replaceWith(`\n\n${prefix} ${$(el).text().trim()}\n\n`)
  })

  // Convert lists to text
  $('li').each((_, el) => {
    $(el).prepend('- ')
    $(el).append('\n')
  })

  // Convert tables to text
  $('table').each((_, table) => {
    const rows: string[] = []
    $(table).find('tr').each((_, tr) => {
      const cells: string[] = []
      $(tr).find('th, td').each((_, cell) => {
        cells.push($(cell).text().trim())
      })
      rows.push(cells.join(' | '))
    })
    $(table).replaceWith('\n\n' + rows.join('\n') + '\n\n')
  })

  // Convert <br> to newlines
  $('br').replaceWith('\n')

  // Get text
  let text = $.root().text()

  // Clean up whitespace
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim()

  return text
}

/**
 * Generate a content hash for change detection.
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)
}

/**
 * Scrape a single HMRC guidance page and return structured data.
 * Returns the page data on success, or an error string on failure.
 */
export async function scrapeGuidancePage(
  url: string,
  category: HmrcGuidancePage['category']
): Promise<HmrcGuidancePage | string> {
  const result = await fetchGovUkPage(url)

  if (!result) {
    return 'No response from gov.uk'
  }

  if ('failureReason' in result) {
    return result.failureReason
  }

  if (!result.content || result.content.length < 30) {
    return `Content too short (${result.content?.length || 0} chars)`
  }

  return {
    url,
    title: result.title,
    content: result.content,
    category,
    contentHash: hashContent(result.content),
    lastUpdated: result.lastUpdated,
  }
}

/**
 * Run the full scrape of all HMRC guidance URLs.
 * Checks existing documents by source_url to detect changes.
 *
 * @param existingDocs - Map of source_url → { id, content_hash } from the database
 * @param onProgress - Optional callback for progress updates
 */
export async function scrapeAllGuidance(
  existingDocs: Map<string, { id: string; contentHash: string }>,
  onProgress?: (msg: string) => void
): Promise<{ pages: HmrcGuidancePage[]; result: ScrapeResult }> {
  const result: ScrapeResult = { scraped: 0, new: 0, updated: 0, unchanged: 0, errors: [] }
  const pages: HmrcGuidancePage[] = []

  for (const { url, category } of HMRC_GUIDANCE_URLS) {
    try {
      onProgress?.(`Scraping: ${url}`)
      const page = await scrapeGuidancePage(url, category)

      if (typeof page === 'string') {
        // page is an error message
        result.errors.push({ url, error: page })
        await sleep(FETCH_DELAY_MS) // Rate limit even on failures
        continue
      }

      result.scraped++

      const existing = existingDocs.get(url)
      if (existing) {
        if (existing.contentHash === page.contentHash) {
          result.unchanged++
          await sleep(FETCH_DELAY_MS)
          continue // No changes
        }
        result.updated++
      } else {
        result.new++
      }

      pages.push(page)

      // Rate limit - be respectful of gov.uk
      await sleep(FETCH_DELAY_MS)
    } catch (err) {
      result.errors.push({ url, error: err instanceof Error ? err.message : String(err) })
      await sleep(FETCH_DELAY_MS)
    }
  }

  return { pages, result }
}
