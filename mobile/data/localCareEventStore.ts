import * as SQLite from "expo-sqlite";
import type { CareEvent } from "./repository";

export interface StoredCareEvent extends CareEvent {
  deletedAt: Date | null;
}

interface StoredCareEventRow {
  id: string;
  type: CareEvent["type"];
  subtype: string;
  by: string;
  by_initial: string;
  at: string;
  end_at: string | null;
  detail: string | null;
  sync: CareEvent["sync"];
  duplicate_of: string | null;
  deleted_at: string | null;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("alora-local.db").then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS care_events (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          subtype TEXT NOT NULL,
          by TEXT NOT NULL,
          by_initial TEXT NOT NULL,
          at TEXT NOT NULL,
          end_at TEXT,
          detail TEXT,
          sync TEXT NOT NULL,
          duplicate_of TEXT,
          deleted_at TEXT
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toStoredCareEventRow(event: CareEvent, deletedAt: Date | null): StoredCareEventRow {
  return {
    id: event.id,
    type: event.type,
    subtype: event.subtype,
    by: event.by,
    by_initial: event.byInitial,
    at: event.at.toISOString(),
    end_at: event.endAt?.toISOString() ?? null,
    detail: event.detail ?? null,
    sync: event.sync,
    duplicate_of: event.duplicateOf ?? null,
    deleted_at: deletedAt?.toISOString() ?? null,
  };
}

function fromStoredCareEventRow(row: StoredCareEventRow): StoredCareEvent | null {
  const at = parseDate(row.at);
  if (!at) return null;
  const endAt = parseDate(row.end_at);
  const deletedAt = parseDate(row.deleted_at);
  return {
    id: row.id,
    type: row.type,
    subtype: row.subtype,
    by: row.by,
    byInitial: row.by_initial,
    at,
    endAt: endAt ?? undefined,
    detail: row.detail ?? undefined,
    sync: row.sync,
    duplicateOf: row.duplicate_of ?? undefined,
    deletedAt,
  };
}

export async function getStoredCareEvents(): Promise<StoredCareEvent[]> {
  const db = await database();
  const rows = await db.getAllAsync<StoredCareEventRow>(
    "SELECT id, type, subtype, by, by_initial, at, end_at, detail, sync, duplicate_of, deleted_at FROM care_events",
  );
  return rows.flatMap((row) => {
    const event = fromStoredCareEventRow(row);
    return event ? [event] : [];
  });
}

export async function saveStoredCareEvent(event: CareEvent, deletedAt: Date | null = null): Promise<void> {
  const db = await database();
  const row = toStoredCareEventRow(event, deletedAt);
  await db.runAsync(
    `INSERT OR REPLACE INTO care_events
      (id, type, subtype, by, by_initial, at, end_at, detail, sync, duplicate_of, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    row.id,
    row.type,
    row.subtype,
    row.by,
    row.by_initial,
    row.at,
    row.end_at,
    row.detail,
    row.sync,
    row.duplicate_of,
    row.deleted_at,
  );
}
