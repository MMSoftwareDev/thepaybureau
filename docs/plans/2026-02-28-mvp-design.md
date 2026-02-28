# ThePayBureau Pro — MVP Design

**Date:** 2026-02-28
**Status:** Approved
**Approach:** Evolve existing codebase (Approach A)

## Product Summary

A personal payroll case tracker for individual bureau specialists. The specialist adds their clients, configures pay frequencies and custom checklists, and tracks each pay period's progress. HMRC filing deadlines are auto-calculated.

**Target user:** Individual payroll specialist (free tier)
**Core value:** "Never Miss Another Payroll Deadline"
**Future:** Data flows into a manager dashboard for bureau owners (v2)

## Pages (4 total)

| Route | Purpose |
|-------|---------|
| `/dashboard` | KPI cards (Total Clients, Due This Week, Overdue, Completed This Month) + upcoming deadlines list |
| `/dashboard/clients` | Client list + full onboarding form (5-step: company, payroll config, pension, contact, checklist template) |
| `/dashboard/payrolls` | Client list with status badges. Click row → expand checklist with tick boxes. Filters: All / Due This Week / Overdue / Complete |
| `/dashboard/settings` | Profile, default checklist template, preferences |

## Database Schema

### Modified: `clients`

New columns added to existing table:

| Column | Type | Purpose |
|--------|------|---------|
| `paye_reference` | text | HMRC PAYE reference |
| `accounts_office_ref` | text | HMRC accounts office reference |
| `pay_frequency` | enum | `weekly`, `fortnightly`, `four_weekly`, `monthly` |
| `pay_day` | text | e.g., "last_friday", "28", "monday" |
| `tax_period_start` | date | Tax year payroll start |
| `pension_provider` | text | e.g., "NEST", "NOW Pensions" |
| `pension_staging_date` | date | Auto-enrolment staging date |
| `contact_name` | text | Primary payroll contact |
| `contact_email` | text | Contact email |
| `contact_phone` | text | Contact phone |

### New: `checklist_templates`

Defines the steps a client needs each pay period.

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `client_id` | uuid FK → clients |
| `name` | text |
| `sort_order` | int |
| `is_active` | bool |
| `created_at` | timestamp |

### New: `payroll_runs`

One record per client per pay period.

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `client_id` | uuid FK → clients |
| `tenant_id` | uuid FK → tenants |
| `period_start` | date |
| `period_end` | date |
| `pay_date` | date |
| `status` | enum (`not_started`, `in_progress`, `complete`, `overdue`) |
| `rti_due_date` | date |
| `eps_due_date` | date |
| `notes` | text |
| `created_at` | timestamp |
| `updated_at` | timestamp |

### New: `checklist_items`

Actual checklist entries for a specific payroll run.

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `payroll_run_id` | uuid FK → payroll_runs |
| `template_id` | uuid FK → checklist_templates |
| `name` | text |
| `is_completed` | bool |
| `completed_at` | timestamp |
| `completed_by` | uuid FK → users |
| `sort_order` | int |

### RLS Policies

All new tables get tenant-scoped RLS:
- `checklist_templates` → via `client_id → clients.tenant_id`
- `payroll_runs` → direct `tenant_id` column
- `checklist_items` → via `payroll_run_id → payroll_runs.tenant_id`

## HMRC Deadline Engine

Pure utility at `src/lib/hmrc-deadlines.ts`. No API calls.

**Pay date calculation** from `pay_frequency` + `pay_day`:
- `monthly`: Day of month or "last_friday" etc.
- `weekly`: Every 7 days from reference date
- `fortnightly`: Every 14 days
- `four_weekly`: Every 28 days

**Filing deadlines** (per pay date):
- **FPS (RTI):** On or before the pay date
- **EPS:** 19th of month following the tax month containing the pay date
- **PAYE payment:** 22nd of following month (electronic)

Tax months run 6th to 5th (tax month 1 = 6 Apr – 5 May).

**Status derivation** (computed client-side, not stored):
- `overdue` — pay date passed, checklist incomplete
- `due_soon` — pay date within 5 days, not complete
- `in_progress` — some items ticked, not all
- `complete` — all items ticked
- `not_started` — no items ticked, pay date > 5 days away

## API Routes

### Direct Supabase (client-side, RLS-protected)
- List/add/edit clients
- List/add/edit/reorder checklist templates
- Toggle checklist items
- List payroll runs
- Update payroll run notes

### Server-side API routes
| Route | Purpose |
|-------|---------|
| `POST /api/clients` | Create client + templates + first payroll run |
| `POST /api/payroll-runs/generate` | Generate next period for a client |
| `GET /api/dashboard/stats` | Aggregate KPIs |

## Data Flows

**Adding a client:**
1. User fills 5-step form
2. POST /api/clients → insert client, templates, calculate first pay date, create payroll_run, copy templates to checklist_items

**Daily workflow:**
1. Open /dashboard/payrolls → query payroll_runs joined with clients
2. Status calculated client-side from deadlines + checklist completion
3. Click row → fetch checklist_items → tick off tasks
4. All ticked → status becomes "complete"

**Period rollover:**
1. User clicks "Generate next period" on completed run
2. POST /api/payroll-runs/generate → calculate next dates, create run, copy templates

## File Change Inventory

**Keep as-is (~10 files):** Auth pages, Supabase clients, theme, UI components, utils, layout, CSS

**Modify (~9 files):** Sidebar (strip to 4 items), dashboard page (real data), clients page/form (payroll fields), API routes (extend), database types, validations, register route

**Create (~6 files):** hmrc-deadlines.ts, payrolls page, settings page, payroll-runs API, dashboard stats API, migration SQL

**Delete (~15 files):** All stub dashboard pages (payroll-overview, your-payrolls, timesheet, contracts, invoices, compliance, pension-compliance, reports, benchmarking), onboarding pages, unused API stubs (contracts, invoices, onboarding, payments, webhooks)
