# Lessons Learned

_Patterns and corrections captured here to prevent repeated mistakes. Review at session start._

## Infrastructure & Build

- **`next/font/google` breaks builds** — Use `<link>` tags in `layout.tsx` with CSS variables instead. Intermittent fetch failures on Vercel. (Session 6)
- **Sentry `hideSourceMaps` deprecated** — Use `sourcemaps: { deleteSourcemapsAfterUpload: true }` instead. (Session 6)
- **Exclude test files from `tsconfig.json`** — Otherwise missing `@types/jest` causes build errors. (Session 6)

## Vercel Serverless

- **Never fire-and-forget emails** — Always `await sendEmail()`. Vercel terminates the runtime after response is sent; unawaited promises die. Use `waitUntil()` for genuinely non-blocking work. (Session 16)
- **Badge/stats updates can be fire-and-forget** — Non-critical side effects like `updateUserStats()` and `checkAndAwardBadges()` are OK as fire-and-forget since losing them isn't user-facing. (Session 9)

## Supabase & Database

- **Migrations are NOT auto-applied** — Files in `supabase/migrations/` must be manually run in Supabase SQL Editor. If user reports "Failed to create X", check migration status first. (Session 20)
- **RLS is sound** — Database-level tenant isolation is correct across all tables. Data leaks between accounts are client-side caching issues, not RLS. (Sessions 5, 13)

## SWR & Client-Side Caching

- **Clear + revalidate on auth change** — Both `SIGNED_IN` and `SIGNED_OUT` must call `clearSWRCache()` then `revalidateAllSWR()` in that order. Without revalidation, mounted hooks show empty state. (Sessions 5, 13, 23)
- **`dedupingInterval` is 2000ms** — Not 5s as originally noted. Already reasonable. (Session 23)

## Testing

- **`chainMock()` requires two-pass init** — First pass creates all `jest.fn()` stubs, second pass sets `mockReturnValue` with spread. Single-pass causes eager evaluation bugs where methods reference not-yet-created fns. (Session 22)
- **Jest config key is `setupFiles`** — NOT `setupFilesAfterSetup` (doesn't exist). (Session 22)
- **Helper files match test patterns** — Add `testPathIgnorePatterns` for `helpers/` directories. (Session 22)

## UI & Design

- **`logo-full.png` breaks dark mode** — Dark text baked into image; invisible on dark backgrounds. Use `logo.png` icon mark + themed text. (Session 21)
- **Toast z-index must be `z-[100]`** — Sheet/Dialog overlays use z-50; toasts must be higher. (Session 20)
- **Recharts cannot be dynamically imported** — Shares internal React context that breaks across chunk boundaries. (Session 8)
- **CSS variables use `--login-*` prefix** — Historical artifact; used app-wide despite the name. Don't be confused by it. (Session 1)

## Architecture Decisions

- **One client → many payrolls** — Payroll config fields live on `payrolls` table, not `clients`. Payroll runs reference `payroll_id`. (Session 18)
- **`prospect` status removed** — Only `active` and `inactive` client statuses. Enforced in Zod, UI, and KPI filters. (Session 18)
- **Marketing pages use CVA, not ThemeContext** — Three styling zones: Auth (CSS vars), Dashboard (getThemeColors), Marketing (brand const + CVA). (Session 12)
- **Cross-domain links use `<a>`, not `<Link>`** — Next.js `<Link>` is same-origin only. Marketing → app links must be `<a href={APP_DOMAIN + '/...'}>`. (Session 25)
