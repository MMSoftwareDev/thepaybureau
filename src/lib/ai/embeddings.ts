const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3'

interface EmbeddingResponse {
  data: { embedding: number[]; index: number }[]
  usage: { total_tokens: number }
}

function getVoyageApiKey(): string {
  const key = process.env.VOYAGE_API_KEY
  if (!key) {
    throw new Error('VOYAGE_API_KEY is not set')
  }
  return key
}

/**
 * Generate embeddings for a single text query.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getVoyageApiKey()}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
      input_type: 'query',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Voyage AI embedding failed: ${response.status} ${error}`)
  }

  const data: EmbeddingResponse = await response.json()
  return data.data[0].embedding
}

/**
 * Generate embeddings for multiple document chunks (batch).
 * Voyage AI supports up to 128 texts per request.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 128
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)

    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getVoyageApiKey()}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: batch,
        input_type: 'document',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Voyage AI embedding failed: ${response.status} ${error}`)
    }

    const data: EmbeddingResponse = await response.json()
    const sorted = data.data.sort((a, b) => a.index - b.index)
    allEmbeddings.push(...sorted.map(d => d.embedding))
  }

  return allEmbeddings
}
