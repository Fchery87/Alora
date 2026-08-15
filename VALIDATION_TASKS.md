# Alora validation tasks

Last updated: 2026-08-15

The implementation slices in the 2026-08-14 production-readiness plan are now
landed in the working tree. The hosted Supabase migration history and database
matrix are now verified. The remaining release blockers are environmental or
human-controlled, not permission to weaken the product contract: provision
PowerSync, run native two-device and accessibility checks, resolve dependency
advisories, and obtain privacy/store approval.

## Evidence from this workspace

| Check            | Result                                                        | Evidence or limitation                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mobile typecheck | Pass                                                          | `cd mobile && npm run typecheck` includes runtime, routes, PowerSync, and tests.                                                                                                                 |
| Mobile lint      | Pass                                                          | `cd mobile && npm run lint`, zero warnings.                                                                                                                                                      |
| Mobile format    | Pass                                                          | `cd mobile && npm run format`, with generated coverage ignored.                                                                                                                                  |
| Mobile Jest      | Pass after the final adapter contract update                  | 14 suites, 99 tests. The repository contract runs against mock and fake-SQLite live adapters.                                                                                                    |
| Android export   | Pass                                                          | `npm run export:android` emitted the Hermes bundle and metadata.                                                                                                                                |
| iOS export       | Pass                                                          | `npm run export:ios` emitted the JavaScript bundle and metadata.                                                                                                                               |
| Dependency audit | Blocked by registry access and known advisories               | `npm audit --omit=dev --audit-level=high` previously reported 1 critical, 16 high, and 9 moderate. See [`docs/security/dependency-risk-register.md`](docs/security/dependency-risk-register.md). |
| Hosted pgTAP     | Pass                                                          | On 2026-08-15, the linked Supabase project applied migrations through `20260815000600`; all 74 assertions passed and the runner exited 0.                                                     |
| Local pgTAP      | Not available here                                            | No local PostgreSQL service or Docker. Use the documented hosted disposable `psql` path.                                                                                                         |
| Deno Edge checks | Pending                                                       | Deno is not installed in this workspace; CI runs `backend/deno.json`.                                                                                                                            |

## Slice status

| Slice                           | Status                  | What is now implemented                                                                                                                 | Remaining proof                                                                          |
| ------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Release contract and migrations | Verified                | Canonical additive migration history, no direct membership-management path, and updated runner.                                         | Re-run the hosted suite for each future migration.                                     |
| Test foundations                | Code complete           | Jest Expo, React Native Testing Library, repository contract suite, Deno contract checks, and CI jobs.                                  | Observe a clean CI run.                                                                  |
| Runtime and boot                | Code complete           | Explicit demo/local-first/live state, fail-closed startup, retryable font/session/sync failures, and one lifecycle owner.               | Native sign-in/sign-out/account-switch smoke test.                                       |
| Family bootstrap and recovery   | Code complete           | Idempotent `bootstrap_family`, onboarding gate, invite deep link handoff, and password reset screens.                                   | Test email-confirmation and recovery links on iOS and Android.                           |
| Atomic invitations              | Code complete           | Durable limiter, locked redemption RPC, generic errors, and link redemption route.                                                      | Deploy function and migrations, then race two real accounts.                             |
| Live care correctness           | Code complete           | Active sleep identity, persisted duplicate resolution, and sanitized sync projection.                                                   | Offline/reconnect/process-death convergence on two devices.                              |
| Role privacy                    | Code complete           | Database family context, limited-seat RLS, role capability matrix, guarded routes, and role-scoped sync buckets.                        | Inspect both devices' local databases with real accounts.                                |
| Account deletion                | Code complete           | Durable request state, Auth deletion trigger, deterministic ownership transfer, sole-owner family deletion, and retry-safe client flow. | Exercise Auth Admin failure and completion paths in a disposable project.                |
| Accessibility                   | Partially automated     | Shared controls expose roles/names, boot/auth critical screens have tests, and reduced motion is respected.                             | VoiceOver, TalkBack, large text, focus order, and touch-target pass.                     |
| Dependencies and CI             | Code complete with risk | Format, typecheck, lint, coverage, exports, backend checks, optional hosted pgTAP, and aggregate gate are wired; the hosted runner passed. | Fresh audit and branch-protection check.                                                  |
| Packaging and beta              | Human-gated             | App identity, deep-link scheme, export scripts, security register, and launch docs exist.                                               | EAS ownership, signing, privacy/legal approval, store declarations, and 3–5-family beta. |

## Required commands

```bash
cd mobile
npm run format
npm run typecheck
npm run lint
npm test -- --runInBand
npm run export:android
npm run export:ios
npx expo install --check
npm audit --omit=dev --audit-level=high

cd ../backend
deno task check
deno task test

cd ..
supabase db push
PGLTAP_REMOTE_CONFIRM=I_UNDERSTAND_THIS_IS_A_DEDICATED_TEST_DATABASE \
  PGLTAP_DATABASE_URL='postgresql://...?...sslmode=require' \
  ./backend/tests/run-pgtap.sh
```

The URI must be one line. Do not store passwords or tokens in shell history,
committed files, CI artifacts, or evidence documents.

## Native tracer and launch gates

Use the fourteen-step journey in [`docs/plans/2026-08-14-production-readiness/testing.md`](docs/plans/2026-08-14-production-readiness/testing.md)
with two accounts and two devices. The final go/no-go decision also requires
the accessibility matrix, Sentry ingestion without sensitive payloads, a
published privacy policy, Apple and Google declarations, and the defined
two-week beta with 14 consecutive crash-free days.

No launch claim should be upgraded to “production ready” until those external
checks have evidence attached under `.scratch/launch-readiness/evidence/`.
