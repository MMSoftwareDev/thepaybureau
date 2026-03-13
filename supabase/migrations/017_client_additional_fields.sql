-- Migration 017: Add additional client fields for payroll bureau CRM
-- Tax & compliance, billing, company details, payroll contact, operational fields

-- Tax & Compliance
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vat_number text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utr text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cis_registered boolean NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sic_code text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS hmrc_agent_authorised boolean NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tpas_authorised boolean NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auto_enrolment_status text;

-- Company Details
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_type text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS incorporation_date date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS registered_address jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS director_name text;

-- Billing
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fee text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_frequency text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_method text;

-- Operational
ALTER TABLE clients ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_end_date date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referral_source text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bacs_bureau_number text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_storage_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_access_enabled boolean NOT NULL DEFAULT false;

-- Payroll Contact
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payroll_contact_name text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payroll_contact_email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payroll_contact_phone text;

-- Add CHECK constraint for enums
ALTER TABLE clients ADD CONSTRAINT clients_auto_enrolment_status_check
  CHECK (auto_enrolment_status IS NULL OR auto_enrolment_status IN ('enrolled', 'exempt', 'postponed'));

ALTER TABLE clients ADD CONSTRAINT clients_company_type_check
  CHECK (company_type IS NULL OR company_type IN ('ltd', 'llp', 'sole_trader', 'charity', 'public_sector', 'partnership'));

ALTER TABLE clients ADD CONSTRAINT clients_billing_frequency_check
  CHECK (billing_frequency IS NULL OR billing_frequency IN ('monthly', 'per_run', 'quarterly', 'annually'));
