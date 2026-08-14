# Phase 11: Turn Production Checks into CI Gates

## Goal

Make the repository continuously prove formatting, types, lint, tests, exports, database invariants, dependency risk, and coverage from a clean checkout.

## Why This Phase Comes Here

CI should encode the final architecture and test layers. Adding gates earlier would create churn while migrations, runtime composition, and test infrastructure are still changing.

## Target Pipeline

Use separate jobs with explicit ownership and failure output.

- Repository hygiene and formatting.
- Mobile typecheck, lint, Jest, and coverage.
- Android and iOS static exports.
- Supabase local reset and pgTAP.
- Backend Deno checks and tests.
- Dependency audit and compatibility checks.
- One required aggregate status for branch protection.

Keep fast deterministic checks on every pull request. Schedule slower advisory checks separately when they cannot be made stable enough to block merges.

## Files

- Update `.github/workflows/ci.yml`.
- Create `.github/workflows/dependency-review.yml` if the repository policy supports it.
- Create `docs/security/dependency-risk-register.md`.
- Update `mobile/package.json`.
- Update `backend/deno.json`.
- Update `README.md`.
- Update `VALIDATION_TASKS.md`.

## Tasks

### 1. Regenerate dependency evidence

Run a fresh install from the committed lockfile. Run `npm audit` and Expo compatibility checks after the PowerSync and test dependencies are final.

Classify each finding by exploitability in the shipped mobile or Edge runtime, available compatible fix, and owner. Apply compatible patches. Do not use forced major upgrades as an audit shortcut.

Record accepted temporary risk with an expiry date and an upgrade path. Do not copy secrets, registry tokens, or full environment output into the register.

### 2. Make repository scripts canonical

Add named scripts for format checking, unit tests, coverage, Android export, iOS export, backend checks, and database tests. CI and contributor documentation must call the same scripts.

Avoid hidden shell setup. Each script should fail on the first invalid result and return a meaningful exit code.

### 3. Split CI by responsibility

Use cache keys derived from lockfiles and runtime versions. Pin supported Node, Deno, Supabase CLI, and Expo-compatible tool versions.

Upload coverage and failing test artifacts. Do not upload `.env` files, database dumps with user data, source maps containing secrets, or device logs without redaction.

### 4. Add coverage as a ratchet

Capture a trustworthy baseline after Jest Expo and React Native Testing Library migration. Set initial thresholds at or just below the measured baseline. Raise them only with evidence.

Require direct coverage for authentication boundaries, onboarding, live care, invite redemption, role privacy, sync projection, and account deletion. Do not treat aggregate line coverage as proof of those behaviors.

### 5. Prove the gates fail correctly

In a temporary local branch or uncommitted edit, deliberately trigger each major job failure. Confirm the relevant job fails and the aggregate status blocks. Revert only the deliberate test mutation.

Then rerun from a clean checkout-equivalent dependency state.

## Static Verification

Run the same commands CI will run, including:

- `cd mobile && npm ci`
- `cd mobile && npm run format`
- `cd mobile && npm run typecheck`
- `cd mobile && npm run lint`
- `cd mobile && npm run test:coverage`
- `cd mobile && npm run export:android`
- `cd mobile && npm run export:ios`
- `cd mobile && npx expo install --check`
- `cd mobile && npm audit`
- `cd backend && deno task check`
- `cd backend && deno task test`
- `supabase db reset`
- `supabase test db`

Command names may be finalized while implementing the canonical scripts. The README and workflow must use the final names consistently.

## Runtime Verification

Open a pull request from a disposable branch and observe every required job from a clean runner. Confirm dependency restoration, local Supabase startup, exports, artifact upload, and aggregate status behavior.

Deliberately broken format, test, migration, and export changes must each fail the expected job. The repaired commit must pass without relying on untracked local state.

## Exit Criteria

- A clean runner executes every production gate.
- CI and local commands share one script surface.
- Coverage thresholds ratchet from a trustworthy baseline.
- Dependency findings have fixes or time-bounded risk records.
- Branch protection can require one reliable aggregate status.
