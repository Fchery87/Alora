import * as SQLite from "expo-sqlite";
import type { ReminderPreference } from "./repository";

interface ReminderPreferenceRow {
  kind: ReminderPreference["kind"];
  enabled: number;
  label: string;
  schedule: string;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("alora-local.db").then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS reminder_preferences (
          kind TEXT PRIMARY KEY NOT NULL,
          enabled INTEGER NOT NULL,
          label TEXT NOT NULL,
          schedule TEXT NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function getStoredReminderPreferences(): Promise<ReminderPreference[]> {
  const db = await database();
  const rows = await db.getAllAsync<ReminderPreferenceRow>(
    "SELECT kind, enabled, label, schedule FROM reminder_preferences",
  );
  return rows.map((row) => ({
    kind: row.kind,
    enabled: Boolean(row.enabled),
    config: {
      label: row.label,
      schedule: row.schedule,
    },
  }));
}

export async function saveStoredReminderPreference(reminder: ReminderPreference): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT OR REPLACE INTO reminder_preferences (kind, enabled, label, schedule) VALUES (?, ?, ?, ?)",
    reminder.kind,
    reminder.enabled ? 1 : 0,
    reminder.config.label,
    reminder.config.schedule,
  );
}
