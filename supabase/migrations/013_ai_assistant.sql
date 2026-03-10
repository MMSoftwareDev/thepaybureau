-- AI Assistant — RAG-powered payroll chatbot
-- Adds tables for document storage, embeddings, conversations, and external API

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════
-- KNOWLEDGE BASE
-- ═══════════════════════════════════════════════════

-- HMRC documents (admin-managed knowledge base)
CREATE TABLE IF NOT EXISTS public.ai_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source_url text,
  category text,
  file_path text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document chunks with vector embeddings
CREATE TABLE IF NOT EXISTS public.ai_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.ai_documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  chunk_index integer NOT NULL,
  section_title text,
  embedding vector(1024),
  token_count integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Vector similarity search index (cosine distance)
CREATE INDEX IF NOT EXISTS ai_chunks_embedding_idx
  ON public.ai_document_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_ai_chunks_document
  ON public.ai_document_chunks(document_id);

-- ═══════════════════════════════════════════════════
-- CONVERSATIONS
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  citations jsonb DEFAULT '[]',
  token_count integer,
  model text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant ON public.ai_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id);

-- ═══════════════════════════════════════════════════
-- EXTERNAL API
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] DEFAULT '{chat}',
  rate_limit integer DEFAULT 100,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES public.ai_api_keys(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  status integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_api_usage_key ON public.ai_api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_created ON public.ai_api_usage(created_at);

-- ═══════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════

ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_api_usage ENABLE ROW LEVEL SECURITY;

-- Documents are globally readable (HMRC guidance is shared)
CREATE POLICY "ai_documents_select" ON public.ai_documents FOR SELECT USING (true);
CREATE POLICY "ai_document_chunks_select" ON public.ai_document_chunks FOR SELECT USING (true);

-- Conversations: users can only access their own
CREATE POLICY "ai_conversations_select" ON public.ai_conversations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ai_conversations_insert" ON public.ai_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_conversations_delete" ON public.ai_conversations
  FOR DELETE USING (user_id = auth.uid());

-- Messages: accessible if user owns the conversation
CREATE POLICY "ai_messages_select" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );
CREATE POLICY "ai_messages_insert" ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

-- API keys: tenant-scoped access
CREATE POLICY "ai_api_keys_select" ON public.ai_api_keys
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );

-- API usage: tenant-scoped access
CREATE POLICY "ai_api_usage_select" ON public.ai_api_usage
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );

-- ═══════════════════════════════════════════════════
-- VECTOR SEARCH FUNCTION
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1024),
  match_count integer DEFAULT 8,
  match_threshold float DEFAULT 0.3
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
