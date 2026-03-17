# Task Tracker

_Active tasks and progress are tracked here. Updated each session._

## Critical (Before Production Launch)

- [ ] Run migration 022 (`022_user_titles_and_comments.sql`) in Supabase SQL Editor — blocks admin users page, feature request comments, user titles
- [ ] Run migration 023 (`023_training_cpd_enhancements.sql`) in Supabase SQL Editor — blocks training CPD enhancements
- [ ] Verify admin users page works in production after migration 022 is applied (`/dashboard/admin/users`)

## Should Do (Polish / Completeness)

- [ ] Replace Hero mockup with real software screenshots (blocked on user providing images with dummy data)
- [ ] Reorder pension tasks after payroll run in checklists (tester feedback)
- [ ] Global auth context for reactive user tracking (SWR cache fix done; full reactive context still pending)
- [ ] Update Supabase email templates (`supabase/templates/*.html`) to use dynamic logo URLs if needed

## Can Defer (V2 / Nice-to-Have)

- [ ] Multiple checklist templates — save named templates (e.g., "Standard Monthly", "Weekly Payroll")
- [ ] Bureau manager oversight / multi-tenancy V2 — organization roles (manager vs specialist)
- [ ] Team / Bureau / Enterprise subscription tiers (currently "Coming Soon" in UI)
- [ ] Google / Microsoft OAuth (currently "Coming Soon" on login page)
- [ ] Session management UI — view/revoke active sessions
- [ ] 2FA / MFA — additional security layer
