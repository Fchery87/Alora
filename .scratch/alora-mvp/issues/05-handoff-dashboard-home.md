# 05 — Handoff dashboard (Home)

Status: ready-for-agent
Type: AFK

## What to build

The Home screen as a handoff dashboard rather than a general feed. It surfaces current baby state so a caregiver understands recent events and likely next action within seconds of opening the app. Modules: baby status summary (last feed, last diaper, current sleep state derived from any open sleep event), next action/reminder surface, quick-log row for feed/diaper/sleep, recent caregiver activity panel, and a visible pending-sync notice when relevant.

## Acceptance criteria

- [ ] Home shows last feed, last diaper, and current sleep state (open sleep event reflected as "asleep")
- [ ] Quick-log row creates feed/diaper/sleep events directly from Home
- [ ] Recent caregiver activity panel shows who did what, most recent first
- [ ] A pending-sync notice appears when unsynced events exist and clears on sync
- [ ] Layout supports one-handed use with large tap targets and minimal typing
- [ ] Tests cover status derivation (esp. current sleep state) and quick-log from Home

## Blocked by

- 04-diaper-sleep-logging-durable-timers.md
