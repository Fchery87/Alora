# 09 — Local reminders + notifications

Status: implemented
Type: AFK

## What to build

Local notifications only (no server/push infrastructure in MVP). Recurring reminders via `expo-notifications`, quiet-hours support, and per-user notification preferences (`notification_preferences`). Validate that local notifications work in Expo Go while noting that any future remote push requires a development build (deferred to Phase 2).

## Acceptance criteria

- [ ] User can configure recurring local reminders
- [ ] Quiet hours suppress notifications within the configured window
- [ ] Per-user notification preferences persist and are respected
- [ ] No reminder fires during quiet hours; resumes correctly afterward
- [ ] Tests cover quiet-hours suppression and preference application

## Blocked by

- 02-local-first-pipeline-family-baby-setup.md
