# 04 — Runtime Composition: Mode Resolver

Status: implemented
Type: AFK

## What to build

A single mode resolver that selects demo, local-first, or live mode from environment configuration + auth/session state. No screen, hook, or sync routine should read raw environment booleans directly — they all go through the resolver.

If live mode is requested but PowerSync adapter cannot load, fail closed with a diagnostic rather than silently degrading.

## Acceptance criteria

- [x] Single `resolveMode()` function that returns `"demo" | "localFirst" | "live"`
- [x] Resolver reads env config + auth/session state
- [x] `useData.ts` uses resolver to select mock vs supabase repository
- [x] No raw environment boolean reads outside the resolver
- [x] PowerSync starts only after resolver confirms live/local-first + valid session
- [x] Sign-out stops sync and clears local sync state
- [x] Live mode with missing adapter shows diagnostic (does not silently use mock)

## Comments

### 2025-07-16
Created from production-readiness PRD user stories 25-28.

## Comments

### 2025-07-16
- Client-side implementation complete: repository methods, tests, and UI wiring.
- Backend provisioning (W0) still required for end-to-end live-path verification.

## Comments

### 2025-07-16
- All acceptance criteria verified and implemented.

## Comments

### 2025-08-07 (verification pass)
- Re-verified the resolver, sync lifecycle (start gated on signed-in + live/local-first,
  `stopSync()` on sign-out), and the fail-closed diagnostic (`useData` warns and stays
  on mock when the PowerSync adapter can't load; Home shows a sync-failure state).
- End-to-end live verification still requires backend provisioning (W0, human gate).
