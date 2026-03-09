import {
  fetchWithRetry,
  htmlToText,
  hashContent,
  sleep,
  USER_AGENT,
  type HmrcGuidancePage,
  type ScrapeResult,
} from './hmrc-scraper'

// ═══════════════════════════════════════════════════════════════
// HMRC Internal Manual Scraper (Smart Crawl)
//
// Fetches HMRC internal manuals (e.g. PAYE Manual, NIC Manual)
// via the gov.uk Content API. These manuals are hierarchical:
//   Manual → Section Groups → Sections → Sub-sections
//
// The smart crawl runs ONE manual per request to stay within
// Vercel's function timeout. It uses a single-pass approach:
// fetch each section once, keep content if relevant.
// ═══════════════════════════════════════════════════════════════

const MANUAL_DELAY_MS = 1000 // 1s between requests (Content API is lightweight)

// ─── Manuals to scrape ──────────────────────────────────────

export interface HmrcManualConfig {
  slug: string
  title: string
  category: HmrcGuidancePage['category']
}

export const HMRC_MANUALS: HmrcManualConfig[] = [
  { slug: 'paye-manual', title: 'PAYE Manual', category: 'paye' },
  { slug: 'national-insurance-manual', title: 'National Insurance Manual', category: 'nic' },
  { slug: 'employment-income-manual', title: 'Employment Income Manual', category: 'paye' },
]

export function getManualBySlug(slug: string): HmrcManualConfig | undefined {
  return HMRC_MANUALS.find(m => m.slug === slug)
}

// ─── Keyword-based section filtering ────────────────────────

const RELEVANCE_KEYWORDS = [
  // PAYE operations
  'employer', 'payroll', 'paye operation', 'tax code', 'tax table',
  'p45', 'p46', 'p60', 'p11d', 'starter', 'leaver',
  // RTI
  'fps', 'eps', 'rti', 'real time', 'full payment', 'employer payment',
  // NIC
  'ni category', 'ni letter', 'nic ', 'national insurance contribution',
  'director', 'company director', 'category letter',
  // Statutory pay
  'statutory', 'ssp', 'smp', 'spp', 'sap', 'shpp', 'spbp',
  'sick pay', 'maternity', 'paternity', 'bereavement',
  // Deductions & benefits
  'student loan', 'postgraduate loan',
  'benefit', 'expense', 'payrolling', 'p11d',
  'attachment of earnings', 'court order',
  'salary sacrifice', 'optional remuneration',
  // Pensions
  'pension', 'auto-enrolment', 'automatic enrolment',
  // Employment types
  'apprentice', 'employment allowance',
  'construction industry', 'cis',
  // Year-end
  'year end', 'year-end', 'annual', 'end of year',
  // Rates & thresholds
  'rate', 'threshold', 'limit', 'allowance',
]

function isRelevantSection(title: string): boolean {
  const lower = title.toLowerCase()
  return RELEVANCE_KEYWORDS.some(kw => lower.includes(kw))
}

// ─── Content API types for manuals ──────────────────────────

interface ManualSection {
  title: string
  base_path: string
  description?: string
}

interface ManualSectionGroup {
  title: string
  child_sections?: ManualSection[]
}

interface ManualIndexResponse {
  title: string
  description?: string
  details?: {
    body?: string
    child_section_groups?: ManualSectionGroup[]
  }
}

interface ManualSectionResponse {
  title: string
  description?: string
  details?: {
    body?: string
    section_id?: string
    child_section_groups?: ManualSectionGroup[]
  }
  public_updated_at?: string
}

// ─── Safe JSON parsing ──────────────────────────────────────

async function safeJsonParse<T>(res: Response, context: string): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    const preview = text.length > 120 ? text.slice(0, 120) + '...' : text
    throw new Error(`Non-JSON response from ${context}: ${preview}`)
  }
}

// ─── Single-pass manual scraping ────────────────────────────

/**
 * Fetch a single section from the Content API.
 * Returns null if the section can't be fetched or has no content.
 */
async function fetchSection(
  basePath: string,
): Promise<ManualSectionResponse | null> {
  try {
    const res = await fetchWithRetry(
      `https://www.gov.uk/api/content${basePath}`,
      { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }
    )
    if (!res.ok) return null
    return await safeJsonParse<ManualSectionResponse>(res, `section ${basePath}`)
  } catch (err) {
    console.error(`[manual-scraper] Failed to fetch ${basePath}:`, err)
    return null
  }
}

/**
 * Scrape a single HMRC manual in one pass.
 *
 * Strategy:
 * 1. Fetch the manual index → get top-level sections
 * 2. For each relevant top-level section, fetch it (single request gets
 *    both content AND child section list)
 * 3. Keep content from top-level sections if substantial
 * 4. For relevant child sections, fetch and keep content
 *
 * Each section is fetched exactly once.
 */
export async function scrapeManual(
  manual: HmrcManualConfig,
  existingDocs: Map<string, { id: string; contentHash: string }>,
): Promise<{
  pages: HmrcGuidancePage[]
  result: ScrapeResult
  sectionsFound: number
  sectionsRelevant: number
}> {
  const result: ScrapeResult = { scraped: 0, new: 0, updated: 0, unchanged: 0, errors: [] }
  const pages: HmrcGuidancePage[] = []
  let sectionsFound = 0
  let sectionsRelevant = 0

  // 1. Fetch manual index
  const indexUrl = `https://www.gov.uk/api/content/hmrc-internal-manuals/${manual.slug}`
  const indexRes = await fetchWithRetry(indexUrl, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })

  if (!indexRes.ok) {
    const body = await indexRes.text().catch(() => '')
    throw new Error(`Failed to fetch manual index: status=${indexRes.status} — ${body.slice(0, 200)}`)
  }

  const index = await safeJsonParse<ManualIndexResponse>(indexRes, `manual index ${manual.slug}`)

  // Collect top-level sections
  const topLevelSections: ManualSection[] = []
  for (const group of index.details?.child_section_groups || []) {
    for (const section of group.child_sections || []) {
      topLevelSections.push(section)
    }
  }
  sectionsFound = topLevelSections.length

  // Helper to process a fetched section's content
  const processSection = (
    sectionData: ManualSectionResponse,
    url: string,
  ) => {
    const body = sectionData.details?.body || ''
    const content = htmlToText(body)

    if (content.length < 50) return // Index-only, skip

    const contentHash = hashContent(content)
    result.scraped++

    const existing = existingDocs.get(url)
    if (existing) {
      if (existing.contentHash === contentHash) {
        result.unchanged++
        return
      }
      result.updated++
    } else {
      result.new++
    }

    pages.push({
      url,
      title: sectionData.title,
      content,
      category: manual.category,
      contentHash,
      lastUpdated: sectionData.public_updated_at || null,
    })
  }

  // 2. Fetch relevant top-level sections (single pass — gets content + children)
  for (const section of topLevelSections) {
    if (!isRelevantSection(section.title)) continue
    sectionsRelevant++

    await sleep(MANUAL_DELAY_MS)
    const sectionData = await fetchSection(section.base_path)
    if (!sectionData) {
      result.errors.push({
        url: `https://www.gov.uk${section.base_path}`,
        error: 'Failed to fetch',
      })
      continue
    }

    // Keep content from this top-level section if it has any
    const url = `https://www.gov.uk${section.base_path}`
    try {
      processSection(sectionData, url)
    } catch (err) {
      result.errors.push({ url, error: err instanceof Error ? err.message : String(err) })
    }

    // 3. Discover and fetch relevant child sections
    for (const group of sectionData.details?.child_section_groups || []) {
      for (const child of group.child_sections || []) {
        sectionsFound++

        if (!isRelevantSection(child.title)) continue
        sectionsRelevant++

        await sleep(MANUAL_DELAY_MS)
        const childData = await fetchSection(child.base_path)
        if (!childData) {
          result.errors.push({
            url: `https://www.gov.uk${child.base_path}`,
            error: 'Failed to fetch',
          })
          continue
        }

        const childUrl = `https://www.gov.uk${child.base_path}`
        try {
          processSection(childData, childUrl)
        } catch (err) {
          result.errors.push({ url: childUrl, error: err instanceof Error ? err.message : String(err) })
        }
      }
    }
  }

  return {
    pages,
    result,
    sectionsFound,
    sectionsRelevant,
  }
}
