# ThePayBureau Pro

## Project Overview

SaaS platform for UK payroll bureaux to manage clients, payroll runs, pensions, HMRC compliance, and training records. Currently in **v1.0.0-alpha** (pre-launch).

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack dev)
- **Language:** TypeScript 5.9
- **Auth & DB:** Supabase (auth, PostgreSQL with RLS, SSR helpers)
- **Payments:** Stripe (subscriptions)
- **Styling:** Tailwind CSS 4, Radix UI primitives, shadcn/ui (`components.json`)
- **AI:** Anthropic SDK (AI assistant feature), VoyageAI (embeddings)
- **Email:** Resend
- **Rate limiting:** Upstash Redis
- **Monitoring:** Sentry, Vercel Analytics + Speed Insights
- **Testing:** Jest + Testing Library (unit), Playwright (e2e)
- **Linting:** ESLint 9, Prettier with Tailwind plugin

## Project Structure

```
src/
  app/
    (auth)/           # Login/signup (route group)
    (dashboard)/      # Authenticated dashboard (route group)
      dashboard/
        admin/        # Platform admin panel
        ai-assistant/ # AI chat assistant
        audit-log/    # Audit trail viewer
        clients/      # Client management
        feature-requests/
        payrolls/     # Payroll runs & checklists
        pensions/     # Pension management
        settings/     # User/tenant settings
        subscription/ # Stripe subscription management
        training/     # Training records
    api/              # API routes (REST)
    auth/             # Supabase auth callbacks
  components/         # Reusable UI components
  config/             # App configuration
  contexts/           # React contexts
  hooks/              # Custom React hooks
  lib/                # Core utilities
    ai/               # AI/RAG logic
    anthropic.ts      # Claude API client
    supabase.ts       # Client-side Supabase
    supabase-server.ts # Server-side Supabase (service role)
    stripe.ts         # Stripe helpers
    validations.ts    # Zod schemas
  types/              # TypeScript type definitions
  middleware.ts       # Auth redirect, CSRF protection
supabase/
  migrations/         # SQL migration files (RLS, tables)
  templates/          # Email templates
docs/plans/           # Design docs & feedback
```

## Key Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npx jest             # Unit tests
npx playwright test  # E2E tests
```

## Architecture Patterns

- **Multi-tenant:** Every table scoped by `tenant_id`. RLS policies enforce isolation via `get_user_tenant_id()`.
- **Auth flow:** Supabase Auth -> middleware redirects unauthenticated users from `/dashboard` -> API routes call `getAuthUser()`.
- **CSRF:** Middleware validates Origin header matches Host for mutating API requests (webhooks exempted).
- **API routes:** All under `src/app/api/`. Mutating routes require auth and scope queries by `tenant_id`.
- **Forms:** react-hook-form + Zod validation.
- **Data fetching:** SWR for client-side caching.
- **Cron routes:** Protected by `CRON_SECRET` bearer token.
- **Admin routes:** Protected by `PLATFORM_ADMIN_EMAILS` env check.

## Security Notes (from audit 2026-03-07)

- Health/status endpoints are intentionally unauthenticated.
- `feature_requests` RLS UPDATE/DELETE policies need tightening (currently `USING (true)` — admin check only in API layer).
- Some API routes use `SELECT *` — consider explicit column selection for list endpoints.

## Current Status & Roadmap

### Completed
- Full client management with 5-step onboarding
- Payroll runs with checklists
- Pension management
- Training records
- Stripe subscription billing
- AI assistant (Claude-powered)
- Audit logging
- HMRC deadline tracking
- Feature request system
- Badge/gamification system
- Security audit (OWASP top 10, RLS, Stripe)

### Also Completed (from sessions)
- CSV/bulk import for clients (batched, chunks of 50)
- Duplicate/copy client workflow
- GDPR compliance: account deletion + data export
- Marketing landing page + `/roadmap` page with design system
- Domain migration: `app.thepaybureau.com` → `thepaybureau.com`
- AI assistant RAG pipeline debugging & fixes
- SWR cache isolation fix on logout
- Deployment build fixes (fonts, Sentry)
- Production performance optimizations (non-blocking badges, dashboard date filter, import batching)

### In Progress / Planned (from tester feedback 2026-03-04)
- Show frequency name in payroll run summary rows
- Reorder pension tasks after payroll run in checklists
- Global auth context for reactive user tracking
- Reduce SWR `dedupingInterval` or add explicit revalidation on login

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Conventions

- Use Zod for all validation (schemas in `src/lib/validations.ts`).
- Use shadcn/ui components (installed via `components.json`).
- API error responses: `{ error: string }` with appropriate HTTP status.
- Dates: use `date-fns` for formatting/manipulation.
- Keep all Supabase migrations numbered sequentially in `supabase/migrations/`.

## Session Log

_Add notes from each Claude Code session below so context carries forward._

### Session 1 — Dashboard Redesign, Client Edit Page, Domain Config
- Updated Supabase auth config to use app.thepaybureau.com custom domain
- Pinned TypeScript to 5.9.3 to resolve build issues
- Built client edit page (`/dashboard/clients/[id]/edit`) with tabbed form (Company, Payroll, Pension, Contact, Checklist)
- Added toast notification component to replace browser `alert()` calls
- Redesigned all dashboard pages (home, clients, payrolls, settings) to match login page aesthetic — clean cards, brand purple palette, no glassmorphism
- Restyled Sidebar and Navbar with simplified layout and brand colors
- Aligned ThemeContext with auth page CSS variables (`--login-purple`, `--login-pink`, `--login-peach`)
- Added Suspense wrapper on clients page for `useSearchParams()` fix
- Branch `claude/link-domain-lOh9a` has all changes; merged via PR

### Session 2 — Merge Feature Branch to Main
- Confirmed `claude/fix-clients-redirect-DUSRh` was already fully merged — main was up to date via PRs #3–#12
- No additional changes needed
- Completed features from PRs #3–#12: Dashboard with charts/KPI cards/activity feed, client detail/profile page, sidebar/navbar redesign (Stripe/Notion style), profile image/avatar upload with Supabase storage

### Session 3 — Product Launch Prep (~161 commits, PRs #14–#50)
- **Dashboard**: Redesigned to answer "4 Morning Questions" — KPIs, activity feed, charts, greeting
- **Payroll runs**: Board/List views, checklist side panel, dropdown status, frequency filter, pay period, auto-generate on complete
- **Client management**: Detail/profile page, edit page, CSV import for bulk creation, duplicate action
- **Pension Declarations**: Auto-save, exempt option, dashboard integration
- **Stripe subscription**: Billing/subscription page integration
- **Audit Log**: CSV export, tracking all client/payroll/settings changes
- **Training & CPD page**, **Admin analytics dashboard** (restricted to admin email)
- **Marketing landing page** at root `/`
- **Auth**: Google/Microsoft OAuth wired (Coming Soon), Change Password in settings
- **Security**: Fixed 14 vulnerabilities, blocked disposable emails, MX validation, Redis rate limiting, CSP headers
- **Email**: Branded templates via Resend SMTP on `mail.thepaybureau.com`, multiple redesigns
- **UX**: SWR caching, debounced search, optimistic updates, Vercel Speed Insights, health check + Traffic Light widget, error boundaries, loading states, 404 page
- **Pre-Release Audit**: Fixed critical security/UX/build issues
- Branch: `claude/product-launch-prep-BuVVc`

### Session 4 — All Clients Page & Edit Client Improvements
- Removed Payroll Status column, added Industry column to All Clients table
- Edit Client — Checklist Template: Added "Apply from Template" selector on Checklist tab
- Pay Date: Added "Last Working Day of the Month" option to Add and Edit Client pages
- Annually frequency: Changed to single date picker; period start/end hidden
- Removed Quarterly and Biannually from pay frequency options
- **Pay Period auto-fill logic**: Selecting frequency + pay day auto-fills period start/end; changing frequency resets dates; manual period start auto-calculates end; period end is read-only
- First/Next Pay Date preview shown after period fields
- Files: `clients/page.tsx`, `clients/add/page.tsx`, `clients/[id]/edit/page.tsx`

### Session 5 — SaaS Pre-Launch Security: Auth & Data Isolation Fix
- **Bug**: Users could see data from previously logged-in account after switching accounts
- **Root cause**: SWR cache not cleared on logout; 5-second `dedupingInterval` served stale data on fast re-login
- **RLS confirmed sound**: Supabase RLS correctly filters by `tenant_id` — issue was purely client-side caching
- **Fix**: Added global SWR cache clear (`mutate(() => true, undefined, { revalidate: false })`) in Navbar logout handler
- **Outstanding**: Reset dashboard layout user state on auth change; reduce SWR `dedupingInterval`; global auth context
- Branch: `claude/saas-prelaunch-checklist-tnKbg`

### Session 6 — Fix Deployment Build Errors & Google Fonts Strategy
- Fixed two build-breaking issues causing Vercel deployment failures:
  1. `next/font/google` fetch failures — switched to `<link>` tags in `layout.tsx` with CSS variables
  2. Sentry `hideSourceMaps` deprecation — replaced with `sourcemaps: { deleteSourcemapsAfterUpload: true }`
- Excluded test files from `tsconfig.json` to resolve missing `@types/jest` errors
- Merged `origin/main` into feature branch to sync Sentry, Vercel Analytics, service worker, global error page
- Branch: `claude/redesign-homepage-ghg3y`

### Session 7 — Setup Instructions for Sentry, Vercel Analytics & PWA
- Confirmed Sentry, Vercel Analytics, and PWA already fully integrated in code
- Produced step-by-step setup instructions for Sentry (env vars), Vercel Analytics (dashboard toggle), PWA (already functional)
- No code changes — instructional/documentation session only

### Session 8 — GDPR Compliance: Account Deletion
- Created `/api/user/delete-account` endpoint with rate limiting (3 req/15 min), auth, audit logging
- Handles sole-admin edge case by cascading tenant deletion
- Added "Danger Zone" section to Settings with two-step confirmation (type "DELETE")
- Investigated Recharts lazy loading — correctly rejected (shared internal context breaks with dynamic imports)
- Confirmed `/api/user/export-data` already existed from prior session
- Branch: `claude/security-quality-audit-k6zjy`

### Session 9 — Production Readiness Audit & Performance Optimizations
- **Badge/stats non-blocking**: Moved `updateUserStats()` and `checkAndAwardBadges()` to fire-and-forget in payroll run actions
- **Dashboard stats date filter**: Added 6-month lookback + 31-day lookahead to payroll runs query
- **Client import batching**: Rewrote sequential loop into chunks of 50 (~40 queries for 500 clients instead of ~2,500)
- **Prettier config**: Created `.prettierrc` with Tailwind plugin

### Session 10 — AI Assistant Chat: Debugging RAG Pipeline
- **4 root causes fixed**:
  1. RAG retrieval crash — wrapped in try/catch for graceful fallback
  2. Race condition in conversation history — added `ensureAlternatingRoles()` helper
  3. Prompt too long (207K > 200K limit) — reduced to 5 chunks + 80K char budget
  4. Vector search returning zero results — IVFFlat `probes=1` → `probes=10`, threshold `0.3` → `0.1`
- Fixed SSE line buffer in ChatWidget, improved error propagation
- Migration: `014_fix_vector_search.sql`
- Branch: `claude/payroll-ai-chatbot-VHTuX`

### Session 11 — Replace app.thepaybureau.com with thepaybureau.com
- Removed all `app.thepaybureau.com` references across 11 files
- Updated CI workflow, Supabase config, 5 email templates, `email-templates.ts`, `layout.tsx`, `sitemap.ts`, `robots.ts`
- Left `mail.thepaybureau.com` and `support@thepaybureau.com` unchanged
- Note: `NEXT_PUBLIC_APP_URL` env var in Vercel should also be updated
- Branch: `claude/add-version-control-Ur1Ox`

### Session 12 — Marketing Design System & Roadmap Page
- Built 12 reusable marketing components (`src/components/marketing/`) using CVA for phase variants
- New `/roadmap` page — full product timeline with 4 phases, 46 features, alternating layout
- Restyled landing page — hero with HeroBadge/HeroStats, gradient radials, dark branded footer
- CSS additions: `pulse-dot` and `marketing-float` keyframe animations
- Decision: New design language for marketing pages only; dashboard stays on shadcn/ui
- Branch: `claude/locate-website-code-8YiTI`

### Session 13 — SaaS Pre-Launch Security: Auth & Data Isolation Audit (Deep Dive)
- Deep audit: Full auth flow, Supabase RLS, SWR caching, logout handling, API routes, client-side state
- Confirmed RLS is sound — database-level isolation correct across all tables
- Root cause reconfirmed: SWR cache not cleared on logout + `dedupingInterval` stale data
- Fix: Global SWR cache clear in Navbar logout handler (same as Session 5)
- Severity: SWR cache bleed rated critical; RLS and API tenant filtering rated secure
- Branch: `claude/saas-prelaunch-checklist-tnKbg`

### Session 14 — Initial CLAUDE.md Setup & Session Log Compilation
- Created CLAUDE.md with project overview, tech stack, structure, architecture patterns, security notes, roadmap
- Added workflow orchestration rules, task management, core principles, conventions
- Compiled session logs from Sessions 1–13 into this file
