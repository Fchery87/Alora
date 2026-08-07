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
import { addBreadcrumb, captureError } from "../lib/crashReporting";

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: new OPSqliteOpenFactory({ dbFilename: "alora.db" }),
});

// Structured sync logging (PRD §Observability) — emitted as Sentry
// breadcrumbs so the sync lifecycle is observable in the crash dashboard.
function syncLog(event: string, detail?: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), component: "powersync", event, ...detail }));
  addBreadcrumb(event, "sync", detail as Record<string, string> | undefined);
}

/** Log a sync failure as an exception (surfaces in the crash dashboard). */
function syncFailure(event: string, error: unknown, detail?: Record<string, unknown>) {
  syncLog(event, { ...detail, error: String(error) });
  captureError(error instanceof Error ? error : new Error(String(error)), { event, ...detail });
}

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

    syncLog("sync.upload.started", { ops: tx.crud.length });
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
      if (error) {
        syncFailure("sync.upload.failed", error, { op: op.op, table: op.table });
        throw error; // leaves the tx for retry with backoff
      }
    }
    await tx.complete();
    syncLog("sync.upload.completed", { ops: tx.crud.length });
  }
}

/** Call once after the user is signed in (e.g. in an effect on the tabs layout). */
export async function startSync() {
  syncLog("sync.started");
  try {
    await db.init();
    await db.connect(new SupabaseConnector());
    syncLog("sync.connected");
  } catch (err) {
    syncFailure("sync.failed", err);
    throw err;
  }
}

export async function stopSync() {
  syncLog("sync.stopping");
  await db.disconnectAndClear();
  syncLog("sync.stopped");
}
