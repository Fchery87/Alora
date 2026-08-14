# Phase 2. Credible Test Foundations

[Back to overview](overview.md)

## Goal

Create test surfaces that instrument application source, render React Native behavior, and fail reliably on database security regressions.

## Blockers addressed

- VAL-010 backend security automation.
- VAL-017 credible source coverage and mobile behavior tests.

## Data structures

- Coverage baseline. Measured source coverage by domain and layer.
- Database security matrix. Actor, family, role, action, expected result, and expected audit outcome.

## Changes

### Task 1. Replace the transpile-in-test harness

**Files:**

- Modify `mobile/package.json` and `mobile/package-lock.json`.
- Create `mobile/jest.config.js`.
- Create `mobile/jest.setup.ts`.
- Migrate `mobile/__tests__/careEventStore.test.js`.
- Migrate `mobile/__tests__/growth.test.js`.
- Migrate `mobile/__tests__/handoff.test.js`.
- Migrate `mobile/__tests__/pediatricReport.test.js`.
- Migrate `mobile/__tests__/reminderSchedule.test.js`.
- Migrate `mobile/__tests__/repository.test.js`.
- Migrate `mobile/__tests__/schemaAlignment.test.js`.

Install Expo's supported Jest preset and React Native Testing Library. Import TypeScript source through the real transform. Preserve the fast repository stand-in, but name it as a contract adapter rather than live integration. Delete duplicated per-file transpile loaders.

Completion criterion. The same seven behavior groups pass under Jest and the coverage report names real `data/`, `lib/`, `config/`, and runtime source files.

### Task 2. Add React Native integration tests

**Files:**

- Create `mobile/__tests__/app/boot.test.tsx`.
- Create `mobile/__tests__/app/auth-routing.test.tsx`.
- Create `mobile/__tests__/app/accessibility-primitives.test.tsx`.

Start with failing tests for current gaps. Assert visible loading and failure outcomes, auth routing, and primitive semantics. Keep screen behavior tests at public interfaces.

Completion criterion. Each new test fails against the pre-remediation behavior for the intended reason.

### Task 3. Move database tests to the Supabase CLI

**Files:**

- Move `backend/tests/01-rls-security.sql` to `supabase/tests/01-rls-security.test.sql`.
- Delete `backend/tests/run-pgtap.sh` after the CLI path passes.
- Modify `backend/README.md`.
- Modify `backend/PROVISIONING.md`.

Use `supabase test db` so each test is transaction-isolated and TAP failures return nonzero. Preserve all existing assertions before adding new ones.

Completion criterion. A deliberately failing pgTAP assertion fails the command, and a subsequent clean run starts from an unchanged database.

### Task 4. Record the baseline without gaming it

**Files:**

- Modify `mobile/package.json`.
- Create `docs/testing.md`.
- Modify `VALIDATION_TASKS.md`.

Add `test`, `test:coverage`, and targeted test scripts. Record measured coverage. Set no threshold in this phase.

Completion criterion. Coverage is credible and reproducible from a clean checkout.

## Verification

### Static

Run:

```bash
cd mobile
npm run typecheck
npm run lint
npm test
npm run test:coverage
```

```bash
supabase db reset
supabase test db
```

Expected. Every command exits 0. Coverage includes application TypeScript. pgTAP failure propagation is proven once with a temporary failing assertion and then restored.

### Runtime

Render the root app shell in the React Native test environment and confirm tests query user-visible output instead of implementation state.

## Commit boundary

Commit mobile test migration separately from the Supabase test migration if either diff becomes difficult to review.

Suggested commits:

- `test(mobile): instrument application source with jest expo`
- `test(backend): run security matrix through supabase cli`

## Exit criteria

- Node's empty 100 percent report is gone.
- React Native behavior has a supported render surface.
- Database tests fail and clean up reliably.
- Feature phases can follow red, green, refactor without replacing this infrastructure.
