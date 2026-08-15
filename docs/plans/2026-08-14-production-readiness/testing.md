# Production Readiness Verification Matrix

[Back to overview](overview.md)

## Purpose

This matrix separates fast contract tests, database security tests, native integration tests, and release evidence. Passing one layer never substitutes for another.

Hosted database evidence: the linked Supabase project applied migrations through
`20260815000600` and passed all 74 pgTAP assertions on 2026-08-15.

## Static checks

| Check              | Command                                                | Required evidence                                                       |
| ------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| Formatting         | `cd mobile && npm run format`                          | Exit 0 with no changed files                                            |
| TypeScript         | `cd mobile && npm run typecheck`                       | Exit 0 with runtime, PowerSync, routes, and tests included              |
| Lint               | `cd mobile && npm run lint`                            | Exit 0 with zero warnings                                               |
| Expo compatibility | `cd mobile && npx expo install --check`                | No incompatible Expo package versions                                   |
| Android bundle     | `cd mobile && npm run export:android`                  | Hermes bundle and metadata emitted                                      |
| iOS bundle         | `cd mobile && npm run export:ios`                      | JavaScript bundle and metadata emitted                                  |
| Dependency policy  | `cd mobile && npm audit --omit=dev --audit-level=high` | No unresolved critical or high advisory without an approved disposition |

## Automated test layers

| Layer                    | Tool                                        | Must prove                                                                                                        |
| ------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Pure domain              | Jest                                        | Runtime states, capabilities, duplicate pairs, sync projection, retry decisions, formatting, and calculations     |
| React Native integration | Jest Expo plus React Native Testing Library | Boot fallback, auth routing, onboarding gates, role navigation, accessibility semantics, and error retry          |
| Repository contract      | Jest with the existing SQLite stand-in      | Mock and live adapters preserve the same domain behavior                                                          |
| Source coverage          | Jest coverage                               | Application TypeScript appears in the report; thresholds follow the measured baseline                             |
| Database security        | Supabase CLI plus pgTAP                     | RLS, composite ownership, actor attribution, role matrix, invite concurrency, bootstrap, and deletion idempotency |
| Edge orchestration       | Deno tests or locally invoked functions     | Auth validation, generic errors, RPC mapping, and checked external failures                                       |
| Native journey           | Maestro on development builds               | Sign-up, onboarding, recovery, deep links, route guards, and basic accessibility focus                            |
| Live two-device          | Provisioned Supabase plus PowerSync         | Offline persistence, reconnect, convergence, privacy isolation, and deletion propagation                          |

## Required negative tests

- Configured and authenticated runtime cannot select `mockRepository`.
- A failed PowerSync import or connection produces a blocking retry state.
- Session restoration rejection exits loading and offers retry or sign-out.
- A user cannot create a second first-owner bootstrap for the same idempotency key.
- Two callers racing one invite have one winner.
- Two valid invites racing the last seat have one winner.
- A retry by the winning invitee returns the original success.
- Cross-family baby events and edit history are rejected.
- A caller cannot spoof `created_by`, `edited_by`, or audit actor identity.
- A limited user cannot create check-ins, open guarded routes, receive audit rows, or receive invite-token rows.
- Keep-both duplicate resolution does not reappear after restart or sync.
- Repeated deletion requests converge to the same terminal result.
- A failing pgTAP assertion fails CI and the temporary database is removed.
- A deliberately broken Android or iOS import fails the aggregate CI gate.

## Native tracer journey

Use two clean physical devices or one physical device and one simulator with separate accounts.

1. Create Account A. Confirm email when that environment requires it.
2. Create the family and baby through onboarding.
3. Generate a partner invite and open its deep link on Device B.
4. Create Account B and redeem the invite. If the link was opened while signed out, confirm the pending-code handoff resumes after sign-in.
5. Put Device A offline. Log feed, diaper, and an open sleep.
6. Kill and reopen Device A while still offline. Confirm all data and the active sleep survive.
7. Stop sleep. Confirm the pending state is honest.
8. Reconnect Device A. Confirm Device B receives the events and both devices converge.
9. Create overlapping events. Resolve keep-both and merge. Restart both devices and confirm the decisions persist.
10. Create private check-ins on both accounts. Inspect both local SQLite databases and confirm each contains only its author's rows.
11. Repeat with a limited account. Confirm the Check-In route, trust data, invite tokens, export, and deletion actions are absent and server-rejected.
12. Revoke an unused invite. Confirm it fails with the generic invalid response.
13. Export Account A. Confirm family data plus only Account A's check-ins appear.
14. Delete Account A. Confirm deterministic ownership transfer, scrubbed private data, retained shared history, and a successful retry response.

## Manual accessibility matrix

Run on iOS VoiceOver and Android TalkBack with the largest supported text size and reduced motion enabled.

- All five tabs announce label, role, and selected state.
- Buttons announce label, disabled state, and busy state.
- Chips and segmented controls announce selection.
- Switches announce checked state.
- Inputs announce label, value purpose, error, and required state.
- Modals place initial focus, preserve a reachable close action, and restore focus on dismissal.
- The mood row and quick-log controls remain operable without clipped text.
- Every touch target remains at least 44 by 44 points.

## Evidence storage

Store non-secret evidence under `.scratch/launch-readiness/evidence/<date>/`:

- Commit SHA and build identifiers.
- CI run link.
- Supabase migration version and pgTAP result.
- TestFlight and Android internal build numbers.
- Device and OS versions.
- Redacted screenshots or recordings for role, accessibility, and error states.
- Two-device tracer checklist with pass, fail, and issue links.

Never store tokens, session cookies, service keys, email addresses, baby names, or real family data in evidence artifacts.
