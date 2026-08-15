export type SyncProjection = {
  connection: "offline" | "connecting" | "connected";
  initialSyncComplete: boolean;
  uploading: boolean;
  pendingCount: number;
  pendingEventIds: string[];
  lastSyncedAt: string | null;
  error: string | null;
};

export type SyncStatusSnapshot = {
  connected?: boolean;
  connecting?: boolean;
  hasSynced?: boolean;
  uploading?: boolean;
  lastSyncedAt?: Date;
  downloadError?: unknown;
  uploadError?: unknown;
};

export const INITIAL_SYNC_PROJECTION: SyncProjection = {
  connection: "offline",
  initialSyncComplete: false,
  uploading: false,
  pendingCount: 0,
  pendingEventIds: [],
  lastSyncedAt: null,
  error: null,
};

function safeError(error: unknown): string | null {
  return error ? "Sync needs attention. Your changes remain on this device and will retry." : null;
}

export function projectSyncStatus(status: SyncStatusSnapshot, pendingCount: number): SyncProjection {
  return {
    connection: status.connected ? "connected" : status.connecting ? "connecting" : "offline",
    initialSyncComplete: status.hasSynced === true,
    uploading: status.uploading === true,
    pendingCount: Math.max(0, pendingCount),
    pendingEventIds: [],
    lastSyncedAt: status.lastSyncedAt?.toISOString() ?? null,
    error: safeError(status.downloadError ?? status.uploadError),
  };
}

export function withPendingCount(projection: SyncProjection, pendingCount: number): SyncProjection {
  return { ...projection, pendingCount: Math.max(0, pendingCount) };
}

export function withPendingEventIds(projection: SyncProjection, ids: string[]): SyncProjection {
  return {
    ...projection,
    pendingEventIds: [...new Set(ids)],
    pendingCount: Math.max(projection.pendingCount, ids.length),
  };
}
