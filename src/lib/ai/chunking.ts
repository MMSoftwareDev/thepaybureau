export interface DocumentChunk {
  content: string
  chunkIndex: number
  sectionTitle: string | null
  tokenCount: number
}

/**
 * Rough token count estimate (~4 chars per token for English text).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Split a document into overlapping chunks suitable for embedding.
 *
 * Strategy:
 * - Target ~500 tokens per chunk with ~50 token overlap
 * - Preserve section headings (lines starting with # or all-caps lines)
 * - Split on paragraph boundaries when possible
 */
export function chunkDocument(
  text: string,
  options: { targetTokens?: number; overlapTokens?: number } = {}
): DocumentChunk[] {
  const targetTokens = options.targetTokens ?? 500
  const overlapTokens = options.overlapTokens ?? 50
  const targetChars = targetTokens * 4
  const overlapChars = overlapTokens * 4

  const chunks: DocumentChunk[] = []
  const paragraphs = text.split(/\n\n+/)

  let currentContent = ''
  let currentSection: string | null = null
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()
    if (!trimmed) continue

    // Detect section headings
    const isHeading =
      trimmed.startsWith('#') ||
      (trimmed.length < 120 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed))

    if (isHeading) {
      currentSection = trimmed.replace(/^#+\s*/, '')
    }

    const combined = currentContent
      ? currentContent + '\n\n' + trimmed
      : trimmed

    if (combined.length > targetChars && currentContent) {
      // Save current chunk
      chunks.push({
        content: currentContent.trim(),
        chunkIndex,
        sectionTitle: currentSection,
        tokenCount: estimateTokens(currentContent),
      })
      chunkIndex++

      // Start new chunk with overlap from previous
      const overlapText = currentContent.slice(-overlapChars)
      currentContent = overlapText + '\n\n' + trimmed
    } else {
      currentContent = combined
    }
  }

  // Final chunk
  if (currentContent.trim()) {
    chunks.push({
      content: currentContent.trim(),
      chunkIndex,
      sectionTitle: currentSection,
      tokenCount: estimateTokens(currentContent),
    })
  }

  return chunks
}

/**
 * Extract text from a PDF buffer using pdf-parse.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid bundling issues
  const pdfParseModule = await import('pdf-parse')
  const pdfParse = 'default' in pdfParseModule ? (pdfParseModule.default as (buf: Buffer) => Promise<{ text: string }>) : (pdfParseModule as unknown as (buf: Buffer) => Promise<{ text: string }>)
  const data = await pdfParse(buffer)
  return data.text
}
