# Version Control & Deployment Strategy

## The Problem

Right now: push to `main` → Vercel auto-deploys → production. That's fine when you're the only user. Once you have real users and real data, a bad deploy means broken payroll workflows, lost trust, and potential compliance issues.

## How Other SaaS Teams Handle This

Most solo/small-team SaaS products at your stage use **GitHub Flow** — not GitFlow (too complex), not trunk-based (too risky without comprehensive tests):

```
feature branch → PR → CI checks pass → review preview → merge to main → auto-deploy
```

The key differences from what you do now:

1. **You test the Vercel preview deployment before merging** (not after)
2. **Database changes have a separate, careful process** (not "merge and hope")
3. **You can roll back instantly** via Vercel (not "fix forward under pressure")
4. **Branch protection prevents accidental pushes to main**

This is what companies like Linear, Cal.com, Dub.co, and most Vercel-deployed SaaS products do at the 1-10 developer stage.

---

## Your Workflow (Implement Now)

### Step 1: Branch Protection (5 minutes, do today)

Go to GitHub → Settings → Branches → Add rule for `main`:

- [x] Require pull request before merging
- [x] Require status checks to pass (select your CI workflow)
- [x] Do not allow bypassing these settings

This prevents you (or Claude Code) from accidentally pushing straight to `main`. Every change goes through a PR.

### Step 2: The Deploy Checklist

Every change follows this process:

```
┌─────────────────────────────────────────────────────┐
│  1. Code on feature branch                          │
│  2. Push → PR auto-created                          │
│  3. CI runs (lint, types, tests, build)             │
│  4. Vercel builds a preview deployment              │
│  5. YOU click the preview URL and test it            │
│  6. If DB migration needed → run migration FIRST    │
│  7. Merge PR → auto-deploy to production            │
│  8. Verify production (30-second smoke test)        │
│  9. If broken → instant rollback via Vercel         │
└─────────────────────────────────────────────────────┘
```

### Step 3: Database Migrations (The Scary Part)

This is your biggest risk. Code deploys can be rolled back in seconds. Database changes cannot.

**Rules for safe migrations:**

1. **Always additive first** — add columns/tables, never rename or drop in the same deploy
2. **Never delete columns with data** — mark as deprecated, remove in a later migration after code no longer references them
3. **Test migrations on a copy** — before running on production, test on a Supabase branching database or local Supabase instance
4. **Backup before migrating** — Supabase has daily automatic backups, but trigger a manual one before any migration (Dashboard → Settings → Database → Backups)
5. **Migration THEN code, not the other way around** — run the migration before merging the PR that uses the new columns

**The 2-phase migration pattern** (how the pros do it):

Want to rename a column? Don't. Instead:
```
Phase 1: Add new column → deploy code that writes to BOTH old and new → backfill data
Phase 2: Deploy code that reads from new only → drop old column (weeks later)
```

Want to change a column type? Same pattern — add new, migrate data, switch reads, drop old.

**Migration ordering:**

```
1. Take a Supabase backup (Dashboard → Settings → Backups)
2. Test migration SQL on local Supabase (supabase db reset)
3. Run migration on production Supabase SQL Editor
4. Verify data looks correct (spot check a few rows)
5. THEN merge the PR that uses the new schema
```

### Step 4: Vercel Preview Deployments (Your Free Staging)

You already have this — Vercel auto-builds a preview URL for every PR. Use it.

**What to check on the preview:**
- Pages load without errors
- Key flows work (create client, view payrolls, etc.)
- No console errors in browser DevTools
- Mobile layout isn't broken

**Limitation:** Preview deployments hit your **production Supabase**. This is fine for read operations but means you should be careful with write operations during testing. If you want full isolation later, set up a staging Supabase project (see "Growing Up" section below).

### Step 5: Rollback Strategy

**Code rollback (instant):**
- Vercel Dashboard → Deployments → find the last working deployment → "..." menu → "Promote to Production"
- This takes ~10 seconds. Your production is restored to the previous version.

**Database rollback (manual):**
- If a migration went wrong, you need a **reverse migration** SQL script
- For every migration you write, write the reverse: `ALTER TABLE DROP COLUMN` for every `ADD COLUMN`, etc.
- Store these in `supabase/rollbacks/` (optional, but smart)
- Worst case: restore from the backup you took before migrating

**Decision tree when production breaks:**

```
Production broken?
├── Is it a code bug (no DB changes)?
│   └── Rollback via Vercel (10 seconds) ✅
├── Is it a migration bug (DB + code)?
│   ├── Can the code work without the new column?
│   │   └── Rollback code via Vercel, leave DB as-is ✅
│   └── Code depends on the migration?
│       └── Fix forward (hotfix branch → PR → merge) 🔧
└── Is it a data issue (wrong data in DB)?
    └── Fix data directly in Supabase SQL Editor 🔧
```

---

## What NOT To Do Yet

Things that are overkill for a solo dev with Claude Code:

| Skip This | Why |
|-----------|-----|
| Separate staging environment | Vercel previews + local dev are enough until you have a team |
| Feature flags (LaunchDarkly etc.) | Just use branches and PRs — feature flags add complexity |
| Automated database migrations | Manual is safer at your scale — you see exactly what runs |
| GitFlow (develop/release/hotfix branches) | Way too complex for 1 person — GitHub Flow is plenty |
| Canary/blue-green deployments | Vercel handles this automatically with instant rollback |
| Automated rollback triggers | Just watch Sentry + manually rollback if needed |

---

## Growing Up (When You Have a Team)

When you hire your first developer or reach ~50 paying customers:

### Add a Staging Environment
1. Create a second Supabase project ("ThePayBureau Staging")
2. Run all migrations on staging first
3. Add a `staging` branch in Vercel (auto-deploys from a `staging` git branch)
4. Vercel env vars: point staging at the staging Supabase project
5. Workflow becomes: feature → staging → production

### Add Automated Migration Checks
- Use `supabase db diff` to auto-generate migrations from schema changes
- Add a CI step that validates migration SQL syntax
- Consider Supabase branching (creates temporary database branches for PRs)

### Consider Feature Flags
Only when you need to:
- Deploy code that isn't ready for all users
- A/B test features
- Gradually roll out risky changes

A simple `features` table in Supabase + a React context is enough — no need for LaunchDarkly.

---

## Quick Reference Card

### Before Every Deploy
- [ ] CI passes (lint, types, tests, build)
- [ ] Preview deployment tested manually
- [ ] No `console.log` or debug code left in
- [ ] If migration needed: backup taken, migration tested locally, migration run on prod BEFORE merge

### After Every Deploy
- [ ] Check production loads (30-second smoke test)
- [ ] Check Sentry for new errors (give it 5 minutes)
- [ ] If something's wrong: rollback via Vercel immediately, investigate after

### Emergency Rollback
1. Go to `vercel.com/dashboard` → your project → Deployments
2. Find the last working deployment (green checkmark, before the bad one)
3. Click "..." → "Promote to Production"
4. Done. Production is restored in ~10 seconds.

---

## Summary

Your current workflow is 90% there. The three changes that matter most:

1. **Turn on branch protection** — prevents accidents (5 minutes)
2. **Test preview deployments before merging** — catches bugs before production (habit change)
3. **Run migrations before merging code** — prevents "new code, old schema" crashes (process change)

Everything else is optimisation. These three things are the difference between "I hope this works" and "I know this works."
