# 03 — Feed logging tracer

Status: implemented
Type: AFK

## What to build

The first end-to-end event path, proving the entire local-first + sync architecture with a single event type before fanning out. Add the `baby_events` table (typed-payload model supporting feed/diaper/sleep) and implement **feed** logging only: breast, bottle, pumping, quantity, duration, timestamp. Writes go to local SQLite first (durable offline and across app restarts), display immediately with a pending indicator, then upload via PowerSync to the family bucket and appear on a second caregiver's device.

Note: `syncStatus` is a **client-only** concern (PowerSync manages the upload queue) — keep it in the local SQLite schema, not as a synced server column.

## Acceptance criteria

- [ ] `baby_events` table + RLS exists, scoped to the family bucket
- [ ] A feed event can be logged in under ~10 seconds with minimal typing (quick-log UI)
- [ ] New feed events appear instantly from local storage with a pending indicator
- [ ] Events created offline persist across app kill and sync automatically on reconnect with no re-entry
- [ ] A feed logged on device A appears on device B after sync
- [ ] Pending/synced state is tracked locally only (not a synced column)
- [ ] Tests cover offline create → durability → sync, and cross-device visibility

## Blocked by

- 02-local-first-pipeline-family-baby-setup.md

## Comments

### 2025-07-16
- Client-side implementation complete: repository methods, tests, and UI wiring.
- Backend provisioning (W0) still required for end-to-end live-path verification.
