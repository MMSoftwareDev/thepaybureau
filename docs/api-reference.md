# ThePayBureau API Reference

Complete API documentation for all 42 route handlers. All API routes are under `/api/`.

**Base URL:** `https://app.thepaybureau.com/api`

**Common error format:**
```json
{ "error": "Error message string" }
```

**Authentication methods:**
- **Cookie session** -- Supabase Auth cookie via `getAuthUser()`. Used by most routes.
- **Admin email check** -- Cookie session + email must be in `PLATFORM_ADMIN_EMAILS` env var.
- **CRON_SECRET bearer** -- `Authorization: Bearer <CRON_SECRET>` header.
- **Stripe signature** -- `stripe-signature` header verified against `STRIPE_WEBHOOK_SECRET`.
- **API key** -- `x-api-key` header containing a `tpb_live_*` key, verified via SHA-256 hash lookup.
- **None** -- Unauthenticated, intentionally public.

---

## Table of Contents

1. [System](#1-system)
2. [Auth](#2-auth)
3. [Clients](#3-clients)
4. [Payrolls](#4-payrolls)
5. [Payroll Runs](#5-payroll-runs)
6. [Dashboard](#6-dashboard)
7. [Pensions](#7-pensions)
8. [Training](#8-training)
9. [Audit Logs](#9-audit-logs)
10. [Feature Requests](#10-feature-requests)
11. [Feedback](#11-feedback)
12. [Badges](#12-badges)
13. [Settings](#13-settings)
14. [Users](#14-users)
15. [Account](#15-account)
16. [Stripe](#16-stripe)
17. [AI Assistant](#17-ai-assistant)
18. [External API](#18-external-api)
19. [Admin](#19-admin)
20. [Cron](#20-cron)

---

## 1. System

### `GET /api/health`

Health check endpoint.

| Field | Value |
|-------|-------|
| **Auth** | None |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

---

### `GET /api/status`

Fetches UptimeRobot monitor statuses. Cached for 60 seconds.

| Field | Value |
|-------|-------|
| **Auth** | None |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "monitors": [
    {
      "id": 123456,
      "name": "App",
      "status": 2,
      "url": "https://app.thepaybureau.com"
    }
  ]
}
```

UptimeRobot status codes: `0` = paused, `1` = not checked yet, `2` = up, `8` = seems down, `9` = down.

**Error responses:**
| Code | Message |
|------|---------|
| `503` | `UptimeRobot API key not configured` |
| `502` | `Failed to fetch status` |

---

## 2. Auth

### `POST /api/auth/register`

Register a new user account, tenant, and user profile.

| Field | Value |
|-------|-------|
| **Auth** | None |
| **Rate limit** | 5 per IP per 15 minutes |

**Request body** (validated by `adminRegistrationSchema`):

| Field | Type | Constraints |
|-------|------|-------------|
| `email` | `string` | Valid email. Must not be a personal provider (gmail, outlook, hotmail, yahoo, etc.) or disposable domain. Domain must have valid MX records. |
| `password` | `string` | Min 8 chars. Must include lowercase, uppercase, digit, and special character. |
| `companyName` | `string` | Min 1, max 255 |
| `adminName` | `string` | Min 1, max 255 |
| `phone` | `string` | Optional |

**Response `200` (success):**
```json
{
  "success": true,
  "message": "Account created successfully! Please check your email to verify your account."
}
```

**Response `200` (user already exists -- same shape to prevent email enumeration):**
```json
{
  "success": true,
  "message": "If this email is not already registered, you will receive a verification email shortly."
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many registration attempts. Please try again later.` (includes `Retry-After` header) |
| `400` | `This email domain does not appear to accept emails. Please use a valid business email.` |
| `400` | `We could not verify this email domain. Please check the address and try again.` |
| `400` | `Failed to create account. Please try again.` |
| `400` | Zod validation error: `{ error: "Validation error", details: [...] }` |
| `500` | `Failed to create account` / `Failed to setup company account` / `Failed to setup user profile` |

---

## 3. Clients

### `GET /api/clients`

List all clients for the authenticated user's tenant.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:** Array of client objects, ordered by `created_at` descending. Returns `[]` if none.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `400` | `Failed to fetch clients` |
| `500` | `Internal server error` / `Failed to create tenant` / `Failed to create user` |

---

### `POST /api/clients`

Create a new client. Checks plan client limit before creation.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Request body** (validated by `createClientSchema`):

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | `string` | **Required.** Min 1, max 255 |
| `company_number` | `string` | Optional, max 20 |
| `industry` | `string` | Optional |
| `employee_count` | `number` | Optional, integer, positive |
| `status` | `string` | Optional. Enum: `active`, `inactive`. Default: `active` |
| `address` | `object` | Optional. `{ street?, city?, postcode?, country? }` |
| `contact_name` | `string` | Optional |
| `contact_email` | `string` | Optional. Valid email or empty string |
| `contact_phone` | `string` | Optional |
| `email` | `string` | Optional. Valid email or empty string |
| `phone` | `string` | Optional |
| `notes` | `string` | Optional |
| `domain` | `string` | Optional |
| `secondary_contact_name` | `string` | Optional |
| `secondary_contact_email` | `string` | Optional. Valid email or empty string |
| `secondary_contact_phone` | `string` | Optional |
| `accountant_name` | `string` | Optional |
| `accountant_email` | `string` | Optional. Valid email or empty string |
| `accountant_phone` | `string` | Optional |
| `vat_number` | `string` | Optional |
| `utr` | `string` | Optional |
| `cis_registered` | `boolean` | Optional |
| `sic_code` | `string` | Optional |
| `hmrc_agent_authorised` | `boolean` | Optional |
| `auto_enrolment_status` | `string` | Optional. Enum: `enrolled`, `exempt`, `currently_not_required` |
| `company_type` | `string` | Optional. Enum: `ltd`, `llp`, `sole_trader`, `charity`, `public_sector`, `partnership` |
| `incorporation_date` | `string` | Optional |
| `fee` | `string` | Optional |
| `billing_frequency` | `string` | Optional. Enum: `monthly`, `per_run`, `quarterly`, `annually` |
| `payment_method` | `string` | Optional. Enum: `bacs`, `standing_order`, `card`, `invoice`, `direct_debit` |
| `contract_type` | `string` | Optional. Enum: `fixed_term`, `rolling` |
| `start_date` | `string` | Optional |
| `contract_end_date` | `string` | Optional |
| `notice_period_value` | `number` | Optional. Integer, positive |
| `notice_period_unit` | `string` | Optional. Enum: `days`, `weeks`, `months` |
| `assigned_to` | `string` | Optional. UUID or empty string |
| `referral_source` | `string` | Optional |
| `bacs_bureau_number` | `string` | Optional |
| `tags` | `string[]` | Optional |
| `document_storage_url` | `string` | Optional. Valid URL or empty string |
| `portal_access_enabled` | `boolean` | Optional |

**Response `200`:** The created client object.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `403` | `Client limit reached. Upgrade your plan to add more clients.` (includes `limit` and `upgrade: true`) |
| `400` | `Failed to create client` / Zod validation error |
| `500` | `Internal server error` |

---

### `GET /api/clients/[id]`

Fetch a single client with checklist templates and payroll runs.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Path parameters:** `id` -- Client UUID

**Response `200`:** Client object with embedded `checklist_templates` array and `payroll_runs` array (ordered by `pay_date` descending).

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Client not found` |
| `400` | `Failed to fetch client` |
| `500` | `Internal server error` |

---

### `PUT /api/clients/[id]`

Update a client. All fields optional. Supports updating checklist templates.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Path parameters:** `id` -- Client UUID

**Request body:** Same fields as `createClientSchema` (all optional), plus:

| Field | Type | Constraints |
|-------|------|-------------|
| `checklist_templates` | `array` | Optional. `[{ name: string (min 1, max 255), sort_order: number (int, min 0) }]` |
| `paye_reference` | `string` | Optional |
| `accounts_office_ref` | `string` | Optional, max 13 |
| `pay_frequency` | `string` | Optional. Enum: `weekly`, `two_weekly`, `four_weekly`, `monthly`, `annually` |
| `pay_day` | `string` | Optional |
| `period_start` | `string` | Optional |
| `period_end` | `string` | Optional |
| `payroll_software` | `string` | Optional |
| `employment_allowance` | `boolean` | Optional |
| `pension_provider` | `string` | Optional |
| `pension_staging_date` | `string` | Optional |
| `pension_reenrolment_date` | `string` | Optional |
| `declaration_of_compliance_deadline` | `string` | Optional |
| `payroll_contact_name` | `string` | Optional |
| `payroll_contact_email` | `string` | Optional. Valid email or empty string |
| `payroll_contact_phone` | `string` | Optional |
| `tpas_authorised` | `boolean` | Optional |
| `auto_enrolment_status` | `string` | Optional. Enum: `enrolled`, `exempt`, `postponed` |
| `registered_address` | `object` | Optional. `{ street?, city?, postcode?, country? }` |
| `director_name` | `string` | Optional |
| `payment_method` | `string` | Optional (free text in update schema) |

**Response `200`:** Updated client object.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Client not found` |
| `400` | `Failed to update client` / `Failed to update checklist templates` / Zod validation error with field details |
| `500` | `Internal server error` |

---

### `DELETE /api/clients/[id]`

Delete a client and all related records (cascades).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Path parameters:** `id` -- Client UUID

**Response `200`:**
```json
{ "message": "Client deleted successfully", "id": "uuid" }
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Client not found` |
| `400` | `Failed to delete client` |
| `500` | `Internal server error` |

---

### `GET /api/clients/export`

Export clients as CSV file. Supports filtering.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 5 per IP per 15 minutes |

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | `string` | Filter by name, contact_name, contact_email, domain, or company_number (ilike) |
| `status` | `string` | Filter by status. Use `all` to skip filter |
| `industry` | `string` | Filter by industry. Use `all` to skip filter |

**Response `200`:** CSV file download (`text/csv`). Filename: `clients-YYYY-MM-DD.csv`. Max 5000 rows. Contains 42 columns covering all client fields.

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to export clients` |
| `500` | `Internal server error` |

---

### `POST /api/clients/import`

Bulk import clients from parsed CSV data. Batched inserts (chunks of 50). Creates checklist templates and first payroll run for each imported client.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 5 per IP per 15 minutes |

**Request body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `clients` | `array` | **Required.** Min 1, max 500. Each object has all standard client fields plus payroll fields (`paye_reference`, `pay_frequency`, `pay_day`, `payroll_software`, `pension_provider`). `pay_frequency` defaults to `monthly`, `pay_day` defaults to `last_day_of_month`. |

**Response `200`:**
```json
{
  "total": 100,
  "successful": 98,
  "failed": 2,
  "results": [
    { "row": 1, "name": "Acme Ltd", "success": true, "clientId": "uuid" },
    { "row": 2, "name": "Bad Co", "success": false, "error": "error message" }
  ]
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many import attempts. Please try again later.` |
| `401` | `Unauthorized` |
| `403` | `Client limit reached.` / `Import would exceed your plan limit.` (includes `limit`, `remaining`, `upgrade: true`) |
| `404` | `User not found` |
| `400` | Zod validation error |
| `500` | `Internal server error` |

---

## 4. Payrolls

### `GET /api/payrolls`

List all payroll configurations for the tenant, with client names and latest run info.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:** Array of payroll objects. Each includes:
- `clients` -- joined `{ name }` object
- `latestRun` -- `{ id, pay_date, status }` or `null`

Returns `[]` if none.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to fetch payrolls` |
| `500` | `Internal server error` |

---

### `POST /api/payrolls`

Create a new payroll configuration. Also creates checklist templates and the first payroll run with calculated dates.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Request body** (validated by `createPayrollSchema`):

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | `string` | **Required.** Min 1, max 255 |
| `client_id` | `string` | **Required.** UUID. Must belong to same tenant |
| `pay_frequency` | `string` | **Required.** Enum: `weekly`, `two_weekly`, `four_weekly`, `monthly`, `annually` |
| `pay_day` | `string` | **Required.** Min 1 |
| `paye_reference` | `string` | Optional |
| `accounts_office_ref` | `string` | Optional, max 13 |
| `period_start` | `string` | Optional |
| `period_end` | `string` | Optional |
| `payroll_software` | `string` | Optional |
| `employment_allowance` | `boolean` | Optional |
| `pension_provider` | `string` | Optional |
| `pension_staging_date` | `string` | Optional |
| `pension_reenrolment_date` | `string` | Optional |
| `declaration_of_compliance_deadline` | `string` | Optional |
| `checklist_items` | `array` | **Required.** Min 1. `[{ name: string (min 1), sort_order: number (int) }]` |

**Response `200`:** Created payroll object with embedded `checklist_templates` and `payroll_run`.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Client not found` |
| `400` | `Failed to create payroll` / `Failed to create checklist templates` / Zod validation error |
| `500` | `Internal server error` |

---

### `GET /api/payrolls/[id]`

Fetch a single payroll with client name, checklist templates, and payroll runs.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Path parameters:** `id` -- Payroll UUID

**Response `200`:** Payroll object with `clients`, `checklist_templates`, and `payroll_runs` arrays.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Payroll not found` |
| `400` | `Failed to fetch payroll` |
| `500` | `Internal server error` |

---

### `PUT /api/payrolls/[id]`

Update a payroll configuration. Optionally replaces checklist templates.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Path parameters:** `id` -- Payroll UUID

**Request body** (validated by `updatePayrollSchema`):

All fields from `createPayrollSchema` are optional, plus:

| Field | Type | Constraints |
|-------|------|-------------|
| `status` | `string` | Optional. Enum: `active`, `inactive` |
| `checklist_templates` | `array` | Optional. `[{ name: string (min 1), sort_order: number (int) }]`. Replaces all existing templates when provided. |

**Response `200`:** Updated payroll object.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Payroll not found` |
| `400` | `Failed to update payroll` / Zod validation error with field details |
| `500` | `Internal server error` |

---

### `DELETE /api/payrolls/[id]`

Delete a payroll and all related records.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Path parameters:** `id` -- Payroll UUID

**Response `200`:**
```json
{ "message": "Payroll deleted successfully", "id": "uuid" }
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Payroll not found` |
| `400` | `Failed to delete payroll` |
| `500` | `Internal server error` |

---

## 5. Payroll Runs

### `POST /api/payroll-runs/actions`

Perform actions on payroll runs: toggle checklist items, mark all complete, save notes, add steps.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 30 per IP per 60 seconds |

**Request body** (discriminated union on `action` field):

#### Action: `toggle_item`

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | `string` | `"toggle_item"` |
| `item_id` | `string` | UUID |
| `is_completed` | `boolean` | |

**Response `200`:**
```json
{ "success": true, "newBadges": [] }
```

#### Action: `mark_all_complete`

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | `string` | `"mark_all_complete"` |
| `payroll_run_id` | `string` | UUID |

**Response `200`:**
```json
{ "success": true, "completed": 5, "newBadges": [] }
```

#### Action: `save_notes`

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | `string` | `"save_notes"` |
| `payroll_run_id` | `string` | UUID |
| `notes` | `string` | Max 5000 chars |

**Response `200`:**
```json
{ "success": true }
```

#### Action: `add_step`

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | `string` | `"add_step"` |
| `payroll_run_id` | `string` | UUID |
| `name` | `string` | Min 1, max 255 |
| `sort_order` | `number` | Integer, min 0 |

**Response `200`:** The created checklist item object.

**Error responses (all actions):**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `404` | `User not found` / `Item not found` / `Payroll run not found` |
| `400` | `Failed to update` / `Failed to add step` / Zod validation error |
| `500` | `Internal server error` |

---

### `POST /api/payroll-runs/generate`

Generate the next payroll run for a payroll. Calculates dates based on pay frequency, pay day, and the last run's pay date.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Request body** (validated by `generatePayrollRunSchema`):

| Field | Type | Constraints |
|-------|------|-------------|
| `payroll_id` | `string` | **Required.** UUID |

**Response `200`:** Created payroll run object with `checklist_items` array.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Payroll not found` |
| `400` | `Payroll is missing pay frequency or pay day configuration` / `Failed to generate payroll run` / Zod validation error |
| `500` | `Internal server error` |

---

## 6. Dashboard

### `GET /api/dashboard/stats`

Fetch comprehensive dashboard statistics. Includes KPIs, action items, charts, activity feed, pension alerts, and trend data.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "todayRuns": [{ "id", "clientName", "clientId", "payDate", "status", "totalSteps", "completedSteps", "currentStep" }],
  "overdueRuns": [{ "id", "clientName", "clientId", "payDate", "daysOverdue", "totalSteps", "completedSteps" }],
  "thisWeekRuns": [{ "id", "clientName", "clientId", "payDate", "status", "totalSteps", "completedSteps", "daysUntil" }],
  "actionRequired": [{ "id", "clientName", "clientId", "payDate", "severity": "red|amber|neutral", "reason", "daysOverdue?", "daysUntil?" }],
  "periodProgress": { "total", "complete", "inProgress", "notStarted" },
  "totalClients": 25,
  "totalEmployees": 500,
  "dueThisWeek": 3,
  "overdue": 1,
  "completedThisMonth": 10,
  "upcomingDeadlines": [{ "clientName", "type": "FPS|EPS", "date", "payrollRunId" }],
  "payrollStatusBreakdown": [{ "name", "value" }],
  "clientStatusDistribution": [{ "name", "value" }],
  "payFrequencyDistribution": [{ "name", "value" }],
  "completionTrend": [{ "month", "completed", "total" }],
  "recentActivity": [{ "id", "type", "description", "timestamp" }],
  "pensionOverdue": 2,
  "pensionDueSoon": 1
}
```

Payroll runs are scoped to last 6 months + 31 days ahead. `actionRequired` limited to 10 items. `upcomingDeadlines` limited to 10. `recentActivity` limited to 5.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `500` | `Internal server error` / `Failed to create tenant` / `Failed to create user` / `Failed to resolve user` |

---

## 7. Pensions

### `GET /api/pensions`

List all clients with pension-related fields for the tenant.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:** Array of objects with fields: `id`, `name`, `status`, `pension_provider`, `pension_staging_date`, `pension_reenrolment_date`, `declaration_of_compliance_deadline`. Ordered by name ascending.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to fetch pension data` |
| `500` | `Internal server error` |

---

### `PUT /api/pensions`

Update pension-related fields for a specific client.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Request body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `client_id` | `string` | **Required.** UUID |
| `pension_provider` | `string` | Optional |
| `pension_staging_date` | `string\|null` | Optional, nullable |
| `pension_reenrolment_date` | `string\|null` | Optional, nullable |
| `declaration_of_compliance_deadline` | `string\|null` | Optional, nullable |

**Response `200`:** Updated client object (pension fields only).

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Client not found` |
| `400` | `Failed to update pension details` / Zod validation error |
| `500` | `Internal server error` |

---

## 8. Training

### `GET /api/training`

List all training records for the tenant.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:** Array of training record objects, ordered by `created_at` descending.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to fetch training records` |
| `500` | `Internal server error` |

---

### `POST /api/training`

Create a new training record.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Request body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | `string` | **Required.** Min 1, max 500 |
| `provider` | `string\|null` | Optional, max 255 |
| `category` | `string\|null` | Optional. Enum: `hmrc_webinar`, `cipp_webinar`, `online_course`, `conference`, `workshop`, `self_study`, `other` |
| `url` | `string\|null` | Optional. Valid URL (max 2000) or empty string |
| `notes` | `string\|null` | Optional, max 2000 |
| `completed` | `boolean` | Optional |
| `completed_date` | `string\|null` | Optional |

**Response `200`:** Created training record object.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to save training record` / Zod validation error |
| `500` | `Internal server error` |

---

### `PUT /api/training`

Update a training record.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Request body:** Same as POST (all optional), plus:

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `string` | **Required.** UUID |

**Response `200`:** Updated training record object.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Record not found` |
| `400` | `Failed to save training record` / Zod validation error |
| `500` | `Internal server error` |

---

### `DELETE /api/training`

Delete a training record.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Query parameters:**

| Param | Type | Constraints |
|-------|------|-------------|
| `id` | `string` | **Required.** UUID |

**Response `200`:**
```json
{ "message": "Deleted", "id": "uuid" }
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Record not found` |
| `400` | `Missing id` / `Failed to delete` |
| `500` | `Internal server error` |

---

## 9. Audit Logs

### `GET /api/audit-logs`

List audit logs with pagination and filtering.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `50` | Results per page (max 100) |
| `resource_type` | `string` | -- | Filter by resource type |
| `action` | `string` | -- | Filter by action (CREATE, UPDATE, DELETE) |
| `search` | `string` | -- | Search in resource_name and user_email (safe chars only, max 100) |
| `from` | `string` | -- | Filter by created_at >= value |
| `to` | `string` | -- | Filter by created_at <= value |

**Response `200`:**
```json
{
  "logs": [...],
  "total": 250,
  "page": 1,
  "limit": 50,
  "totalPages": 5
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to fetch audit logs` |
| `500` | `Internal server error` |

---

### `GET /api/audit-logs/export`

Export audit logs as CSV file. Same filters as list endpoint.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 5 per IP per 15 minutes |

**Query parameters:** Same as `GET /api/audit-logs` (except `page` and `limit` -- exports up to 5000 rows).

**Response `200`:** CSV file download (`text/csv`). Filename: `audit-log-YYYY-MM-DD.csv`. Columns: Date, User, Action, Resource Type, Resource Name, Changes, IP Address.

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to export audit logs` |
| `500` | `Internal server error` |

---

## 10. Feature Requests

### `GET /api/feature-requests`

List all feature requests with vote counts and user vote status.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `sort` | `string` | `newest` (default), `oldest`, or `most_votes` |
| `status` | `string` | Filter by status. Use `all` or omit to show all |

**Response `200`:**
```json
{
  "requests": [
    {
      "id": "uuid",
      "title": "...",
      "description": "...",
      "status": "submitted",
      "created_by_email": "...",
      "created_by_name": "...",
      "vote_count": 5,
      "user_has_voted": true,
      "created_at": "..."
    }
  ]
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `500` | `Failed to fetch feature requests` |

---

### `POST /api/feature-requests`

Create a new feature request. Sends email notification to support.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 10 per IP per 15 minutes |

**Request body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | `string` | **Required.** Min 1, max 200 |
| `description` | `string` | Optional, max 2000 |

**Response `201`:**
```json
{
  "request": { "...created object...", "vote_count": 0, "user_has_voted": false }
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `400` | `Invalid input` with Zod details |
| `500` | `Failed to create feature request` |

---

### `PUT /api/feature-requests/[id]`

Update a feature request (admin only).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Path parameters:** `id` -- Feature request UUID

**Request body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | `string` | Optional, min 1, max 200 |
| `description` | `string` | Optional, max 2000 |
| `status` | `string` | Optional. Enum: `submitted`, `planned`, `considering`, `working_on`, `shipped`, `will_not_implement`, `future` |

**Response `200`:**
```json
{ "request": { "...updated object..." } }
```

**Error responses:**
| Code | Message |
|------|---------|
| `403` | `Forbidden` |
| `400` | `Invalid input` |
| `500` | `Failed to update` |

---

### `DELETE /api/feature-requests/[id]`

Delete a feature request (admin only).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Path parameters:** `id` -- Feature request UUID

**Response `200`:**
```json
{ "success": true }
```

**Error responses:**
| Code | Message |
|------|---------|
| `403` | `Forbidden` |
| `500` | `Failed to delete` |

---

### `POST /api/feature-requests/[id]/vote`

Toggle vote on a feature request (add vote if not voted, remove if already voted).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 20 per IP per 15 minutes |

**Path parameters:** `id` -- Feature request UUID

**Request body:** None.

**Response `200`:**
```json
{ "vote_count": 6, "user_has_voted": true }
```

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `500` | `Failed to vote` |

---

## 11. Feedback

### `POST /api/feedback`

Submit feedback. Sends email notification to support.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 10 per IP per 15 minutes |

**Request body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `category` | `string` | **Required.** Enum: `bug`, `improvement`, `other` |
| `message` | `string` | **Required.** Min 1, max 2000 |
| `page_url` | `string` | Optional, max 500 |

**Response `201`:**
```json
{ "success": true }
```

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `400` | `Invalid input` |
| `500` | `Failed to save feedback` |

---

## 12. Badges

### `GET /api/badges`

Fetch user badges, stats, and next badge progress.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "badges": [{ "badge_key", "badge_tier", "earned_at", "..." }],
  "stats": { "steps_completed", "payrolls_completed", "..." },
  "nextBadges": [
    {
      "badge_key": "steps",
      "badge_name": "Step Master",
      "badge_icon": "...",
      "next_tier": "bronze",
      "threshold": 50,
      "current": 23,
      "progress": 46,
      "description": "..."
    }
  ],
  "totalEarned": 3,
  "totalPossible": 20
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `500` | `Internal server error` |

---

## 13. Settings

### `GET /api/settings`

Fetch tenant checklist templates.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "templates": [
    {
      "id": "uuid-or-default",
      "name": "Standard Payroll",
      "is_default": true,
      "steps": [{ "name": "Receive payroll changes", "sort_order": 0 }]
    }
  ]
}
```

If no templates are saved, returns a single default template with 7 standard steps.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `500` | `Internal server error` |

---

### `POST /api/settings`

Perform settings actions: update profile, change password, update avatar, save checklist defaults/templates.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 20 per IP per 15 minutes |

**Request body** (discriminated union on `action` field):

#### Action: `update_profile`

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | `string` | `"update_profile"` |
| `name` | `string` | Min 1, max 255 |

#### Action: `change_password`

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | `string` | `"change_password"` |
| `password` | `string` | Min 8, max 128 |

#### Action: `update_avatar`

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | `string` | `"update_avatar"` |
| `avatar_url` | `string\|null` | Nullable |

#### Action: `save_checklist_defaults`

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | `string` | `"save_checklist_defaults"` |
| `checklist` | `array` | `[{ name: string (min 1, max 255), sort_order: number (int, min 0) }]` |

#### Action: `save_checklist_templates`

| Field | Type | Constraints |
|-------|------|-------------|
| `action` | `string` | `"save_checklist_templates"` |
| `templates` | `array` | Validated by `checklistTemplatesSchema`. Each: `{ id: string, name: string (min 1, max 100), is_default: boolean, steps: [{ name: string (min 1, max 255), sort_order: number }] }`. Min 1 template. Exactly one must be `is_default: true`. |

**Response `200` (all actions):**
```json
{ "success": true }
```

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to save settings` / `Exactly one template must be set as default` / Zod validation error |
| `500` | `Internal server error` |

---

## 14. Users

### `GET /api/users`

List active users in the tenant (for "Assigned To" dropdowns).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:** Array of `{ id, name, email }` objects, ordered by name ascending. Only active users.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to fetch users` |
| `500` | `Internal server error` |

---

## 15. Account

### `POST /api/account/delete`

Delete user account. Removes avatar files, deletes auth user (cascading to users table and related data).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 5 per IP per 60 minutes |

**Request body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `confirmation` | `string` | **Required.** Must be exactly `"DELETE MY ACCOUNT"` |

**Response `200`:**
```json
{ "success": true }
```

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Invalid confirmation` / `Invalid confirmation text` (Zod) |
| `500` | `Failed to delete account` / `Internal server error` |

---

### `GET /api/account/export`

Export all user and tenant data as a ZIP file (GDPR data export).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:** ZIP file download (`application/zip`). Filename: `thepaybureau-export-YYYY-MM-DD.zip`.

Contains CSV files:
- `account.csv` -- User profile
- `clients.csv` -- All tenant clients
- `payroll_runs.csv` -- All tenant payroll runs
- `checklist_items.csv` -- All tenant checklist items
- `training_records.csv` -- All tenant training records
- `audit_logs.csv` -- All tenant audit logs
- `badges.csv` -- User badges
- `stats.csv` -- User stats

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `500` | `Internal server error` |

---

## 16. Stripe

### `POST /api/stripe/checkout`

Create a Stripe Checkout session for subscription upgrade.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 10 per IP per 15 minutes |

**Request body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `plan` | `string` | **Required.** Must be a valid plan key from `PLANS` |
| `billingCycle` | `string` | Optional. `monthly` (default) or `annual` |

**Response `200`:**
```json
{ "url": "https://checkout.stripe.com/..." }
```

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `404` | `User not found` / `Tenant not found` |
| `400` | `Invalid plan` / `Free plan does not require checkout` / `Plan not available. Please contact support.` |
| `500` | `Failed to create checkout session` |

---

### `POST /api/stripe/portal`

Create a Stripe Billing Portal session.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | 10 per IP per 15 minutes |

**Request body:** None.

**Response `200`:**
```json
{ "url": "https://billing.stripe.com/..." }
```

**Error responses:**
| Code | Message |
|------|---------|
| `429` | `Too many requests. Please try again later.` |
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `No billing account found` |
| `500` | `Failed to create portal session` |

---

### `GET /api/stripe/subscription`

Fetch current subscription status and plan info.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "plan": "professional",
  "planName": "Professional",
  "subscription": {
    "id": "sub_...",
    "status": "active",
    "currentPeriodEnd": 1710000000,
    "cancelAtPeriodEnd": false
  },
  "hasStripeCustomer": true
}
```

`subscription` is `null` if no active subscription exists.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `Tenant not found` |
| `500` | `Failed to fetch subscription` |

---

### `POST /api/stripe/webhook`

Handle Stripe webhook events. Uses database-backed idempotency via `stripe_events` table.

| Field | Value |
|-------|-------|
| **Auth** | Stripe signature (`stripe-signature` header verified against `STRIPE_WEBHOOK_SECRET`) |
| **Rate limit** | None |

**Request body:** Raw Stripe event payload.

**Handled events:**
- `checkout.session.completed` -- Updates tenant plan from session metadata
- `customer.subscription.updated` -- Maps price ID to plan, updates tenant plan if subscription is active
- `customer.subscription.deleted` -- Downgrades tenant to `free`
- `invoice.payment_failed` -- Records payment failure timestamp and invoice ID in tenant settings

**Response `200`:**
```json
{ "received": true }
```

Or if deduplicated:
```json
{ "received": true, "deduplicated": true }
```

**Error responses:**
| Code | Message |
|------|---------|
| `400` | `Missing signature` / `Invalid signature` |
| `500` | `Webhook processing failed` |

---

## 17. AI Assistant

### `POST /api/ai-assistant/chat`

Send a message to the AI assistant. Returns a Server-Sent Events (SSE) stream. Creates a new conversation if `conversation_id` is not provided. Stores both user and assistant messages.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Request body** (validated by `aiChatSchema`):

| Field | Type | Constraints |
|-------|------|-------------|
| `message` | `string` | **Required.** Min 1, max 4000 |
| `conversation_id` | `string` | Optional. UUID of existing conversation |

**Response `200`:** SSE stream (`text/event-stream`).

Response headers include `X-Conversation-Id` with the conversation UUID.

SSE events:
- `data: {"type": "text", "content": "..."}` -- Streamed text chunks
- `data: {"type": "citations", "citations": [...]}` -- Source citations
- `data: {"type": "done", "model": "...", "usage": {...}}` -- Completion signal

**Conversation limit:** 20 messages per conversation (~10 exchanges).

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `429` | `{ error: "conversation_limit", message: "This conversation has reached its limit..." }` |
| `400` | Zod validation error |
| `500` | `Internal server error` / `Failed to create conversation` |

---

### `GET /api/ai-assistant/conversations`

List all conversations for the authenticated user.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:** Array of `{ id, title, created_at, updated_at }` objects, ordered by `updated_at` descending.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to fetch conversations` |
| `500` | `Internal server error` |

---

### `DELETE /api/ai-assistant/conversations`

Delete a conversation.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Query parameters:**

| Param | Type | Constraints |
|-------|------|-------------|
| `id` | `string` | **Required.** Conversation UUID |

**Response `200`:**
```json
{ "message": "Deleted", "id": "uuid" }
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `Conversation not found` |
| `400` | `Missing conversation id` / `Failed to delete conversation` |
| `500` | `Internal server error` |

---

### `GET /api/ai-assistant/conversations/messages`

Fetch all messages for a conversation.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Query parameters:**

| Param | Type | Constraints |
|-------|------|-------------|
| `conversation_id` | `string` | **Required.** UUID |

**Response `200`:** Array of `{ id, role, content, citations, created_at }` objects, ordered by `created_at` ascending.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `Conversation not found` |
| `400` | `Missing conversation_id` |
| `500` | `Internal server error` / `Failed to fetch messages` |

---

### `GET /api/ai-assistant/documents`

List all AI knowledge base documents (admin only).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Response `200`:** Array of document objects, ordered by `created_at` descending.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `400` | `Failed to fetch documents` |
| `500` | `Internal server error` |

---

### `POST /api/ai-assistant/documents`

Upload a new document to the AI knowledge base. Content is chunked, embedded, and stored in the background.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Request body** (validated by `aiDocumentUploadSchema`):

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | `string` | **Required.** Min 1, max 500 |
| `source_url` | `string` | Optional. Valid URL (max 2000) or empty string |
| `category` | `string` | Optional. Enum: `paye`, `nic`, `statutory_pay`, `pensions`, `rti`, `expenses`, `general` |
| `content` | `string` | **Required.** Min 1. The full document text |

**Response `201`:** Created document object (status will be `processing` initially).

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `400` | Zod validation error |
| `500` | `Internal server error` / `Failed to create document` |

---

### `DELETE /api/ai-assistant/documents`

Delete a document and its chunks from the knowledge base (admin only).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Query parameters:**

| Param | Type | Constraints |
|-------|------|-------------|
| `id` | `string` | **Required.** Document UUID |

**Response `200`:**
```json
{ "message": "Deleted", "id": "uuid" }
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `Document not found` |
| `400` | `Missing document id` / `Failed to delete document` |
| `500` | `Internal server error` |

---

### `GET /api/ai-assistant/documents/scrape`

Get HMRC guidance scrape status (admin only).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "total_seed_urls": 50,
  "scraped_count": 45,
  "ready": 43,
  "processing": 1,
  "errors": 1,
  "last_scrape": "2026-03-13T00:00:00.000Z"
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `500` | `Internal server error` |

---

### `POST /api/ai-assistant/documents/scrape`

Trigger a full scrape of HMRC payroll guidance. Compares content hashes to detect changes. Creates/updates documents with embeddings.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check **OR** `CRON_SECRET` bearer |
| **Rate limit** | None |
| **Max duration** | 300 seconds (5 minutes) |

**Request body:** None.

**Response `200`:**
```json
{
  "ok": true,
  "total_urls": 50,
  "new": 5,
  "updated": 2,
  "unchanged": 43,
  "errors": [{ "url": "...", "error": "..." }]
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `500` | `Scrape failed` with details |

---

### `GET /api/ai-assistant/documents/scrape-manuals`

Get HMRC manual scrape status per manual (admin only).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "total_manuals": 5,
  "manuals": [
    {
      "slug": "paye-manual",
      "title": "PAYE Manual",
      "scraped_count": 120,
      "ready": 118,
      "errors": 2,
      "last_scrape": "2026-03-13T00:00:00.000Z"
    }
  ],
  "scraped_count": 500,
  "ready": 490,
  "processing": 5,
  "errors": 5,
  "last_scrape": "2026-03-13T00:00:00.000Z"
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `500` | `Internal server error` |

---

### `POST /api/ai-assistant/documents/scrape-manuals`

Trigger a smart crawl of a single HMRC internal manual. Requires a `manual` query param.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check **OR** `CRON_SECRET` bearer |
| **Rate limit** | None |
| **Max duration** | 300 seconds (5 minutes) |

**Query parameters:**

| Param | Type | Constraints |
|-------|------|-------------|
| `manual` | `string` | **Required.** Manual slug (e.g., `paye-manual`) |

**Response `200`:**
```json
{
  "ok": true,
  "manual": "paye-manual",
  "manual_title": "PAYE Manual",
  "sections_found": 200,
  "sections_relevant": 150,
  "new": 10,
  "updated": 5,
  "unchanged": 135,
  "errors": [{ "url": "...", "error": "..." }]
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `400` | `Missing \`manual\` query parameter. Valid values: ...` / `Unknown manual: ...` |
| `500` | `Manual scrape failed` with details |

---

### `GET /api/ai-assistant/api-keys`

List all AI API keys for the tenant (shows prefix, not full key).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Response `200`:** Array of `{ id, name, key_prefix, scopes, rate_limit, is_active, last_used_at, expires_at, created_at }`.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | `Failed to fetch API keys` |
| `500` | `Internal server error` |

---

### `POST /api/ai-assistant/api-keys`

Create a new AI API key. The full key is returned only once on creation.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Request body** (validated by `aiApiKeyCreateSchema`):

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | `string` | **Required.** Min 1, max 255 |
| `rate_limit` | `number` | Optional. Integer, min 1, max 10000. Default: 100 |
| `expires_at` | `string` | Optional |

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "My Key",
  "key_prefix": "tpb_live_abc123",
  "rate_limit": 100,
  "created_at": "...",
  "key": "tpb_live_full_key_here..."
}
```

The `key` field contains the full API key and is **only returned on creation**.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` |
| `400` | Zod validation error |
| `500` | `Internal server error` / `Failed to create API key` |

---

### `DELETE /api/ai-assistant/api-keys`

Delete an AI API key.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session |
| **Rate limit** | None |

**Query parameters:**

| Param | Type | Constraints |
|-------|------|-------------|
| `id` | `string` | **Required.** API key UUID |

**Response `200`:**
```json
{ "message": "Deleted", "id": "uuid" }
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `404` | `User not found` / `API key not found` |
| `400` | `Missing API key id` / `Failed to delete API key` |
| `500` | `Internal server error` |

---

## 18. External API

### `POST /api/v1/payroll-ai/chat`

External AI chat endpoint for third-party integrations. Non-streaming. Authenticated via API key.

| Field | Value |
|-------|-------|
| **Auth** | API key (`x-api-key` header) |
| **Rate limit** | Per API key `rate_limit` setting per hour (default 100/hr). Rate limit headers included in response. |

**Request headers:**

| Header | Value |
|--------|-------|
| `x-api-key` | `tpb_live_*` API key |

**Request body** (validated by `aiExternalChatSchema`):

| Field | Type | Constraints |
|-------|------|-------------|
| `message` | `string` | **Required.** Min 1, max 4000 |
| `conversation_id` | `string` | Optional. UUID for conversation continuity |

**Response `200`:**
```json
{
  "answer": "According to HMRC guidance...",
  "citations": [
    {
      "document": "PAYE Manual",
      "section": "Section 12.3",
      "source_url": "https://www.gov.uk/..."
    }
  ],
  "conversation_id": "uuid-or-null",
  "usage": {
    "input_tokens": 1500,
    "output_tokens": 300
  }
}
```

**Response headers:**
- `X-RateLimit-Limit` -- Max requests per window
- `X-RateLimit-Remaining` -- Remaining requests

**Error responses:**
| Code | Message | Notes |
|------|---------|-------|
| `401` | `Invalid or missing API key` | Key not found, inactive, or expired |
| `429` | `Rate limit exceeded` | Includes `retry_after` in body and `X-RateLimit-*` headers |
| `400` | Zod validation error | |
| `500` | `Internal server error` | |

---

## 19. Admin

### `GET /api/admin/check`

Check if the current user is a platform admin.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session (gracefully returns `{ isAdmin: false }` if unauthenticated) |
| **Rate limit** | None |

**Response `200`:**
```json
{ "isAdmin": true }
```

Always returns 200. Returns `{ isAdmin: false }` if not authenticated or email not in admin list.

---

### `GET /api/admin/analytics`

Cross-tenant platform analytics dashboard. Uses service role to bypass RLS.

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "summary": {
    "totalUsers": 50,
    "totalTenants": 20,
    "totalClients": 300,
    "totalPayrollRuns": 1500,
    "activeUsers7d": 15,
    "activeUsers30d": 35,
    "newUsers30d": 5,
    "newClients30d": 25
  },
  "signupTrend": [{ "date": "2026-01-01", "signups": 2 }],
  "clientTrend": [{ "date": "2026-01-01", "clients": 5 }],
  "loginTrend": [{ "date": "2026-03-01", "logins": 10 }],
  "tenantBreakdown": [{
    "id", "name", "plan", "mode", "created_at",
    "userCount", "clientCount", "payrollRunCount", "totalEmployees", "lastLogin"
  }],
  "recentSignups": [{
    "id", "email", "name", "created_at", "last_sign_in_at", "tenant_id", "tenantName"
  }],
  "planDistribution": { "trial": 10, "professional": 8, "free": 2 }
}
```

Trends: `signupTrend` and `clientTrend` cover 90 days. `loginTrend` covers 30 days. `recentSignups` limited to 10.

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `403` | `Forbidden` |
| `500` | `Failed to load analytics` |

---

### `GET /api/admin/email-preview`

Preview email templates with sample data (admin only).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Response `200`:**
```json
{
  "compliance_deadline": { "subject": "...", "html": "..." },
  "payroll_incomplete": { "subject": "...", "html": "..." }
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `403` | `Forbidden` |

---

### `POST /api/admin/email-preview`

Send a test email to the admin's own address (admin only).

| Field | Value |
|-------|-------|
| **Auth** | Cookie session + admin email check |
| **Rate limit** | None |

**Request body:**

| Field | Type | Constraints |
|-------|------|-------------|
| `emailType` | `string` | **Required.** `compliance_deadline` or `payroll_incomplete` |

**Response `200`:**
```json
{ "ok": true, "sentTo": "admin@example.com" }
```

**Error responses:**
| Code | Message |
|------|---------|
| `403` | `Forbidden` |
| `400` | `Invalid email type` |
| `500` | `Failed to send` |

---

## 20. Cron

### `GET /api/cron/email-reminders`

Send automated email reminders. Two email types: compliance deadline (3 days ahead) and payroll incomplete (pay day is today). Deduplicates via `email_logs` table.

| Field | Value |
|-------|-------|
| **Auth** | `CRON_SECRET` bearer |
| **Rate limit** | None |
| **Max duration** | 60 seconds |

**Response `200`:**
```json
{
  "ok": true,
  "date": "2026-03-13",
  "sent": {
    "compliance_deadline": 2,
    "payroll_incomplete": 1
  },
  "errors": 0
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |

---

### `GET /api/cron/hmrc-scraper`

Cron job that triggers the HMRC guidance scraper by calling `POST /api/ai-assistant/documents/scrape` internally.

| Field | Value |
|-------|-------|
| **Auth** | `CRON_SECRET` bearer |
| **Rate limit** | None |
| **Max duration** | 300 seconds (5 minutes) |

**Response `200`:**
```json
{
  "ok": true,
  "trigger": "cron",
  "timestamp": "2026-03-13T00:00:00.000Z",
  "total_urls": 50,
  "new": 5,
  "updated": 2,
  "unchanged": 43,
  "errors": []
}
```

**Error responses:**
| Code | Message |
|------|---------|
| `401` | `Unauthorized` |
| `500` | `Scrape failed` / `Cron job failed` |

---

## Rate Limit Summary

| Route | Key | Limit | Window |
|-------|-----|-------|--------|
| `POST /api/auth/register` | `register:{ip}` | 5 | 15 min |
| `GET /api/clients/export` | `client-export:{ip}` | 5 | 15 min |
| `POST /api/clients/import` | `import:{ip}` | 5 | 15 min |
| `POST /api/payroll-runs/actions` | `payroll-actions:{ip}` | 30 | 60 sec |
| `POST /api/feature-requests` | `feature-req:{ip}` | 10 | 15 min |
| `POST /api/feature-requests/[id]/vote` | `vote:{ip}` | 20 | 15 min |
| `POST /api/feedback` | `feedback:{ip}` | 10 | 15 min |
| `POST /api/settings` | `settings:{ip}` | 20 | 15 min |
| `POST /api/account/delete` | `delete-account:{ip}` | 5 | 60 min |
| `GET /api/audit-logs/export` | `audit-export:{ip}` | 5 | 15 min |
| `POST /api/stripe/checkout` | `checkout:{ip}` | 10 | 15 min |
| `POST /api/stripe/portal` | `stripe-portal:{ip}` | 10 | 15 min |
| `POST /api/v1/payroll-ai/chat` | `ai_api:{keyId}:{ip}` | per-key `rate_limit` | 60 min |
