/**
 * PowerSync database + Supabase backend connector.
 * Local SQLite is the source of truth; this connects it to Supabase using
 * the end-user JWT (so backend RLS + the sync-rules buckets apply) and
 * flushes the local write queue to Postgres.
 *
 * Requires the PowerSync React Native SDK and its native OP-SQLite peer:
 *   npx expo install @powersync/react-native @op-engineering/op-sqlite
 */
import {
  PowerSyncDatabase,
  UpdateType,
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
} from "@powersync/react-native";
import { AppSchema } from "./schema";
import { getSupabase } from "../lib/supabase";
import { env } from "../config/env";
import { addBreadcrumb, captureError } from "../lib/crashReporting";
import {
  INITIAL_SYNC_PROJECTION,
  projectSyncStatus,
  withPendingCount,
  withPendingEventIds,
  type SyncProjection,
} from "./syncProjection";

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: "alora.db" },
});

let syncConnected = false;
let statusListenerDispose: (() => void) | null = null;
let syncProjection: SyncProjection = INITIAL_SYNC_PROJECTION;
const projectionListeners = new Set<() => void>();

function publishSyncProjection(next: SyncProjection) {
  syncProjection = next;
  projectionListeners.forEach((listener) => listener());
}

export function getSyncProjection(): SyncProjection {
  return syncProjection;
}

export function subscribeSyncProjection(listener: () => void): () => void {
  projectionListeners.add(listener);
  return () => projectionListeners.delete(listener);
}

async function refreshPendingCount() {
  try {
    const queue = await db.getUploadQueueStats();
    publishSyncProjection(withPendingCount(syncProjection, queue.count));
  } catch {
    // The queue is unavailable while the native database is opening. The
    // current projection remains useful and will refresh on the next status.
  }
}

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

    publishSyncProjection(
      withPendingEventIds(
        { ...syncProjection, uploading: true, error: null },
        tx.crud.filter((entry) => entry.table === "baby_events").map((entry) => entry.id),
      ),
    );
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
        publishSyncProjection({ ...syncProjection, uploading: false, error: "upload" });
        throw error; // leaves the tx for retry with backoff
      }
    }
    await tx.complete();
    publishSyncProjection({ ...syncProjection, uploading: false, error: null, pendingEventIds: [] });
    await refreshPendingCount();
    syncLog("sync.upload.completed", { ops: tx.crud.length });
  }
}

/** Call once after the user is signed in (e.g. in an effect on the tabs layout). */
export async function startSync() {
  if (syncConnected) return;
  syncLog("sync.started");
  publishSyncProjection({ ...INITIAL_SYNC_PROJECTION, connection: "connecting" });
  try {
    await db.init();
    statusListenerDispose?.();
    statusListenerDispose = db.registerListener({
      statusChanged: (status) => {
        publishSyncProjection(projectSyncStatus(status, syncProjection.pendingCount));
        void refreshPendingCount();
      },
    });
    await db.connect(new SupabaseConnector());
    syncConnected = true;
    publishSyncProjection(projectSyncStatus(db.currentStatus, syncProjection.pendingCount));
    await refreshPendingCount();
    syncLog("sync.connected");
  } catch (err) {
    syncConnected = false;
    statusListenerDispose?.();
    statusListenerDispose = null;
    publishSyncProjection({ ...syncProjection, connection: "offline", error: "connection" });
    syncFailure("sync.failed", err);
    throw err;
  }
}

export async function stopSync() {
  if (!syncConnected) return;
  syncLog("sync.stopping");
  try {
    await db.disconnectAndClear();
    syncLog("sync.stopped");
  } finally {
    syncConnected = false;
    statusListenerDispose?.();
    statusListenerDispose = null;
    publishSyncProjection(INITIAL_SYNC_PROJECTION);
  }
}
