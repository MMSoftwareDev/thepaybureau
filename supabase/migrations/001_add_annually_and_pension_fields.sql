-- Migration: Add annually frequency, pension fields, remove tax_period_start dependency
-- Run this against your existing Supabase database

-- 1. Update pay_frequency CHECK constraint to include 'annually'
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_pay_frequency_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_pay_frequency_check
  CHECK (pay_frequency IN ('weekly', 'fortnightly', 'four_weekly', 'monthly', 'annually'));

-- 2. Add new pension-related columns
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pension_reenrolment_date date;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS declaration_of_compliance_deadline date;

-- 3. Add payroll software column (useful for bureau consultants)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS payroll_software text;
