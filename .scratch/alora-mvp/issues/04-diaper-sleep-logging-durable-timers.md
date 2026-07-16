# 04 — Diaper & sleep logging + durable timers

Status: ready-for-agent
Type: AFK

## What to build

Extend the proven feed-logging pattern to the remaining two event types. **Diaper:** wet, dirty, mixed, notes, timestamp. **Sleep:** start, stop, manual edit, nap/night type, timestamp. Add quick-add presets and repeat-last actions across all event types. Implement local device timers for in-progress sleep that are **persisted to SQLite** so an in-progress sleep survives app kill/restart and commits as a completed event on stop.

## Acceptance criteria

- [ ] Diaper events (wet/dirty/mixed + notes) log local-first and sync
- [ ] Sleep events support start/stop, manual edit, nap/night type
- [ ] An in-progress sleep timer persists across app kill and resumes correctly
- [ ] Stopping a timer commits a completed sleep event with correct start/end
- [ ] Quick-add presets and repeat-last work for all three event types
- [ ] Tests cover timer persistence across app restart and preset/repeat-last behavior

## Blocked by

- 03-feed-logging-tracer.md
