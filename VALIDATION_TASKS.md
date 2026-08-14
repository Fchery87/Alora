# Alora Validation Tasks

Last scan: 2026-08-13
Profile: perfectionist
Health score: 28 / 100
Target: 95 / 100
Perfectionist state: **not reached**
Tech stack: Expo SDK 54, React Native 0.81, React 19, TypeScript 5.9, Supabase, PowerSync, PostgreSQL, pgTAP, EAS, Sentry

Alora is a strong demo build. It is not production ready. The Android shipping bundle now compiles, but the live collaboration path is incomplete and release-blocking security, privacy, onboarding, and launch gates remain.

## Command results

| Check | Result | Evidence |
|---|---|---|
| `npm run typecheck` | Pass | Exit 0 with the live PowerSync system, schema, and repository included. |
| `npm run lint` | Pass | Exit 0 with the zero-warning policy. |
| `npm test` | Pass | Seven test files pass, including the PowerSync schema and sync-rule contract tests. The repository suite uses a fake PowerSync database. |
| `npm run format` | Pass after safe fix | `mobile/README.md` was formatted. |
| Android Expo export | Pass | Expo produces the Android Hermes bundle in `/tmp/alora-export-android`. Native-device build and runtime smoke testing remain. |
| `npm audit --omit=dev` | Fail | 1 critical, 16 high, and 9 moderate findings. |
| Expo dependency compatibility | Pass with caveat | Local SDK 54 dependency map reports current versions. Network validation was unavailable. |
| Backend pgTAP suite | Not run | PostgreSQL and pgTAP are unavailable in this environment. The suite is not in CI. |
| Coverage | Invalid | Node reports 100% with no files because TypeScript is transpiled inside the tests and is not instrumented. |

## Open tasks

| ID | Status | Severity | Category | Scope | Location | Summary |
|---|---|---|---|---|---|---|
| VAL-001 | done | critical | build | global | `mobile/package.json`, `mobile/tsconfig.json`, `mobile/powersync/system.ts` | PowerSync native dependencies are installed, the live path is typechecked, and Android export passes. CI still needs the release gate. |
| VAL-002 | todo | critical | reliability | global | `mobile/data/useData.ts`, `mobile/lib/useAuth.tsx` | Live mode silently falls back to demo data and never starts PowerSync. |
| VAL-003 | todo | critical | product | global | `mobile/app`, `mobile/data/repository.ts` | New-family onboarding, invite redemption, and password recovery are absent. |
| VAL-004 | in progress | critical | data | global | `mobile/powersync/schema.ts`, `mobile/data/supabaseRepository.ts` | Synced tables, invite-token storage, seat limits, and event notes now align; active sleep identity and duplicate persistence still need implementation. |
| VAL-005 | in progress | critical | privacy | global | `backend/sync-rules.yaml`, `backend/rls.sql`, `mobile/app/(tabs)/_layout.tsx` | Trust and invite tables now use role-scoped sync buckets; limited navigation and private check-in enforcement still need completion. |
| VAL-006 | todo | critical | security | global | `backend/functions/redeem-invite/index.ts` | Invite redemption is not atomic and rate limiting is process-local. |
| VAL-007 | todo | critical | security | global | `backend/functions/delete-account/index.ts` | Account deletion mutates ownership before auth deletion and ignores intermediate errors. |
| VAL-008 | todo | critical | security | global | `mobile/package-lock.json` | The production dependency tree has a critical advisory. |
| VAL-009 | todo | high | ci | global | `.github/workflows/ci.yml` | CI can be green while the app cannot bundle. |
| VAL-010 | todo | high | test | global | `backend/tests/run-pgtap.sh` | Backend security tests are not automated and the runner does not perform its advertised cleanup. |
| VAL-011 | in progress | high | docs | global | `README.md`, `alora_updated_prd.md`, `.scratch/production-readiness` | Documentation now records the private-beta scope; migration and provisioning references still need canonical-path updates. |
| VAL-012 | todo | high | accessibility | global | `mobile/components`, `mobile/app` | Interactive controls have no explicit accessibility roles, labels, or states. |
| VAL-013 | todo | high | release | global | `mobile/app.json`, `mobile/eas.json` | Store assets, EAS project linkage, privacy publication, and release metadata are incomplete. |
| VAL-014 | todo | high | data-integrity | global | `supabase/migrations/` | Database invariants allow cross-family references and need composite ownership constraints. |
| VAL-015 | todo | high | correctness | global | `mobile/data/supabaseRepository.ts` | Live sleep stop, sync status, and duplicate dismissal do not satisfy the repository contract. |
| VAL-016 | todo | medium | reliability | global | `mobile/app/_layout.tsx`, `mobile/lib/useAuth.tsx` | Font and session restoration failures can leave the app on a blank or permanent loading screen. |
| VAL-017 | todo | medium | coverage | global | `mobile/__tests__` | There is no credible coverage measurement or real PowerSync integration test. |

## Task details

### VAL-001. Restore a buildable, typechecked shipping graph

PowerSync React Native 2.x and its native OP-SQLite peer are now explicit dependencies. The SDK's built-in OP-SQLite factory is configured directly, the dummy declarations and `@ts-nocheck` directives are gone, and the live files are included in TypeScript. Android Expo export now passes.

Remaining work: add Android and iOS bundle exports to CI and perform a native-device runtime smoke test.

### VAL-002. Make runtime mode fail closed and own sync lifecycle

`setRepositoryMode()` catches every live-adapter load error and installs `mockRepository`. It sets `currentMode` before the import completes, does not retry after failure, and can race an auth-state transition. `startSync()` has no caller anywhere in the app.

Suggested fix: model runtime composition as an explicit state machine. Production configuration must surface a blocking error when live dependencies are unavailable. Start and stop sync from one authenticated lifecycle owner. Never show demo family data to an authenticated production user.

### VAL-003. Complete the first-user and second-caregiver journeys

No mobile code creates a family or first owner membership. `saveBabyProfile()` requires a family that does not exist. Successful sign-up routes directly to tabs. The app does not call `redeem-invite`, has no invite acceptance route, and has no password recovery flow.

Suggested fix: implement and integration-test sign-up, profile creation, family creation, first owner membership, baby creation, invite deep link redemption, and password recovery. Verify on clean devices and with email confirmation both enabled and disabled.

### VAL-004. Reconcile all database shapes

The PowerSync schema now includes `families.seat_limit`, `audit_logs`, `subscription_status`, and owner-scoped `invitation_tokens`. `stopSleep()` writes the backend's `baby_events.notes` column, and `EventRow` includes `family_id`. `getBabyStatus()` still does not return `activeSleepId`, and duplicate resolution is not persisted.

Remaining work: define one reviewed domain schema and compare Postgres, PowerSync, repository row types, sync rules, and test fixtures. Trust actions such as invite issue and revoke should use authenticated server operations rather than local writes, even though invite tokens are now restricted to an owner-only sync bucket.

### VAL-005. Enforce scoped roles at the sync and UI boundaries

The family bucket no longer includes `audit_logs`; a separate trust bucket is limited to non-limited roles, and an owner-only bucket carries invitation tokens. The self-only check-in policies do not exclude limited users, and the Check-In tab is always rendered.

Suggested fix: split shared-care and trust buckets by role, block limited check-in writes at RLS, remove restricted routes from limited navigation, and add two-device tests that inspect local SQLite contents rather than only server query results.

### VAL-006. Make invite redemption atomic and durable

The edge function reads an active token, inserts membership, and consumes the token in separate requests. Concurrent callers can redeem the same token when the family has no cap. The in-memory rate map resets on cold starts and does not coordinate instances.

Suggested fix: move redemption into one Postgres transaction or RPC that locks and conditionally consumes the token. Add durable rate limiting keyed by account and network signal. Return a generic invalid-code response to reduce enumeration.

### VAL-007. Make account deletion transactional and retry-safe

The function promotes a successor or deletes a family before deleting the auth user. Intermediate Supabase errors are ignored. A later auth deletion failure leaves partially changed ownership or deleted family data.

Suggested fix: move data mutations into an idempotent database operation with explicit error checks and a resumable deletion state. Perform the irreversible auth step in a sequence whose retries converge to the documented result.

### VAL-008. Remediate dependency advisories

The 2026-08-13 npm advisory scan reports 26 findings. A dry run shows that some can be fixed within Expo SDK 54 through patch updates, while others require an Expo SDK upgrade. Do not apply a forced major upgrade without an Expo compatibility pass.

Suggested fix: apply compatible patch updates in a dedicated dependency change, rebuild both platforms, then plan the smallest supported Expo SDK upgrade for remaining advisories.

### VAL-009. Turn CI into a real release gate

CI runs only typecheck, lint, and tests. It omits formatting, bundle export, dependency audit, PowerSync schema checks, and backend security tests. The current CI can pass while Android export fails.

Suggested fix: add format, Android and iOS export, audit policy, schema-alignment tests, and a PostgreSQL pgTAP job. Make the final gate depend on every release check.

### VAL-010. Automate the backend security suite

The runner requires local PostgreSQL and pgTAP and is not called by CI. Its final line prints a cleanup command but never executes it.

Suggested fix: run pgTAP in an ephemeral CI service or container. Use a unique validated database name and clean it up with a trap.

### VAL-011. Resolve product and documentation drift

The private-beta scope now preserves the implemented growth, report, handoff, and limited-role surfaces while freezing net-new expansion. The source PRD, context, remediation PRD, and roadmap record that decision. Remaining work is to make provisioning and migration references point to the canonical Supabase history.

Suggested fix: keep the scope reconciliation visible in the source docs, then close the task after the canonical migration and runbook references pass the Phase 1 checks.

### VAL-012. Add an accessibility contract

The codebase has about 123 pressable usages and no explicit `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, or `accessibilityHint` properties in app TSX files.

Suggested fix: encode semantics in shared button, chip, tab, and switch primitives. Add screen-reader and dynamic-type checks on iOS and Android. Include automated accessibility assertions where the React Native test surface supports them.

### VAL-013. Finish store and release configuration

`app.json` has no icon, adaptive icon, splash asset, description, EAS project ID, or platform privacy metadata. The privacy policy is a draft with placeholder contact fields. Developer accounts, service projects, and beta builds remain human-gated.

Suggested fix: complete `docs/launch-checklist.md` in order. Do not distribute a beta until the bundle, live smoke test, privacy policy, and legal gates pass.

### VAL-014. Harden relational invariants

`token_is_active()` calls `now()` but is declared immutable. `baby_events.family_id` is not constrained to the same family as its `baby_id`. Reflections can reference a check-in owned by a different user.

Suggested fix: mark time-dependent helpers stable, add composite ownership constraints or validated definer functions, and add negative pgTAP cases for every cross-tenant reference.

### VAL-015. Match live behavior to the UI contract

The live adapter always labels events `synced`, never exposes an active sleep ID, and ignores duplicate-resolution persistence. The UI therefore cannot stop a live sleep from Home, cannot show honest pending state, and re-detects dismissed duplicates.

Suggested fix: make sync and duplicate resolution explicit domain data. Add black-box tests against a real PowerSync database and verify the Home and Timeline flows on two devices.

### VAL-016. Handle boot failures

Font loading ignores its error value and returns `null` until success. Session restoration has no rejection handler. The current error boundary is nested inside the auth and theme providers.

Suggested fix: add a bounded boot state with retry and a dependency-light outer fallback. Capture initialization failures in Sentry without user data.

### VAL-017. Measure useful coverage

Node's experimental coverage output reports 100% with no instrumented files. This is not evidence of source coverage.

Suggested fix: use a React Native compatible test runner and instrument TypeScript source. Set thresholds only after critical domain and integration seams are measured.

## Completed during this scan

- `mobile/README.md` now passes Prettier.
- No committed secrets were found by the targeted credential-pattern scan.
- Expo SDK 54 package versions match the locally bundled compatibility map.
- PowerSync native dependencies are installed and the Android Expo export passes.
- PowerSync schema and sync-rule contract tests cover synced tables, backend columns, and trust-bucket role boundaries.

## Scan history

| Date | Profile | Score | Result |
|---|---|---:|---|
| 2026-08-13 | perfectionist | 28 | Release blocked by bundle, live-path, privacy, security, and external launch gates. |
| 2026-08-13 | perfectionist | 28 (slice complete) | PowerSync build graph and schema alignment slice complete; release remains blocked by runtime lifecycle, onboarding, privacy, security, CI, and external launch gates. |
