-- Email logs for deduplication of automated email reminders
-- Tracks which emails have been sent to prevent duplicates on retry

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  reference_id VARCHAR(255) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_dedup
  ON email_logs(email_type, reference_id, sent_at);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at
  ON email_logs(sent_at DESC);

-- No RLS needed — only accessed by service-role client in cron jobs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
