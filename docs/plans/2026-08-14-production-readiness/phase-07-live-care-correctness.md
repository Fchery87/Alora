# Phase 7. Live Care Correctness

[Back to overview](overview.md)

## Goal

Make active sleep, duplicate resolution, and pending sync state durable and truthful in live mode.

## Blockers addressed

- Remaining VAL-004 data-shape alignment.
- VAL-015 repository and UI contract mismatch.

## Data structures

- `EventDuplicateResolution`. Canonically ordered event pair, resolution, canonical event, actor, and timestamp.
- `SyncProjection`. Connected, initial-sync complete, last error, and pending event IDs.
- `BabyStatus.activeSleepId`. The open sleep event that Home may stop.

## Changes

### Task 1. Specify duplicate behavior at the domain seam

**Files:**

- Create `mobile/domains/babyCare.ts` or deepen the existing care-event module selected during implementation.
- Modify `mobile/data/repository.ts`.
- Create `mobile/__tests__/domains/duplicateResolution.test.ts`.

Define pending, keep-both, and merged outcomes. Use one canonical event-pair ordering. Prove keep-both survives reread and merge preserves history while soft-deleting only the loser.

Completion criterion. Tests no longer depend on mutating `CareEvent.duplicateOf` as persistent state.

### Task 2. Persist duplicate resolutions end to end

**Files:**

- Create `supabase/migrations/20260814000500_event_duplicate_resolutions.sql`.
- Modify `backend/sync-rules.yaml`.
- Modify `mobile/powersync/schema.ts`.
- Modify `mobile/data/supabaseRepository.ts`.
- Modify `mobile/__tests__/schemaAlignment.test.js` or its Jest replacement.
- Extend `supabase/tests/02-relational-integrity.test.sql`.

Add a same-family resolution table with a unique canonical pair. Constrain canonical and loser events to the same family. Sync it with family care data. Read and write resolutions through the care module.

Completion criterion. Restart and second-device reads preserve keep-both and merge decisions.

### Task 3. Restore live sleep control

**Files:**

- Modify `mobile/data/supabaseRepository.ts`.
- Modify `mobile/app/(tabs)/index.tsx`.
- Extend `mobile/__tests__/repository.test.js` or its Jest replacement.

Return `openSleep.id` as `activeSleepId`. Assert Home stops that exact event after restart and does not manufacture a second timer.

Completion criterion. Live Home can start, survive restart, and stop one open sleep.

### Task 4. Derive honest sync state

**Files:**

- Create `mobile/powersync/syncProjection.ts`.
- Modify `mobile/powersync/system.ts`.
- Modify `mobile/data/supabaseRepository.ts`.
- Modify `mobile/app/(tabs)/index.tsx`.
- Modify `mobile/app/(tabs)/timeline.tsx`.
- Create `mobile/__tests__/powersync/syncProjection.test.ts`.

Use supported PowerSync status and upload events. Track pending event IDs durably enough to survive app restart. Clear pending state only after the matching upload transaction completes. Surface connection and upload errors without exposing tokens or row content.

Completion criterion. Offline writes show pending, reconnect clears them after upload, and failed uploads remain visible and retryable.

## Verification

### Static

Run:

```bash
supabase db reset
supabase test db
cd mobile && npm run typecheck && npm run lint && npm test -- duplicate sleep syncProjection schema
```

Expected. Domain, repository, schema, and database assertions pass.

### Runtime

Run the care portion of the two-device tracer journey. Include offline start and stop, process death, reconnect, failed upload, same-type overlap, keep-both, merge, and restart on both devices.

## Commit boundary

Commit duplicate persistence separately from sleep and sync projection. Each change must preserve repository contract tests.

Suggested commits:

- `feat(care): persist duplicate resolutions`
- `fix(care): restore live sleep identity`
- `feat(sync): project honest event upload state`

## Exit criteria

- Home can stop live sleep.
- Duplicate decisions converge across devices.
- Pending and synced labels reflect real upload state.
- No UI derives persistent conflict state from an ephemeral object field.
