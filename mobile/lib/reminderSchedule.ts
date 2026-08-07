import type { ReminderKind } from "../data/repository";

export type ReminderSchedulePlan =
  { kind: "timeInterval"; seconds: number; repeats: true } | { kind: "daily"; hour: number; minute: number };

const QUIET_ALLOWED_HOURS = [6, 9, 12, 15, 18, 21];

export function reminderSchedulePlans(kind: ReminderKind, quietHoursEnabled: boolean): ReminderSchedulePlan[] {
  if (kind === "feed" || kind === "diaper") {
    if (quietHoursEnabled) return QUIET_ALLOWED_HOURS.map((hour) => ({ kind: "daily", hour, minute: 0 }));
    return [{ kind: "timeInterval", seconds: 3 * 60 * 60, repeats: true }];
  }

  if (kind === "bedtime") {
    return [{ kind: "daily", hour: 20, minute: 30 }];
  }

  return [];
}

export function reminderSchedulePlan(kind: ReminderKind, quietHoursEnabled: boolean): ReminderSchedulePlan | null {
  return reminderSchedulePlans(kind, quietHoursEnabled)[0] ?? null;
}
