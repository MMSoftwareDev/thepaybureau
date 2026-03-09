-- Fix vector search returning no results
--
-- Problem: IVFFlat index with lists=100 but default probes=1 means only
-- 1% of chunks are searched per query. Relevant documents are missed.
--
-- Fix: Set probes=10 inside the RPC function so 10% of lists are searched,
-- dramatically improving recall. Also lower default threshold from 0.3 to 0.1.

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1024),
  match_count integer DEFAULT 5,
  match_threshold float DEFAULT 0.1
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  section_title text,
  chunk_index integer,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Search more IVFFlat lists for better recall (default is 1, which misses most data)
  SET LOCAL ivfflat.probes = 10;

  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.content,
    c.section_title,
    c.chunk_index,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.ai_document_chunks c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
