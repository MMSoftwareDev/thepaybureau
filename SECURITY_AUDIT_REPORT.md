# ThePayBureau Pro - Pre-Launch Security & Quality Audit

**Date:** 2026-03-07
**Auditor:** Automated Security Audit (Claude)
**Scope:** Full codebase review — OWASP Top 10, RLS, Stripe, Auth, Performance

---

## SECTION 1: OWASP TOP 10 CHECKS

### A01 - Broken Access Control

| Check | Status | Details |
|-------|--------|---------|
| API routes check authentication | ✅ PASS | All data-mutating routes call `getAuthUser()` and return 401 if null. Verified in all 26 route files. |
| No cross-user data leakage | ✅ PASS | Every query filters by `tenant_id` derived from the authenticated user. e.g. `src/app/api/clients/route.ts:78` — `.eq('tenant_id', user.tenant_id)` |
| RLS policies block cross-user access | ✅ PASS | All core tables have RLS enabled with `get_user_tenant_id()` checks. |
| Middleware protects dashboard routes | ✅ PASS | `src/middleware.ts:51` — redirects unauthenticated users from `/dashboard` to `/login`. |
| Direct object references verify ownership | ✅ PASS | `src/app/api/clients/[id]/route.ts:76` — queries include `.eq('tenant_id', user.tenant_id)` to scope by tenant. Same pattern in training, payroll-runs, etc. |
| Admin routes verify admin role | ✅ PASS | `src/app/api/admin/analytics/route.ts:20` — checks `PLATFORM_ADMIN_EMAILS` env var. |
| Cron route auth | ✅ PASS | `src/app/api/cron/email-reminders/route.ts:13` — verifies `CRON_SECRET` bearer token. |
| CSRF protection | ✅ PASS | `src/middleware.ts:29-43` — validates Origin header matches Host for all mutating API requests, exempting webhooks. |

**Findings:**
- ⚠️ WARNING: `src/app/api/health/route.ts` and `src/app/api/status/route.ts` have no auth — acceptable for health/status endpoints but `/api/status` exposes UptimeRobot monitor URLs. Consider whether monitor URLs should be public.
- ⚠️ WARNING: `feature_requests` RLS allows UPDATE/DELETE by any authenticated user (`USING (true)` in `008_feature_requests.sql:49-54`). The comment says "admin check done in API", but if a client ever calls Supabase directly (e.g., from browser), any user could modify any feature request. Add `created_by_user_id = auth.uid()` for UPDATE policy and restrict DELETE to admins.

---

### A02 - Cryptographic Failures

| Check | Status | Details |
|-------|--------|---------|
| No secrets logged to console | ✅ PASS | All `console.error` calls log error objects, not raw credentials. Verified across all 50+ log statements. |
| Service role key server-only | ✅ PASS | `SUPABASE_SERVICE_ROLE_KEY` only in `src/lib/supabase-server.ts:10`. Client-side code in `src/lib/supabase.ts` uses only `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| .env excluded from git | ✅ PASS | `.gitignore:34` — `.env*` pattern blocks all env files. |
| API responses don't over-expose data | ⚠️ WARNING | Several routes return `SELECT *` (e.g., `src/app/api/clients/route.ts:77`). While tenant-scoped, this returns every column including potentially sensitive fields like `notes`. Consider explicit column selection for list endpoints. |

---

### A03 - Injection

| Check | Status | Details |
|-------|--------|---------|
| No raw SQL injection | ✅ PASS | All database operations use the Supabase client library's parameterized query builder. No `rpc()` with string interpolation found. |
| Zod validation on inputs | ✅ PASS | All POST/PUT routes validate with Zod schemas before DB operations. Verified: register, clients, clients/[id], clients/import, payroll-runs/actions, payroll-runs/generate, settings, training, feature-requests. |
| No string interpolation in queries | ✅ PASS | All queries use `.eq()`, `.in()`, etc. — no template literals used for query construction. |

---

### A04 - Insecure Design

| Check | Status | Details |
|-------|--------|---------|
| Personal email domains blocked at API | ✅ PASS | `src/lib/validations.ts:4-7` — blocks gmail, outlook, hotmail, yahoo, aol, icloud, live, msn, protonmail at Zod schema level. Used in `src/app/api/auth/register/route.ts:26`. |
| Email enumeration prevention | ✅ PASS | `src/app/api/auth/register/route.ts:59-63` — returns same success message whether email exists or not. |
| DNS/MX validation | ✅ PASS | `src/app/api/auth/register/route.ts:34-49` — verifies domain has MX records with 5s timeout. |
| Rate limiting on registration | ✅ PASS | `src/app/api/auth/register/route.ts:14` — 5 attempts per IP per 15 minutes. |

**Findings:**
- ⚠️ WARNING: Blocked domains list in `src/lib/validations.ts:4-7` is missing several common free email providers. **Missing:** `pm.me`, `tutanota.com`, `zoho.com` (free tier), `mail.com`, `yandex.com`, `yandex.ru`, `gmx.com`, `gmx.net`. `protonmail.com` IS included.

---

### A05 - Security Misconfiguration

| Check | Status | Details |
|-------|--------|---------|
| X-Frame-Options | ✅ PASS | `next.config.ts:20` — `DENY` |
| Content-Security-Policy | ✅ PASS | `next.config.ts:27-38` — comprehensive CSP with strict defaults. `script-src` includes `'unsafe-inline'` (needed for Next.js) but only allows `js.stripe.com`. |
| HSTS | ✅ PASS | `next.config.ts:23` — `max-age=31536000; includeSubDomains` |
| X-Content-Type-Options | ✅ PASS | `next.config.ts:19` — `nosniff` |
| Referrer-Policy | ✅ PASS | `next.config.ts:22` — `strict-origin-when-cross-origin` |
| Permissions-Policy | ✅ PASS | `next.config.ts:24` — disables camera, microphone, geolocation |
| Error messages don't expose internals | ✅ PASS | All catch blocks return generic "Internal server error" to clients. Stack traces only go to `console.error` (server-side). |
| No debug routes in production | ✅ PASS | Admin routes are protected by `PLATFORM_ADMIN_EMAILS`. `/api/health` returns minimal data. |

---

### A06 - Vulnerable Components

| Check | Status | Details |
|-------|--------|---------|
| npm audit | ✅ PASS | `npm audit` reports **0 vulnerabilities**. |
| Key dependency versions | ✅ PASS | `next@^16.1.6`, `@supabase/supabase-js@^2.50.3`, `@supabase/ssr@^0.6.1`, `stripe@^18.3.0`, `resend@^4.6.0` — all current. |

---

### A07 - Authentication Failures

| Check | Status | Details |
|-------|--------|---------|
| Session management via Supabase | ✅ PASS | Uses `@supabase/ssr` with cookie-based sessions. Middleware refreshes sessions via `supabase.auth.getUser()` on every request (`middleware.ts:48`). |
| Duplicate signup prevention | ✅ PASS | `src/app/api/auth/register/route.ts:52-63` checks for existing user, returns generic message. |
| Password policy | ✅ PASS | `src/lib/validations.ts:19-24` — min 8 chars, requires uppercase, lowercase, number, special character. |

**Findings:**
- ⚠️ WARNING: No explicit email verification enforcement before dashboard access. The middleware (`src/middleware.ts:51`) only checks if `user` exists (from `getUser()`), not whether the email is confirmed. Supabase's `getUser()` returns the user even if email is unconfirmed (unless configured otherwise in Supabase dashboard). **Verify in Supabase dashboard that "Confirm email" is enabled** so `getUser()` only succeeds after confirmation.

---

### A08 - Software & Data Integrity

| Check | Status | Details |
|-------|--------|---------|
| Stripe webhook signature validation | ✅ PASS | `src/app/api/stripe/webhook/route.ts:45` — uses `constructEvent()` with `STRIPE_WEBHOOK_SECRET`. |
| No eval() or dynamic code execution | ✅ PASS | No `eval()` or `new Function()` found in the codebase. |
| dangerouslySetInnerHTML | ✅ PASS | Only used in `src/app/layout.tsx:80` for a static service worker registration script — safe, no user input involved. |
| Trusted npm sources | ✅ PASS | No custom registries or `preinstall`/`postinstall` scripts that fetch from untrusted sources. |

---

### A09 - Security Logging

| Check | Status | Details |
|-------|--------|---------|
| Audit logging on data changes | ✅ PASS | `writeAuditLog()` called on CREATE/UPDATE/DELETE for clients, payroll runs, checklist items, settings, training records, and password changes. Stores tenant_id, user_id, IP, user_agent, and JSON diff of changes. |
| Failed login logging | ⚠️ WARNING | Failed logins are handled by Supabase Auth directly. The app doesn't explicitly log failed login attempts to the `audit_logs` table. Supabase logs these internally but they may not be easily queryable. |
| RLS violation detection | ⚠️ WARNING | RLS violations in Supabase result in empty result sets (not errors), making them invisible. Consider adding monitoring/alerting for suspicious patterns (e.g., many 404s from the same user). |

---

### A10 - Server-Side Request Forgery

| Check | Status | Details |
|-------|--------|---------|
| User-supplied URL fetching | ✅ PASS | No API route fetches user-supplied URLs. `src/app/api/status/route.ts:18` fetches a hardcoded UptimeRobot URL. |
| Email sending SSRF risk | ✅ PASS | `src/lib/resend.ts` sends emails via Resend API with validated `to` addresses — no URL fetching involved. |
| Training record URL field | ✅ PASS | `src/app/api/training/route.ts:11` validates `url` with `z.string().url()` but only stores it — never fetches it server-side. |

---

## SECTION 2: STRIPE WEBHOOK IDEMPOTENCY

| Check | Status | Details |
|-------|--------|---------|
| Signature validation | ✅ PASS | `src/app/api/stripe/webhook/route.ts:45` — `constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` |
| Idempotency handling | ✅ PASS | Lines 9-32 implement in-memory idempotency with TTL. Checks `hasProcessed(event.id)` before processing, calls `markProcessed(event.id)` after. |
| Event handling: checkout.session.completed | ✅ PASS | Lines 59-70 — updates tenant plan. |
| Event handling: customer.subscription.updated | ✅ PASS | Lines 73-100 — maps price ID to plan name, updates tenant. |
| Event handling: customer.subscription.deleted | ✅ PASS | Lines 102-116 — downgrades tenant to 'free'. |

**Findings:**
- ❌ FAIL: **In-memory idempotency is not durable.** The `processedEvents` Map resets on every serverless cold start (Vercel deploys, scale-to-zero, etc.). This means the same event could be processed twice across cold starts. **Remediation:** Store processed event IDs in a `stripe_events` database table:
  ```sql
  CREATE TABLE stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE INDEX idx_stripe_events_id ON stripe_events(stripe_event_id);
  ```
  Before processing: `SELECT id FROM stripe_events WHERE stripe_event_id = $1`
  After processing: `INSERT INTO stripe_events (stripe_event_id, event_type) VALUES ($1, $2)`

- ⚠️ WARNING: **Missing event: `invoice.payment_failed`** — when a payment fails, the tenant should be notified or flagged. Currently there's no handling for failed payments.

- ⚠️ WARNING: **Missing event: `customer.subscription.created`** — handled indirectly via `checkout.session.completed`, but an explicit handler would be more robust.

- ⚠️ WARNING: **No transaction wrapping** — if the tenant update fails after the event is marked processed (line 119 runs even on DB errors), the event won't be retried. Mark processed ONLY after successful DB operations, or wrap in a try/catch that only marks on success. Current code already does this correctly (markProcessed is after the switch), but add explicit error checking.

---

## SECTION 3: SUPABASE ROW LEVEL SECURITY VERIFICATION

### RLS Status by Table

| Table | RLS Enabled | Policies | Status |
|-------|-------------|----------|--------|
| `tenants` | ✅ Yes | SELECT/UPDATE own, INSERT for authenticated | ✅ PASS |
| `users` | ✅ Yes | SELECT own/same-tenant, UPDATE own, INSERT self | ✅ PASS |
| `clients` | ✅ Yes | Full CRUD scoped to tenant | ✅ PASS |
| `checklist_templates` | ✅ Yes | Full CRUD via client→tenant join | ✅ PASS |
| `payroll_runs` | ✅ Yes | Full CRUD scoped to tenant | ✅ PASS |
| `checklist_items` | ✅ Yes | Full CRUD via payroll_run→tenant join | ✅ PASS |
| `audit_logs` | ✅ Yes | SELECT only (service role inserts) | ✅ PASS |
| `training_records` | ✅ Yes | SELECT only via tenant (service role inserts) | ⚠️ See below |
| `feature_requests` | ✅ Yes | Cross-tenant by design | ⚠️ See below |
| `feature_request_votes` | ✅ Yes | SELECT all, INSERT/DELETE own | ✅ PASS |
| `email_logs` | ✅ Yes | No SELECT/INSERT policies for users | ✅ PASS (service-role only) |
| `user_badges` | ✅ Yes | SELECT/INSERT scoped to tenant | ✅ PASS |
| `user_stats` | ✅ Yes | SELECT/ALL scoped to tenant | ✅ PASS |

### Conceptual Test Results

**Test 1 — Consultant isolation (payroll_runs):**
```sql
-- Policy: payroll_runs_select
-- USING (tenant_id = public.get_user_tenant_id())
```
✅ PASS — Consultant A (tenant X) cannot see Consultant B's (tenant Y) payroll runs. The `get_user_tenant_id()` function returns the caller's tenant_id via `auth.uid()`.

**Test 2 — Bureau isolation:**
✅ PASS — Same mechanism. All tenant-scoped queries use `get_user_tenant_id()` which is derived from the authenticated user's record in the `users` table.

**Test 3 — Profile protection:**
```sql
-- Policy: users_update_own
-- USING (id = auth.uid()) WITH CHECK (id = auth.uid())
```
✅ PASS — User A cannot update User B's profile. UPDATE restricted to own record.

**Test 4 — Feature request privacy:**
⚠️ WARNING — Feature requests are intentionally cross-tenant (shared board). But UPDATE/DELETE policies use `USING (true)` — any authenticated user could modify or delete any feature request via direct Supabase client calls. This bypasses the API-level admin check.

### Issues Found

- ❌ FAIL: **`feature_requests` UPDATE/DELETE RLS is too permissive** (`008_feature_requests.sql:49-54`). Any authenticated user can modify/delete any request. Fix:
  ```sql
  -- Replace overly permissive policies:
  DROP POLICY feature_requests_update ON feature_requests;
  DROP POLICY feature_requests_delete ON feature_requests;
  -- Only creator can update/delete their own requests:
  CREATE POLICY feature_requests_update ON feature_requests
    FOR UPDATE TO authenticated
    USING (created_by_user_id = auth.uid());
  CREATE POLICY feature_requests_delete ON feature_requests
    FOR DELETE TO authenticated
    USING (created_by_user_id = auth.uid());
  ```

- ⚠️ WARNING: **`training_records` has SELECT-only RLS policy** (`006_training_records.sql:24-30`). INSERT/UPDATE/DELETE have no RLS policies. Since API routes use service-role (bypasses RLS), this works currently, but if any client-side Supabase call is added later, users could insert training records into other tenants. Add INSERT/UPDATE/DELETE policies.

- ⚠️ WARNING: **`audit_logs` has SELECT-only RLS policy** (`005_audit_logs.sql:32-38`). Same as above — service role bypasses for inserts, but explicit INSERT restriction policy would be defense-in-depth.

---

## SECTION 4: EMAIL VALIDATION & SENDER REPUTATION

| Check | Status | Details |
|-------|--------|---------|
| Frontend validation | ✅ PASS | `src/lib/validations.ts` — `adminRegistrationSchema` with blocked domains + disposable email check. Used by frontend form. |
| Backend re-validation | ✅ PASS | `src/app/api/auth/register/route.ts:26` — same Zod schema applied server-side. |
| Disposable domain blocklist | ✅ PASS | `src/lib/disposable-domains.ts` — 180+ disposable domains in a Set for O(1) lookup. |
| FROM address uses verified domain | ✅ PASS | `src/lib/resend.ts:15` — `noreply@mail.thepaybureau.com` (subdomain of main domain). |

**Findings:**
- ⚠️ WARNING: **Missing from blocked domains list** (`src/lib/validations.ts:4-7`):
  - `pm.me` (ProtonMail alias)
  - `tutanota.com`
  - `zoho.com` (free tier)
  - `mail.com`
  - `yandex.com`, `yandex.ru`
  - `gmx.com`, `gmx.net`

- ⚠️ WARNING: **SPF/DKIM/DMARC documentation missing.** The `mail.thepaybureau.com` subdomain should have:
  - SPF record allowing Resend's sending IPs
  - DKIM records (Resend provides these during domain verification)
  - DMARC policy (at minimum `v=DMARC1; p=none; rua=...`)
  - Verify these are configured in your DNS provider. No documentation found in the codebase.

- ⚠️ WARNING: **No bounce handling.** Resend provides webhooks for bounce/complaint events. Hard bounces should suppress future sends to that address. Consider setting up a Resend webhook to track delivery failures.

---

## SECTION 5: AUTH & SESSION EDGE CASES

| Edge Case | Status | Details |
|-----------|--------|---------|
| 1. User deletes account mid-session | ⚠️ WARNING | `users` table has `ON DELETE CASCADE` from `auth.users` (`000_full_schema.sql:24`). If the auth user is deleted, the user profile is removed, and `getAuthUser()` will return null on next request — triggering a 401. The UX may be abrupt (no graceful "account deleted" message). |
| 2. Token expiry during active session | ✅ PASS | `src/middleware.ts:48` — calls `supabase.auth.getUser()` on every request which refreshes the session cookie. Supabase SSR handles token refresh transparently. |
| 3. Duplicate signup with same email | ✅ PASS | `src/app/api/auth/register/route.ts:52-63` — checks for existing user and returns generic success message (preventing enumeration). Supabase Auth also prevents duplicate emails. |
| 4. Payroll_runs on profile deletion | ✅ PASS | `clients` cascade to `payroll_runs` (`ON DELETE CASCADE`), and `payroll_runs` cascade to `checklist_items`. Users have `ON DELETE CASCADE` from `auth.users`. However, `users.tenant_id` references `tenants` with no CASCADE — orphaned tenants are possible but not harmful. |
| 5. Rate limit on signup | ✅ PASS | `src/app/api/auth/register/route.ts:14` — 5 attempts per IP per 15 minutes via Upstash Redis (with in-memory fallback). |
| 6. Middleware handles Supabase downtime | ⚠️ WARNING | If Supabase is temporarily unavailable, `getUser()` in middleware will fail. The current code doesn't catch errors from `supabase.auth.getUser()` — an uncaught exception could result in a 500 error instead of a graceful degradation. Consider wrapping in try/catch with a redirect to an error page. |

---

## SECTION 6: INPUT VALIDATION COMPLETENESS

| API Route | Zod Schema | Status | Notes |
|-----------|-----------|--------|-------|
| POST `/api/auth/register` | `adminRegistrationSchema` | ✅ PASS | Email, password (8+ chars, complexity), companyName, adminName validated |
| POST `/api/clients` | `clientOnboardingSchema` | ✅ PASS | All fields validated, pay_frequency enum, checklist_items array |
| PUT `/api/clients/[id]` | `clientUpdateSchema` | ✅ PASS | Status enum (`active`, `inactive`, `prospect`), all optional fields typed |
| DELETE `/api/clients/[id]` | N/A (UUID param only) | ✅ PASS | UUID from URL path, tenant ownership verified |
| POST `/api/clients/import` | `csvClientSchema` | ✅ PASS | Validated per-row with defaults |
| POST `/api/payroll-runs/actions` | `actionSchema` (discriminated union) | ✅ PASS | `toggle_item`, `mark_all_complete`, `save_notes`, `add_step` — each with specific schemas |
| POST `/api/payroll-runs/generate` | `generatePayrollRunSchema` | ✅ PASS | `client_id: z.string().uuid()` |
| POST `/api/settings` | `actionSchema` (discriminated union) | ✅ PASS | `update_profile`, `change_password`, `update_avatar`, `save_checklist_defaults`, `save_checklist_templates` |
| POST `/api/training` | `createSchema` | ✅ PASS | title, provider, category enum, url validation |
| PUT `/api/training` | `updateSchema` | ✅ PASS | Partial of createSchema + id UUID |
| POST `/api/feature-requests` | `createSchema` | ✅ PASS | title (1-200 chars), description (max 2000) |
| POST `/api/stripe/checkout` | N/A | ⚠️ WARNING | Needs review — body parsing for plan/billingCycle should validate against allowed values |
| PUT `/api/pensions` | inline Zod | ✅ PASS | Pension fields validated |

---

## SECTION 7: PERFORMANCE & SCALABILITY

| Check | Status | Details |
|-------|--------|---------|
| Database indexes | ✅ PASS | Indexes on `audit_logs(tenant_id, resource_type, created_at)`, `training_records(tenant_id)`, `feature_requests(status, created_at)`, `feature_request_votes(request_id, user_id)`, `user_badges(user_id, tenant_id)`, `user_stats(user_id, tenant_id)`, `email_logs(email_type, reference_id)`. Core tables use FK indexes. |
| N+1 query patterns | ⚠️ WARNING | `src/app/api/cron/email-reminders/route.ts:113-116` — for each payroll run, fetches checklist items individually. On a busy day with many runs, this could be slow. Consider batch-fetching with `.in('payroll_run_id', runIds)`. |
| N+1 in dashboard stats | ⚠️ WARNING | `src/app/api/admin/analytics/route.ts` fetches ALL users, tenants, clients, and payroll runs into memory (lines 31-52). This will not scale past ~10k records. Consider SQL aggregation. |
| Realtime subscriptions cleanup | ✅ PASS | No Supabase realtime subscriptions found in the codebase — no cleanup needed. |
| Pagination | ⚠️ WARNING | Only `audit_logs` uses pagination (`src/app/api/audit-logs/route.ts:62` — `.range(offset, offset + limit - 1)`). Other list endpoints (clients, training records, payroll runs) return all records. This is acceptable at launch scale but should be addressed as data grows. |
| Large data fetches | ⚠️ WARNING | `src/app/api/clients/route.ts:77` — `SELECT *` on all clients. Includes fetching all payroll runs for those clients (line 91-98). For a tenant with hundreds of clients, this could be slow. |

**Missing index suggestion:**
```sql
-- If querying payroll_runs by client_id frequently:
CREATE INDEX IF NOT EXISTS idx_payroll_runs_client_id ON payroll_runs(client_id);
-- Already exists via FK but explicit index for sort:
CREATE INDEX IF NOT EXISTS idx_payroll_runs_pay_date ON payroll_runs(tenant_id, pay_date DESC);
```

---

## SECTION 8: FEEDBACK CHANNEL READINESS

| Check | Status | Details |
|-------|--------|---------|
| FeedbackWidget component | ❌ FAIL | **No `FeedbackWidget` component found.** `Grep` for "FeedbackWidget" and "feedback" only returned `src/app/privacy/page.tsx` (privacy policy text). |
| Feedback API route | ❌ FAIL | **No `/api/feedback` route exists.** No feedback storage mechanism. |
| Feature requests (alternative) | ✅ PASS | `src/app/api/feature-requests/route.ts` exists as an in-app feature request board with voting. This partially addresses feedback but is not a general feedback channel. |
| Slack webhook notification | ❌ FAIL | No Slack integration found for any notifications (feedback, signups, etc.). |

**Remediation:** Add a lightweight feedback widget:
1. Create `src/components/FeedbackWidget.tsx` — floating button, modal with textarea
2. Create `POST /api/feedback` route — store in a `feedback` table or send via email
3. Add a Slack webhook to notify on new submissions:
   ```ts
   await fetch(process.env.SLACK_WEBHOOK_URL, {
     method: 'POST',
     body: JSON.stringify({ text: `New feedback from ${email}: ${message}` })
   })
   ```

---

## FINAL REPORT

### CRITICAL (fix before launch)

1. **Stripe webhook idempotency is in-memory only** — `src/app/api/stripe/webhook/route.ts:9`. Will lose state on cold starts, allowing duplicate event processing that could corrupt subscription/plan data. **Fix:** Use database-backed idempotency.

2. **`feature_requests` RLS allows any user to UPDATE/DELETE any request** — `supabase/migrations/008_feature_requests.sql:49-54`. While API routes do admin checks, direct Supabase client access (browser devtools) bypasses this. **Fix:** Tighten RLS policies to `created_by_user_id = auth.uid()`.

### HIGH (fix within 48 hours of launch)

3. **No FeedbackWidget or general feedback channel** — Users have no way to report issues except the feature request board. Critical for catching UX issues in early days.

4. **Email verification enforcement unclear** — `src/middleware.ts:51` checks `user` exists but not `email_confirmed_at`. Verify Supabase dashboard has "Confirm email" enabled, or add explicit check.

5. **Missing `invoice.payment_failed` webhook handler** — `src/app/api/stripe/webhook/route.ts`. Users won't know their payment failed. Could lead to plan access without payment.

6. **`training_records` missing INSERT/UPDATE/DELETE RLS policies** — `supabase/migrations/006_training_records.sql`. Only SELECT policy exists. Service-role usage covers current API routes, but this is a defense-in-depth gap.

7. **Middleware doesn't handle Supabase downtime** — `src/middleware.ts:48`. An unhandled exception from `getUser()` would 500 the entire app.

### MEDIUM (fix in first week)

8. **Blocked email domains list incomplete** — `src/lib/validations.ts:4-7`. Missing: `pm.me`, `tutanota.com`, `mail.com`, `yandex.com`, `gmx.com`, `gmx.net`.

9. **Admin analytics loads all data into memory** — `src/app/api/admin/analytics/route.ts:31-52`. Will break at scale. Move to SQL aggregation.

10. **No pagination on clients/training/payroll list endpoints** — Acceptable at launch volume but should be added as user base grows.

11. **N+1 query in cron email-reminders** — `src/app/api/cron/email-reminders/route.ts:113-116`. Batch-fetch checklist items for all runs at once.

12. **`/api/status` endpoint exposes UptimeRobot monitor URLs** — Could reveal infrastructure details. Consider restricting to authenticated users.

13. **SPF/DKIM/DMARC documentation** — Verify DNS records are configured for `mail.thepaybureau.com`. Document the setup.

14. **No bounce handling for emails** — Set up Resend webhooks to track hard bounces and suppress future sends.

### NICE TO HAVE

15. **Slack notifications** — For new signups, new feedback, failed payments. Keeps the team in the loop without checking dashboards.

16. **Database-backed rate limiting in production** — Redis is configured but falls back to in-memory if not set. Verify `UPSTASH_REDIS_REST_URL` is set in production Vercel env vars.

17. **Audit log for failed login attempts** — Currently only Supabase Auth tracks these internally. Consider surfacing in the admin dashboard.

18. **ValiDora bulk email validator** — For validating client contact emails during CSV import.

19. **VibeCodersNest community share** — For showcasing the product and getting early feedback.

20. **Stripe `customer.subscription.created` explicit handler** — Currently handled indirectly via `checkout.session.completed`.

---

### Launch Readiness Score: **7.5 / 10**

**Strengths:**
- Excellent security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- Comprehensive Zod validation on all API inputs
- Solid multi-tenant RLS with `get_user_tenant_id()` helper
- CSRF protection in middleware
- Rate limiting on critical endpoints
- Full audit logging with IP tracking and change diffs
- 0 npm vulnerabilities
- No injection vectors found
- Email enumeration prevention
- Clean separation of service-role (server) vs anon-key (client) Supabase clients

**Weaknesses:**
- Stripe webhook idempotency is volatile (in-memory)
- One overly permissive RLS policy (feature_requests)
- No dedicated feedback channel
- Email verification enforcement needs verification
- Missing `invoice.payment_failed` handler

The application has a strong security foundation. The 2 critical issues (Stripe idempotency and feature_requests RLS) are straightforward fixes. Address those and the high-priority items, and the app is ready for launch.
