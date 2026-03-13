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
- **Plan gating:** Free tier limited to 50 clients; AI Assistant, Knowledge Base, Training & CPD require paid plan. Server-side enforcement in API routes (`403` with `upgrade: true`), client-side gating via `useSubscription()` SWR hook and `UpgradePrompt` component. Sidebar shows PRO badges on gated items.

## Security Notes (from audit 2026-03-07)

- Health/status endpoints are intentionally unauthenticated.
- `feature_requests` RLS UPDATE/DELETE policies need tightening (currently `USING (true)` — admin check only in API layer).
- Some API routes use `SELECT *` — consider explicit column selection for list endpoints.

## Known Issues

- **Incomplete domain migration**: 15+ `app.thepaybureau.com` references remain in email templates, fallback URLs, CI config, and Supabase config (see Session 11).
- **Missing migration**: Vector search fix migration referenced in Session 10 was never committed.

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
- Domain migration: `app.thepaybureau.com` → `thepaybureau.com` (partial — fallback URLs and email templates still reference `app.` subdomain)
- AI assistant RAG pipeline debugging & fixes
- SWR cache isolation fix on logout
- Deployment build fixes (fonts, Sentry)
- Production performance optimizations (non-blocking badges, dashboard date filter, import batching)
- Free tier client limits (50) and feature gating (AI Assistant, Training & CPD behind paywall)

### In Progress / Planned (from tester feedback 2026-03-04)
- Show frequency name in payroll run summary rows
- Reorder pension tasks after payroll run in checklists
- Global auth context for reactive user tracking
- Reduce SWR `dedupingInterval` or add explicit revalidation on login
- Complete `app.thepaybureau.com` → `thepaybureau.com` domain migration
- ~~Renumber duplicate `001_` migration files~~ (fixed: renamed to `014_`)
- Create missing `014_fix_vector_search.sql` migration (or verify fixes applied directly)

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
- Plan/feature gating: use `PLANS` from `src/lib/stripe.ts` as source of truth. Client-side checks via `useSubscription()` SWR hook. Server-side checks query `tenants.plan`. Gated pages use wrapper component pattern + `UpgradePrompt` component.
- API routes returning plan-gated errors: `{ error: string, upgrade: true }` with `403` status.

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
- Navbar height: `52px` (`h-[52px]`)
- Page content padding: `p-4 md:p-6`
- Card padding: `p-4` to `p-6`
- Card gap in grids: `gap-3 md:gap-4`
- Section vertical spacing: `space-y-5`

**Visual consistency:**
- **Border radius:** `rounded-xl` (12px) for cards/panels, `rounded-lg` (8px) for inputs/buttons, `rounded-full` for avatars/badges
- **Shadows:** `shadow-sm` for cards, `shadow-md` for dropdowns/modals — no inline shadow definitions
- **Spacing:** 4px grid — use Tailwind scale (`p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px)
- **Cards:** White bg (light) / `var(--login-surface)` (dark), 1px border via `var(--login-border)`, `rounded-xl`, `shadow-sm`
- **Page layout:** `max-w-7xl mx-auto` with `px-4 sm:px-6 lg:px-8` padding
- **Tables:** Alternating row backgrounds, sticky headers, consistent `px-4 py-3` cell padding
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
| Plan definitions & limits | `src/lib/stripe.ts` (`PLANS`, `PAID_ONLY_ROUTES`) |
| Upgrade prompt (feature gate) | `src/components/ui/UpgradePrompt.tsx` |

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

### Session 16 — Free Tier Client Limits & Feature Gating (2026-03-13)
- **Free tier**: Limited to 50 clients (was 100, unenforced). Server-side enforcement in both `/api/clients` (POST) and `/api/clients/import` (POST)
- **Feature gating**: AI Assistant, Knowledge Base, Training & CPD require paid plan (`unlimited`)
- **Sidebar**: Gated items visible with gradient "PRO" badge, greyed out at 60% opacity. Clicking navigates to page which shows upgrade prompt
- **Page gates**: Wrapper component pattern on `ai-assistant`, `ai-assistant/documents`, `training` pages — free users see `UpgradePrompt` card with "Upgrade to Unlimited" CTA
- **Client limit UX**: Warning banner at 45/50 on Add Client page, error banner + upgrade button at 50/50. Import page shows remaining slots
- **Subscription page**: Updated feature lists — free (Payroll runs, Pension declarations, Audit log, Feature requests, Email support), unlimited (Everything in Free, Unlimited clients, AI Assistant, Training & CPD, Priority support). FAQ updated for 50-client limit
- **Architecture**: `useSubscription()` SWR hook added. Plan flows through `layout.tsx` → `DashboardWrapper` → `Sidebar` via prop drilling (matches existing `isAdmin` pattern)
- **New component**: `src/components/ui/UpgradePrompt.tsx` — reusable upgrade card with feature name, description, and CTA
- **Decisions**: Audit Log stays free. Gated items visible (not hidden) to drive upgrade awareness
- **Future design (not implemented)**: 30-day trial via Stripe `trial_period_days: 30` — one line change. Manual upgrade via admin API that sets `tenants.plan` directly (no Stripe needed)
- **Files modified**: `stripe.ts`, `swr.ts`, `clients/route.ts`, `clients/import/route.ts`, `Sidebar.tsx`, `DashboardWrapper.tsx`, `layout.tsx`, `subscription/page.tsx`, `ai-assistant/page.tsx`, `ai-assistant/documents/page.tsx`, `training/page.tsx`, `clients/add/page.tsx`, `clients/import/page.tsx`
- **Files created**: `src/components/ui/UpgradePrompt.tsx`
- Branch: `claude/free-tier-client-limits-XJT1j`
