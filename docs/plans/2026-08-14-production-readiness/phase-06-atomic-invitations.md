# Phase 6. Atomic Invitation Lifecycle

[Back to overview](overview.md)

## Goal

Make invite issue, redeem, revoke, expire, rate limit, audit, and retry behavior transactional and reachable through real mobile links.

## Blockers addressed

- VAL-003 invited-caregiver journey.
- VAL-004 local invite writes against read-only audit policy.
- VAL-006 redemption atomicity and durable rate limiting.

## Data structures

- `InviteCommand`. Family, role, actor, and idempotency key.
- `InviteRedemptionAttempt`. Authenticated user, privacy-preserving network hash, window, and count.
- `InviteRedemptionResult`. Success with family ID or a generic invalid result.

## Changes

### Task 1. Prove current races and retries fail

**Files:**

- Create `supabase/tests/04-invitation-lifecycle.test.sql`.
- Create `backend/tests/integration/invite-concurrency.test.ts`.

Cover issue, revoke, expire, owner authorization, same-user retry, two users racing one token, and two tokens racing the final seat. Include audit outcomes.

Completion criterion. The race tests fail against the current multi-request implementation.

### Task 2. Move trust mutations into database functions

**Files:**

- Create `supabase/migrations/20260814000400_atomic_invitations.sql`.
- Extend `supabase/tests/04-invitation-lifecycle.test.sql`.

Add security-definer functions for issue, revoke, and redeem. Lock token and family rows. Enforce role and capacity. Upsert the invitee profile, insert membership, consume the token conditionally, and append audit in the same transaction. Grant execution only to intended roles.

Completion criterion. Every mutation is all-or-nothing and same-user retries return the original success.

### Task 3. Replace process-local rate limiting

**Files:**

- Extend `supabase/migrations/20260814000400_atomic_invitations.sql`.
- Modify `backend/functions/redeem-invite/index.ts`.
- Extend `backend/tests/integration/invite-concurrency.test.ts`.

Store atomic attempt windows in Postgres. Key by authenticated account plus an HMAC-derived network signal. Keep raw addresses out of logs and tables. Return 429 only after authentication. Return one generic invalid-code response for nonexistent, expired, revoked, consumed-by-other, and capacity failures.

Completion criterion. Limits survive function cold starts and concurrent instances without revealing token state.

### Task 4. Make Edge Functions thin and checked

**Files:**

- Modify `backend/functions/generate-invite/index.ts`.
- Create `backend/functions/revoke-invite/index.ts`.
- Modify `backend/functions/redeem-invite/index.ts`.
- Create `backend/functions/_shared/responses.ts`.

Authenticate, validate the request, call one database function, check the result, and map it to the public response. Remove duplicated business logic and ignored Supabase errors.

Completion criterion. Edge functions contain transport and authentication behavior only.

### Task 5. Wire issue and revoke through the server

**Files:**

- Create `mobile/domains/caregiverTrust.ts`.
- Modify `mobile/data/supabaseRepository.ts`.
- Modify `mobile/app/invite.tsx`.
- Create `mobile/__tests__/domains/caregiverTrust.test.ts`.

Delete local invitation-token and audit-log writes. Validate server responses. Preserve offline care logging while showing trust actions as online-only.

Completion criterion. A failed audit cannot leave a partially issued or revoked token.

### Task 6. Add invite link redemption

**Files:**

- Create `mobile/app/invite/[code].tsx`.
- Modify `mobile/app.json`.
- Modify `mobile/runtime/RuntimeProvider.tsx`.
- Create `mobile/__tests__/app/invite-redemption.test.tsx`.

Support the custom scheme and verified universal or app links for the production domain. Preserve a pending invite through sign-up or sign-in. After redemption, wait for family membership to reach local PowerSync before entering tabs.

Completion criterion. A link opened while signed out, signed in, or awaiting email confirmation reaches the same idempotent redemption outcome.

## Verification

### Static

Run:

```bash
supabase db reset
supabase test db
deno test backend/tests/integration/invite-concurrency.test.ts
cd mobile && npm run typecheck && npm run lint && npm test -- caregiverTrust invite-redemption
```

Expected. Authorization, atomicity, concurrency, generic errors, and mobile state restoration pass.

### Runtime

Use three clean accounts. Verify owner issue, partner rejection, limited-role invite, revoke, expired link, concurrent redemption, last-seat race, link opened before authentication, and a network loss after server commit.

## Commit boundary

Commit transactional functions and concurrency proof before Edge Functions. Commit mobile wiring only after the server contract is stable.

Suggested commits:

- `fix(invites): make trust mutations atomic and durable`
- `feat(invites): redeem caregiver links in the app`

## Exit criteria

- Invite state and audit state cannot diverge.
- Concurrent redemption has a deterministic winner.
- Durable limiting survives cold starts.
- Real invite links work across authentication states.
