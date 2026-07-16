# 06 — Shared timeline + edit/soft-delete

Status: ready-for-agent
Type: AFK

## What to build

The family history and audit surface. A unified chronological list of recent events with event-type labels, timestamps, and actor attribution. Editing an event must not silently erase context: prior values are retained in an `event_edits` table and surfaced as "edited by X" markers. Deletes are soft-deletes (`deleted_at`) that propagate as sync tombstones.

## Acceptance criteria

- [ ] Timeline renders all recent events chronologically with type, timestamp, and who logged it
- [ ] Editing an event records the prior values in `event_edits` and shows an "edited by X" marker
- [ ] Deleting an event soft-deletes it (`deleted_at`) and propagates as a tombstone across devices
- [ ] Edits and deletes are local-first and sync like other writes
- [ ] Tests cover edit-history retention and soft-delete tombstone propagation

## Blocked by

- 04-diaper-sleep-logging-durable-timers.md
