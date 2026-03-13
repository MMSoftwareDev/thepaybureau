-- Migration 018: Client field updates
-- - Add contract_type (rolling/fixed_term)
-- - Add notice_period_value + notice_period_unit
-- - Update auto_enrolment_status CHECK (replace 'postponed' with 'currently_not_required')

-- Add contract_type with default 'rolling'
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'rolling';
ALTER TABLE clients ADD CONSTRAINT clients_contract_type_check
  CHECK (contract_type IN ('fixed_term', 'rolling'));

-- Add notice period fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notice_period_value integer;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notice_period_unit text;
ALTER TABLE clients ADD CONSTRAINT clients_notice_period_unit_check
  CHECK (notice_period_unit IN ('days', 'weeks', 'months'));

-- Migrate existing 'postponed' values before updating constraint
UPDATE clients SET auto_enrolment_status = 'currently_not_required'
  WHERE auto_enrolment_status = 'postponed';

-- Update auto_enrolment_status CHECK constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_auto_enrolment_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_auto_enrolment_status_check
  CHECK (auto_enrolment_status IN ('enrolled', 'exempt', 'currently_not_required'));
