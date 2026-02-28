-- ThePayBureau RLS Policies
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- These policies enforce multi-tenant data isolation:
-- each user can only access data within their own tenant.

-- ═══════════════════════════════════════════════════
-- HELPER FUNCTION: Get the current user's tenant_id
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
-- TABLE: tenants
-- ═══════════════════════════════════════════════════

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Users can read their own tenant
CREATE POLICY "tenants_select_own"
  ON public.tenants
  FOR SELECT
  USING (id = public.get_user_tenant_id());

-- Users can update their own tenant (for settings, name changes)
CREATE POLICY "tenants_update_own"
  ON public.tenants
  FOR UPDATE
  USING (id = public.get_user_tenant_id())
  WITH CHECK (id = public.get_user_tenant_id());

-- Allow INSERT during registration (user doesn't have tenant_id yet)
CREATE POLICY "tenants_insert_authenticated"
  ON public.tenants
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════
-- TABLE: users
-- ═══════════════════════════════════════════════════

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Users can read other users in the same tenant
CREATE POLICY "users_select_same_tenant"
  ON public.users
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Users can update their own record
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow INSERT during registration
CREATE POLICY "users_insert_self"
  ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- ═══════════════════════════════════════════════════
-- TABLE: clients
-- ═══════════════════════════════════════════════════

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Users can read clients in their tenant
CREATE POLICY "clients_select_own_tenant"
  ON public.clients
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Users can insert clients for their tenant
CREATE POLICY "clients_insert_own_tenant"
  ON public.clients
  FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Users can update clients in their tenant
CREATE POLICY "clients_update_own_tenant"
  ON public.clients
  FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Users can delete clients in their tenant
CREATE POLICY "clients_delete_own_tenant"
  ON public.clients
  FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- ═══════════════════════════════════════════════════
-- TABLE: client_onboarding (if exists)
-- ═══════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_onboarding') THEN
    EXECUTE 'ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY';

    -- Users can read onboarding data for clients in their tenant
    EXECUTE '
      CREATE POLICY "onboarding_select_own_tenant"
        ON public.client_onboarding
        FOR SELECT
        USING (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';

    -- Users can insert onboarding for their tenant's clients
    EXECUTE '
      CREATE POLICY "onboarding_insert_own_tenant"
        ON public.client_onboarding
        FOR INSERT
        WITH CHECK (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';

    -- Users can update onboarding for their tenant's clients
    EXECUTE '
      CREATE POLICY "onboarding_update_own_tenant"
        ON public.client_onboarding
        FOR UPDATE
        USING (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))
        WITH CHECK (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════
-- TABLE: contacts (if exists)
-- ═══════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    EXECUTE 'ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY';

    EXECUTE '
      CREATE POLICY "contacts_select_own_tenant"
        ON public.contacts
        FOR SELECT
        USING (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';

    EXECUTE '
      CREATE POLICY "contacts_insert_own_tenant"
        ON public.contacts
        FOR INSERT
        WITH CHECK (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';

    EXECUTE '
      CREATE POLICY "contacts_update_own_tenant"
        ON public.contacts
        FOR UPDATE
        USING (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';

    EXECUTE '
      CREATE POLICY "contacts_delete_own_tenant"
        ON public.contacts
        FOR DELETE
        USING (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════
-- TABLE: contracts (if exists)
-- ═══════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
    EXECUTE 'ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY';

    EXECUTE '
      CREATE POLICY "contracts_select_own_tenant"
        ON public.contracts
        FOR SELECT
        USING (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';

    EXECUTE '
      CREATE POLICY "contracts_insert_own_tenant"
        ON public.contracts
        FOR INSERT
        WITH CHECK (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';

    EXECUTE '
      CREATE POLICY "contracts_update_own_tenant"
        ON public.contracts
        FOR UPDATE
        USING (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════
-- TABLE: invoices (if exists)
-- ═══════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    EXECUTE 'ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY';

    EXECUTE '
      CREATE POLICY "invoices_select_own_tenant"
        ON public.invoices
        FOR SELECT
        USING (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';

    EXECUTE '
      CREATE POLICY "invoices_insert_own_tenant"
        ON public.invoices
        FOR INSERT
        WITH CHECK (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';

    EXECUTE '
      CREATE POLICY "invoices_update_own_tenant"
        ON public.invoices
        FOR UPDATE
        USING (client_id IN (
          SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
        ))';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════
-- GRANT USAGE TO authenticated role
-- ═══════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
