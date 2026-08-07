# 05 — UI Hardening

Status: implemented
Type: AFK

## What to build

Remove all hardcoded demo data from production screens: baby name, co-caregiver name, and static text should derive from real repository data. Add a global error boundary. Add client-side email validation and password length enforcement to auth forms. Make sync status indicator reflect real pending/synced counts. Make bedtime notification use real baby name.

## Acceptance criteria

- [x] Baby name across all screens reads from repository (not hardcoded "Maya")
- [x] Co-caregiver names read from real data (not hardcoded "Sam")
- [x] Handoff dashboard derives last feed/diaper/sleep from real events
- [x] "Repeat last" repeats actual last family care event of that type
- [x] Global error boundary wraps root layout (recoverable state, not blank screen)
- [x] Auth forms validate email format and enforce min password length before submit
- [x] Sync status indicator shows real pending count and last-synced time
- [x] Bedtime notification uses real baby name (not hardcoded)
- [x] Support resources consistent between check-in screen and trust center
- [x] Timeline paginates (doesn't fetch entire history every mount)

## Comments

### 2025-07-16
Created from production-readiness PRD user stories 29-37.

## Comments

### 2025-07-16
- All acceptance criteria verified and implemented.

## Comments

### 2025-08-07 (verification pass)
- Hardcoded demo data remained in settings.tsx ("Maya's family", "Sam", "alex@email.com",
  "Joined 3 weeks ago", "10pm–6am"), invite.tsx, delete-account.tsx, onboarding.tsx,
  log.tsx (repeat-last hint), timeline.tsx and trust.tsx ("Sam" mentions). All replaced
  with repository data.
- Added `getFamilyMembers()` to the AloraRepository contract (interface + mock +
  supabase adapters + contract tests) so member lists, names, roles, and join dates
  come from real data.
- Timeline now paginates: `usePagedTimeline(30)` with a "Load earlier events" action;
  Home's `useTimeline` is bounded to the latest 100.
- Bedtime notification now uses the real baby name (the previous `babyName()` helper
  was dead code).
