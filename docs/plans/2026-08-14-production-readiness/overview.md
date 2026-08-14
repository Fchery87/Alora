# Alora Production Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task.

**Goal:** Turn Alora's buildable demo into a fail-closed, transaction-safe, testable private beta for two real caregivers on iOS and Android.

**Architecture:** Build one explicit mobile runtime-composition module and move privileged trust mutations into transactional Postgres functions. Keep PowerSync SQLite as the UI source of truth. Prove each boundary with source-instrumented tests, pgTAP, native builds, and a two-device tracer journey.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, TypeScript 5.9, PowerSync React Native 2, Supabase Auth and Postgres, PostgreSQL functions and RLS, Jest Expo, React Native Testing Library, pgTAP, Maestro, GitHub Actions, EAS, and Sentry.

---

## Context

The first remediation slice restored the PowerSync build graph, strict TypeScript coverage, Android export, and structural schema alignment. The remaining blockers are coupled. An authenticated app can still fall back to demo data. New users cannot create the first family. Invite and deletion workflows cross several non-atomic requests. Limited-role privacy is incomplete. The current tests cannot prove native lifecycle, real PowerSync behavior, or UI accessibility.

This plan treats `VALIDATION_TASKS.md` as a dated hypothesis ledger. Every blocker closes only when current automated and runtime evidence exists.

## Scope

Included:

- VAL-002 through VAL-017 where work remains.
- Canonical Supabase migrations and database tests.
- Mobile runtime composition, boot recovery, onboarding, recovery links, invite links, and live repository correctness.
- Transactional invite, role, and deletion boundaries.
- Accessibility semantics, source coverage, release CI, Expo metadata, and private-beta evidence.
- Documentation changes required to keep the launch contract truthful.

Explicitly excluded:

- New product features, monetization, EU launch, clinical claims, server push notifications, and media sync.
- Production secrets in the repository or chat.
- Automatic production deployment, store submission, legal approval, developer-account enrollment, and customer communication.
- Public launch before the private-beta exit criteria pass.

## Launch-scope assumption

Preserve the features already implemented in the app. Freeze net-new feature work. Limited caregivers remain supported because the backend already accepts that role and hidden code paths still require security. Growth, reports, and handoff remain beta surfaces but receive no expansion in this program. Phase 1 records this as the canonical launch contract. A founder may choose a smaller scope before Phase 1 lands, but security checks remain required for every reachable backend path.

## Constraints

- Keep PowerSync SQLite as the mobile read and write source of truth after onboarding.
- Keep Supabase Auth sessions in SecureStore.
- Use server operations for online-only trust actions. Do not generate or audit invite tokens with local PowerSync writes.
- Preserve author-only private check-in sync. Add family context without moving check-ins into a family bucket.
- Model runtime, permissions, duplicate resolution, and deletion progress as explicit states.
- Make retries converge. Network loss after a committed server mutation must not create a second family, membership, invite redemption, or deletion.
- Use strict TypeScript. Validate external responses at their boundary. Avoid `any` and unchecked casts.
- Use versioned Supabase migrations as the schema source of truth. Provisioning docs must stop asking operators to paste mutable SQL files.
- Keep each implementation phase independently reviewable and releasable.
- Do not set coverage thresholds until the first report proves application source is instrumented.

## Alternatives considered

### Severity order

Fix every critical item, then every high item. This mirrors the ledger but causes repeated edits to runtime, schema, onboarding, and tests. It also asks UI work to depend on unstable server behavior. Rejected.

### User-journey slices first

Build owner onboarding and caregiver invitation end to end before shared foundations. This gives early demos, but each slice would invent its own lifecycle, retry, and test setup. Rejected as the primary sequence.

### Dependency-ordered foundations plus tracer journeys

Establish the migration and test surfaces, then runtime and database invariants, then owner and invited-caregiver journeys. Finish with release gates and native evidence. Selected because it concentrates behavior behind deep module interfaces and gives every phase a real proof artifact.

## Target module seams and data shapes

- `RuntimeState`. A discriminated union for intentional demo, session restore, signed out, starting live, ready, and blocking failure.
- `RuntimeComposition`. The single module that owns session-driven repository selection and PowerSync start, retry, stop, and clear behavior.
- `CaregiverCapabilities`. A role-derived value used by navigation and screens. The database remains authoritative.
- `FamilyBootstrapResult`. The idempotent result of creating the profile, family, first owner membership, and first baby.
- `InviteRedemptionResult`. A generic public result backed by a locked, transactional database operation.
- `EventDuplicateResolution`. A canonical same-family event pair with pending, keep-both, or merged resolution.
- `SyncProjection`. Connection state plus pending event identifiers derived from supported PowerSync status and upload events.
- `AccountDeletionRequest`. An idempotent state record spanning Postgres preparation and Supabase Auth deletion.

## Phase map

| Phase                                                                                     | Outcome                                                     | Validation tasks                                      |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| [1. Release contract and migration baseline](phase-01-release-contract-and-migrations.md) | One canonical scope and database history                    | VAL-011, VAL-013 foundation                           |
| [2. Credible test foundations](phase-02-test-foundations.md)                              | Source coverage, UI tests, reliable pgTAP                   | VAL-010, VAL-017                                      |
| [3. Runtime composition and boot recovery](phase-03-runtime-and-boot.md)                  | No authenticated demo fallback; bounded startup             | VAL-002, VAL-016                                      |
| [4. Database invariants](phase-04-database-invariants.md)                                 | Cross-family and attribution errors become impossible       | VAL-014                                               |
| [5. First-family onboarding and recovery](phase-05-family-bootstrap-and-recovery.md)      | A clean account can become a usable owner                   | VAL-003                                               |
| [6. Atomic invitation lifecycle](phase-06-atomic-invitations.md)                          | Safe issue, redeem, revoke, expire, and retry               | VAL-003, VAL-004, VAL-006                             |
| [7. Live care correctness](phase-07-live-care-correctness.md)                             | Sleep, duplicate, and sync state match the UI contract      | VAL-004, VAL-015                                      |
| [8. Role privacy and capability enforcement](phase-08-role-privacy.md)                    | Limited devices cannot reach or receive restricted data     | VAL-005                                               |
| [9. Idempotent account deletion](phase-09-account-deletion.md)                            | Deletion retries converge without partial ownership state   | VAL-007                                               |
| [10. Accessibility contract](phase-10-accessibility.md)                                   | Shared controls and screens announce purpose and state      | VAL-012                                               |
| [11. Dependencies and release CI](phase-11-dependencies-and-ci.md)                        | Merge gate matches the release contract                     | VAL-001 remainder, VAL-008, VAL-009, VAL-010, VAL-017 |
| [12. Packaging and private beta](phase-12-packaging-and-beta.md)                          | Installable staging builds and recorded two-device evidence | VAL-011, VAL-013                                      |

The complete verification matrix lives in [testing.md](testing.md).

## Program gates

1. Phase 2 must prove tests fail correctly before feature work begins.
2. Phase 4 must land before any privileged RPC relies on family or actor invariants.
3. Phase 6 must land before invite deep links or limited-role device tests are accepted.
4. Phases 7 through 9 must pass before CI is promoted to the release gate.
5. Phase 11 must be green before EAS staging builds begin.
6. Phase 12 requires human-owned service accounts, secrets, legal approval, and physical devices.

## Throughput checkpoint

Stop after Phase 3. Review the runtime interface, source-instrumented test duration, and migration workflow. Continue only when a new engineer can run the mobile and database suites from a clean checkout, a configured signed-in app cannot render demo data, and boot failures show a retry surface. If those conditions fail, fix the foundation before adding journeys.

## Project-level verification

Run from a clean checkout after Phase 11:

```bash
cd mobile
npm ci
npm run format
npm run typecheck
npm run lint
npm run test
npm run test:coverage
npx expo install --check
npx expo export --platform android --output-dir /tmp/alora-export-android
npx expo export --platform ios --output-dir /tmp/alora-export-ios
npm audit --omit=dev --audit-level=high
```

```bash
supabase db reset
supabase test db
```

Native verification uses a development build and the scenarios in [testing.md](testing.md). There is no installed native-mobile control skill in the current environment, so the implementation must use Maestro where possible and record manual VoiceOver, TalkBack, offline-restart, and two-device evidence where automation cannot drive the surface.

## Applicable skills

The implementer must invoke the smallest relevant set for each phase:

- `$Poteto Mode` for phase sequencing, architecture judgment, and proof standards.
- `superpowers:test-driven-development` before every behavior change.
- `typescript-best-practices` before reading or editing TypeScript.
- `codebase-design` when shaping the runtime, trust, care-event, and deletion module seams.
- `supabase-postgres-best-practices` before migrations, RLS, functions, indexes, or query changes.
- `bash-defensive-patterns` before changing the pgTAP runner.
- `github-workflows` before changing GitHub Actions.
- `launch-checklist` for packaging, external accounts, staging, and beta gates.
- `agent-browser` only for web dashboards or published-policy verification. It does not replace native device testing.

Reference current official guidance when implementing test infrastructure. Use [Expo unit testing](https://docs.expo.dev/develop/unit-testing/), [Supabase database testing in CI](https://supabase.com/docs/guides/deployment/ci/testing), and [PowerSync React Native and Expo](https://docs.powersync.com/client-sdks/reference/react-native-and-expo).

## Implementation guidance

- Use Poteto's `how` skill over each unfamiliar subsystem if it is installed. It was unavailable while this plan was authored. Use `codebase-design` plus an independent design review as the fallback.
- Use Poteto's `interrogate` skill before shipping the invite and deletion designs. If unavailable, require an independent security review against the pgTAP matrix and failure states.
- Use `/deslop` before each commit and the `unslop` skill for prose if those skills are installed.
- Keep a decision trail with `show-me-your-work` because this program spans migrations, native state, security, and release operations.
- Use `superpowers:requesting-code-review` after each phase and a full independent review after Phase 11.
- Open one PR per phase or per explicitly named subtask. Use the repository's normal review workflow after opening each PR.
- Commit only after the phase's static and runtime checks pass.

## Definition of done

Production-readiness engineering is complete only when all agent-owned tasks in `VALIDATION_TASKS.md` have current evidence, both native staging builds install on clean devices, the two-caregiver tracer test passes, restricted rows are absent from a limited device's SQLite database, CI blocks every release-contract failure, and `docs/launch-checklist.md` contains only human or joint external gates.

Public launch is a separate decision after the documented private-beta exit criteria pass.
