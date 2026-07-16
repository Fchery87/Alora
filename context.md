# Code Context

## Files Retrieved
1. `mobile/data/mockRepository.ts` (lines 1-125) - defines the in-memory reminder store and helper functions.
2. `mobile/data/mockRepository.ts` (lines 195-318) - implements `getReminderPreferences()` and `setReminder()`; reminders currently persist only in module state.
3. `mobile/data/repository.ts` (lines 32-46) - defines `ReminderKind`, `ReminderConfig`, and `ReminderPreference`.
4. `mobile/data/repository.ts` (lines 100-116) - repository contract for reminder reads/writes.
5. `mobile/data/useData.ts` (lines 18-23) - selects `mockRepository` as the active source.
6. `mobile/data/useData.ts` (lines 56-72) - exposes reminder hooks/actions used by the UI.
7. `mobile/lib/notifications.ts` (lines 1-99) - schedules/cancels local Expo notifications; no quiet-hours suppression yet.
8. `mobile/app/reminders.tsx` (lines 14-41) - toggle flow saves one reminder then syncs that same reminder.
9. `mobile/app/reminders.tsx` (lines 80-136) - renders quiet hours and reminder rows; quiet-hours schedule is display-only.
10. `mobile/data/localSleepTimerStore.ts` (lines 1-59) - existing Expo SQLite persistence pattern to reuse.
11. `.scratch/alora-mvp/issues/09-local-reminders-notifications.md` (lines 1-18) - acceptance criteria: local reminders, quiet-hours suppression, persisted prefs, no backend/push.
12. `mobile/data/supabaseRepository.ts` (lines 1-105) - live adapter is incomplete for reminders; leave it alone for this mobile-only patch.
13. `mobile/package.json` (lines 1-31) - confirms `expo-notifications` and `expo-sqlite` are installed; only `typecheck` script exists.

## Key Code

Reminder model:
```ts
export type ReminderKind = "feed" | "diaper" | "bedtime" | "quietHours";
export interface ReminderPreference {
  kind: ReminderKind;
  enabled: boolean;
  config: { label: string; schedule: string };
}
```

Current mock persistence is memory-only:
```ts
let reminderStore: ReminderPreference[] = [/* defaults */];
async getReminderPreferences() { return delay(reminderStore.map(cloneReminder), s); }
async setReminder(kind, config, enabled) { await delay(undefined, s); updateReminder(kind, config, enabled); }
```

Current notification sync is per-row only:
```ts
export async function syncReminderNotification(reminder, enabled) {
  await cancelReminderNotification(reminder.kind);
  if (!enabled || reminder.kind === "quietHours") return "off";
  // schedules feed/diaper every 3h, bedtime daily at 8:30 PM
}
```

Existing SQLite store pattern:
```ts
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
async function database() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync("alora-local.db").then(async (db) => {
    await db.execAsync(`CREATE TABLE IF NOT EXISTS active_sleep_timer (...)`);
    return db;
  });
  return dbPromise;
}
```

## Architecture
- `mobile/app/reminders.tsx` is the only UI entry point for W5 reminder toggles.
- `mobile/data/useData.ts` binds the app to `mockRepository`, so the safe patch stays local and does not touch backend sync.
- `mockRepository` owns the canonical reminder defaults; it should hydrate from SQLite on read and save on write.
- `syncReminderNotification()` currently does not know the full preference set, so quiet-hours suppression cannot be correct yet.
- `supabaseRepository` is not the right target here because reminder persistence is still missing there and backend work is gated.

## Safe Next Patch
1. Add `mobile/data/localReminderPreferenceStore.ts` using the same `expo-sqlite` pattern as `localSleepTimerStore.ts`.
2. Persist reminder rows with a local key such as `LOCAL_USER_ID = "local-demo-user"` so the feature behaves per-user without backend/auth.
3. In `mockRepository.getReminderPreferences()`, hydrate defaults from SQLite before returning clones.
4. In `mockRepository.setReminder()`, update memory and write the row to SQLite.
5. Replace the single-row notification sync with a preference-aware `syncReminderNotifications(preferences)` helper.
6. Resync all reminders when quiet hours change so stale scheduled notifications are canceled.

## Quiet-Hours Strategy
- Keep the current fixed window string for W5; do not add time pickers.
- Add pure helpers like `isWithinQuietHours(now, quietHours)` so behavior is testable later.
- `expo-notifications` repeating `TIME_INTERVAL` triggers cannot reliably skip quiet hours.
- Safest MVP behavior is to reschedule reminders based on quiet-hours windows when preferences change, rather than relying on repeating triggers alone.

## Risks
- Repeating 3-hour triggers can still fire inside quiet hours; they are not sufficient for the acceptance criterion.
- One-shot scheduling avoids quiet-hour violations but does not self-repeat forever unless reminders are rescheduled after delivery or on app foreground.
- There is no mobile test harness found in `mobile/`, so the issue’s test requirement likely needs a follow-up setup.
- The hardcoded local user id is acceptable only for demo/local-first mode.
- Changing quiet hours must cancel and rebuild all scheduled reminder IDs, or stale notifications will remain active.

## Start Here
Open `mobile/data/mockRepository.ts` first. It owns the current defaults and the two methods that need persistence, so it is the smallest safe root for the patch.