-- 011_security_audit_fixes.sql
-- Fixes identified in the pre-launch security audit

-- ═══════════════════════════════════════════════════
-- 1. Stripe webhook idempotency table (database-backed)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_stripe_id ON stripe_events(stripe_event_id);

-- Auto-cleanup: remove events older than 7 days (Stripe retries within 3 days max)
-- Run via cron or pg_cron: DELETE FROM stripe_events WHERE processed_at < now() - interval '7 days';

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- No RLS policies needed — only accessed by service-role in webhook handler

-- ═══════════════════════════════════════════════════
-- 2. Fix feature_requests RLS — restrict UPDATE/DELETE
-- ═══════════════════════════════════════════════════

-- Drop overly permissive policies that allow any authenticated user to modify any request
DROP POLICY IF EXISTS feature_requests_update ON feature_requests;
DROP POLICY IF EXISTS feature_requests_delete ON feature_requests;

-- Only the creator can update their own request
CREATE POLICY feature_requests_update ON feature_requests
  FOR UPDATE TO authenticated
  USING (created_by_user_id = auth.uid());

-- Only the creator can delete their own request
CREATE POLICY feature_requests_delete ON feature_requests
  FOR DELETE TO authenticated
  USING (created_by_user_id = auth.uid());

-- ═══════════════════════════════════════════════════
-- 3. Fix training_records RLS — add missing policies
-- ═══════════════════════════════════════════════════

-- Currently only has a SELECT policy. Add INSERT/UPDATE/DELETE for defense-in-depth.
CREATE POLICY "Users can insert own tenant training records"
  ON training_records FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own tenant training records"
  ON training_records FOR UPDATE
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete own tenant training records"
  ON training_records FOR DELETE
  USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- ═══════════════════════════════════════════════════
-- 4. Missing indexes for RLS performance
-- ═══════════════════════════════════════════════════

-- These are critical: get_user_tenant_id() is called in every RLS policy.
-- Without indexes, Supabase performs full table scans on every query.

CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant_id ON payroll_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_client_id ON payroll_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_pay_date ON payroll_runs(tenant_id, pay_date DESC);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_client_id ON checklist_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_payroll_run_id ON checklist_items(payroll_run_id);
