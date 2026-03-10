# CLAUDE.md — ThePayBureau

## Project Overview

- **Stack**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Supabase
- **Purpose**: SaaS payroll management platform for accountant partners
- **UI**: Shadcn/ui components, dark mode via ThemeContext, glass morphism effects

## Key Directories

- `src/app/` — Next.js App Router pages and API routes
- `src/components/ui/` — Shadcn/ui primitives (20 components)
- `src/components/layout/` — DashboardWrapper, Navbar, Sidebar
- `src/contexts/ThemeContext.tsx` — Dark/light theme provider with brand colors
- `src/lib/` — Utilities, validations, Supabase clients, HMRC deadline engine

## Brand Colors (Canonical Source: ThemeContext.tsx)

| Token | Light | Dark |
|-------|-------|------|
| Primary (purple) | `#401D6C` | `#6B46C1` |
| Secondary (pink) | `#EC385D` | `#EC4899` |
| Accent (peach) | `#FF8073` | `#F97316` |
| Success (green) | `#10B981` | `#10B981` |
| Warning (amber) | `#F59E0B` | `#F59E0B` |
| Error | `#EF4444` | `#EF4444` |

## Conventions

- All client components must have `"use client"` directive
- New components use TypeScript with typed props
- Colors in new components must align with ThemeContext values (see table above)
- Inline-styled standalone components (e.g., quote calculator) should reference a `BRAND` object matching the canonical palette

## Features

### Completed

- Auth flow (login, signup, forgot/reset password, verify email, callback)
- Dashboard with KPI cards
- Client management & onboarding (5-step wizard)
- Payroll management
- Settings pages
- HMRC deadline engine
- Dark mode support
- **AccountantQuoteCalculator** — Partner tool for instant client quotes with pricing breakdown, discounts, and profit calculation (`src/components/AccountantQuoteCalculator.tsx`)

### In Progress

- (none currently)

## Session Log

### 2026-03-10 — Fix color palette in AccountantQuoteCalculator

- **Problem**: `AccountantQuoteCalculator` component had a `BRAND` color palette out of sync with the project's `ThemeContext` theme system
- **Fixes applied**:
  - `green`: `#2DA44E` → `#10B981` (match ThemeContext success)
  - `greenLight`: `#DAFBE1` → `#D1FAE5` (emerald-100)
  - `amber`: `#D4A017` → `#F59E0B` (match ThemeContext warning)
  - `amberLight`: `#FFF8E1` → `#FEF3C7` (amber-100)
  - `offWhite`: `#F8F6FB` → `#F8F4FF` (match ThemeContext lightBg)
  - Hardcoded `#28a745` in profit gradient → `#059669` (emerald-600)
- Added `"use client"` directive (required for Next.js App Router with hooks)
- Added TypeScript types for all component props and state
- File created at `src/components/AccountantQuoteCalculator.tsx`
- Branch: `claude/fix-color-palette-7JWSK`
