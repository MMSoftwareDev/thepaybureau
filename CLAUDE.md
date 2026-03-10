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

### In Progress / Planned (from tester feedback 2026-03-04)
- CSV/bulk import for clients
- Duplicate/copy client workflow (for multi-frequency payrolls)
- Show frequency name in payroll run summary rows
- Reorder pension tasks after payroll run in checklists

## Conventions

- Use Zod for all validation (schemas in `src/lib/validations.ts`).
- Use shadcn/ui components (installed via `components.json`).
- API error responses: `{ error: string }` with appropriate HTTP status.
- Dates: use `date-fns` for formatting/manipulation.
- Keep all Supabase migrations numbered sequentially in `supabase/migrations/`.

## Session Log

_Add notes from each Claude Code session below so context carries forward._

### 2026-03-10 — Initial CLAUDE.md setup
- Created this file to maintain context across sessions.
