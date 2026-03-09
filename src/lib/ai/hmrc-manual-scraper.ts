import {
  fetchWithRetry,
  htmlToText,
  hashContent,
  sleep,
  USER_AGENT,
  FETCH_DELAY_MS,
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
// The smart crawl:
// 1. Fetches each manual's index to discover sections
// 2. Filters sections by payroll-relevant keywords
// 3. Only scrapes sections that match
// ═══════════════════════════════════════════════════════════════

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

/**
 * Safely parse a Response as JSON, handling cases where the Content API
 * returns HTML error pages (e.g. "An error occurred") instead of JSON.
 */
async function safeJsonParse<T>(res: Response, context: string): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    // Truncate for error message
    const preview = text.length > 120 ? text.slice(0, 120) + '...' : text
    throw new Error(`Non-JSON response from ${context}: ${preview}`)
  }
}

// ─── Manual scraping ────────────────────────────────────────

/**
 * Fetch a manual's index and return all discoverable section references.
 * Recursively discovers sub-sections from relevant top-level sections.
 */
async function discoverSections(
  manualSlug: string,
  onProgress?: (msg: string) => void
): Promise<{ sections: ManualSection[]; totalDiscovered: number }> {
  const indexUrl = `https://www.gov.uk/api/content/hmrc-internal-manuals/${manualSlug}`
  onProgress?.(`Fetching index: ${manualSlug}`)

  const res = await fetchWithRetry(indexUrl, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Failed to fetch manual index ${manualSlug}: status=${res.status} — ${body.slice(0, 200)}`)
  }

  const index = await safeJsonParse<ManualIndexResponse>(res, `manual index ${manualSlug}`)
  const topLevelSections: ManualSection[] = []

  // Collect all top-level sections from groups
  for (const group of index.details?.child_section_groups || []) {
    for (const section of group.child_sections || []) {
      topLevelSections.push(section)
    }
  }

  // For relevant top-level sections, fetch them to discover sub-sections
  const allSections: ManualSection[] = []
  let totalDiscovered = topLevelSections.length

  for (const section of topLevelSections) {
    // Check if this top-level section (or its group) is relevant
    if (!isRelevantSection(section.title)) continue

    onProgress?.(`Discovering sub-sections: ${section.title}`)
    await sleep(FETCH_DELAY_MS)

    try {
      const sectionRes = await fetchWithRetry(
        `https://www.gov.uk/api/content${section.base_path}`,
        { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }
      )

      if (!sectionRes.ok) continue

      const sectionData = await safeJsonParse<ManualSectionResponse>(
        sectionRes, `section ${section.base_path}`
      )
      const body = sectionData.details?.body || ''
      const content = htmlToText(body)

      // If this section has actual content (not just an index), include it
      if (content.length >= 50) {
        allSections.push(section)
      }

      // Collect child sections
      const childSections: ManualSection[] = []
      for (const group of sectionData.details?.child_section_groups || []) {
        for (const child of group.child_sections || []) {
          childSections.push(child)
          totalDiscovered++
        }
      }

      // Filter child sections by relevance and add them
      for (const child of childSections) {
        if (isRelevantSection(child.title)) {
          allSections.push(child)
        }
      }
    } catch (err) {
      console.error(`[manual-scraper] Discovery failed for ${section.base_path}:`, err)
      // Skip sections that fail to fetch during discovery
    }
  }

  return { sections: allSections, totalDiscovered }
}

/**
 * Scrape all relevant sections from a single HMRC manual.
 */
export async function scrapeManual(
  manual: HmrcManualConfig,
  existingDocs: Map<string, { id: string; contentHash: string }>,
  onProgress?: (msg: string) => void
): Promise<{
  pages: HmrcGuidancePage[]
  result: ScrapeResult
  sectionsFound: number
  sectionsRelevant: number
}> {
  const result: ScrapeResult = { scraped: 0, new: 0, updated: 0, unchanged: 0, errors: [] }
  const pages: HmrcGuidancePage[] = []

  // Discover relevant sections
  const { sections, totalDiscovered } = await discoverSections(manual.slug, onProgress)

  onProgress?.(`${manual.title}: ${sections.length} relevant sections of ${totalDiscovered} discovered`)

  // Fetch each relevant section
  for (const section of sections) {
    const url = `https://www.gov.uk${section.base_path}`

    try {
      onProgress?.(`Scraping: ${section.title}`)
      await sleep(FETCH_DELAY_MS)

      const sectionRes = await fetchWithRetry(
        `https://www.gov.uk/api/content${section.base_path}`,
        { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }
      )

      if (!sectionRes.ok) {
        result.errors.push({ url, error: `API status=${sectionRes.status}` })
        continue
      }

      const sectionData = await safeJsonParse<ManualSectionResponse>(
        sectionRes, `section ${section.base_path}`
      )
      const body = sectionData.details?.body || ''
      const content = htmlToText(body)

      if (content.length < 30) {
        // Skip index-only sections (no real content)
        continue
      }

      const contentHash = hashContent(content)
      result.scraped++

      const existing = existingDocs.get(url)
      if (existing) {
        if (existing.contentHash === contentHash) {
          result.unchanged++
          continue
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
    } catch (err) {
      result.errors.push({ url, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return {
    pages,
    result,
    sectionsFound: totalDiscovered,
    sectionsRelevant: sections.length,
  }
}

/**
 * Scrape all configured HMRC manuals.
 */
export async function scrapeAllManuals(
  existingDocs: Map<string, { id: string; contentHash: string }>,
  onProgress?: (msg: string) => void
): Promise<{
  pages: HmrcGuidancePage[]
  result: ScrapeResult
  manualStats: { slug: string; title: string; sectionsFound: number; sectionsRelevant: number; scraped: number }[]
}> {
  const combinedResult: ScrapeResult = { scraped: 0, new: 0, updated: 0, unchanged: 0, errors: [] }
  const allPages: HmrcGuidancePage[] = []
  const manualStats: { slug: string; title: string; sectionsFound: number; sectionsRelevant: number; scraped: number }[] = []

  for (const manual of HMRC_MANUALS) {
    try {
      onProgress?.(`Starting manual: ${manual.title}`)
      const { pages, result, sectionsFound, sectionsRelevant } = await scrapeManual(
        manual,
        existingDocs,
        onProgress
      )

      allPages.push(...pages)
      combinedResult.scraped += result.scraped
      combinedResult.new += result.new
      combinedResult.updated += result.updated
      combinedResult.unchanged += result.unchanged
      combinedResult.errors.push(...result.errors)

      manualStats.push({
        slug: manual.slug,
        title: manual.title,
        sectionsFound,
        sectionsRelevant,
        scraped: result.scraped,
      })
    } catch (err) {
      combinedResult.errors.push({
        url: `https://www.gov.uk/hmrc-internal-manuals/${manual.slug}`,
        error: `Manual failed: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }

  return { pages: allPages, result: combinedResult, manualStats }
}
