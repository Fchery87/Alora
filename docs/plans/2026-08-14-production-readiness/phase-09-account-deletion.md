# Phase 9: Make Account Deletion Retry-Safe

## Goal

Implement account deletion as an idempotent workflow across application data and Supabase Auth. A failed Auth Admin call must not leave family ownership or private data half-mutated.

## Why This Phase Comes Here

Deletion depends on the ownership invariants from Phase 4 and the role model from Phase 8. It must land before beta because account deletion is both a privacy obligation and a destructive production path.

## Target Workflow

Use a database-backed `account_deletion_requests` record as the durable workflow boundary.

- The Edge Function authenticates the caller and creates or reuses one active request.
- The Edge Function asks Supabase Auth Admin to delete the authenticated user.
- An `auth.users` deletion trigger performs all application-data cleanup in the same database transaction as the Auth deletion.
- The trigger locks affected families in stable order.
- The trigger transfers ownership to the deterministic eligible caregiver when one exists.
- The trigger deletes a family only when no valid successor exists and the product policy allows it.
- The trigger scrubs private check-ins, reflections, tokens, and attribution according to the approved retention policy.
- The trigger marks the durable request complete.
- A retry returns success when the user is already absent and the matching request is complete.

The request table must not depend on a cascading foreign key to `auth.users`. Its identifier must survive user deletion long enough to prove the terminal result.

## Files

- Create `supabase/tests/05-account-deletion.test.sql`.
- Create `backend/tests/unit/delete-account.test.ts`.
- Create `supabase/migrations/20260814000700_idempotent_account_deletion.sql`.
- Update `backend/functions/delete-account/index.ts`.
- Update `mobile/app/delete-account.tsx`.
- Update `mobile/powersync/system.ts`.
- Update `docs/backend-contract.md`.
- Update `docs/privacy-policy-draft.md`.

## Tasks

### 1. Write the failure matrix first

Cover these cases in pgTAP and Edge Function tests.

- An owner with an eligible partner transfers ownership.
- An owner with only limited caregivers does not transfer ownership to a limited caregiver.
- A sole caregiver follows the approved family deletion policy.
- A non-owner caregiver leaves the family without changing ownership.
- A user in multiple families is processed with stable lock ordering.
- An Auth Admin failure leaves family state unchanged and the request retryable.
- A repeated request is safe.
- A repeated request after completion returns success without replaying destructive work.

Assert that no intermediate ownerless family can commit.

### 2. Add the durable deletion state machine

Create `account_deletion_requests` with an explicit status such as `requested`, `auth_pending`, `completed`, or `failed`. Record timestamps, attempt count, and a sanitized failure category. Do not store provider error bodies or secrets.

Constrain the table so one user cannot create concurrent active deletion workflows. Grant access only through approved security-definer functions and service-role orchestration.

### 3. Put relational cleanup in the Auth deletion transaction

Add an `auth.users` deletion trigger that handles family membership, ownership transfer, retention, and private-data cleanup. Use stable lock ordering by family identifier. Select successors deterministically from eligible non-limited caregivers.

Keep the trigger focused on database state. Do not make network calls from it.

### 4. Keep the Edge Function thin and retryable

The function should authenticate, create or reuse the request, call Auth Admin, classify errors, and report terminal state. Every Auth Admin failure path must be checked. A missing Auth user is success only when the durable database state proves cleanup completed.

### 5. Make the mobile flow truthful

Keep the user signed in while deletion is pending. Show retryable failure without pretending local data is gone. After confirmed completion, disconnect PowerSync, clear user-scoped local state, clear the session, and return to the authentication boundary.

Require a deliberate confirmation step. Keep the copy aligned with the retention behavior documented in the privacy policy.

## Static Verification

Run:

- `cd mobile && npm run typecheck`
- `cd mobile && npm run lint`
- `cd backend && deno check supabase/functions/delete-account/index.ts`
- `supabase test db`

Review the migration for stable lock ordering, deterministic successor selection, and a request record that survives Auth deletion.

## Runtime Verification

Run the Edge Function tests with mocked Auth Admin outcomes. Then exercise deletion against a disposable local Supabase project for each ownership case.

Prove these outcomes from database queries and UI state:

- No committed family has zero owners.
- Auth failure preserves the pre-request family graph.
- Retry reaches one terminal result.
- Completed deletion clears the local session and user-scoped cache.
- Private check-ins and reflections follow the documented retention policy.

## Exit Criteria

- Account deletion is idempotent across database and Auth boundaries.
- Ownership transfer is deterministic and never selects a limited caregiver.
- Failure is retryable without partial relational mutation.
- Mobile state reflects the real server outcome.
- Retention behavior matches the privacy documentation.
