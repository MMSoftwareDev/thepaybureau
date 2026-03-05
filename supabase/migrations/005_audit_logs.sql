-- 005_audit_logs.sql
-- Audit log table to track every change made in the system

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by tenant (primary access pattern)
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);

-- Index for filtering by timestamp (date range queries)
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for common query: tenant + resource type + time
CREATE INDEX idx_audit_logs_tenant_resource ON audit_logs(tenant_id, resource_type, created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read audit logs from their own tenant
CREATE POLICY "Users can view own tenant audit logs"
  ON audit_logs FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: allow service role to insert (API routes use service role)
-- No INSERT policy needed as service role bypasses RLS
