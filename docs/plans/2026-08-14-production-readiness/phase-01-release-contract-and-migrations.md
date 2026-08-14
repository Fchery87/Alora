# Phase 1. Release Contract and Migration Baseline

[Back to overview](overview.md)

## Goal

Create one truthful beta scope and one canonical, versioned database history before additional schema work begins.

## Blockers addressed

- VAL-011 product and documentation drift.
- VAL-013 migration and provisioning foundation.

## Data structures

- `LaunchScope`. The approved set of enabled beta capabilities and explicit deferrals.
- Supabase migration history. Ordered SQL files that fully create a fresh Alora backend.

## Changes

### Task 1. Freeze the beta contract

**Files:**

- Modify `alora_updated_prd.md`.
- Modify `CONTEXT.md`.
- Modify `.scratch/launch-readiness/ROADMAP-PRD.md`.
- Modify `README.md`.
- Modify `VALIDATION_TASKS.md`.

Record one consistent decision. The default for this plan keeps owner, partner, limited, seat limits, growth, reports, and handoff enabled for beta. It freezes all net-new features. Mark device-unverified features accurately.

Completion criterion. A search for MVP, Phase 2, limited, growth, and production ready produces no contradictory launch claims.

### Task 2. Establish Supabase CLI layout

**Files:**

- Create `supabase/config.toml`.
- Create `supabase/migrations/20260814000100_alora_baseline.sql`.
- Move `backend/tests/00-mock-auth.sql` into test support under `supabase/tests/support/`.
- Modify `backend/PROVISIONING.md`.
- Modify `backend/README.md`.

Build the baseline from the current schema and RLS in their required order. Include extensions, enums, tables, indexes, functions, triggers, grants, and policies. Configure local development without production secrets.

Completion criterion. `supabase db reset` creates a fresh local backend without manual SQL pasting.

### Task 3. Delete the duplicate schema entry points

**Files:**

- Delete `backend/schema.sql` after every reference is migrated.
- Delete `backend/rls.sql` after every reference is migrated.
- Modify `docs/adr/0001-supabase-powersync-backend.md`.
- Modify `docs/launch-checklist.md`.

Keep `backend/sync-rules.yaml` as the PowerSync configuration source. Do not keep mutable schema copies beside migrations.

Completion criterion. The migration directory is the only production schema source and all documentation points to it.

## Verification

### Static

Run:

```bash
supabase db reset
git diff --check
```

Expected. The database reset exits 0 and documentation contains no obsolete provisioning path.

### Runtime

Open Supabase Studio locally. Confirm every application table, RLS policy, function, trigger, and seed resource exists after reset.

## Commit boundary

Commit the approved scope and migration baseline together because the migration encodes the supported role model.

Suggested commit. `chore(backend): establish canonical beta schema migrations`

## Exit criteria

- Fresh local backend creation is one command.
- Launch scope is consistent across product, domain, readiness, and provisioning documents.
- No production schema has two editable sources.
