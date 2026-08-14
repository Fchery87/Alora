# Phase 8. Role Privacy and Capability Enforcement

[Back to overview](overview.md)

## Goal

Apply one role-capability model across navigation, screens, server mutations, RLS, and synced local data.

## Blockers addressed

- Remaining VAL-005 privacy and role enforcement.

## Data structures

- `CaregiverCapabilities`. Log care, edit care, view check-in, write check-in, view audit, issue invite, manage seat limit, export, and delete account.
- Family-scoped private check-in. User ID plus family ID while remaining in the user's private sync bucket.

## Changes

### Task 1. Define and test the capability matrix

**Files:**

- Create `mobile/domains/caregiverCapabilities.ts`.
- Create `mobile/__tests__/domains/caregiverCapabilities.test.ts`.
- Modify `CONTEXT.md`.

Encode owner, partner, and limited capabilities as a total mapping. Resolve the effective family membership once. Do not scatter role string comparisons through screens.

Completion criterion. Every visible trust and check-in action is accounted for by the matrix.

### Task 2. Give private check-ins family context

**Files:**

- Create `supabase/migrations/20260814000600_scoped_private_checkins.sql`.
- Modify `mobile/powersync/schema.ts`.
- Modify `mobile/data/supabaseRepository.ts`.
- Extend `supabase/tests/01-rls-security.test.sql`.
- Extend the schema-alignment test.

Add family ID to check-ins and reflections. Preserve user-private sync. Require the author to hold a non-limited membership in that family. Constrain reflections to the same user and family as the check-in.

Completion criterion. Limited users cannot create or receive check-ins, while owner and partner devices receive only their own rows.

### Task 3. Enforce capabilities in navigation and screens

**Files:**

- Modify `mobile/app/(tabs)/_layout.tsx`.
- Modify `mobile/app/(tabs)/settings.tsx`.
- Modify `mobile/app/(tabs)/checkin.tsx`.
- Modify `mobile/app/trust.tsx`.
- Modify `mobile/app/invite.tsx`.
- Modify `mobile/app/seat-limit.tsx`.
- Modify `mobile/app/delete-account.tsx`.
- Create `mobile/components/CapabilityGate.tsx`.
- Create `mobile/__tests__/app/role-navigation.test.tsx`.

Remove restricted tabs from limited navigation. Guard direct routes and render a safe back path. Match owner-only invite behavior. Keep server rejection as the authority.

Completion criterion. Deep links and direct route names cannot bypass the role experience.

### Task 4. Prove local-device isolation

**Files:**

- Create `mobile/e2e/role-privacy.yaml`.
- Create `.scratch/launch-readiness/role-privacy-evidence-template.md`.

Provision owner, partner, and limited accounts. Inspect local SQLite after sync. Assert restricted tables and rows are absent, not merely hidden.

Completion criterion. The limited device contains no audit, invite-token, check-in, or reflection data.

## Verification

### Static

Run:

```bash
supabase db reset
supabase test db
cd mobile && npm run typecheck && npm run lint && npm test -- caregiverCapabilities role-navigation checkin schema
```

Expected. Capability, navigation, RLS, and schema cases pass.

### Runtime

Run the role matrix on three provisioned development builds. Exercise visible controls, direct links, server calls, and local SQLite inspection for owner, partner, and limited users.

## Commit boundary

Commit database privacy before navigation. Commit the local-data evidence only after a provisioned run passes.

Suggested commits:

- `fix(privacy): scope private checkins by family role`
- `feat(roles): enforce caregiver capabilities in navigation`

## Exit criteria

- The database, sync rules, and UI agree on every capability.
- Limited devices never receive restricted rows.
- Partner invite behavior matches owner-only server policy.
- Direct routes cannot bypass navigation restrictions.
