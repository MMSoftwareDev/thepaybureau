-- Migration 023: Training & CPD enhancements
-- Adds CPD hours, expiry date, certificate URL, and status enum (replacing boolean completed)

-- Add new columns
ALTER TABLE training_records
  ADD COLUMN IF NOT EXISTS cpd_hours NUMERIC(5,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expiry_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS certificate_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'not_started';

-- Add CHECK constraint for status enum
ALTER TABLE training_records
  ADD CONSTRAINT training_records_status_check
  CHECK (status IN ('not_started', 'in_progress', 'completed'));

-- Migrate existing data: completed=true → 'completed', else 'not_started'
UPDATE training_records SET status = 'completed' WHERE completed = true;
UPDATE training_records SET status = 'not_started' WHERE completed = false OR completed IS NULL;

-- Create index for expiry date queries (finding expiring/expired certs)
CREATE INDEX IF NOT EXISTS idx_training_records_expiry
  ON training_records (expiry_date)
  WHERE expiry_date IS NOT NULL;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_training_records_status
  ON training_records (status);
