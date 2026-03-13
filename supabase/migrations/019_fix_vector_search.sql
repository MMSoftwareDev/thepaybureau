-- Fix vector search: lower threshold (0.3 -> 0.1) and increase IVFFlat probes (1 -> 10)
-- Session 10 applied these fixes directly to the database but never committed a migration.
-- This migration formally captures those changes for reproducibility.

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1024),
  match_count integer DEFAULT 8,
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
  -- Increase IVFFlat probes for better recall (default is 1).
  -- SET LOCAL scopes this to the current transaction only.
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
  WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
