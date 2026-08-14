# Phase 4. Database Invariants

[Back to overview](overview.md)

## Goal

Make cross-family references, duplicate owners, actor spoofing, and racy seat-cap enforcement invalid at the database boundary.

## Blockers addressed

- VAL-014 relational integrity.
- VAL-006 seat-cap concurrency prerequisite.

## Data structures

- Composite family ownership keys for babies, events, and edit history.
- Composite author ownership keys for check-ins and reflections.
- One-owner-per-family invariant.

## Changes

### Task 1. Write negative pgTAP cases

**Files:**

- Modify `supabase/tests/01-rls-security.test.sql`.
- Create `supabase/tests/02-relational-integrity.test.sql`.

Add failing cases for cross-family events, cross-family edit history, cross-user reflections, duplicate owners, actor spoofing, and simultaneous seat claims.

Completion criterion. Every new assertion fails against the baseline for the intended invariant.

### Task 2. Add composite ownership constraints

**Files:**

- Create `supabase/migrations/20260814000200_relational_integrity.sql`.
- Modify `mobile/powersync/schema.ts` only if a synced column changes.
- Modify `mobile/__tests__/schemaAlignment.test.js` or its Jest replacement.

Add composite uniqueness and foreign keys for family-scoped relationships. Add composite check-in ownership for reflections. Mark `token_is_active` as stable.

Completion criterion. Cross-tenant rows cannot be constructed even with service-role SQL.

### Task 3. Lock membership capacity and owner selection

**Files:**

- Extend `supabase/migrations/20260814000200_relational_integrity.sql`.
- Extend `supabase/tests/02-relational-integrity.test.sql`.

Serialize seat-cap decisions by locking the family row. Add a partial unique index for one owner per family. Define deterministic successor ordering for later deletion work.

Completion criterion. Concurrent last-seat and owner assertions have deterministic outcomes.

### Task 4. Tighten attribution policies

**Files:**

- Extend `supabase/migrations/20260814000200_relational_integrity.sql`.
- Extend `supabase/tests/01-rls-security.test.sql`.

Require authenticated actors on event and edit creation. Prevent clients from rewriting attribution after insert. Preserve former-caregiver nulling during account deletion.

Completion criterion. RLS rejects spoofed actors and legitimate local-first writes still upload.

## Verification

### Static

Run:

```bash
supabase db reset
supabase test db
cd mobile && npm run typecheck && npm test -- schema
```

Expected. All positive and negative database cases pass from a fresh schema.

### Runtime

Use two authenticated local clients to submit the last available seat concurrently. Confirm one succeeds, one receives the defined capacity result, and the audit and member counts remain consistent.

## Commit boundary

Keep invariants and their negative tests in one migration commit.

Suggested commit. `fix(database): enforce family and actor invariants`

## Exit criteria

- Cross-family and cross-author references are database-invalid.
- Exactly one owner exists per family.
- Seat-cap decisions serialize.
- Client attribution cannot be spoofed.
