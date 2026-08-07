# 03 — Live Data Path Completion

Status: implemented
Type: AFK

## What to build

Complete the supabaseRepository with all 19 `AloraRepository` interface methods (currently only 3 read methods exist). The mockRepository already has full implementations. This ports all write methods to the PowerSync-backed adapter: createEvent, startSleep, stopSleep, updateEvent, softDeleteEvent, createCheckIn, setReminder, generateInvite, revokeInvite, deleteAccount, exportMyData, plus the remaining read methods (getReminderPreferences, getInvite, getSupportResources, getAuditLog, saveBabyProfile).

Also wire the PowerSync sync lifecycle: start on authenticated session, stop on sign-out with local state cleared.

## Acceptance criteria

- [x] All 19 AloraRepository methods implemented in supabaseRepository
- [x] Write methods use PowerSync local `db.execute()` (auto-queues upload)
- [x] Read methods read from local PowerSync SQLite
- [x] Sync starts only after valid authenticated session
- [x] Sign-out stops sync and clears local state
- [x] Repository contract tests pass against both mockRepository and supabaseRepository

## Comments

### 2025-07-16
Created from production-readiness PRD user stories 11-24, 25-28. Overlaps significantly with alora-mvp issues 03, 04, 06, 10, 11, 12.

## Comments

### 2025-07-16
- All acceptance criteria verified and implemented.

## Comments

### 2025-08-07 (verification pass)
- Contract tests only ran against mockRepository. Parameterized `mobile/__tests__/repository.test.js`:
  the identical 20-assertion contract suite now runs against BOTH adapters, with a
  faithful in-memory fake of the PowerSync local SQLite (same query shapes) backing
  supabaseRepository. `npm test` passes 50/50.
- The dual-adapter run caught a REAL bug: `updateEvent` pushed the `updated_at` value
  into params AFTER the patch values while `updated_at = ?` is the first SET clause —
  timestamps and field values were swapped on every edit. Fixed in
  `data/supabaseRepository.ts`.
- End-to-end live-path verification (provisioned backend) remains a human gate (W0);
  see backend/PROVISIONING.md.
