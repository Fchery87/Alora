import * as SQLite from "expo-sqlite";

/**
 * Baby sex for WHO growth reference curves (the babies table has no sex
 * column at MVP; growth charts ask once and remember the choice locally).
 */
export type BabySexChoice = "boy" | "girl";

interface StoredRow {
  sex: string | null;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("alora-local.db").then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS baby_sex (
          singleton_key TEXT PRIMARY KEY NOT NULL,
          sex TEXT
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function getStoredBabySex(): Promise<BabySexChoice | null> {
  const db = await database();
  const row = await db.getFirstAsync<StoredRow>("SELECT sex FROM baby_sex WHERE singleton_key = ?", "current");
  if (!row?.sex) return null;
  return row.sex === "boy" || row.sex === "girl" ? row.sex : null;
}

export async function saveStoredBabySex(sex: BabySexChoice): Promise<void> {
  const db = await database();
  await db.runAsync("INSERT OR REPLACE INTO baby_sex (singleton_key, sex) VALUES (?, ?)", "current", sex);
}
