import {
  INITIAL_SYNC_PROJECTION,
  projectSyncStatus,
  withPendingCount,
  withPendingEventIds,
} from "../../powersync/syncProjection";

describe("sync projection", () => {
  it("distinguishes connecting, connected, and offline states", () => {
    expect(projectSyncStatus({ connecting: true }, 0).connection).toBe("connecting");
    expect(projectSyncStatus({ connected: true, hasSynced: true }, 0)).toMatchObject({
      connection: "connected",
      initialSyncComplete: true,
    });
    expect(projectSyncStatus({ downloadError: new Error("secret details") }, 2)).toMatchObject({
      connection: "offline",
      pendingCount: 2,
      error: expect.stringContaining("Sync needs attention"),
    });
  });

  it("never exposes provider error text and keeps pending counts non-negative", () => {
    const projection = withPendingCount(INITIAL_SYNC_PROJECTION, -4);
    expect(projection.pendingCount).toBe(0);
    expect(withPendingEventIds(projection, ["event-1", "event-1"]).pendingEventIds).toEqual(["event-1"]);
    expect(JSON.stringify(projectSyncStatus({ uploadError: new Error("token=secret") }, 1))).not.toContain("secret");
  });
});
