-- Migration: Add extra client fields (domain, secondary contact, accountant contact)
-- Also removes prospect as a valid client status concept (no DB constraint change needed)

ALTER TABLE clients ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS secondary_contact_name text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS secondary_contact_email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS secondary_contact_phone text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS accountant_name text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS accountant_email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS accountant_phone text;
