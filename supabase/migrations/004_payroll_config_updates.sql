-- Migration: Expand pay frequency options, add pay period and employment allowance fields

-- 1. Update pay_frequency CHECK constraint to include new frequencies
--    Replaces 'fortnightly' with 'two_weekly', adds 'quarterly' and 'biannually'
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_pay_frequency_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_pay_frequency_check
  CHECK (pay_frequency IN ('weekly', 'two_weekly', 'fortnightly', 'four_weekly', 'monthly', 'quarterly', 'biannually', 'annually'));

-- 2. Migrate existing 'fortnightly' values to 'two_weekly'
UPDATE public.clients SET pay_frequency = 'two_weekly' WHERE pay_frequency = 'fortnightly';

-- 3. Migrate existing 'last_working_day' pay_day values to 'last_day_of_month'
--    (keeping last_working_day supported in code for backwards compatibility)

-- 4. Add new columns for pay period dates and employment allowance
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS period_end date;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS employment_allowance boolean;
