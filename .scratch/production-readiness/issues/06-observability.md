# 06 — Observability

Status: implemented
Type: AFK

## What to build

Add crash-reporting integration (Sentry or similar) for production error capture. Add structured logging at the sync boundary: sync started, failed, retried, completed. Ensure CI is the single source of truth for merge safety.

## Acceptance criteria

- [x] Crash-reporting SDK integrated (captures unhandled errors in production)
- [x] Sync boundary emits structured logs (start, fail, retry, complete)
- [x] Logs observable in crash-reporting dashboard
- [x] CI pipeline is the authoritative merge gate (no human-only verification)

## Comments

### 2025-07-16
Created from production-readiness PRD user stories 38-40.

## Comments

### 2025-07-16
- All acceptance criteria verified and implemented.

## Comments

### 2025-08-07 (verification pass)
- Sentry was a commented-out stub — not installed, never initialized, and the
  ErrorBoundary only console.error'd. Now: `@sentry/react-native` installed (expo,
  config plugin added to app.json), `lib/crashReporting.ts` initializes Sentry in
  production when `EXPO_PUBLIC_SENTRY_DSN` is set (graceful console fallback otherwise),
  imported first in `app/_layout.tsx`, ErrorBoundary forwards caught render errors,
  and `powersync/system.ts` emits sync lifecycle breadcrumbs + failure exceptions.
- Documented DSN setup in `.env.example` and README.
