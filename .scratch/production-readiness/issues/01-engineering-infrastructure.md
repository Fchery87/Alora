# 01 — Engineering Infrastructure

Status: implemented
Type: AFK

## What to build

Establish the engineering foundation: version control is already in place. Add a root-level `.gitignore` (exists), ESLint + Prettier config with Expo preset, a CI pipeline via GitHub Actions that runs typecheck, tests, and lint on every PR, and blocks merge on failure.

## Acceptance criteria

- [x] ESLint config with Expo preset + Prettier formatting
- [x] GitHub Actions CI workflow that runs: typecheck → lint → tests
- [x] CI blocks merge on failure
- [x] `npm run typecheck`, `npm run lint`, `npm run test` all succeed locally

## Comments

### 2025-07-16
Created from production-readiness PRD user stories 1-5.

## Comments

### 2025-07-16
- All acceptance criteria verified and implemented.

## Comments

### 2025-08-07 (verification pass)
- Re-verified: eslint + prettier were missing from devDependencies (`npm run lint` failed
  with `eslint: not found`). Installed eslint@^9, eslint-config-expo@~10.0.0 (SDK 54),
  eslint-config-prettier, eslint-plugin-prettier, prettier; migrated `.eslintrc.js` →
  flat `eslint.config.js`; fixed 575 lint findings (34 errors incl. 5 no-unescaped-entity
  files, unused vars, dead `babyName()` in notifications — bedtime notification now
  uses the real baby name); CI lint job now runs `npm run lint` against the pinned eslint.
- `npm run lint` (0 warnings, --max-warnings=0), `npm run format`, `npm run typecheck`,
  and `npm test` (50 tests) all pass locally.
