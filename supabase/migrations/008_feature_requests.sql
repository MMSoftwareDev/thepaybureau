-- Feature Requests: cross-tenant feature request board with voting
-- All authenticated users can view and vote; admin manages via API

-- Feature requests table (no tenant_id — intentionally cross-tenant)
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'planned', 'considering', 'will_not_implement', 'future')),
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email VARCHAR(255),
  created_by_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes table (one vote per user per request)
CREATE TABLE IF NOT EXISTS feature_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feature_request_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_request_id ON feature_request_votes(feature_request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_user_id ON feature_request_votes(user_id);

-- Enable RLS
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated users can read all feature requests
CREATE POLICY feature_requests_select ON feature_requests
  FOR SELECT TO authenticated
  USING (true);

-- RLS: Authenticated users can insert their own requests
CREATE POLICY feature_requests_insert ON feature_requests
  FOR INSERT TO authenticated
  WITH CHECK (created_by_user_id = auth.uid());

-- RLS: Allow update/delete for all authenticated (admin check done in API)
CREATE POLICY feature_requests_update ON feature_requests
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY feature_requests_delete ON feature_requests
  FOR DELETE TO authenticated
  USING (true);

-- RLS: All authenticated users can read all votes
CREATE POLICY feature_request_votes_select ON feature_request_votes
  FOR SELECT TO authenticated
  USING (true);

-- RLS: Users can insert their own votes
CREATE POLICY feature_request_votes_insert ON feature_request_votes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS: Users can delete their own votes
CREATE POLICY feature_request_votes_delete ON feature_request_votes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
