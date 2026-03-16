-- Migration 022: User titles and feature request comments
-- Adds title field to users table and creates threaded comments for feature requests

-- ── USER TITLES ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(100);

-- Set Founder title for platform owner
UPDATE users SET title = 'Founder' WHERE email = 'minhaz.moosa@intelligentpayroll.co.uk';

-- ── FEATURE REQUEST COMMENTS ──
CREATE TABLE IF NOT EXISTS feature_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES feature_request_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fr_comments_request ON feature_request_comments(feature_request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_fr_comments_parent ON feature_request_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_fr_comments_user ON feature_request_comments(user_id);

-- RLS
ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read comments
CREATE POLICY fr_comments_select ON feature_request_comments
  FOR SELECT TO authenticated USING (true);

-- Users can insert their own comments
CREATE POLICY fr_comments_insert ON feature_request_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments (admin deletes via service role)
CREATE POLICY fr_comments_delete ON feature_request_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
