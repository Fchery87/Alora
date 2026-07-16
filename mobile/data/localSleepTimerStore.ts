import * as SQLite from "expo-sqlite";

export interface StoredSleepTimer {
  id: string;
  startAt: Date;
}

interface StoredSleepTimerRow {
  id: string;
  start_at: string;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("alora-local.db").then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS active_sleep_timer (
          singleton_key TEXT PRIMARY KEY NOT NULL,
          id TEXT NOT NULL,
          start_at TEXT NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function getStoredSleepTimer(): Promise<StoredSleepTimer | null> {
  const db = await database();
  const row = await db.getFirstAsync<StoredSleepTimerRow>(
    "SELECT id, start_at FROM active_sleep_timer WHERE singleton_key = ?",
    "current",
  );
  if (!row) return null;
  const startAt = new Date(row.start_at);
  if (Number.isNaN(startAt.getTime())) {
    await clearStoredSleepTimer();
    return null;
  }
  return { id: row.id, startAt };
}

export async function saveStoredSleepTimer(timer: StoredSleepTimer): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT OR REPLACE INTO active_sleep_timer (singleton_key, id, start_at) VALUES (?, ?, ?)",
    "current",
    timer.id,
    timer.startAt.toISOString(),
  );
}

export async function clearStoredSleepTimer(): Promise<void> {
  const db = await database();
  await db.runAsync("DELETE FROM active_sleep_timer WHERE singleton_key = ?", "current");
}
