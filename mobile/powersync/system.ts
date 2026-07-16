/**
 * PowerSync database + Supabase backend connector.
 * Local SQLite is the source of truth; this connects it to Supabase using
 * the end-user JWT (so backend RLS + the sync-rules buckets apply) and
 * flushes the local write queue to Postgres.
 *
 * INERT until you install: npx expo install @powersync/react-native @powersync/op-sqlite
 */
import {
  PowerSyncDatabase,
  UpdateType,
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
} from "@powersync/react-native";
import { OPSqliteOpenFactory } from "@powersync/op-sqlite";
import { AppSchema } from "./schema";
import { getSupabase } from "../lib/supabase";
import { env } from "../config/env";

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: new OPSqliteOpenFactory({ dbFilename: "alora.db" }),
});

class SupabaseConnector implements PowerSyncBackendConnector {
  /** Hand PowerSync the user's Supabase access token + the instance endpoint. */
  async fetchCredentials() {
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) return null;
    return { endpoint: env.powersyncUrl, token: data.session.access_token };
  }

  /** Flush the local write queue to Supabase. Last-write-wins per row;
   *  duplicate *creates* are preserved (both rows upsert) per the conflict rules. */
  async uploadData(database: AbstractPowerSyncDatabase) {
    const tx = await database.getNextCrudTransaction();
    if (!tx) return;

    const supabase = getSupabase();
    for (const op of tx.crud) {
      const table = supabase.from(op.table);
      let error;
      if (op.op === UpdateType.PUT) {
        ({ error } = await table.upsert({ id: op.id, ...op.opData }));
      } else if (op.op === UpdateType.PATCH) {
        ({ error } = await table.update(op.opData ?? {}).eq("id", op.id));
      } else if (op.op === UpdateType.DELETE) {
        ({ error } = await table.delete().eq("id", op.id));
      }
      if (error) throw error; // leaves the tx for retry with backoff
    }
    await tx.complete();
  }
}

/** Call once after the user is signed in (e.g. in an effect on the tabs layout). */
export async function startSync() {
  await db.init();
  await db.connect(new SupabaseConnector());
}

export async function stopSync() {
  await db.disconnectAndClear();
}
