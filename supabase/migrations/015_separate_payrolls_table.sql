-- ═══════════════════════════════════════════════════
-- Migration 015: Separate Payrolls Table
-- Moves payroll config from clients table to a new payrolls table
-- Supports multiple payrolls per client
-- ═══════════════════════════════════════════════════

-- 1. Create the new payrolls table
CREATE TABLE IF NOT EXISTS public.payrolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  paye_reference text,
  accounts_office_ref text,
  pay_frequency text CHECK (pay_frequency IN ('weekly', 'two_weekly', 'four_weekly', 'monthly', 'annually')),
  pay_day text,
  period_start date,
  period_end date,
  payroll_software text,
  employment_allowance boolean DEFAULT false,
  pension_provider text,
  pension_staging_date date,
  pension_reenrolment_date date,
  declaration_of_compliance_deadline date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payrolls_select"
  ON public.payrolls FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "payrolls_insert"
  ON public.payrolls FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "payrolls_update"
  ON public.payrolls FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "payrolls_delete"
  ON public.payrolls FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- 3. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payrolls TO authenticated;

-- 4. Add payroll_id column to payroll_runs
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS payroll_id uuid REFERENCES public.payrolls(id) ON DELETE CASCADE;

-- 5. Add payroll_id column to checklist_templates
ALTER TABLE public.checklist_templates
  ADD COLUMN IF NOT EXISTS payroll_id uuid REFERENCES public.payrolls(id) ON DELETE CASCADE;

-- 6. Migrate existing data: create payroll records from clients that have pay_frequency set
INSERT INTO public.payrolls (tenant_id, client_id, name, paye_reference, accounts_office_ref,
  pay_frequency, pay_day, period_start, period_end, payroll_software, employment_allowance,
  pension_provider, pension_staging_date, pension_reenrolment_date, declaration_of_compliance_deadline,
  created_by, created_at)
SELECT
  c.tenant_id,
  c.id,
  c.name || ' Payroll',
  c.paye_reference,
  c.accounts_office_ref,
  c.pay_frequency,
  c.pay_day,
  c.period_start,
  c.period_end,
  c.payroll_software,
  c.employment_allowance,
  c.pension_provider,
  c.pension_staging_date,
  c.pension_reenrolment_date,
  c.declaration_of_compliance_deadline,
  c.created_by,
  c.created_at
FROM public.clients c
WHERE c.pay_frequency IS NOT NULL;

-- 7. Backfill payroll_id on payroll_runs from migrated payrolls
UPDATE public.payroll_runs pr
SET payroll_id = p.id
FROM public.payrolls p
WHERE pr.client_id = p.client_id
  AND pr.payroll_id IS NULL;

-- 8. Backfill payroll_id on checklist_templates from migrated payrolls
UPDATE public.checklist_templates ct
SET payroll_id = p.id
FROM public.payrolls p
WHERE ct.client_id = p.client_id
  AND ct.payroll_id IS NULL;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payrolls_tenant_id ON public.payrolls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_client_id ON public.payrolls(client_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_payroll_id ON public.payroll_runs(payroll_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_payroll_id ON public.checklist_templates(payroll_id);
