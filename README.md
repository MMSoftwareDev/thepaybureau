# ThePayBureau Pro

SaaS platform for UK payroll bureaux to manage clients, payroll runs, pensions, HMRC compliance, and training records. Currently in **v1.0.0-alpha** (pre-launch).

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack dev)
- **Language:** TypeScript 5.9
- **Auth & DB:** Supabase (auth, PostgreSQL with RLS, SSR helpers)
- **Payments:** Stripe (subscriptions)
- **Styling:** Tailwind CSS 4, Radix UI primitives, shadcn/ui
- **AI:** Anthropic SDK (AI assistant feature), VoyageAI (embeddings)
- **Email:** Resend (transactional), Brevo (marketing/newsletter)
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
        payrolls/     # Payroll configs, runs & checklists
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
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (auth + PostgreSQL)
- Stripe account (subscriptions)

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Key variables include: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, and others. See `.env.example` for the full list.

### Development

```bash
npm install
npm run dev          # Start dev server (Turbopack)
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Unit tests (Jest)
npm run test:watch   # Unit tests in watch mode
npm run test:coverage # Unit tests with coverage report
npx playwright test  # E2E tests
```

### Database Migrations

Migrations in `supabase/migrations/` must be run manually in the Supabase SQL Editor. They are **not** auto-applied.

## Architecture

- **Multi-tenant:** Every table scoped by `tenant_id` with RLS policies enforcing isolation.
- **Auth flow:** Supabase Auth → middleware redirects unauthenticated users → API routes use `getAuthUser()`.
- **CSRF:** Middleware validates Origin header for mutating requests (webhooks exempted).
- **Domain routing:** `www.thepaybureau.com` serves marketing pages; `app.thepaybureau.com` serves the application. Middleware-based hostname routing in a single Vercel deployment.
- **Clients vs Payrolls:** Separate tables — one client can have multiple payrolls. Payroll config fields live on the `payrolls` table.

## Deployment

Deployed on [Vercel](https://vercel.com). Production builds run via `npm run build`.

Domains:
- `app.thepaybureau.com` — Application
- `www.thepaybureau.com` — Marketing pages

## License

Proprietary. All rights reserved.
