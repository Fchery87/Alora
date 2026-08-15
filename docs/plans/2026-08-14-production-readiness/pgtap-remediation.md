# pgTAP RLS Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the hosted pgTAP security suite represent PostgreSQL RLS behavior accurately and restore the valid founder-first onboarding path.

**Architecture:** Keep the already-pushed baseline migration immutable. Add one additive migration with a narrowly scoped `SECURITY DEFINER` predicate for the founder’s first owner seat, then update the test fixture/assertions to distinguish rejected writes from no-op updates. Make fresh local/standalone runs apply every canonical migration in filename order.

**Tech Stack:** Supabase Postgres, PostgreSQL RLS, pgTAP, Bash, Supabase CLI.

### Task 1: Add the owner-first policy fix

**Files:**
- Create `supabase/migrations/20260814000200_fix_owner_first_rls.sql`

Write a security-definer predicate that checks both family ownership and emptiness without being blocked by `families` or `family_members` RLS. Replace `members_owner_first` so only the creator of an empty family can insert the first owner member. Preserve the existing role check and prevent hijacking a family after membership exists.

### Task 2: Correct pgTAP behavior assertions

**Files:**
- Modify `supabase/tests/01-rls-security.test.sql`

Change denied authenticated inserts to assert SQLSTATE `42501` with `throws_ok`, while retaining follow-up row-count assertions. Change the limited-seat update test to assert that the statement is a no-op and that `seat_limit` remains unchanged. Filter invitation-token counts by the intended family and account for the second active token created by the issuance test.

### Task 3: Repair the seat-limit fixture sequence

**Files:**
- Modify `supabase/tests/01-rls-security.test.sql`

Use a cap of one for the explicit over-limit rejection assertion, then raise the cap to two before the redemption success assertion. Keep the plan at 52 assertions and preserve the redemption success path.

### Task 4: Apply the complete migration history in standalone runs

**Files:**
- Modify `backend/tests/run-pgtap.sh`

Replace the single baseline migration path with a sorted migration-file list. Apply every canonical migration for local and explicitly opted-in disposable remote targets. Leave the default hosted-target mode unchanged so it never reapplies migrations.

### Task 5: Verify before publishing

Run:

```bash
bash -n backend/tests/run-pgtap.sh
git diff --check
```

Review the SQL diff and confirm no production reset or destructive operation is introduced. After review, push the additive migration with `supabase db push`, then rerun the dedicated remote suite with the existing `PGLTAP_DATABASE_URL`, `PGPASSWORD`, and confirmation token.
