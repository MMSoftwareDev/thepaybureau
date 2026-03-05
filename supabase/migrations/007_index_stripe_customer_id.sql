-- Index stripe_customer_id within tenants.settings JSONB for efficient webhook lookups
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id
  ON public.tenants ((settings->>'stripe_customer_id'))
  WHERE settings->>'stripe_customer_id' IS NOT NULL;
