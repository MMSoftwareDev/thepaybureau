-- 006_training_records.sql
-- CPD / Training log for tracking professional development

CREATE TABLE IF NOT EXISTS training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  provider TEXT,
  category TEXT CHECK (category IN ('hmrc_webinar', 'cipp_webinar', 'online_course', 'conference', 'workshop', 'self_study', 'other')),
  url TEXT,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_records_tenant ON training_records(tenant_id);
CREATE INDEX idx_training_records_completed ON training_records(tenant_id, completed, completed_date DESC);

ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant training records"
  ON training_records FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
