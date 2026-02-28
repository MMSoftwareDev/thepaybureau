-- ThePayBureau Pro — Complete Schema
-- Run this in the SQL Editor of a FRESH Supabase project
-- Creates all tables, RLS policies, and grants in one go

-- ═══════════════════════════════════════════════════
-- BASE TABLES
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text,
  plan text DEFAULT 'trial',
  mode text DEFAULT 'playground',
  allowed_domains text[],
  demo_data_active boolean DEFAULT false,
  can_switch_modes boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id),
  email text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name text NOT NULL,
  company_number text,
  email text,
  phone text,
  address jsonb,
  industry text,
  employee_count integer,
  status text DEFAULT 'active',
  notes text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- MVP payroll fields
  paye_reference text,
  accounts_office_ref text,
  pay_frequency text CHECK (pay_frequency IN ('weekly', 'fortnightly', 'four_weekly', 'monthly')),
  pay_day text,
  tax_period_start date,
  pension_provider text,
  pension_staging_date date,
  contact_name text,
  contact_email text,
  contact_phone text
);

-- ═══════════════════════════════════════════════════
-- MVP TABLES
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

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

-- ═══════════════════════════════════════════════════
-- HELPER FUNCTION
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid()
$$;

-- ═══════════════════════════════════════════════════
-- RLS: tenants
-- ═══════════════════════════════════════════════════

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select_own"
  ON public.tenants FOR SELECT
  USING (id = public.get_user_tenant_id());

CREATE POLICY "tenants_update_own"
  ON public.tenants FOR UPDATE
  USING (id = public.get_user_tenant_id())
  WITH CHECK (id = public.get_user_tenant_id());

CREATE POLICY "tenants_insert_authenticated"
  ON public.tenants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════
-- RLS: users
-- ═══════════════════════════════════════════════════

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_select_same_tenant"
  ON public.users FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_self"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ═══════════════════════════════════════════════════
-- RLS: clients
-- ═══════════════════════════════════════════════════

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_own_tenant"
  ON public.clients FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "clients_insert_own_tenant"
  ON public.clients FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "clients_update_own_tenant"
  ON public.clients FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "clients_delete_own_tenant"
  ON public.clients FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- ═══════════════════════════════════════════════════
-- RLS: checklist_templates
-- ═══════════════════════════════════════════════════

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
-- RLS: payroll_runs
-- ═══════════════════════════════════════════════════

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
-- RLS: checklist_items
-- ═══════════════════════════════════════════════════

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
-- GRANTS
-- ═══════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
