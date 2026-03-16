-- Add column to track when the last declaration of compliance was completed
-- Used to advance the declaration deadline by 3 years on each completion cycle
ALTER TABLE clients ADD COLUMN last_declaration_completed_at timestamptz;
