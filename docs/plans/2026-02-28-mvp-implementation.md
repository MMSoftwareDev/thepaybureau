# ThePayBureau Pro MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the existing Next.js + Supabase app into a personal payroll case tracker for individual bureau specialists, with HMRC deadline intelligence and customisable checklists.

**Architecture:** Evolve existing codebase. Keep auth, RLS, theme, and UI components. Add 3 new Supabase tables (checklist_templates, payroll_runs, checklist_items), extend clients table with payroll fields, build 4 focused pages (Dashboard, Clients, Payrolls, Settings), and delete 15 unused stub files.

**Tech Stack:** Next.js 16, React 19, Supabase (auth + DB + RLS), Tailwind CSS 4, shadcn/ui, Zod, date-fns, lucide-react

**Design doc:** `docs/plans/2026-02-28-mvp-design.md`

---

## Task 1: Database Migration — New Tables + Client Fields

**Files:**
- Create: `supabase/migrations/002_payroll_schema.sql`
- Modify: `src/types/database.ts`

**Step 1: Write the migration SQL**

Create `supabase/migrations/002_payroll_schema.sql`:

```sql
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
  template_id uuid REFERENCES public.checklist_templates(id) ON SET NULL,
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
```

**Step 2: Update TypeScript database types**

Modify `src/types/database.ts` — add the 3 new table types alongside existing ones, and extend the `clients` Row/Insert/Update types with the new payroll columns (`paye_reference`, `accounts_office_ref`, `pay_frequency`, `pay_day`, `tax_period_start`, `pension_provider`, `pension_staging_date`, `contact_name`, `contact_email`, `contact_phone`).

Add these new table types:
- `checklist_templates` with Row/Insert/Update
- `payroll_runs` with Row/Insert/Update
- `checklist_items` with Row/Insert/Update

**Step 3: Run migration in Supabase SQL Editor**

User action: Copy `002_payroll_schema.sql` into Supabase SQL Editor and run it.

**Step 4: Verify build**

Run: `npm run build`
Expected: Clean build, no TypeScript errors

**Step 5: Commit**

```bash
git add supabase/migrations/002_payroll_schema.sql src/types/database.ts
git commit -m "feat: add payroll schema — checklist_templates, payroll_runs, checklist_items tables"
```

---

## Task 2: HMRC Deadline Engine

**Files:**
- Create: `src/lib/hmrc-deadlines.ts`
- Create: `src/lib/__tests__/hmrc-deadlines.test.ts`

**Step 1: Write tests for the deadline engine**

Create `src/lib/__tests__/hmrc-deadlines.test.ts` with tests for:
- `calculateNextPayDate('monthly', '28', referenceDate)` → returns 28th of next month
- `calculateNextPayDate('monthly', 'last_friday', referenceDate)` → returns last Friday
- `calculateNextPayDate('weekly', 'friday', referenceDate)` → returns next Friday
- `calculateNextPayDate('four_weekly', 'friday', referenceDate)` → returns Friday 28 days later
- `calculateRtiDueDate(payDate)` → returns same date as pay date
- `calculateEpsDueDate(payDate)` → returns 19th of month following the HMRC tax month
- `calculateEpsDueDate('2026-03-20')` → tax month 12 (6 Mar–5 Apr) → EPS due 19 Apr
- `calculateEpsDueDate('2026-04-10')` → tax month 1 (6 Apr–5 May) → EPS due 19 May
- `calculatePayePaymentDate(payDate)` → 22nd of following month (electronic)
- `getPayrollStatus(payDate, checklistTotal, checklistCompleted, today)` → correct status
- `calculatePeriodDates('monthly', payDate)` → correct period_start and period_end
- `getTaxMonth(date)` → returns correct HMRC tax month number (1-12)

**Step 2: Run tests to verify they fail**

Run: `npx jest src/lib/__tests__/hmrc-deadlines.test.ts`
Expected: All tests fail (module not found)

**Step 3: Implement the deadline engine**

Create `src/lib/hmrc-deadlines.ts` with these exports:

```typescript
import { addDays, addWeeks, addMonths, lastDayOfMonth, getDay, setDay,
         isBefore, isAfter, differenceInDays, format, startOfMonth,
         endOfMonth, subDays, setDate } from 'date-fns'

export type PayFrequency = 'weekly' | 'fortnightly' | 'four_weekly' | 'monthly'

export type PayrollStatus = 'not_started' | 'in_progress' | 'complete' | 'overdue' | 'due_soon'

// Returns HMRC tax month (1-12) for a given date
// Tax month 1 = 6 Apr – 5 May, Tax month 12 = 6 Mar – 5 Apr
export function getTaxMonth(date: Date): number

// Calculate the next pay date from frequency + pay day
export function calculateNextPayDate(
  frequency: PayFrequency,
  payDay: string,
  referenceDate: Date
): Date

// RTI FPS due date = on or before pay date
export function calculateRtiDueDate(payDate: Date): Date

// EPS due date = 19th of month following the tax month containing pay date
export function calculateEpsDueDate(payDate: Date): Date

// PAYE payment due = 22nd of following month (electronic)
export function calculatePayePaymentDate(payDate: Date): Date

// Calculate period start and end dates from frequency and pay date
export function calculatePeriodDates(
  frequency: PayFrequency,
  payDate: Date
): { periodStart: Date; periodEnd: Date }

// Derive display status from dates + checklist progress
export function getPayrollStatus(
  payDate: Date,
  totalItems: number,
  completedItems: number,
  today?: Date
): PayrollStatus
```

Key implementation details:
- `getTaxMonth`: If date is between 6th of month and 5th of next month, that's one tax month. Tax month 1 starts 6 Apr.
- `calculateNextPayDate` with `'monthly'` and a number: use `setDate()`. For `'last_friday'`: find last day of month, walk backwards to Friday.
- `getPayrollStatus`: `complete` if all items done. `overdue` if pay date passed and not complete. `due_soon` if within 5 days. `in_progress` if some items done. `not_started` otherwise.

**Step 4: Run tests to verify they pass**

Run: `npx jest src/lib/__tests__/hmrc-deadlines.test.ts`
Expected: All tests pass

**Step 5: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 6: Commit**

```bash
git add src/lib/hmrc-deadlines.ts src/lib/__tests__/hmrc-deadlines.test.ts
git commit -m "feat: add HMRC deadline engine with tax month, FPS, EPS calculations"
```

---

## Task 3: Update Zod Validations

**Files:**
- Modify: `src/lib/validations.ts`

**Step 1: Add new validation schemas**

Add to `src/lib/validations.ts`:

```typescript
// Client creation schema — full onboarding
export const clientOnboardingSchema = z.object({
  // Step 1: Company details
  name: z.string().min(1, 'Company name is required').max(255),
  paye_reference: z.string().optional(),
  accounts_office_ref: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  employee_count: z.number().int().positive().optional(),

  // Step 2: Payroll config
  pay_frequency: z.enum(['weekly', 'fortnightly', 'four_weekly', 'monthly']),
  pay_day: z.string().min(1, 'Pay day is required'),
  tax_period_start: z.string().optional(),

  // Step 3: Pension
  pension_provider: z.string().optional(),
  pension_staging_date: z.string().optional(),

  // Step 4: Contact
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),

  // Step 5: Checklist template
  checklist_items: z.array(z.object({
    name: z.string().min(1),
    sort_order: z.number().int()
  })).min(1, 'At least one checklist item is required')
})

// Payroll run generation
export const generatePayrollRunSchema = z.object({
  client_id: z.string().uuid()
})

// Checklist item toggle
export const toggleChecklistItemSchema = z.object({
  id: z.string().uuid(),
  is_completed: z.boolean()
})
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/lib/validations.ts
git commit -m "feat: add Zod schemas for client onboarding, payroll runs, checklist items"
```

---

## Task 4: Delete Unused Files

**Files to delete:**

Dashboard stubs:
- `src/app/(dashboard)/dashboard/payroll-overview/page.tsx`
- `src/app/(dashboard)/dashboard/your-payrolls/page.tsx`
- `src/app/(dashboard)/dashboard/timesheet/page.tsx`
- `src/app/(dashboard)/dashboard/contracts/page.tsx`
- `src/app/(dashboard)/dashboard/invoices/page.tsx`
- `src/app/(dashboard)/dashboard/compliance/page.tsx`
- `src/app/(dashboard)/dashboard/pension-compliance/page.tsx`
- `src/app/(dashboard)/dashboard/reports/page.tsx`
- `src/app/(dashboard)/dashboard/benchmarking/page.tsx`

Onboarding pages:
- `src/app/(dashboard)/onboarding/page.tsx`
- `src/app/(dashboard)/onboarding/[clientId]/page.tsx`

Unused API stubs:
- `src/app/api/contracts/route.ts`
- `src/app/api/invoices/route.ts`
- `src/app/api/onboarding/route.ts`
- `src/app/api/payments/route.ts`
- `src/app/api/webhooks/route.ts`

**Step 1: Delete all files listed above**

```bash
rm -rf src/app/(dashboard)/dashboard/payroll-overview
rm -rf src/app/(dashboard)/dashboard/your-payrolls
rm -rf src/app/(dashboard)/dashboard/timesheet
rm -rf src/app/(dashboard)/dashboard/contracts
rm -rf src/app/(dashboard)/dashboard/invoices
rm -rf src/app/(dashboard)/dashboard/compliance
rm -rf src/app/(dashboard)/dashboard/pension-compliance
rm -rf src/app/(dashboard)/dashboard/reports
rm -rf src/app/(dashboard)/dashboard/benchmarking
rm -rf src/app/(dashboard)/onboarding
rm -rf src/app/api/contracts
rm -rf src/app/api/invoices
rm -rf src/app/api/onboarding
rm -rf src/app/api/payments
rm -rf src/app/api/webhooks
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build (no pages reference deleted pages)

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused stub pages and API routes for MVP focus"
```

---

## Task 5: Simplify Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Step 1: Replace the navigationSections array**

Replace lines 48-151 of `src/components/layout/Sidebar.tsx` with a flat 4-item navigation:

```typescript
import {
  Building2,
  Users,
  ClipboardCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus
} from 'lucide-react'

// Remove NavigationSection interface, simplify to flat NavItem[]
const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview & deadlines'
  },
  {
    name: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
    description: 'Manage your clients'
  },
  {
    name: 'Payrolls',
    href: '/dashboard/payrolls',
    icon: ClipboardCheck,
    description: 'Track payroll runs'
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Preferences'
  }
]
```

Update the rendering section to iterate over `navigationItems` directly (no section groups, no collapsible headers, no section toggle logic). Remove the `collapsedSections` state, `toggleSection` function, and the `NavigationSection` interface. Remove unused icon imports (`FileText`, `BarChart3`, `ChevronDown`, `UserCheck`, `Clock`, `Shield`, `TrendingUp`, `Calendar`, `DollarSign`, `Archive`, `Search`).

Keep: logo, "Add Client" button, collapse/expand, active route highlighting, bottom status bar, tooltips for collapsed state.

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: simplify sidebar to 4 MVP nav items"
```

---

## Task 6: Extend Clients API

**Files:**
- Modify: `src/app/api/clients/route.ts`
- Modify: `src/app/api/clients/[id]/route.ts`

**Step 1: Update the POST handler in `/api/clients/route.ts`**

Replace the existing `clientSchema` with the new `clientOnboardingSchema` import from `@/lib/validations`. After inserting the client row, also:

1. Insert `checklist_templates` rows from `validatedData.checklist_items`
2. Calculate the first pay date using `calculateNextPayDate()` from `@/lib/hmrc-deadlines`
3. Calculate period dates, RTI due, EPS due
4. Insert a `payroll_runs` row
5. Copy templates into `checklist_items` for the first run
6. Return the client with its first payroll run

The GET handler stays the same but should also return the payroll-specific fields (they come automatically since we `select('*')`).

**Step 2: Update the `[id]` route**

Ensure `GET /api/clients/[id]` returns the client with its checklist templates:

```typescript
const { data: client } = await supabase
  .from('clients')
  .select('*, checklist_templates(*)')
  .eq('id', id)
  .eq('tenant_id', user.tenant_id)
  .single()
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add src/app/api/clients/route.ts src/app/api/clients/[id]/route.ts
git commit -m "feat: extend clients API with checklist templates and payroll run generation"
```

---

## Task 7: Payroll Runs API

**Files:**
- Create: `src/app/api/payroll-runs/generate/route.ts`
- Create: `src/app/api/dashboard/stats/route.ts`

**Step 1: Create payroll run generation endpoint**

`POST /api/payroll-runs/generate` accepts `{ client_id }`:
1. Fetch the client (verify tenant ownership)
2. Check if there's already an active (non-complete) run — if so, return error
3. Calculate next pay date from `pay_frequency` + `pay_day`
4. Calculate period dates, RTI due, EPS due
5. Insert `payroll_runs` row
6. Fetch `checklist_templates` for this client
7. Insert `checklist_items` from templates
8. Return the new payroll run with items

**Step 2: Create dashboard stats endpoint**

`GET /api/dashboard/stats` returns:
```json
{
  "totalClients": 12,
  "dueThisWeek": 3,
  "overdue": 1,
  "completedThisMonth": 8,
  "upcomingDeadlines": [
    { "clientName": "Acme Ltd", "type": "FPS", "dueDate": "2026-03-05", "payrollRunId": "..." },
    { "clientName": "Acme Ltd", "type": "EPS", "dueDate": "2026-03-19", "payrollRunId": "..." }
  ]
}
```

Query logic:
- `totalClients`: count of clients in tenant
- `dueThisWeek`: payroll_runs where pay_date is within 7 days and status != 'complete'
- `overdue`: payroll_runs where pay_date < today and status != 'complete'
- `completedThisMonth`: payroll_runs where status = 'complete' and updated_at is this month
- `upcomingDeadlines`: next 7 days of RTI/EPS due dates from payroll_runs, sorted by date

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add src/app/api/payroll-runs/generate/route.ts src/app/api/dashboard/stats/route.ts
git commit -m "feat: add payroll run generation and dashboard stats APIs"
```

---

## Task 8: Payrolls Page (Core Feature)

**Files:**
- Create: `src/app/(dashboard)/dashboard/payrolls/page.tsx`

**Step 1: Build the payrolls page**

This is the main feature page. Structure:

**Header:**
- Title: "Payrolls" with subtitle showing current month/year
- Filter tabs: All | Due This Week | Overdue | Complete
- "Generate Next Period" bulk action (future — skip for MVP)

**Table:**
| Column | Source |
|--------|--------|
| Client name | `payroll_runs.client_id` → `clients.name` |
| Frequency | `clients.pay_frequency` |
| Pay date | `payroll_runs.pay_date` |
| Progress | Count `checklist_items` where `is_completed = true` / total |
| Status | Computed by `getPayrollStatus()` from `hmrc-deadlines.ts` |
| FPS due | `payroll_runs.rti_due_date` |
| EPS due | `payroll_runs.eps_due_date` |

**Expandable row (click to open):**
- Checklist items with checkboxes
- Each checkbox calls Supabase update on `checklist_items`
- Notes textarea for period-specific notes
- "Mark All Complete" button
- "Generate Next Period" button (visible when current run is complete)

**Data fetching:**
```typescript
const { data: runs } = await supabase
  .from('payroll_runs')
  .select('*, clients(name, pay_frequency), checklist_items(*)')
  .order('pay_date', { ascending: true })
```

Status is computed client-side using `getPayrollStatus(run.pay_date, items.length, completedCount)`.

**Style:** Use existing theme system (`useTheme`, `getThemeColors`), shadcn `Card`, `Badge`, `Button`, `Table` components. Status badges use color coding: green (complete), blue (in progress), amber (due soon), red (overdue), gray (not started).

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/payrolls/page.tsx
git commit -m "feat: add payrolls page with checklist management and status tracking"
```

---

## Task 9: Dashboard Page (Real Data)

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

**Step 1: Replace hardcoded data with real queries**

Rewrite the dashboard page to:

1. Fetch stats from `GET /api/dashboard/stats`
2. Display 4 KPI cards:
   - Total Clients (icon: Users)
   - Due This Week (icon: Clock)
   - Overdue (icon: AlertTriangle, red if > 0)
   - Completed This Month (icon: CheckCircle2)

3. Upcoming deadlines list (next 7 days):
   - Each row: client name, deadline type (FPS/EPS/PAYE), due date, days remaining
   - Color-coded by urgency
   - Click navigates to `/dashboard/payrolls` with that run expanded

4. Quick actions: "Add Client" button, "View All Payrolls" link

**Remove:** All hardcoded `dashboardData`, revenue charts, activity feeds, MiniLineChart imports. Keep it simple — just the numbers that matter.

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/page.tsx
git commit -m "feat: replace dashboard with real KPI data and upcoming deadlines"
```

---

## Task 10: Client Add Form (Multi-Step Onboarding)

**Files:**
- Modify: `src/app/(dashboard)/dashboard/clients/add/page.tsx`

**Step 1: Build multi-step form**

Replace the existing add client page with a 5-step form:

**Step 1 — Company Details:**
- Company name* (text input)
- PAYE reference (text, placeholder "123/AB45678")
- Accounts office reference (text)
- Address (street, city, postcode)
- Employee count (number)

**Step 2 — Payroll Configuration:**
- Pay frequency* (select: Weekly, Fortnightly, 4-Weekly, Monthly)
- Pay day* (conditional input):
  - If monthly → number input 1-31 OR select "Last Monday/Tuesday/.../Friday"
  - If weekly/fortnightly/4-weekly → select day of week (Monday–Sunday)
- Tax period start (date picker, defaults to 6 April current year)

**Step 3 — Pension:**
- Pension provider (text, with common suggestions: NEST, NOW Pensions, Smart Pension, People's Pension, Aviva)
- Staging date (date picker)

**Step 4 — Contact:**
- Contact name (text)
- Contact email (email)
- Contact phone (text)
- Notes (textarea)

**Step 5 — Checklist Template:**
- List of editable items with drag handles for reordering
- "Add item" button
- Pre-populated with defaults: "Receive payroll changes", "Process payroll", "Review & approve", "Send payslips", "Submit RTI to HMRC", "BACS payment", "Pension submission"
- Each item has a delete button
- Minimum 1 item required

**Navigation:** Back/Next buttons, step indicator at top, final "Create Client" button on step 5.

**On submit:** POST to `/api/clients` with all data including `checklist_items` array.

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/clients/add/page.tsx
git commit -m "feat: add 5-step client onboarding form with checklist template builder"
```

---

## Task 11: Settings Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/settings/page.tsx`

**Step 1: Build settings page**

Three sections:

**Profile:**
- Name (editable, saves to `users` table)
- Email (read-only, from auth)
- Theme toggle (already exists via ThemeContext)

**Default Checklist Template:**
- Same drag-reorderable list as the client form
- These defaults are stored in `tenants.settings` JSON field as `{ default_checklist: [...] }`
- When adding a new client, step 5 pre-populates from these defaults
- "Save Defaults" button

**About:**
- App version
- Link to support/feedback

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/settings/page.tsx
git commit -m "feat: add settings page with profile and default checklist template"
```

---

## Task 12: Update Clients List Page

**Files:**
- Modify: `src/app/(dashboard)/dashboard/clients/page.tsx`

**Step 1: Update client list to show payroll info**

Extend the existing client list table to show:

| Column | Source |
|--------|--------|
| Client name | `clients.name` |
| Frequency | `clients.pay_frequency` |
| Employees | `clients.employee_count` |
| PAYE Ref | `clients.paye_reference` |
| Status | From their latest `payroll_runs` status |
| Next pay date | From latest `payroll_runs.pay_date` |

Add a "View Payroll" button per row that navigates to `/dashboard/payrolls` (with the run expanded — pass via URL query param).

Keep existing: search, status filter (active/inactive), "Add Client" button.

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/clients/page.tsx
git commit -m "feat: extend clients list with payroll status and frequency columns"
```

---

## Task 13: Update Register API

**Files:**
- Modify: `src/app/api/auth/register/route.ts`

**Step 1: Create default checklist template on signup**

After creating the tenant, store a default checklist template in `tenants.settings`:

```typescript
settings: {
  industry: 'payroll_bureau',
  company_domain: companyDomain,
  setup_completed: false,
  default_checklist: [
    { name: 'Receive payroll changes', sort_order: 0 },
    { name: 'Process payroll', sort_order: 1 },
    { name: 'Review & approve', sort_order: 2 },
    { name: 'Send payslips', sort_order: 3 },
    { name: 'Submit RTI to HMRC', sort_order: 4 },
    { name: 'BACS payment', sort_order: 5 },
    { name: 'Pension submission', sort_order: 6 }
  ]
}
```

Remove the `createDemoData` function call (no more demo clients — users create real clients).

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: store default checklist template on signup, remove demo data"
```

---

## Task 14: Final Build + Deploy

**Step 1: Full build verification**

Run: `npm run build`
Expected: Clean build with 0 errors

**Step 2: Manual testing checklist**

Run `npm run dev` and verify:
- [ ] Login works
- [ ] Dashboard shows real KPIs (zeros for new user)
- [ ] Sidebar has exactly 4 items
- [ ] Add Client form has 5 steps
- [ ] Checklist template builder works (add/remove/reorder)
- [ ] After adding client, payroll run appears on Payrolls page
- [ ] Checklist items can be ticked off
- [ ] Status badges update correctly
- [ ] Settings page loads with profile and default template
- [ ] Dark mode works throughout

**Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final MVP polish and fixes"
```

**Step 4: Push to GitHub**

```bash
git push origin main
```

Vercel auto-deploys from main. Verify the deployed site works.

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Database migration + types | 2 files |
| 2 | HMRC deadline engine + tests | 2 files |
| 3 | Zod validation schemas | 1 file |
| 4 | Delete unused stubs | -15 files |
| 5 | Simplify sidebar to 4 items | 1 file |
| 6 | Extend clients API | 2 files |
| 7 | Payroll runs + dashboard stats APIs | 2 files |
| 8 | Payrolls page (core feature) | 1 file |
| 9 | Dashboard page (real data) | 1 file |
| 10 | Client add form (5-step) | 1 file |
| 11 | Settings page | 1 file |
| 12 | Update clients list | 1 file |
| 13 | Update register API | 1 file |
| 14 | Build + deploy | 0 files |

**Total: 14 tasks, ~16 files created/modified, ~15 files deleted**
