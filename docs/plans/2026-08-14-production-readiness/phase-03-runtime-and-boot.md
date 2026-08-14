# Phase 3. Runtime Composition and Boot Recovery

[Back to overview](overview.md)

## Goal

Give the app one explicit owner for session restoration, repository selection, PowerSync lifecycle, and recoverable startup failure.

## Blockers addressed

- VAL-002 runtime composition and sync lifecycle.
- VAL-016 boot failure handling.

## Data structures

- `RuntimeState`. Intentional demo, restoring session, signed out, starting live, ready, and blocking failure.
- `RuntimeEvent`. Configuration resolved, session restored, session failed, auth changed, adapter loaded, sync connected, sync failed, retry, and sign out.

## Changes

### Task 1. Define the runtime interface test first

**Files:**

- Create `mobile/runtime/types.ts`.
- Create `mobile/runtime/composition.ts`.
- Create `mobile/__tests__/runtime/composition.test.ts`.

Define a pure state transition interface. Prove that a configured signed-in state cannot transition to demo. Prove stale async completions cannot overwrite a newer auth transition.

Completion criterion. The state matrix covers every configuration and auth combination with exhaustive TypeScript handling.

### Task 2. Own repository and PowerSync lifecycle

**Files:**

- Create `mobile/runtime/RuntimeProvider.tsx`.
- Modify `mobile/data/useData.ts`.
- Modify `mobile/powersync/system.ts`.
- Modify `mobile/lib/useAuth.tsx`.
- Create `mobile/__tests__/runtime/provider.test.tsx`.

Move mutable repository selection out of module globals. Start PowerSync once for a valid live session. Initialize local-first storage without connecting when the endpoint is absent. Stop and clear on user change or sign-out. Serialize transitions and expose retry.

Completion criterion. Rapid sign-in, sign-out, and account-switch tests leave one repository and one sync owner in the correct terminal state.

### Task 3. Add a dependency-light boot boundary

**Files:**

- Modify `mobile/app/_layout.tsx`.
- Modify `mobile/components/ErrorBoundary.tsx`.
- Modify `mobile/lib/crashReporting.ts`.
- Extend `mobile/__tests__/app/boot.test.tsx`.

Handle font and session errors explicitly. Put the outer fallback above theme, router-dependent fallback content, and auth. Show retry and safe sign-out where applicable. Capture sanitized stage and error class only.

Completion criterion. Font, session, adapter, and sync startup failures all exit loading and produce an operable recovery surface.

### Task 4. Delete obsolete mode paths

**Files:**

- Delete `mobile/config/mode.ts` after callers move.
- Modify `mobile/config/env.ts`.
- Modify `mobile/README.md`.
- Modify `CONTEXT.md`.

Keep environment parsing at the boundary. Remove comments and dynamic-import fallbacks that describe missing dependencies as normal production behavior.

Completion criterion. One module owns runtime composition and no screen reads raw mode booleans.

## Verification

### Static

Run:

```bash
cd mobile
npm run typecheck
npm run lint
npm test -- runtime
npm test -- boot
```

Expected. The runtime transition matrix and rendered boot states pass with no unhandled promises.

### Runtime

Use a development build to verify intentional demo, signed-out backend, signed-in local-first, signed-in live, invalid PowerSync endpoint, offline cold start, retry, sign-out, and account switch. Confirm authenticated production configuration never renders demo names.

## Commit boundary

Commit pure runtime state before provider wiring. Commit boot recovery after lifecycle tests are green.

Suggested commits:

- `refactor(runtime): model authenticated data composition`
- `fix(runtime): own powersync lifecycle and boot recovery`

## Exit criteria

- One runtime module owns repository and sync lifecycle.
- Configured failures fail closed.
- Boot cannot remain blank or loading forever.
- The Phase 3 throughput checkpoint in `overview.md` passes.
