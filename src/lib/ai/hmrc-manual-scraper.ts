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
// Vercel's function timeout. Uses concurrent batch fetching
// (5 at a time) and strict keyword filtering to stay fast.
// ═══════════════════════════════════════════════════════════════

const BATCH_SIZE = 5        // Concurrent requests per batch
const BATCH_DELAY_MS = 800  // Delay between batches
const MAX_SECTIONS = 80     // Hard cap per manual to stay within timeout

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
// These must be specific enough to avoid matching every section.
// Words like 'employer', 'rate', 'threshold', 'allowance' are
// too broad and match nearly everything in the PAYE manual.

const RELEVANCE_KEYWORDS = [
  // PAYE operations
  'paye operation', 'tax code', 'tax table', 'coding notice',
  'payroll', 'p45', 'p46', 'p60', 'p11d',
  'starter checklist', 'new employee', 'leaver',
  // RTI
  'fps', 'eps', 'rti', 'real time information', 'full payment submission',
  'employer payment summary',
  // NIC
  'ni category', 'ni letter', 'nic ', 'national insurance contribution',
  'company director', 'category letter',
  // Statutory pay
  'statutory sick pay', 'statutory maternity', 'statutory paternity',
  'statutory adoption', 'statutory bereavement', 'statutory parental',
  'ssp', 'smp', 'spp', 'sap', 'shpp', 'spbp',
  // Deductions
  'student loan', 'postgraduate loan',
  'attachment of earnings', 'court order',
  'salary sacrifice', 'optional remuneration',
  // Benefits in kind
  'payrolling benefit', 'benefit in kind', 'benefits in kind',
  // Pensions
  'pension', 'auto-enrolment', 'automatic enrolment',
  // Employment types
  'apprentice levy', 'employment allowance',
  'construction industry scheme', 'cis ',
  // Year-end
  'year end', 'year-end', 'end of year',
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

// ─── Concurrent batch fetching ──────────────────────────────

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
 * Fetch multiple sections concurrently in batches.
 */
async function fetchSectionsBatch(
  sections: ManualSection[]
): Promise<Map<string, ManualSectionResponse>> {
  const results = new Map<string, ManualSectionResponse>()

  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.all(
      batch.map(s => fetchSection(s.base_path).then(data => ({ path: s.base_path, data })))
    )

    for (const { path, data } of batchResults) {
      if (data) results.set(path, data)
    }

    // Delay between batches (not after the last one)
    if (i + BATCH_SIZE < sections.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  return results
}

// ─── Single-pass manual scraping ────────────────────────────

/**
 * Scrape a single HMRC manual.
 *
 * Strategy:
 * 1. Fetch the manual index → get top-level sections
 * 2. Filter top-level sections by keywords
 * 3. Fetch relevant top-level sections concurrently (5 at a time)
 *    — gets content AND child section list in one request
 * 4. Collect relevant child sections, fetch them concurrently
 * 5. Hard cap at MAX_SECTIONS to stay within timeout
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

  // 2. Filter top-level sections by keywords
  const relevantTopLevel = topLevelSections.filter(s => isRelevantSection(s.title))
  sectionsRelevant = relevantTopLevel.length

  console.log(`[manual-scraper] ${manual.title}: ${relevantTopLevel.length} relevant of ${topLevelSections.length} top-level sections`)

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

  // 3. Fetch relevant top-level sections concurrently
  const topLevelResults = await fetchSectionsBatch(relevantTopLevel)

  // Process top-level sections and collect child sections to fetch
  const childSectionsToFetch: ManualSection[] = []

  for (const section of relevantTopLevel) {
    const sectionData = topLevelResults.get(section.base_path)
    if (!sectionData) {
      result.errors.push({
        url: `https://www.gov.uk${section.base_path}`,
        error: 'Failed to fetch',
      })
      continue
    }

    // Process content from this top-level section
    const url = `https://www.gov.uk${section.base_path}`
    try {
      processSection(sectionData, url)
    } catch (err) {
      result.errors.push({ url, error: err instanceof Error ? err.message : String(err) })
    }

    // Collect relevant child sections
    for (const group of sectionData.details?.child_section_groups || []) {
      for (const child of group.child_sections || []) {
        sectionsFound++
        // Take ALL children of a relevant parent (the parent was already filtered)
        childSectionsToFetch.push(child)
        sectionsRelevant++
      }
    }
  }

  // 4. Apply hard cap to child sections
  const cappedChildren = childSectionsToFetch.slice(0, MAX_SECTIONS)
  if (childSectionsToFetch.length > MAX_SECTIONS) {
    console.log(`[manual-scraper] ${manual.title}: Capped child sections from ${childSectionsToFetch.length} to ${MAX_SECTIONS}`)
  }

  console.log(`[manual-scraper] ${manual.title}: Fetching ${cappedChildren.length} child sections`)

  // 5. Fetch child sections concurrently
  const childResults = await fetchSectionsBatch(cappedChildren)

  for (const child of cappedChildren) {
    const childData = childResults.get(child.base_path)
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

  return {
    pages,
    result,
    sectionsFound,
    sectionsRelevant,
  }
}
