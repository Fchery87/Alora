# ADR-0002: Local-first SQLite as source of truth

- **Status:** Accepted and implemented
- **Scope:** `mobile/` data layer (`data/`, `runtime/`, `lib/supabase.ts`)

## Context

Alora's target user logs feeds and diapers at 3 AM, often with a dead or flaky
connection. Logging must never wait on a network. Sync is a background
reconciliation, not a prerequisite. The demo experience must also run
zero-configuration in Expo Go (no env vars, no auth, no native modules).

## Decision

**Expo SQLite is the local source of truth; Supabase/PowerSync are adapters for
live sync, never the primary store.**

- **One runtime composition owner** (`runtime/RuntimeProvider.tsx`): `demo` (no
  backend), `localFirst` (authenticated local adapter), or `live` (full
  PowerSync sync). It is decided from environment configuration plus
  auth/session state; no screen or hook reads raw env booleans.
- **One data boundary** (`data/repository.ts` — `AloraRepository` interface):
  screens call a repository, never a data source. `mockRepository` (demo) and
  `supabaseRepository` (live, local SQLite via PowerSync) implement the same
  contract; swapping adapters requires zero screen changes.
- **Durable local stores** for demo/local-first: care events, sleep timer,
  handoff marker, baby sex, reminder preferences — namespaced so demo data stays
  isolated from live data.
- **Sessions persist in SecureStore** (`lib/supabase.ts`) for offline cold start
  ("open + log while offline" per the PRD).
- **PowerSync starts only after** the runtime lifecycle has a valid
  authenticated session. It owns stop, clear, retry, and a sanitized sync
  projection for user-visible connection state.
- **Tests**: the same suite (99 tests) runs against the mock and a fake
  PowerSync SQL engine, proving dual-adapter behavior through the contract.

## Consequences

- Offline-first logging always works; sync conflict semantics are handled by the
  repository layer, not screens (screens own display state and submit intent only).
- Demo mode needs zero configuration and works in Expo Go; live mode needs a
  development build (native PowerSync modules) plus the provisioned backend
  (ADR-0001).
- Runtime composition tests cover the mode-to-adapter matrix and sync start/stop.
