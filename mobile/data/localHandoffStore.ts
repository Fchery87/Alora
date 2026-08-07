import * as SQLite from "expo-sqlite";

/**
 * The shift-handoff marker: when the current caregiver started their shift.
 * Stored locally (device-level preference, like the sleep timer); the brief
 * card on Home reads it to say what happened "since the last handoff".
 */
interface StoredRow {
  started_at: string | null;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("alora-local.db").then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS handoff_marker (
          singleton_key TEXT PRIMARY KEY NOT NULL,
          started_at TEXT NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function getStoredHandoff(): Promise<Date | null> {
  const db = await database();
  const row = await db.getFirstAsync<StoredRow>(
    "SELECT started_at FROM handoff_marker WHERE singleton_key = ?",
    "current",
  );
  if (!row?.started_at) return null;
  const at = new Date(row.started_at);
  return Number.isNaN(at.getTime()) ? null : at;
}

export async function saveStoredHandoff(startedAt: Date): Promise<void> {
  const db = await database();
  await db.runAsync(
    "INSERT OR REPLACE INTO handoff_marker (singleton_key, started_at) VALUES (?, ?)",
    "current",
    startedAt.toISOString(),
  );
}
