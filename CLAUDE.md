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
docs/plans/           # Design docs & feedback
```

## Key Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Unit tests (Jest)
npm run test:watch   # Unit tests in watch mode
npm run test:coverage # Unit tests with coverage report
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
- **Clients vs Payrolls:** Separate tables — one client can have multiple payrolls. Payroll config fields (frequency, pay day, PAYE ref, pension) live on `payrolls` table, not `clients`. Payroll runs reference `payroll_id`.
- **Client data model:** 45+ fields across identity, company details, address, 2 contact types (primary, secondary), accountant, tax/compliance (VAT, UTR, CIS, HMRC PAYE Online Auth, AE status), billing/contract (fee, billing frequency, payment method, contract type, notice period), and metadata (tags, assigned_to, referral_source, industry, etc.). Payroll Contact removed (primary contact covers this). Registered Address and TPAS deferred.
- **Domain routing:** Middleware-based hostname routing — `www.thepaybureau.com` serves marketing pages only (`/`, `/roadmap`, `/terms`, `/privacy`), all other routes 301 redirect to `app.thepaybureau.com`. Marketing routes skip auth/CSRF entirely. Domain constants centralised in `src/lib/domains.ts`.

## Database Tables

All tables are scoped by `tenant_id` with RLS policies (except `tenants` itself and system tables).

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `tenants` | Multi-tenant root entity | — |
| `users` | User accounts | `tenant_id` → tenants |
| `clients` | CRM records (45+ fields) | `tenant_id`, `assigned_to` → users |
| `payrolls` | Payroll configurations | `client_id` → clients |
| `payroll_runs` | Individual payroll run instances | `payroll_id` → payrolls |
| `checklist_templates` | Reusable checklist definitions | `payroll_id` → payrolls |
| `checklist_items` | Run-specific checklist entries | `payroll_run_id` → payroll_runs |
| `training_records` | CPD / training tracking | `tenant_id` |
| `audit_logs` | Immutable audit trail | `tenant_id`, action/entity_type/changes (JSON) |
| `feature_requests` | User feature requests | `tenant_id`, admin-only UPDATE/DELETE |
| `user_stats` | Gamification stats | `user_id` → users |
| `user_badges` | Earned badges | `user_id` → users |
| `ai_conversations` | AI chat sessions | `user_id` → users |
| `ai_messages` | Individual chat messages | `conversation_id` → ai_conversations |
| `ai_documents` | RAG knowledge base docs | `tenant_id` |
| `ai_document_chunks` | Vector-embedded doc chunks | `document_id` → ai_documents |
| `ai_api_keys` | User API keys for AI | `user_id` → users |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | App domain (`https://app.thepaybureau.com`) |
| `NEXT_PUBLIC_MARKETING_URL` | Marketing domain (`https://www.thepaybureau.com`) |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_UNLIMITED_MONTHLY` | Stripe price ID for monthly plan |
| `STRIPE_PRICE_UNLIMITED_ANNUAL` | Stripe price ID for annual plan |
| `RESEND_API_KEY` | Resend email API key |
| `ANTHROPIC_API_KEY` | Claude AI assistant |
| `VOYAGE_API_KEY` | VoyageAI embeddings |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `CRON_SECRET` | Bearer token for cron route authentication |
| `PLATFORM_ADMIN_EMAILS` | Comma-separated admin emails for admin routes |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error monitoring DSN |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Sentry org and project for source maps |
| `UPTIMEROBOT_API_KEY` | UptimeRobot status page API key |

## Security Notes (from audit 2026-03-07)

- Health/status endpoints are intentionally unauthenticated.
- `feature_requests` RLS UPDATE/DELETE policies tightened in migration 011 (admin-only via `is_platform_admin()` function).
- SELECT * audit completed (Session 22): 6 routes fixed to use explicit column selection. Remaining `SELECT *` usage is intentional (account export, audit diffs, clients/payrolls list endpoints that serve sidebar edit forms).

## Known Issues

- **Remaining domain references**: Email templates, CI config, and Supabase config still reference `app.thepaybureau.com` (see Sessions 11, 25). Marketing pages and middleware now use `www.thepaybureau.com` correctly.
- **Serverless fire-and-forget caveat**: Never use unawaited promises for critical side effects (emails, webhooks) in Vercel serverless routes — the runtime may terminate before they complete. Always `await` or use `waitUntil()`. Fixed for feedback/feature-request emails in Session 16; audit other routes if adding new email sends.
- **CSS variable naming**: All CSS variables use legacy `--login-*` prefix (e.g., `--login-purple`, `--login-surface`) even though they're used app-wide. Historical artifact from when they only existed on the login page. Rename to `--brand-*` or `--app-*` when convenient.

## Common Pitfalls

Hard-won lessons from previous sessions — check here before making changes in these areas:

- **Supabase migrations must be run manually**: Files in `supabase/migrations/` are NOT auto-applied. User must run them in Supabase SQL Editor. If a new feature requires schema changes and the user reports "Failed to create X", check whether migrations have been applied. (Session 20)
- **Never use `next/font`**: Google Fonts are loaded via `<link>` tags in `layout.tsx` with CSS variables. `next/font/google` has intermittent fetch failures during build on Vercel. (Session 6)
- **Never fire-and-forget emails on Vercel**: Always `await sendEmail()` in serverless routes. The runtime terminates after the response is sent — unawaited promises may never complete. Use `waitUntil()` if you need non-blocking sends. (Session 16)
- **SWR cache must be cleared on auth change**: Both `SIGNED_IN` and `SIGNED_OUT` events must call `clearSWRCache()` then `revalidateAllSWR()` — in that order. Without revalidation, mounted hooks show empty state. (Sessions 5, 13, 23)
- **`logo-full.png` breaks dark mode**: Has dark text baked into the image — invisible on dark backgrounds. Use `logo.png` (icon mark) + theme-aware text instead. (Session 21)
- **Two-pass init for Supabase test mocks**: The `chainMock()` pattern requires two passes — first create all `jest.fn()` stubs, then set `mockReturnValue` with spread. Single-pass causes eager evaluation bugs. (Session 22)
- **Recharts cannot be dynamically imported**: Shares internal React context that breaks across chunk boundaries. Load it synchronously. (Session 8)

## Current Status & Roadmap

### Completed
- CSV/bulk import for clients (batched, chunks of 50)
- Duplicate/copy client workflow
- GDPR compliance: account deletion + data export
- Marketing landing page + `/roadmap` page with design system
- Domain migration: `app.thepaybureau.com` → `thepaybureau.com` (partial — fallback URLs and email templates still reference `app.` subdomain)
- AI assistant RAG pipeline debugging & fixes
- SWR cache isolation fix on logout
- Deployment build fixes (fonts, Sentry)
- Production performance optimizations (non-blocking badges, dashboard date filter, import batching)
- Profile image auto-resize on upload (client-side Canvas API, 256x256 square, WebP output)
- Clients & payrolls data model separation (new `payrolls` table, one client → many payrolls)
- Clients page redesign (dense flat table, sidebar Sheet form, sortable columns, pagination, CSV export, AlertDialog delete)
- Payrolls config page with table + sidebar form (Details, Pay Schedule, HMRC, Pension, Checklist sections)
- Payroll runs moved to `/dashboard/payrolls/runs` sub-route with `?payroll=` filter
- `prospect` client status removed — only `active` and `inactive`
- Full-width responsive dashboard layout (removed `max-w-6xl` constraint from `DashboardWrapper.tsx`)
- 7 new client fields: domain, secondary contact (name/email/phone), accountant (name/email/phone)
- CSV export endpoint for clients (`/api/clients/export`) with rate limiting
- 25 additional client fields for full payroll bureau CRM (tax/compliance, billing, contacts, categorisation — see Session 19)
- `/api/users` endpoint for tenant user listing (used by Assigned To dropdown)
- Client page Phase 2: removed Payroll Contact/Registered Address/TPAS/Director Name; added Contract Type, Notice Period, UK Industries dropdown
- Customizable table columns with localStorage persistence (toggle visibility, reorder)
- Toast z-index fix (z-[100]) to render above Sheet/Dialog overlays
- Sidebar logo: 36px icon mark + themed text (dark mode compatible), header height bumped to 60px
- Jest test infrastructure with chainable Supabase mock pattern (44 tests across 7 API route test files)
- Vector search migration 019: `match_threshold` 0.3→0.1, `ivfflat.probes` 1→10
- API reference documentation (`docs/api-reference.md`) covering all 42 routes
- SELECT * audit: 6 routes fixed to use explicit column selection
- Marketing pages domain routing: `www.thepaybureau.com` serves `/`, `/roadmap`, `/terms`, `/privacy` via middleware hostname detection; non-marketing routes 301 redirect to `app.thepaybureau.com`
- Marketing copy overhaul: company name updated to "Intelligent Payroll Limited T/A The Pay Bureau", free tier updated to 50 clients, CSV import/export and basic audit trail included in free, removed fake social proof and dead newsletter form
- Collapsible sidebar sections with auto-expand for active routes
- Sidebar visual polish: indented child items, 36px row height, 18px icons, rounded-lg items
- Sidebar search fix: clients page reads URL `?search=` param via `useSearchParams`
- Sidebar section rename: "DEVELOPMENT" → "TRAINING"
- Clients page aligned to payrolls page design (consistent header, toolbar, filters, pagination, empty state, default columns)
- Pricing model alignment: Unlimited updated to £19/mo (£12/mo annual), 5 tier cards (Free, Unlimited, Team, Bureau, Enterprise), Bureau & Enterprise as Coming Soon
- Subscription page polish: Upgrade button overflow fix, roadmap disclaimer above FAQ
- Pensions dashboard: TPR Dashboard Status column, fixed status logic (overdue = declaration deadline only), auto-calculated dates from staging date

### In Progress / Planned
- Replace coded Hero mockup with real software screenshots (user to provide images with dummy data)
- Reorder pension tasks after payroll run in checklists
- Global auth context for reactive user tracking

## Workflow Rules

- **Plan first**: Enter plan mode for any non-trivial task (3+ steps or architectural decisions). If something goes sideways, stop and re-plan.
- **Verify before done**: Never mark a task complete without proving it works. Run tests, check logs, demonstrate correctness.
- **Self-improvement**: After ANY correction from the user, update `tasks/lessons.md` with the pattern. Review lessons at session start.
- **Autonomous bug fixing**: When given a bug report, just fix it. Find root causes, check logs, resolve — zero hand-holding needed.
- **Elegance check**: For non-trivial changes, pause and ask "is there a more elegant way?" Skip for simple fixes.
- **Track progress**: Use `tasks/todo.md` for multi-step tasks. Mark items complete as you go.

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
- Client statuses: `active | inactive` only — no `prospect`. Enforced in Zod schemas, UI dropdowns, and KPI filters.
- **Table design:** See "Spacing & Layout → Tables" in Design Standards. ChangePen flat style.
- **Add/Edit forms:** Use shadcn `Sheet` sidebar pattern with grouped collapsible sections — not full-page forms or modals.
- **Destructive confirmations:** Use shadcn `AlertDialog` — never `window.confirm()` or browser `confirm()`.
- **Toast z-index:** Must be `z-[100]` — higher than Sheet/Dialog overlays (z-50).
- **Table columns:** Customizable where practical — toggle visibility + reorder, persist to localStorage.
- **Sidebar logo:** Use `logo.png` icon mark (36px) + themed text — never `logo-full.png` (dark text baked in, breaks dark mode).
- **Testing:** Test files live alongside routes in `__tests__/` directories. Use `chainMock()` pattern for Supabase client mocking (two-pass init for chainable methods). Mock `@/lib/supabase-server` in every API route test. Suppress `console.error` in test setup.
- **API route SELECT:** Use explicit column selection on list/read endpoints. Only use `select('*')` when the full record is needed (e.g., account export, audit diffs, edit forms that need all fields).
- **Cross-domain links:** On marketing pages, use `<a href={APP_DOMAIN + '/login'}>` (not `<Link>`) for links to `app.thepaybureau.com` — Next.js `<Link>` is for same-origin client-side navigation only. Import `APP_DOMAIN` from `@/lib/domains`.
- **Sidebar sections:** Collapsible with `ChevronDown` toggle. Auto-expand section containing active route. Nav items indented (`pl-2`), 36px rows (`h-9`), 18px icons, `rounded-lg`. Section labels are uppercase buttons.
- **Dashboard list page layout:** All list pages must follow the canonical pattern — see payrolls page as reference. Structure: (1) Header with title + Add button; (2) KPI cards; (3) Toolbar: Search → Filters → Columns (`Settings2`) → Export; (4) Expandable filters; (5) Table; (6) Pagination (`pt-2`, icon-only `h-7` buttons, `X / Y` format).

## Design Consistency & Brand Standards

**This section is MANDATORY for all Claude Code work.** Every page, component, and feature must comply with these standards. The visual identity is: clean, modern, premium SaaS — think Linear/Notion. White space is generous, borders are subtle, shadows are minimal. No exceptions. Deviations require explicit user approval.

### Brand Colors

| Token | Light Mode | Dark Mode | CSS Variable | Usage |
|-------|-----------|-----------|--------------|-------|
| **Primary (Purple)** | `#401D6C` | `#7C5CBF` | `--login-purple` | Navigation, primary buttons, headings, active states, focus rings |
| **Secondary (Pink)** | `#EC385D` | `#F06082` | `--login-pink` | CTAs, alerts, badges, destructive actions, hover accents |
| **Accent (Peach)** | `#FF8073` | `#FFA599` | `--login-peach` | Status indicators, progress bars, notifications, decorative elements |
| Surface | `#FFFFFF` | `#1A1B2E` | `--login-surface` | Card backgrounds, page backgrounds |
| Light BG | `#FAF7FF` | `#0F0F23` | `--login-cream` | Page-level background (subtle purple tint) |
| Text Primary | `#1A1225` | `#F1F5F9` | `--login-text` | Headings, body text |
| Text Secondary | `#5E5470` | `#CBD5E1` | `--login-text-2` | Descriptions, labels, secondary content |
| Text Muted | `#8E849A` | `#64748B` | `--login-text-3` | Placeholders, timestamps, metadata |
| Border | `#E8E2F0` | `rgba(255,255,255,0.08)` | `--login-border` | Card borders, dividers |
| Success | `#188038` | `#10B981` | `--login-success` | Completed states, positive feedback |
| Error | `#D93025` | `#EF4444` | `--login-error` | Errors, destructive actions, failures |

**Color rules:**
- **Never hardcode hex values in components** — use CSS variables or `getThemeColors(isDark)` from `src/contexts/ThemeContext.tsx`
- Dark mode variants are mandatory — every color must work in both themes
- All grays are purple-tinted (compare `#8E849A` vs generic `#6B7280`) — never use raw Tailwind grays
- Gradient direction: always purple → pink → peach (left-to-right or top-to-bottom)
- Brand gradient: `linear-gradient(135deg, primary, secondary)` — used for primary CTAs and hero accents
- Additional CSS variables: `--login-purple-d` (dark), `--login-purple-l` (light), `--login-border-f` (focus border) — see `src/app/globals.css`

**Three styling zones (intentional, follow the correct one):**

| Zone | Pages | Color Source | Reason |
|------|-------|-------------|--------|
| **Auth** | `src/app/(auth)/` | CSS variables (`var(--login-*)`) | Server-compatible, no JS needed |
| **Dashboard** | `src/app/(dashboard)/` | `getThemeColors(isDark)` inline styles | Dynamic theme, client-side |
| **Marketing** | `src/app/page.tsx`, `/roadmap` | `brand` const + CVA variants | Server-rendered, no ThemeContext |

### Typography

| Font | CSS Variable | Tailwind Usage | Purpose |
|------|-------------|----------------|---------|
| **Inter** | `--font-inter` | `font-[family-name:var(--font-inter)]` | UI chrome: buttons, labels, nav, form inputs, table headers, badges |
| **Plus Jakarta Sans** | `--font-body` | `font-[family-name:var(--font-body)]` | Body text: paragraphs, descriptions, card content, list items |
| **DM Serif Display** | `--font-display` | `font-[family-name:var(--font-display)]` | Display only: marketing headlines, auth hero text. **NEVER in dashboard** |

**Dashboard typography scale:**

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Page title (h1) | `text-xl md:text-2xl` | `font-bold` | Inter |
| Section heading (h2) | `text-lg` | `font-bold` | Inter |
| Card title | `text-sm` / `text-[0.85rem]` | `font-semibold` | Inter |
| Body text | `text-sm` / `text-[0.85rem]` | `font-normal` | Plus Jakarta Sans |
| Muted/meta | `text-xs` / `text-[0.8rem]` | `font-medium` | Inter |
| KPI number | `text-2xl` | `font-bold` | Inter |
| Table header | `text-xs` | `font-medium uppercase tracking-wider` | Inter |

**Typography rules:**
- Never introduce new fonts — these three cover all use cases
- Dashboard text is compact — `text-sm` is the baseline, not `text-base`
- Use `tracking-tight` on headings, `tracking-wider` on uppercase labels
- Font weight hierarchy: `400` body, `500` labels/nav, `600` headings, `700` emphasis
- Line height: `leading-relaxed` for body text, `leading-tight` for headings
- Fonts loaded via `<link>` tags in `src/app/layout.tsx` with `preconnect` — never use `next/font` (broken, see Session 6)

### Component Standards

**Use existing infrastructure — do not reinvent:**
- `shadcn/ui` components (`src/components/ui/`) — never build custom buttons, cards, dialogs, inputs
- `cn()` from `src/lib/utils.ts` for all className composition
- `CVA` (class-variance-authority) for component variants — follow `src/components/ui/button.tsx`
- `useTheme()` from `src/contexts/ThemeContext.tsx` for theme-aware dynamic styling
- Icons: `lucide-react` — import individual icons (`import { Users } from 'lucide-react'`), size with `className="w-4 h-4"` or `"w-5 h-5"`

**DO:**
- Use Tailwind classes for layout, spacing, sizing, hover states
- Use CSS variables (`var(--login-purple)`) for brand colors in Tailwind arbitrary values
- Use shadcn/ui Card, Button, Dialog, Select, Badge, Tabs, Sheet, Popover, Calendar, etc.
- Use `hover:` and `focus:` Tailwind modifiers for interactive states
- Use SWR hooks from `src/lib/swr.ts` for client-side data — never raw `fetch()` in components

**DON'T:**
- Create inline `style={{}}` objects for colors/backgrounds — use Tailwind or CSS variables (exception: dashboard pages using `getThemeColors()` — follow existing pattern until CSS variable migration)
- Use `onMouseEnter`/`onMouseLeave` to set `.style` properties — use Tailwind `hover:` classes
- Hardcode hex color values in component files
- Mix styling approaches on the same page
- Build custom components when a shadcn/ui primitive exists
- Use emoji as icons — use Lucide React
- Use browser `alert()` — use `useToast()` from `@/components/ui/toast`

### Spacing & Layout

**Dashboard layout constants:**
- Sidebar width: `252px` (`w-[252px]`)
- Navbar/sidebar header height: `60px` (`h-[60px]`)
- Page content padding: `p-4 md:px-6 md:py-6`
- Card padding: `p-4` to `p-6`
- Card gap in grids: `gap-3 md:gap-4`
- Section vertical spacing: `space-y-5`

**Visual consistency:**
- **Border radius:** `rounded-xl` (12px) for cards/panels, `rounded-lg` (8px) for inputs/buttons, `rounded-full` for avatars/badges
- **Shadows:** `shadow-sm` for cards, `shadow-md` for dropdowns/modals — no inline shadow definitions
- **Spacing:** 4px grid — use Tailwind scale (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px)
- **Cards:** White bg (light) / `var(--login-surface)` (dark), 1px border via `var(--login-border)`, `rounded-xl`, `shadow-sm`
- **Page layout:** Full-width (no `max-w` constraint on dashboard content). `DashboardWrapper.tsx` handles outer padding (`md:px-6 md:py-6`)
- **Tables:** Flat (no border wrapper), light gray header, thin `border-b` dividers only, no alternating rows, CSS-only hover. Row height ~48px, `px-4 py-3` cell padding. Sortable column headers with purple highlight + arrow indicator. Reference: ChangePen design language
- **Dividers:** Use `border-b` with `var(--login-border)` — never raw gray values
- **Empty states:** Centered icon (in rounded container with `${colors.primary}12` background) + heading + description + CTA button

### Animations & Transitions

| Class | Duration | Use For |
|-------|----------|---------|
| `transition-colors duration-150` | 150ms | Hover/focus state color changes |
| `transition-all duration-300` | 300ms | Theme change transitions |
| `animate-fadeIn` | 300ms ease-out | Page content appearance |
| `animate-pulse` | default | Skeleton loading states |
| `animate-spin` | default | Spinner icons (Loader2) |

**Rules:**
- Keep interaction animations under 200ms — users should never wait for animations
- Respect `prefers-reduced-motion` — motion-sensitive animations have `@media` overrides in `globals.css`
- Animate `transform` and `opacity` — never animate layout properties (`width`, `height`, `top`, `left`)
- Don't add new `@keyframes` without approval — use existing utility classes

### Performance & UX

- **Core Web Vitals targets:** LCP < 2.5s, FID < 100ms, CLS < 0.1 — Vercel Analytics + Speed Insights integrated in `layout.tsx`
- **Loading states:** Skeleton placeholders (pulsing rectangles matching content shape) for data loading — spinners (`Loader2`) only for user-triggered actions (form submit, button click). Follow pattern in `src/app/(dashboard)/dashboard/page.tsx`
- **Images:** Always use `next/image` with `width`/`height`. Add `priority` to above-the-fold images. Use `loading="lazy"` for below-fold
- **Dynamic imports:** Use `next/dynamic` with `{ ssr: false }` for heavy client components (AI chat widget, Recharts, rich editors, anything > 50KB not above-the-fold)
- **Data fetching:** Use SWR hooks from `src/lib/swr.ts` — handles caching, dedup, and revalidation. Don't use `useEffect` + `fetch()` for data
- **Perceived speed:** Optimistic UI updates via SWR `mutate()` for instant feedback
- **Bundle discipline:** Never add new dependencies without justification. Prefer Tailwind over CSS-in-JS. Import icons individually (`import { Users } from 'lucide-react'` — never import the full library)
- **Sentry:** Error monitoring configured — 10% trace sampling, 100% error replay. Don't swallow errors silently
- **Error display:** Wrap errors in a Card with error styling — never show raw error text

### Responsive Design & Accessibility

- **Mobile-first:** Design for 320px minimum, use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- **Breakpoints:** Mobile = base, Tablet/sidebar appears = `md:` (768px), Full desktop = `lg:` (1024px)
- **Touch targets:** Minimum 44x44px for interactive elements on mobile
- **Color contrast:** WCAG AA minimum — 4.5:1 for normal text, 3:1 for large text. Color must not be the only indicator of state — use icons or text alongside color
- **Focus indicators:** Visible focus rings using `ring-2 ring-[var(--login-purple)]/20` (shadcn handles this via `focus-visible:ring`)
- **Reduced motion:** Use `motion-safe:` Tailwind modifier for animations
- **Semantic HTML:** Proper heading hierarchy (`h1` → `h2` → `h3`), landmarks (`main`, `nav`, `aside`), ARIA labels on icon-only buttons
- **Keyboard navigation:** All interactive elements keyboard-accessible in logical tab order. No `<div onClick>` without `role="button"`, `tabIndex={0}`, and keyboard handler
- **Responsive patterns:** Stack KPI cards with `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`. Use `text-xl md:text-2xl` for responsive headings. Don't hide critical info on mobile — restructure, don't remove

### Dashboard Page Architecture

Every new dashboard page **must** follow this structure:

```tsx
'use client'
// 1. Import useTheme + getThemeColors
const { isDark } = useTheme()
const colors = getThemeColors(isDark)

// 2. Hydration guard
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

// 3. Show skeleton while !mounted or isLoading
if (!mounted || isLoading) return <SkeletonUI />

// 4. Show empty state when data is empty
if (data.length === 0) return <EmptyState />

// 5. Render with theme colors + responsive layout
return <div className="p-4 md:p-6">...</div>
```

### Page Design Checklist

Every new page or component **must** satisfy all of these before it's considered complete:

1. Uses the brand color palette exclusively — no off-brand grays or colours
2. Uses the correct font for each text type (Inter = UI, Plus Jakarta = body, DM Serif = display/marketing only)
3. Follows the 4px spacing grid and dashboard layout constants
4. Has skeleton/placeholder loading states for all async data
5. Works correctly in both light and dark mode (tested visually)
6. Is responsive from 320px to 1920px+
7. Uses shadcn/ui primitives — no custom implementations of solved UI patterns
8. Has consistent page padding and max-width constraints
9. All interactive elements have hover, focus, and active states
10. Passes WCAG AA color contrast requirements
11. Follows the dashboard page architecture pattern (`mounted` guard, skeleton, empty state)
12. Uses SWR for data fetching, not raw `fetch()` in effects

### File Reference Quick Index

| Purpose | File Path |
|---------|-----------|
| Theme colors & dark mode | `src/contexts/ThemeContext.tsx` |
| CSS variables & animations | `src/app/globals.css` |
| Root layout (fonts, analytics) | `src/app/layout.tsx` |
| shadcn/ui config | `components.json` |
| Class merge utility | `src/lib/utils.ts` (`cn()`) |
| SWR data hooks | `src/lib/swr.ts` |
| Zod schemas | `src/lib/validations.ts` |
| Dashboard reference page | `src/app/(dashboard)/dashboard/page.tsx` |
| Auth reference page | `src/app/(auth)/login/page.tsx` |
| Marketing components | `src/components/marketing/` |
| Landing page reference | `src/app/page.tsx` |
| Image processing utils | `src/lib/image-utils.ts` (`processAvatarImage()`) |
| Clients page (table reference) | `src/app/(dashboard)/dashboard/clients/page.tsx` |
| Payrolls config page | `src/app/(dashboard)/dashboard/payrolls/page.tsx` |
| Payroll runs page | `src/app/(dashboard)/dashboard/payrolls/runs/page.tsx` |
| Client CSV export API | `src/app/api/clients/export/route.ts` |
| Client CSV import API | `src/app/api/clients/import/route.ts` |
| Tenant users API | `src/app/api/users/route.ts` |
| Dashboard layout wrapper | `src/components/layout/DashboardWrapper.tsx` |
| API reference docs | `docs/api-reference.md` |
| Test helpers (Supabase mock) | `src/lib/__tests__/helpers/supabase-mock.ts` |
| Test setup (global mocks) | `src/lib/__tests__/helpers/setup.ts` |
| Jest config | `jest.config.js` |
| Vector search migration | `supabase/migrations/019_fix_vector_search.sql` |
| Domain constants | `src/lib/domains.ts` (`APP_DOMAIN`, `MARKETING_DOMAIN`, `MARKETING_ROUTES`) |

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
- **Security**: Fixed 14 vulnerabilities, blocked disposable emails (hardcoded domain blocklist), Redis rate limiting, CSP headers
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
- Created `/api/account/delete` endpoint with rate limiting (3 req/15 min), auth, audit logging
- Handles sole-admin edge case by cascading tenant deletion
- Added "Danger Zone" section to Settings with two-step confirmation (type "DELETE")
- Investigated Recharts lazy loading — correctly rejected (shared internal context breaks with dynamic imports)
- Confirmed `/api/account/export` already existed from prior session
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
- Migration `014_fix_vector_search.sql` was planned but not committed (vector search fixes were applied inline to `013_ai_assistant.sql` or via direct DB changes)
- Branch: `claude/payroll-ai-chatbot-VHTuX`

### Session 11 — Replace app.thepaybureau.com with thepaybureau.com
- Partially migrated `app.thepaybureau.com` references — some files updated but many remain
- **Still referencing `app.thepaybureau.com`**: `email-templates.ts` (4 URLs), `layout.tsx`, `sitemap.ts`, `robots.ts` (as fallbacks), CI workflow, `supabase/config.toml`, 4 Supabase email templates
- Left `mail.thepaybureau.com` and `support@thepaybureau.com` unchanged (correct)
- Note: `NEXT_PUBLIC_APP_URL` env var in Vercel should also be updated
- **TODO**: Complete the domain migration across remaining files
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

### Session 15 — Domain Strategy Discussion (2026-03-12)
- Discussed Vercel domain verification for `thepaybureau.com` — needs TXT record (`_vercel`) in GoDaddy DNS
- **Decision**: Keep `app.thepaybureau.com` as the primary domain for everything (no code changes needed)
- **Decision**: `thepaybureau.com` will be the marketing website (separate concern, to be revisited later)
- Evaluated security tradeoffs: separate deployments (marketing vs app) recommended long-term, single deployment acceptable for pre-launch
- **No code changes made** — current codebase already correctly references `app.thepaybureau.com` throughout
- **TODO**: Revisit `thepaybureau.com` domain setup once Vercel access is confirmed

### Session 16 — Fix Email Delivery for Feature Requests & Feedback (2026-03-12)
- **Bug**: No emails arriving at `support@thepaybureau.com` when users submit feature requests or feedback
- **Root cause**: Both `/api/feedback` and `/api/feature-requests` routes used fire-and-forget `sendEmail().catch()` — on Vercel serverless, the runtime terminates after the response is sent, killing the pending Resend API call before it completes
- **Fix**: Changed both routes to `await sendEmail()` wrapped in try/catch — ensures the Resend API call finishes before the function returns
- **Files modified**: `src/app/api/feedback/route.ts`, `src/app/api/feature-requests/route.ts`
- **Note**: If emails still don't arrive after deploy, check Resend dashboard (API key, `mail.thepaybureau.com` domain verification)
- Branch: `claude/fix-email-delivery-Z7vOS`
### Session 17 — Auto-Resize Profile Images on Upload (2026-03-13)
- **Problem**: Profile images uploaded at full size (up to 2MB) with no processing; planned use across multiple platform areas (feedback, consultant ID, training logs) would cause performance issues
- **Decision**: Client-side Canvas API resize — zero dependencies, processing before upload
- **Built**: `src/lib/image-utils.ts` with `processAvatarImage()` utility
  - Center-crops to square, resizes to 256×256px
  - Outputs WebP (0.85 quality) with JPEG fallback for older browsers
  - Handles transparency (preserved in WebP, white fill for JPEG)
  - Typical output: ~10-20KB vs raw 2MB max
- **Updated**: `src/app/(dashboard)/dashboard/settings/page.tsx` — integrated `processAvatarImage()` into `handleAvatarUpload` (~4 lines changed)
- **No changes needed**: Supabase bucket already accepts WebP/JPEG; Navbar/Sidebar display unchanged; CSP headers already allow `blob:`/`data:`
- **Future use cases discussed**: User feedback attribution, consultant identification in payroll runs (v2), training & CPD log
- Branch: `claude/auto-resize-profile-images-lPoEO`

### Session 18 — Clients & Payrolls Separation + Clients Page Redesign (2026-03-13)
- **Architecture change**: Split clients and payrolls into separate database tables — one client can now have multiple payrolls
- **New `payrolls` table**: Payroll config fields (frequency, pay day, PAYE ref, pension, etc.) moved from `clients` to `payrolls`
- **Migration 015**: Data migration from clients to payrolls, backfills `payroll_id` on existing `payroll_runs` and `checklist_templates`
- **Migration 016**: Added 7 new client fields — `domain`, `secondary_contact_name/email/phone`, `accountant_name/email/phone`
- **Status change**: Removed `prospect` client status — only `active` and `inactive` remain (updated Zod schemas, UI dropdowns, KPI filters, badges)
- **New routes**:
  - `/dashboard/clients` — rewritten as dense flat table with sidebar Sheet form
  - `/dashboard/payrolls` — new payroll config table page with sidebar form (Details, Pay Schedule, HMRC, Pension, Checklist)
  - `/dashboard/payrolls/runs` — payroll runs moved to sub-route, supports `?payroll=` filter param
  - `/api/payrolls` + `/api/payrolls/[id]` — new CRUD routes
  - `/api/clients/export` — CSV export with rate limiting (5 req/15 min)
- **Clients page iterations**:
  1. Table + sidebar + inline editing — rejected (too busy)
  2. Clean flat table matching ChangePen design — no borders, no alternating rows, thin dividers, ~48px rows, CSS-only hover
  3. Full-width responsive — removed `max-w-6xl mx-auto` from `DashboardWrapper.tsx`, reduced desktop padding
  4. Added sortable column headers, pagination (25/page), CSV export, delete AlertDialog
- **Design conventions established**: ChangePen as primary UI reference for tables; flat table style; full-width dashboard layout; sidebar Sheet pattern for add/edit forms
- **Files changed (13 modified, 4 new)**: migrations 015/016, `database.ts`, `validations.ts`, `swr.ts`, payroll API routes, client API routes, clients page, payrolls page, payroll runs page, `DashboardWrapper.tsx`, `Sidebar.tsx`, AlertDialog component
- Branch: `claude/add-clients-payrolls-pages-G0Jum`

### Session 19 — Audit & Expand Client Fields for Payroll Bureau CRM (2026-03-13)
- **Audit**: Reviewed all 20 existing client fields against UK payroll bureau/consultant needs — identified 27 missing fields
- **Added 25 new fields** across 5 categories (excluded `risk_rating` and `last_contacted_at` per user decision):
  - **Tax & Compliance (6)**: `vat_number`, `utr`, `cis_registered`, `hmrc_agent_authorised`, `tpas_authorised`, `auto_enrolment_status` (enum: enrolled/exempt/postponed)
  - **Company Details (3)**: `company_type` (enum: ltd/llp/sole_trader/charity/public_sector/partnership), `director_name`, `sic_code`
  - **Billing & Contract (5)**: `fee`, `billing_frequency` (enum: monthly/per_run/quarterly/annually), `payment_method` (enum: bacs/standing_order/card/invoice/direct_debit), `start_date`, `contract_end_date`
  - **Payroll Contact (3)**: `payroll_contact_name`, `payroll_contact_email`, `payroll_contact_phone`
  - **Additional (8)**: `registered_address` (JSON), `incorporation_date`, `assigned_to` (FK → users), `referral_source`, `bacs_bureau_number`, `tags` (text[]), `document_storage_url`, `portal_access_enabled`
- **Migration 017**: `ALTER TABLE clients ADD COLUMN` with CHECK constraints for all enum fields, array default for tags
- **Clients page expanded**: 10 sidebar form sections (5 new: Payroll Contact, Registered Address, Tax & Compliance, Billing & Contract, Additional Details), 3 new table columns (Company Type, Start Date, Assigned To)
- **New API route**: `/api/users` — returns tenant users (id, name, email) for Assigned To dropdown
- **CSV export/import**: All 25 fields added to both export and import routes
- **Files changed (8)**: migration 017 (new), `database.ts`, `validations.ts`, `clients/[id]/route.ts`, `clients/page.tsx`, `users/route.ts` (new), `clients/export/route.ts`, `clients/import/route.ts`
- Branch: `claude/audit-client-fields-UcXzT`

### Session 20 — Client Page Form Phase 2 & Customizable Table (2026-03-13)
- **Fields removed**: Payroll Contact section (primary contact covers this), Registered Address section (deferred), TPAS Authorised field, Director Name field
- **Fields renamed**: "HMRC Agent Authorised (64-8)" → "HMRC PAYE Online Authorisation"
- **Fields updated**: Auto Enrolment Status options changed from enrolled/exempt/postponed → Exempt/Currently Not Required/Enrolled; Payment Method changed from free text to dropdown (BACS, Standing Order, Card, Invoice, Direct Debit); Industry changed from free text to UK Industries dropdown (20 sectors)
- **Fields added**: Contract Type (Rolling / Fixed Term) — Contract End Date only shows when Fixed Term; Notice Period (number + unit: Days/Weeks/Months)
- **Migration 018**: Added `contract_type`, `notice_period_value`, `notice_period_unit` columns; updated `auto_enrolment_status` CHECK constraint (postponed → currently_not_required)
- **Customizable table columns**: "Columns" button opens dialog to toggle column visibility and reorder with up/down arrows; preferences persist in localStorage
- **Table visual improvements**: Company initial avatars with deterministic colors, sticky header, compact rows (py-2.5), text truncation on overflow cells, left border accent on hover
- **Bug fix**: Toast notifications hidden behind Sheet overlay — both used z-50; fixed toast to z-[100]
- **Root cause of "Failed to create client"**: Migrations 016–018 not applied to Supabase database; guided user through running all three in SQL Editor
- **Files changed**: `clients/page.tsx`, `validations.ts`, `database.ts`, `clients/export/route.ts`, `clients/import/route.ts`, migration 018 (new), `toast.tsx` (z-index fix)
- Branch: `claude/update-client-page-fields-Q1fqU`

### Session 21 — Sidebar Logo Resize & Dark Mode Fix (2026-03-13)
- **Goal**: Make sidebar logo bigger and more prominent
- **Attempt 1**: Swapped to `logo-full.png` (full lockup image) — looked broken due to wrong aspect ratio (275x150 image forced to 180x40)
- **Attempt 2**: Fixed aspect ratio with `h-[38px] w-auto` — looked correct in light mode but dark text baked into image was invisible in dark mode
- **Final solution**: Reverted to icon mark (`logo.png`) at 36px + theme-aware text (`colors.text.primary`) — works in both light and dark mode
- **Decision**: Don't use `logo-full.png` in the app — it has dark text baked in, unusable in dark mode without a separate white-text variant
- **Layout change**: Header height bumped from 52px → 60px across Sidebar, Navbar, and DashboardWrapper skeleton for consistent alignment
- **Files changed**: `Sidebar.tsx`, `Navbar.tsx`, `DashboardWrapper.tsx`
- Branch: `claude/update-client-page-form-7T38L`

### Session 22 — Test Coverage, Vector Search Migration, API Docs & SELECT * Audit (2026-03-13)
- **Scope**: Addressed 4 outstanding items from security/quality audit (items 4, 5, 7, 8)
- **Test infrastructure** (Item 4):
  - Added `npm test`, `npm run test:watch`, `npm run test:coverage` scripts
  - Created test helpers: `supabase-mock.ts` (chainable builder mock), `setup.ts` (global mocks for `next/headers`, audit, badges), `index.ts` (re-exports)
  - Updated `jest.config.js` with `setupFiles` and `testPathIgnorePatterns`
  - Created 7 test files with 44 tests covering: health, status, clients CRUD, clients [id], payrolls, payroll-run actions, dashboard stats
  - **Key pattern**: `chainMock()` uses two-pass init — first creates all `jest.fn()` stubs, then sets `mockReturnValue` with spread (avoids eager evaluation bug)
- **Vector search migration** (Item 5):
  - Created `supabase/migrations/019_fix_vector_search.sql` — `CREATE OR REPLACE FUNCTION match_document_chunks()` with `match_threshold DEFAULT 0.1` (was 0.3) and `SET LOCAL ivfflat.probes = 10` (was default 1)
  - Updated `src/lib/ai/rag.ts` line 35: `match_threshold: 0.3` → `0.1`
- **API documentation** (Item 7):
  - Created `docs/api-reference.md` — 2,175 lines covering all 42 API routes across 20 categories
  - Includes method, path, auth, request/response shapes, error codes, rate limiting
- **SELECT * audit** (Item 8):
  - Fixed 6 routes to use explicit column selection:
    - `feature-requests/route.ts` — 9 explicit columns
    - `badges/route.ts` — 2 queries: 5 + 13 explicit columns
    - `training/route.ts` — 12 explicit columns
    - `ai-assistant/documents/route.ts` — 9 explicit columns
    - `audit-logs/export/route.ts` — 7 columns (dropped `user_agent`, `user_id`, `id`, `tenant_id`)
    - `payroll-runs/generate/route.ts` — `select('id, name, sort_order')` for checklist templates
  - Intentionally skipped: account export (needs all), clients/payrolls list (sidebar edit needs all), audit diffs (needs full record)
- **Bugs encountered & fixed**:
  - `setupFilesAfterSetup` → `setupFiles` (Jest config key doesn't exist)
  - `beforeAll` not defined in setup → removed (setupFiles runs before Jest framework)
  - Helper files matched test pattern → added `testPathIgnorePatterns`
  - `chainMock` spread operator eagerness → two-pass init
- Branch: `claude/migration-vector-search-fix-KoFyk`

### Session 23 — SWR Login Revalidation & Unit Tests (2026-03-13)
- **Goal**: Close backlog item #3 — reduce SWR `dedupingInterval` or add explicit revalidation on login
- **Finding**: `dedupingInterval` was already at 2000ms (not 5s as backlog noted); SWR cache clear on both SIGNED_IN and SIGNED_OUT already existed in AuthContext
- **Remaining gap**: `clearSWRCache()` used `{ revalidate: false }` — mounted SWR hooks wouldn't refetch after cache clear, leaving empty state until something else triggered revalidation
- **Fix**: Added `revalidateAllSWR()` to `src/lib/swr.ts` (calls `mutate(() => true)` to force all mounted hooks to refetch); called it after `clearSWRCache()` on SIGNED_IN event in `AuthContext.tsx`
- **Tests added (12 total)**:
  - `src/lib/__tests__/swr.test.ts` (6 tests) — `clearSWRCache` args, `revalidateAllSWR` args, `defaultConfig` values, hook exports
  - `src/contexts/__tests__/AuthContext.test.tsx` (6 tests) — SIGNED_OUT clears cache + resets state, SIGNED_IN clears + revalidates (order verified), signOut handler, listener cleanup on unmount
- **Test deps installed**: `jest`, `ts-jest`, `@types/jest`, `@testing-library/react`, `@testing-library/jest-dom`, `jest-environment-jsdom`
- **Files changed**: `swr.ts`, `AuthContext.tsx`, 2 new test files, `package.json`/`package-lock.json`
- Branch: `claude/swr-deduping-tests-YqF0W`

### Session 24 — CLAUDE.md Merge Conflict Resolution & Cleanup (2026-03-13)
- **Problem**: 3 unresolved git merge conflicts in `CLAUDE.md` between `claude/update-client-page-fields-Q1fqU` and `main`
- **Resolution**: All 3 conflicts resolved by keeping main's version (superset in every case):
  - "Also Completed" section — main had 8 detailed bullets vs branch's 2
  - Conventions section — main had 5 conventions vs branch's 2
  - Session logs — main included Sessions 20–22 + SWR session vs branch's Session 20 only
- **Session renumbering**: Duplicate "Session 22" (SWR Login Revalidation) renumbered to Session 23
- **Files changed**: `CLAUDE.md`
- Branch: `claude/review-claude-md-JQ571`

### Session 25 — Marketing Pages on Main Domain (2026-03-14)
- **Goal**: Serve marketing pages from `www.thepaybureau.com` while app stays on `app.thepaybureau.com`
- **Decision**: Same Vercel project with middleware-based domain routing (not a separate project) — no code duplication, single deployment, cookies don't cross subdomains
- **Domain routing rules**:
  - `www.thepaybureau.com` → serves `/`, `/roadmap`, `/terms`, `/privacy` only (skips auth/CSRF entirely)
  - `www.thepaybureau.com/login`, `/dashboard`, `/api/*` → 301 redirect to `app.thepaybureau.com`
  - `thepaybureau.com` (bare) → 301 redirect to `www.thepaybureau.com`
  - `app.thepaybureau.com` → serves everything (unchanged)
  - `localhost:3000` → serves everything (dev, no hostname match)
- **New file**: `src/lib/domains.ts` — centralised `APP_DOMAIN`, `MARKETING_DOMAIN`, `MARKETING_ROUTES` constants
- **Middleware**: Domain check added as first middleware step, before Supabase client creation — marketing pages never touch auth
- **Marketing links**: 8 login/signup links across `page.tsx` and `roadmap/page.tsx` changed from relative `<Link>` to absolute `<a href={APP_DOMAIN + '/...'}>` (Next.js `<Link>` is same-origin only)
- **SEO**: Sitemap split by domain (marketing pages → `www.`, app pages → `app.`), `/roadmap` added to sitemap, canonical URLs updated
- **Vercel setup required**: Add `www.thepaybureau.com` + `thepaybureau.com` domains to existing project, add `NEXT_PUBLIC_MARKETING_URL` env var
- **Files changed (6)**: `domains.ts` (new), `middleware.ts`, `page.tsx`, `roadmap/page.tsx`, `sitemap.ts`, `robots.ts`
- Branch: `claude/marketing-pages-main-domain-6GGqZ`

### Session 26 — Marketing Copy Updates (2026-03-14)
- **Company name**: Changed "ThePayBureau Ltd" → "Intelligent Payroll Limited T/A The Pay Bureau" in Footer, Terms of Service (3 refs), Privacy Policy (1 ref)
- **Free tier — 50 clients**: Updated from "up to 5 clients" → "up to 50 clients" in PricingSection, FAQSection, and Roadmap V1 description
- **Free tier features expanded**: CSV import & export now included in free (was Unlimited-only); "Audit trail export" renamed to "Audit trail" with "Basic" label in free tier
- **Unlimited subtitle**: "For growing bureaux" → "For Payroll Pros" in PricingSection
- **Removed "500+ Specialists"**: TrustBar stat replaced with "UK / Built & hosted"; Hero avatar stack + social proof line removed entirely
- **Newsletter form removed**: Footer email form was non-functional (`e.preventDefault()` only, no API endpoint) — removed entirely; `'use client'` directive also removed from Footer since no longer needed
- **Roadmap V1 features**: Updated to match pricing page — "Client Management (up to 50)", "CSV Import & Export", "Basic Audit Trail" replacing previous list
- **Stripe & free users confirmed**: Free users can sign up without Stripe — checkout route rejects `price === 0`, no Stripe customer created at registration. No code changes needed
- **Deferred**: Real software screenshots for marketing pages (follow-up task — user will provide images with dummy data)
- **Files changed (8)**: `TrustBar.tsx`, `Hero.tsx`, `PricingSection.tsx`, `FAQSection.tsx`, `Footer.tsx`, `terms/page.tsx`, `privacy/page.tsx`, `roadmap/page.tsx`
- Branch: `claude/update-marketing-copy-VlmzO`

### Session 27 — Sidebar Collapsible Sections & Polish (2026-03-14)
- **Collapsible sections**: Section labels (OVERVIEW, CLIENTS, PAYROLL, etc.) are now clickable to expand/collapse child nav items; ChevronDown icon rotates to indicate state; smooth CSS grid-row animation
- **Auto-expand active section**: When navigating to a route, the parent section auto-expands via `useEffect` on pathname
- **Visual polish**: Nav items indented under section headers (`pl-2`), row height increased from 32px → 36px (`h-9`), icons bumped from 16px → 18px (`w-[18px]`), stronger active background (`${colors.primary}10`), `rounded-lg` on items
- **Search fix**: Sidebar search navigated to `/dashboard/clients?search=<query>` but clients page never read the URL param — added `useSearchParams()` hook to initialize and sync `searchQuery` state from URL
- **Rename**: "DEVELOPMENT" section → "TRAINING"
- **Files changed (2)**: `Sidebar.tsx`, `clients/page.tsx`
- Branch: `claude/move-settings-to-navbar-fVc8G`

### Session 28 — Align Clients Page to Payrolls Page Design (2026-03-15)
- **Goal**: Make clients and payrolls pages visually consistent; payrolls page chosen as the canonical design
- **Header restructured**: Moved Export and Columns buttons out of header into toolbar; header now shows only title + Add Client button (matching payrolls)
- **Toolbar aligned**: Restructured to Search → Filters → Columns → Export order with consistent `text-xs gap-1.5` button sizing; Columns icon changed from `SlidersHorizontal` to `Settings2`; Filters button color turns primary when filters active
- **Filters panel restyled**: Replaced `Card`/`CardContent` wrapper with plain `div` matching payrolls (`rounded-lg p-3`, subtle background); moved Industry and Status filters from toolbar/KPI-only into expandable filters section; "Clear All" changed from red ghost button to purple text link
- **Default columns expanded**: 3 → 6 defaults (added `industry`, `company_type`, `start_date` alongside existing `status`, `contact_name`, `contact_email`)
- **Empty state**: Wrapped in `Card`/`CardContent className="p-12"` matching payrolls
- **Pagination aligned**: Compact icon-only `h-7` buttons (no "Previous"/"Next" text), `X / Y` format, `pt-2` spacing, `gap-1`, always-visible "Showing X–Y of Z" count
- **Convention established**: Canonical dashboard list page layout pattern documented in Conventions section — all list pages must follow the same structure
- **Files changed (1)**: `clients/page.tsx`
- Branch: `claude/align-dashboard-pages-LkdkS`

### Session 29 — Pricing Model Alignment & Subscription Page Polish (2026-03-16)
- **Pricing model updated**: Unlimited tier changed from £9.99/mo (£7/mo annual) → £19/mo (£12/mo annual, £144/year)
- **5 tier cards on subscription page**: Free, Unlimited, Team (Coming Soon), Bureau (Coming Soon), Enterprise (Coming Soon)
- **Feature lists merged**: Free and Unlimited features consolidated from pricing document and existing codebase
- **Bureau tier features**: Time Tracking, Client Onboarding, Forms, Custom Fields, Invoicing, Contracts & Engagement Letters, E-signatures
- **Enterprise tier features**: AML / KYC Checks, Deep Analytics, Capacity Forecasting, Churn Risk Scoring, Revenue Forecasting, White Labelling
- **Annual savings badge**: Updated from "Save 22%" → "Save 37%" ((19-12)/19 = 36.8%)
- **Marketing pages updated**: PricingSection, FAQSection, roadmap page — all £9.99 refs → £19; "Business" tier renamed to "Bureau"
- **Stripe setup**: User must create new prices in Stripe (old £9.99/£84 prices can't be edited — archive old, create new £19/£144), update `STRIPE_PRICE_UNLIMITED_MONTHLY` and `STRIPE_PRICE_UNLIMITED_ANNUAL` env vars
- **Subscription page polish** (follow-up):
  - Upgrade button: removed CreditCard icon, shortened "Upgrade to Unlimited" → "Upgrade" to fix overflow
  - Added roadmap disclaimer above FAQ: "This is our roadmap — we expect features and plans to change as we grow and the community decides."
- **50-client free tier limit confirmed**: Fully enforced at API level (POST `/api/clients` returns 403), CSV import pre-validates, frontend shows red alert at limit + yellow warning near limit (5 away), submit button disabled — no code changes needed
- **Files changed**: `stripe.ts`, `PricingSection.tsx`, `subscription/page.tsx`, `FAQSection.tsx`, `roadmap/page.tsx`
- Branch: `claude/review-pricing-model-aj7Wq`

### Session 30 — Pensions Dashboard: TPR Column, Status Logic & Date Auto-Calculation (2026-03-16)
- **New column: TPR Dashboard Status** — tracks whether client has been added to The Pension Regulator dashboard; values: `not_added` (grey), `waiting` (amber), `added` (green); badge in table, dropdown in sidebar form
- **Migration 020**: `ALTER TABLE clients ADD COLUMN tpr_dashboard_status TEXT DEFAULT 'not_added'` with CHECK constraint
- **Status logic rewrite** — `getOverallStatus()` completely rewritten:
  - `Overdue`: only when declaration deadline has passed (previously any past date triggered this)
  - `Due Soon`: declaration deadline within 30 days
  - `Ready`: re-enrolment date passed, declaration can now be completed
  - `Waiting`: re-enrolment date still in the future
  - `Missing Info`: required dates not set
  - `Exempt`: AE status is exempt
  - Staging date no longer factors into status — purely informational
- **Date auto-calculation**: Setting staging date auto-fills declaration deadline (+5 months) and re-enrolment date (+3 years); both remain manually editable; helper text shows "Auto-calculated" when auto-filled
- **KPI cards updated**: Total, Overdue, Due Soon, Ready, Exempt (replaced "Missing Info" with "Ready")
- **Legend updated**: 5 status dots with descriptions explaining each state
- **Export route fixed**: `getOverallStatus()` in export route also rewritten to match new logic; TPR Dashboard column added to CSV
- **Domain knowledge captured**:
  - Staging date = start date for pensions (informational only)
  - Re-enrolment = happens every 3 years, date updated manually after each exercise
  - Declaration deadline = compliance form deadline, £400 penalty if missed, normally 5 months after staging date
  - TPR Dashboard = client must be added before declaration can be completed
- **Files changed (6)**: migration 020 (new), `database.ts`, `validations.ts`, `pensions/route.ts`, `pensions/export/route.ts`, `pensions/page.tsx`
- Branch: `claude/pensions-dashboard-dates-QGieb`
