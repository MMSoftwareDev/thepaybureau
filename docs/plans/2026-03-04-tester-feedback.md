# Tester Feedback — 4 March 2026

Captured from initial tester walkthrough. Organised by theme with implementation notes.

---

## 1. Client Management Enhancements

### 1a. Import Clients
> "Ability to Import clients"

- Currently only manual form entry (5-step onboarding)
- **Need:** CSV/spreadsheet bulk import for bureaux onboarding existing client books
- Consider: map columns to our fields, validate PAYE refs, preview before commit

### 1b. Duplicate / Copy Client
> "Edit the new — copy from existing company — if we have a client and just want to add a new frequency — could we just duplicate the client and change the frequency"

- **Need:** "Duplicate" action on client list → pre-fills the add-client form with existing data
- User then tweaks the frequency (and company name suffix?) before saving
- Directly addresses the multi-frequency problem (see 1c)

### 1c. Multiple Frequencies per Client
> "Clients may have multiple frequencies — how are we to manage this?"

- Some clients run weekly AND monthly payrolls (e.g. hourly staff vs salaried)
- Current model: one `pay_frequency` per client record
- **Approach:** Duplicate-client workflow (1b) is the pragmatic MVP solution — same company, separate client records per frequency, each with its own payroll runs
- Later: optional parent-company grouping so dashboards can roll up

### 1d. Show Frequency Name in Payroll Run
> "Add the frequency name next to the client name on the payroll run"

- Already showing frequency in the expanded payroll detail view (`formatPayFrequency`)
- **Need:** Also show it in the collapsed/summary row next to the client name so it's instantly visible — especially important when the same company has weekly + monthly records
- Quick UI tweak on `/dashboard/payrolls/page.tsx`

---

## 2. Checklist / Task Ordering

### 2a. Pension Tasks After Payroll Run
> "Pension tasks to be after — pension tasks are normally after you run the payroll"

- Current default checklist order:
  1. Receive payroll changes
  2. Process payroll
  3. Review & approve
  4. Send payslips
  5. Submit RTI to HMRC
  6. BACS payment
  7. Pension submission ← already last
- "Pension submission" is already positioned after the payroll run steps
- **Clarify with tester:** Is this about adding a gap/grouping (pre-run vs post-run tasks)? Or about a different pension task that's in the wrong place?
- May be resolved — follow up to confirm

### 2b. Multiple Checklist Templates
> "Setup multiple checklist templates so we can choose which template we want when setting up a client"

- Currently: one default template hardcoded, customised per-client during onboarding
- **Need:** Saved named templates (e.g. "Standard Monthly", "Weekly Payroll", "CIS Subcontractor") that can be selected from a dropdown when adding a new client
- DB already has `checklist_templates` table — extend to support multiple named templates per user
- Add template management UI in Settings page

---

## 3. Data Security & Multi-Tenancy

### 3a. User Data Isolation
> "How do we silo each login so that no data can be accessed by any other user"

- **Current state:** Supabase Row Level Security (RLS) — every table has `user_id` filter, each user only sees their own data
- This is already enforced at the database level — no user can query another user's clients or payrolls

### 3b. Bureau Manager Oversight (Future)
> "We need to balance this as when we launch our next version, the bureau manager should be able to have full overview"

- **V2 concept:** Introduce `organisations` table with roles (manager / specialist)
- Manager role gets read access across all org members' data
- Specialist keeps their current silo within the org context
- Not needed for MVP — flag for V2 planning

### 3c. Personal Email Sign-up → Bureau Migration
> "Payroll specialists will sign up with personal email... how do we move that silo data to the payroll bureau when they sign up"

- Real scenario: specialist signs up personally → later their bureau adopts the platform → need to migrate their data under the bureau org
- **V2 approach:**
  - Bureau manager sends invite
  - Specialist accepts → account linked to organisation
  - Existing data transfers ownership to the org (or shared access)
  - Specialist retains login (personal email is fine)
- Important: design the `organisations` migration path so we don't break the single-user model

---

## Priority for Current Sprint

| # | Item | Effort | Priority |
|---|------|--------|----------|
| 1d | Frequency next to client name | Small | **Now** |
| 1b | Duplicate client action | Medium | **Now** |
| 2b | Multiple checklist templates | Medium | **Next** |
| 1a | CSV client import | Medium | **Next** |
| 2a | Pension task ordering (clarify) | Tiny | **Clarify** |
| 1c | Multi-frequency (via 1b) | — | Solved by 1b |
| 3a–c | Multi-tenancy / orgs | Large | **V2** |
