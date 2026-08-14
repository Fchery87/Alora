const assert = require("node:assert/strict");
const { jest, test } = require("@jest/globals");

let mockDb;
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: async () => mockDb,
}));

function loadStore(initialRows = []) {
  const rows = new Map(initialRows.map((row) => [row.id, { ...row }]));
  const db = {
    execAsync: async () => undefined,
    getAllAsync: async () => [...rows.values()].map((row) => ({ ...row })),
    runAsync: async (_sql, id, type, subtype, by, byInitial, at, endAt, detail, sync, duplicateOf, deletedAt) => {
      rows.set(id, {
        id,
        type,
        subtype,
        by,
        by_initial: byInitial,
        at,
        end_at: endAt,
        detail,
        sync,
        duplicate_of: duplicateOf,
        deleted_at: deletedAt,
      });
    },
  };
  mockDb = db;
  let moduleExports;
  jest.isolateModules(() => {
    moduleExports = require("../data/localCareEventStore");
  });
  return moduleExports;
}

test("round trips stored care events with optional fields", async () => {
  const { saveStoredCareEvent, getStoredCareEvents } = loadStore();
  const event = {
    id: "local-99",
    type: "feed",
    subtype: "Bottle",
    by: "You",
    byInitial: "Y",
    at: new Date("2026-01-01T10:00:00.000Z"),
    endAt: new Date("2026-01-01T10:20:00.000Z"),
    detail: "120 ml · 20 min",
    sync: "pending",
    duplicateOf: "e3",
  };

  await saveStoredCareEvent(event);

  assert.deepEqual(await getStoredCareEvents(), [{ ...event, deletedAt: null }]);
});

test("persists soft-delete timestamps with stored events", async () => {
  const { saveStoredCareEvent, getStoredCareEvents } = loadStore();
  const deletedAt = new Date("2026-01-02T12:00:00.000Z");
  const event = {
    id: "local-100",
    type: "diaper",
    subtype: "Wet",
    by: "You",
    byInitial: "Y",
    at: new Date("2026-01-02T11:30:00.000Z"),
    sync: "edited",
  };

  await saveStoredCareEvent(event, deletedAt);

  assert.deepEqual(await getStoredCareEvents(), [
    { ...event, endAt: undefined, detail: undefined, duplicateOf: undefined, deletedAt },
  ]);
});

test("ignores rows with invalid primary timestamps", async () => {
  const { getStoredCareEvents } = loadStore([
    {
      id: "broken",
      type: "sleep",
      subtype: "Nap",
      by: "You",
      by_initial: "Y",
      at: "not-a-date",
      end_at: null,
      detail: null,
      sync: "pending",
      duplicate_of: null,
      deleted_at: null,
    },
  ]);

  assert.deepEqual(await getStoredCareEvents(), []);
});
