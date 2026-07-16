# Production Readiness Remediation — Spec (PRD)

Status: ready-for-agent

---

## Problem Statement

Alora is a beautifully polished demo, but it cannot serve a single real caregiver today. The app's entire reason for existing — local-first baby-care logging with two-caregiver coordination — is non-functional: screens read from an in-memory mock repository, the live data adapter implements only 3 of 19 interface methods, no backend is provisioned, and the sync engine is inert. Beyond the missing core, the project lacks the engineering fundamentals that a product handling sensitive baby data and private reflections requires: there is no version control, no CI pipeline, no linting, a real authorization vulnerability in the backend security model, no observability, and hardcoded demo strings baked directly into production screens.

A first-time parent installing this app today would see a static showcase of "Maya" and "Sam" — not their own baby, not their own co-caregiver, and nothing that persists across devices.

## Solution

Make Alora production-ready by completing the live data path, closing the security gaps, establishing engineering infrastructure, and hardening the UI for real users. The remediation follows the existing architecture: the local-first SQLite store is the source of truth, Supabase + PowerSync are adapters for live sync, and the runtime composition module selects demo / local-first / live mode from one explicit resolver. All screens already consume the repository through hooks — they need no structural changes, only real data flowing through the same interface they already use.

The work is sequenced so that each phase is independently verifiable: infrastructure first (so every subsequent change is tracked and gated), then the backend security fixes (so the live path is safe to build on), then the live adapter completion (so screens can consume real data), and finally UI hardening (so the experience is production-quality).

## User Stories

### Engineering Infrastructure

1. As a developer, I want the repository under version control, so that I can track changes, review contributions, and roll back regressions.
2. As a developer, I want a root-level ignore file, so that secrets, build artifacts, and dependencies are never accidentally committed.
3. As a developer, I want a continuous integration pipeline that runs the typecheck and test suite on every pull request, so that regressions are caught before they merge.
4. As a developer, I want linting and formatting enforcement in CI, so that code style is consistent and common mistakes (unused imports, hook violations) are caught automatically.
5. As a developer, I want the test runner integrated into CI, so that I have confidence the suite passes in a clean environment, not just on my machine.

### Backend Security

6. As a family owner, I want only invited caregivers to join my family, so that no one can gain access to my baby's data by guessing an identifier.
7. As a family owner, I want the invite flow to generate a cryptographically-random, single-use code, so that codes cannot be predicted or brute-forced.
8. As a caregiver, I want row-level security to reject any attempt to insert myself into a family I was not invited to, so that the database is the final line of defense even if the client is compromised.
9. As a family owner, I want revoked and expired invite codes to be unusable, so that old shared links cannot be redeemed later.
10. As a caregiver, I want edge functions to rate-limit redemption attempts, so that an attacker cannot hammer the invite endpoint with guessed codes.

### Live Data Path

11. As a signed-in caregiver, I want my feeds, diapers, and sleep events to persist to the local SQLite store and sync to the backend, so that my co-caregiver sees them on their device.
12. As a signed-in caregiver, I want events I log while offline to appear instantly with a pending indicator and sync automatically when connectivity returns, so that I never lose confidence in the app during a poor connection.
13. As a caregiver, I want to start a sleep timer that survives an app kill and restart, so that an in-progress nap is never lost.
14. As a caregiver, I want to stop a sleep timer and have the duration committed as a completed care event, so that the timeline reflects the actual sleep duration.
15. As a caregiver, I want to edit a care event and have the prior values retained in edit history, so that shared context is never silently erased.
16. As a caregiver, I want to soft-delete a care event and have it disappear from the timeline while remaining in the sync tombstone stream, so that deletions propagate to my co-caregiver's device.
17. As a signed-in caregiver, I want my private daily check-ins and reflections to sync only to my own devices, so that my co-caregiver can never see them.
18. As a caregiver, I want my notification preferences and quiet-hours settings to persist across devices, so that my reminders behave consistently.
19. As a family owner, I want to generate, share, and revoke invite codes that call the real backend, so that my co-caregiver can join my family.
20. As a caregiver, I want to export all my family data and private check-ins as a structured JSON file, so that I can review or port my data.
21. As a family owner who is the sole member, I want account deletion to hard-delete my entire family and all associated data, so that my PII is fully removed.
22. As a family owner with a co-caregiver, I want account deletion to transfer ownership to my co-caregiver and scrub my private data while retaining shared history, so that care is not interrupted and my PII is erased.
23. As a partner caregiver, I want account deletion to remove my private data while leaving the family intact for the owner, so that my departure does not destroy shared records.
24. As a caregiver, I want the audit log to show invite, join, revoke, role-transfer, export, and deletion events, so that I can verify who took sensitive actions.

### Runtime Composition

25. As the app, I want a single mode resolver that decides demo, local-first, or live mode from environment configuration and auth/session state, so that mode logic is concentrated in one place.
26. As the app, I want PowerSync sync to start only after a valid authenticated session exists in local-first or live mode, so that sync never runs against a missing or invalid session.
27. As the app, I want sign-out to stop sync and clear the local sync state, so that no stale data lingers after a session ends.
28. As the app, I want a clear diagnostic when live mode is requested but the PowerSync adapter cannot load, so that the app fails closed rather than silently degrading to fake-live behavior.

### UI Hardening

29. As a caregiver, I want every screen to display my real baby's name and my real co-caregiver's name, not hardcoded demo data, so that the app reflects my family.
30. As a caregiver, I want the handoff dashboard to show the actual last feed, last diaper, and current sleep state derived from my real events, not static mock text.
31. As a caregiver, I want the "repeat last" action on the Log screen to repeat my actual last visible family care event of that type, not a hardcoded default.
32. As a caregiver, I want the timeline to paginate as my family accumulates months of logs, so that it stays fast and does not fetch the entire history on every screen focus.
33. As a caregiver, I want a global error boundary so that a render crash shows a recoverable error state instead of a blank screen.
34. As a caregiver, I want the sync status indicator on Home to reflect real pending/synced state, not a static "1 change syncing" label.
35. As a caregiver, I want the bedtime notification to use my baby's actual name, not a hardcoded name.
36. As a caregiver, I want the check-in screen's support resources to be consistent with the trust center's resources, so that the crisis resource list is the same everywhere.
37. As a caregiver, I want the sign-up form to validate email format and enforce a minimum password length before submission, so that I get clear feedback instead of a raw backend error.

### Observability

38. As a developer, I want a crash-reporting integration that captures unhandled errors in production, so that I can diagnose crashes real users experience.
39. As a developer, I want structured logging at the sync boundary, so that I can understand when sync starts, fails, retries, or completes.
40. As a developer, I want the CI pipeline to be the single source of truth for whether a change is safe to merge, so that no human-only step is required to verify quality.

## Implementation Decisions

### Repository contract

The `AloraRepository` interface is the single data-access boundary. The live adapter must implement all nineteen methods of this interface — the three read methods that exist today plus the sixteen write and lifecycle methods. The adapter reads from the on-device PowerSync SQLite (the local source of truth) and writes through PowerSync's local write queue, which flushes to Supabase Postgres with last-write-wins per row. Shared-family creates that overlap are preserved as separate rows (the duplicate affordance surfaces them for review); concurrent edits to the same row use last-write-wins with prior values recorded in edit history. The completed adapter must never bypass the interface — screens continue to consume hooks from the data module, never the adapter directly.

The mode resolver selects which adapter is active. Demo mode uses the mock repository (local SQLite-backed mock). Local-first and live mode use the PowerSync-backed adapter. The resolver is one explicit function that takes environment configuration plus auth/session state and returns a mode enum. No screen, hook, or sync routine reads raw environment booleans directly — they all go through the resolver.

### Backend security model

The `members_self_join` insert policy is tightened so that it can no longer be used to self-insert into an arbitrary family. Membership insertion is restricted to the invite-redeem path, which runs as a security-definer operation. The policy either requires a valid, active invite token (unused, unexpired, not revoked) bound to the target family, or membership insertion is performed exclusively inside the redeem edge function using the service role.

Invite token issuance is added as either a new edge function or a security-definer database function. The issuer generates a cryptographically-random code (not a hardcoded cycle), binds it to the requesting owner's family, sets the role to partner, and records an audit-log entry. The code format should be human-shareable (short, dashed, uppercase) but generated from a secure random source with enough entropy to resist brute-force. The redeem edge function rate-limits attempts per caller.

### Sync lifecycle

PowerSync starts only after the runtime resolver confirms a valid authenticated session in local-first or live mode. On sign-out, sync disconnects and clears the local sync state. If live mode is explicitly requested (backend + PowerSync configured) but the PowerSync adapter cannot load at runtime, the app resolves to local-first with a clear diagnostic — it never silently pretends to be in live mode.

### Private data isolation

Private daily check-ins and reflections belong to the individual user. They sync only through the per-user PowerSync bucket, never the family bucket. The live adapter's check-in methods read and write only the current user's rows. Data export includes the author's own check-ins and reflections but never a co-caregiver's. Account deletion scrubs the deleting caregiver's check-ins and reflections before removing the auth account.

### Account deletion semantics

Account deletion runs server-side (the edge function) to guarantee both Postgres and downstream copies are purged. The operations are ordered to avoid partial-failure inconsistency: the auth user deletion is attempted, and only if it succeeds are the ownership transfer and family-deletion mutations committed — or the mutations are made idempotent so that a failed deletion can be safely retried without double-transferring ownership. Sole-owner deletion hard-deletes the family. Owner-with-partner deletion transfers ownership and scrubs PII. Partner deletion scrubs PII and leaves the family intact.

### UI data wiring

All hardcoded demo strings are replaced with real data derived from the repository. The handoff dashboard derives last feed, last diaper, and current sleep state from the baby status contract — not static text. The "repeat last" action repeats the last visible family care event of the selected type. The sync status indicator reads from the actual sync queue state (pending count, last-synced timestamp). The timeline paginates rather than fetching all events. Notification content uses the baby's real name.

### Support resources consistency

The curated crisis-support resource list has one source of truth. The check-in screen and the trust center both read from the same repository query, not from inline hardcoded strings. The final copy must be reviewed and approved before launch per the PRD's sign-off requirement.

### Error handling

A global error boundary wraps the root layout so that an uncaught render error produces a recoverable state (reload or return to Home) rather than a blank screen. Auth forms validate email format and enforce a minimum password length client-side before submission.

### Observability

A crash-reporting integration (e.g. Sentry) captures unhandled errors in production builds. The sync boundary emits structured logs (sync started, failed, retried, completed) observable in the crash-reporting dashboard.

### Infrastructure

The repository is placed under version control with a root-level ignore file covering environment files, build artifacts, dependencies, and platform-specific secrets. A CI pipeline runs typecheck, tests, and lint on every pull request and blocks merge on failure. Linting uses the Expo ESLint preset plus Prettier formatting.

## Testing Decisions

### What makes a good test

A good test exercises external behavior through a module's public interface, never its internal implementation details. It does not assert on private state, internal function calls, or implementation strategy. It verifies that given an input, the observable output and side effects match the contract. Tests should survive refactoring — if a test breaks because the implementation changed but the behavior is the same, the test was too coupled to internals.

### Seam 1 — Repository contract (primary)

One behavioral contract test suite that any `AloraRepository` implementation must satisfy. The suite covers: create and list care events; derive baby status (asleep, last feed, last diaper); sleep timer start/stop lifecycle; edit an event and verify prior values are retained; soft-delete and verify it disappears from active results; create private check-ins and verify they are isolated to the author; set and read reminder preferences; generate and revoke invites; export data (including author's own check-ins, excluding co-caregiver's); account deletion semantics (ownership transfer, sole-owner hard delete, partner PII scrub). The suite is parameterized over the adapter under test — running it against both the mock and the completed live adapter with the same assertions.

This reuses the existing transpile-in-Node pattern already established by the care-event store and reminder schedule tests: the TypeScript source is compiled with the TypeScript compiler, native dependencies are mocked, and assertions run against the exported interface in Node's built-in test runner.

### Seam 2 — Backend security (secondary)

pgTAP tests against a local Postgres instance that has the schema and RLS policies applied. Tests use `set role` to simulate different authenticated users and verify: a user cannot insert a membership into a family they were not invited to; the invite lifecycle (issue, redeem, revoke, expire) enforces single-use and time-limit constraints; the two-seat cap rejects a third member; revoked and expired tokens are rejected at redemption; a co-caregiver cannot read another user's private check-ins; a non-member cannot read a family's baby events.

Prior art: the existing tests transpile and run TS modules in Node with mocked dependencies. The pgTAP tests are a new seam but the lowest one that can verify SQL-level access control — RLS policies cannot be meaningfully tested through the TypeScript adapter because the adapter operates on the local SQLite, not the Postgres policies.

### CI as the infrastructure gate

Infrastructure changes (version control setup, CI pipeline, linting) have no code-test seam. The CI pipeline itself is the verification: if it runs, typechecks, lints, and tests pass, the infrastructure is correct.

## Out of Scope

- Growth charts, developmental milestones, and analytics (Phase 2 per PRD).
- Server-triggered shared push notifications / FCM / APNs (Phase 2 per PRD).
- A third caregiver seat or limited role (Phase 2 per PRD).
- EU launch / GDPR-K age verification / EU data residency (US-only launch per PRD).
- A paid tier or billing integration (no paid tier at MVP launch per PRD).
- Mood inference, scoring, or automated triggering (explicitly excluded by PRD principle 5).
- Media uploads, memory capture, or content libraries (Phase 2 per PRD).
- Over-the-air update infrastructure (suggested but not required for MVP).
- The architecture deepening refactor (strangler migration to domain-shaped modules) described in `docs/architecture-deepening-plan.md` — this spec delivers production readiness through the existing repository interface, not through the deeper module restructure. That work is tracked separately.

## Further Notes

- The runtime composition module and mode resolver are described in the architecture deepening plan but are prerequisites for safe live mode, not optional refactors. If live mode is enabled without a single mode resolver, the app risks silently degrading to fake-live behavior when the PowerSync adapter fails to load. The resolver should be built as part of this work.
- The backend SQL (schema, RLS, sync-rules) and edge functions are already written and carefully designed. This spec completes and hardens them — it does not redesign them. The existing provisioning runbook (`backend/PROVISIONING.md`) documents the exact steps to stand up the cloud services.
- The audit's overall production-readiness score was 35/100. The demo-mode build quality is high (~70/100 as a prototype). The gap is entirely in the live path, security, infrastructure, and observability — which is what this spec addresses.
- The curated crisis-support resource list requires product or legal sign-off before launch per the PRD. This spec makes the resource list consistent and data-driven, but the final copy approval is a human gate.
