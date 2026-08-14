# Phase 5. First-Family Onboarding and Recovery

[Back to overview](overview.md)

## Goal

Let a clean account create its profile, family, first owner membership, and baby exactly once, then recover access through mobile-safe links.

## Blockers addressed

- VAL-003 first-user onboarding and password recovery.

## Data structures

- `FamilyBootstrapCommand`. Display name, family name, baby profile, and idempotency key.
- `FamilyBootstrapResult`. Family ID, baby ID, membership ID, and existing-or-created outcome.
- `AccountSetupState`. Needs confirmation, needs family, bootstrapping, waiting for sync, ready, and error.

## Changes

### Task 1. Define the transactional bootstrap

**Files:**

- Create `supabase/migrations/20260814000300_family_bootstrap.sql`.
- Create `supabase/tests/03-family-bootstrap.test.sql`.

Add an authenticated Postgres function that validates input, upserts the public user profile, creates the family, creates the first owner membership, and creates the first baby in one transaction. Store or derive an idempotency key so retries return the original result.

Completion criterion. First call creates one family. Repeated and concurrent calls for the same command return the same family and never create duplicate owners or babies.

### Task 2. Add a deep account-setup module

**Files:**

- Create `mobile/domains/accountSetup.ts`.
- Modify `mobile/data/useData.ts`.
- Create `mobile/__tests__/domains/accountSetup.test.ts`.

Keep online-only account setup outside PowerSync writes. Validate RPC responses at the Supabase boundary. Wait for the returned family and baby to appear in local PowerSync before declaring the app ready.

Completion criterion. Callers learn one setup interface and do not orchestrate tables or sync timing.

### Task 3. Gate signed-in accounts by setup state

**Files:**

- Modify `mobile/runtime/RuntimeProvider.tsx`.
- Modify `mobile/lib/useAuth.tsx`.
- Modify `mobile/app/onboarding.tsx`.
- Create `mobile/__tests__/app/onboarding.test.tsx`.

Route a signed-in account with no family to onboarding. Submit the family and baby command on the final required step. Route to tabs only after local data is ready. Keep invite issuance optional and outside bootstrap.

Completion criterion. A clean confirmed account cannot enter tabs until its own family and baby exist locally.

### Task 4. Add password recovery links

**Files:**

- Create `mobile/app/(auth)/forgot-password.tsx`.
- Create `mobile/app/(auth)/reset-password.tsx`.
- Modify `mobile/components/AuthForm.tsx`.
- Modify `mobile/lib/supabase.ts`.
- Modify `mobile/app.json`.
- Create `mobile/__tests__/app/password-recovery.test.tsx`.

Request recovery through Supabase Auth. Handle the app callback explicitly. Verify the callback session before accepting a new password. Keep SecureStore persistence and avoid enabling browser URL detection as a shortcut.

Completion criterion. Valid links reset the password. Expired, reused, malformed, and wrong-account links show a safe recovery path.

## Verification

### Static

Run:

```bash
supabase db reset
supabase test db
cd mobile && npm run typecheck && npm run lint && npm test -- accountSetup onboarding password-recovery
```

Expected. Bootstrap idempotency, routing, and recovery cases pass.

### Runtime

On clean iOS and Android development builds, test sign-up with email confirmation enabled and disabled. Test offline entry during setup, duplicate submission, app kill while waiting for sync, valid recovery link, expired link, and a second link after the first succeeds.

## Commit boundary

Commit server bootstrap before the mobile account-setup module. Commit recovery as a separate reviewable change.

Suggested commits:

- `feat(onboarding): add idempotent first-family bootstrap`
- `feat(auth): add mobile password recovery`

## Exit criteria

- No manual database rows are needed for the first owner.
- Onboarding is online-only, retry-safe, and locally observable before tabs open.
- Password recovery works through an explicit app link on both platforms.
