-- ThePayBureau Pro MVP Schema
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════
-- EXTEND: clients table with payroll-specific fields
-- ═══════════════════════════════════════════════════

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS paye_reference text,
  ADD COLUMN IF NOT EXISTS accounts_office_ref text,
  ADD COLUMN IF NOT EXISTS pay_frequency text CHECK (pay_frequency IN ('weekly', 'fortnightly', 'four_weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS pay_day text,
  ADD COLUMN IF NOT EXISTS tax_period_start date,
  ADD COLUMN IF NOT EXISTS pension_provider text,
  ADD COLUMN IF NOT EXISTS pension_staging_date date,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text;

-- ═══════════════════════════════════════════════════
-- NEW TABLE: checklist_templates
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_templates_select"
  ON public.checklist_templates FOR SELECT
  USING (client_id IN (
    SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
  ));

CREATE POLICY "checklist_templates_insert"
  ON public.checklist_templates FOR INSERT
  WITH CHECK (client_id IN (
    SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
  ));

CREATE POLICY "checklist_templates_update"
  ON public.checklist_templates FOR UPDATE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
  ));

CREATE POLICY "checklist_templates_delete"
  ON public.checklist_templates FOR DELETE
  USING (client_id IN (
    SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
  ));

-- ═══════════════════════════════════════════════════
-- NEW TABLE: payroll_runs
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  pay_date date NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete', 'overdue')),
  rti_due_date date,
  eps_due_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_runs_select"
  ON public.payroll_runs FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "payroll_runs_insert"
  ON public.payroll_runs FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "payroll_runs_update"
  ON public.payroll_runs FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "payroll_runs_delete"
  ON public.payroll_runs FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- ═══════════════════════════════════════════════════
-- NEW TABLE: checklist_items
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES public.users(id),
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items_select"
  ON public.checklist_items FOR SELECT
  USING (payroll_run_id IN (
    SELECT id FROM public.payroll_runs WHERE tenant_id = public.get_user_tenant_id()
  ));

CREATE POLICY "checklist_items_insert"
  ON public.checklist_items FOR INSERT
  WITH CHECK (payroll_run_id IN (
    SELECT id FROM public.payroll_runs WHERE tenant_id = public.get_user_tenant_id()
  ));

CREATE POLICY "checklist_items_update"
  ON public.checklist_items FOR UPDATE
  USING (payroll_run_id IN (
    SELECT id FROM public.payroll_runs WHERE tenant_id = public.get_user_tenant_id()
  ));

CREATE POLICY "checklist_items_delete"
  ON public.checklist_items FOR DELETE
  USING (payroll_run_id IN (
    SELECT id FROM public.payroll_runs WHERE tenant_id = public.get_user_tenant_id()
  ));

-- ═══════════════════════════════════════════════════
-- GRANT permissions
-- ═══════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_items TO authenticated;
