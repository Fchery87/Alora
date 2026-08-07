/**
 * Repository contract test suite.
 *
 * One behavioral contract suite that any AloraRepository implementation must
 * satisfy, parameterized over the adapter under test. The same assertions run
 * against both:
 *   - mockRepository      (in-memory + local-store mocks)
 *   - supabaseRepository  (the live adapter, backed by a faithful in-memory
 *                          fake of the PowerSync local SQLite — same query
 *                          shapes, same row semantics)
 *
 * The PowerSync native modules are NOT installed in CI (they arrive with
 * backend provisioning), so both adapters are loaded via the transpile-in-Node
 * pattern used by the other suites, with native deps mocked.
 *
 * Also tests standalone functions like detectDuplicates.
 */
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

// ---------------------------------------------------------------------------
// Helpers: transpile + load a TypeScript module
// ---------------------------------------------------------------------------
function loadTsModule(filePath, mockRequire = {}) {
  const source = readFileSync(filePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleExports = {};
  const requireMock = (name) => {
    if (mockRequire[name]) return mockRequire[name];
    throw new Error(`Unexpected module: ${name}`);
  };
  new Function("exports", "require", compiled)(moduleExports, requireMock);
  return moduleExports;
}

// ---------------------------------------------------------------------------
// Load the repository module (just the interface + helpers, not impl)
// ---------------------------------------------------------------------------
const repoModule = loadTsModule(join(__dirname, "../data/repository.ts"));

// ---------------------------------------------------------------------------
// Load mock.ts data module first (needed by mockRepository)
// ---------------------------------------------------------------------------
const mockModule = loadTsModule(join(__dirname, "../data/mock.ts"));

// ---------------------------------------------------------------------------
// mockRepository, with local store mocks
// ---------------------------------------------------------------------------
function loadMockRepository() {
  const careEvents = new Map();
  const sleepTimer = { current: null };
  const reminderPrefs = { current: [] };

  const storeMocks = {
    "./repository": repoModule,
    "./mock": mockModule,
    "./localCareEventStore": {
      getStoredCareEvents: async () => {
        const rows = [];
        for (const [, val] of careEvents) rows.push({ ...val });
        return rows;
      },
      saveStoredCareEvent: async (event, deletedAt) => {
        careEvents.set(event.id, { ...event, deletedAt: deletedAt || null });
      },
    },
    "./localSleepTimerStore": {
      getStoredSleepTimer: async () => sleepTimer.current,
      saveStoredSleepTimer: async (t) => {
        sleepTimer.current = t;
      },
      clearStoredSleepTimer: async () => {
        sleepTimer.current = null;
      },
    },
    "./localReminderPreferenceStore": {
      getStoredReminderPreferences: async () => [...reminderPrefs.current],
      saveStoredReminderPreference: async (pref) => {
        const idx = reminderPrefs.current.findIndex((p) => p.kind === pref.kind);
        if (idx >= 0) reminderPrefs.current[idx] = pref;
        else reminderPrefs.current.push(pref);
      },
    },
  };

  return loadTsModule(join(__dirname, "../data/mockRepository.ts"), storeMocks).mockRepository;
}

// ---------------------------------------------------------------------------
// supabaseRepository, backed by a fake PowerSync local SQLite
// ---------------------------------------------------------------------------
// The live adapter issues a small, regular set of SQL shapes (single-table
// SELECT/INSERT/UPDATE with ?, IS NULL / IS NOT NULL and datetime('now')
// comparisons; ORDER BY / LIMIT / OFFSET). This fake implements exactly that
// subset over in-memory tables, so the contract suite exercises the adapter's
// real query logic without the PowerSync native modules.
function createFakePowerSyncDb(seed = {}) {
  const tables = new Map();
  for (const [name, rows] of Object.entries(seed)) {
    tables.set(
      name,
      rows.map((r) => ({ ...r })),
    );
  }

  const norm = (s) => s.replace(/\s+/g, " ").trim();

  function parseConditions(whereSql, params, state) {
    const conds = [];
    if (!whereSql) return conds;
    for (const raw of whereSql.split(" AND ")) {
      const c = raw.trim();
      let m = c.match(/^(\w+)\s*=\s*\?$/);
      if (m) {
        conds.push({ col: m[1], op: "=", val: params[state.i++] });
        continue;
      }
      m = c.match(/^(\w+)\s*=\s*'([^']*)'$/);
      if (m) {
        conds.push({ col: m[1], op: "=", val: m[2] });
        continue;
      }
      m = c.match(/^(\w+)\s+IS\s+(NOT\s+)?NULL$/);
      if (m) {
        conds.push({ col: m[1], op: m[2] ? "isnotnull" : "isnull" });
        continue;
      }
      m = c.match(/^(\w+)\s+>\s+datetime\('now'\)$/);
      if (m) {
        conds.push({ col: m[1], op: "gt", val: new Date().toISOString() });
        continue;
      }
      throw new Error(`Unsupported WHERE condition in test fixture: ${c}`);
    }
    return conds;
  }

  function matches(row, conds) {
    return conds.every((c) => {
      const v = row[c.col];
      switch (c.op) {
        case "=":
          return v === c.val;
        case "isnull":
          return v === null || v === undefined;
        case "isnotnull":
          return v !== null && v !== undefined;
        case "gt":
          return v != null && String(v) > String(c.val);
        default:
          return false;
      }
    });
  }

  function run(sql, params = []) {
    const state = { i: 0 };
    sql = norm(sql);

    if (sql.startsWith("INSERT INTO")) {
      const m = sql.match(/^INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\)$/);
      if (!m) throw new Error(`Unsupported INSERT in test fixture: ${sql}`);
      const cols = m[2].split(",").map((s) => s.trim());
      const vals = m[3].split(",").map((s) => s.trim());
      const row = {};
      for (let k = 0; k < cols.length; k++) {
        const v = vals[k];
        row[cols[k]] = v === "?" ? params[state.i++] : v.replace(/^'(.*)'$/, "$1");
      }
      tables.get(m[1]).push(row);
      return {};
    }

    if (sql.startsWith("UPDATE ")) {
      const m = sql.match(/^UPDATE (\w+) SET (.+) WHERE (.+)$/);
      if (!m) throw new Error(`Unsupported UPDATE in test fixture: ${sql}`);
      const setCols = m[2]
        .split(",")
        .map((s) => s.trim())
        .map((s) => {
          const mm = s.match(/^(\w+)\s*=\s*\?$/);
          if (!mm) throw new Error(`Unsupported SET clause in test fixture: ${s}`);
          return mm[1];
        });
      const updates = {};
      for (const col of setCols) updates[col] = params[state.i++];
      const conds = parseConditions(m[3], params, state);
      for (const row of tables.get(m[1])) if (matches(row, conds)) Object.assign(row, updates);
      return {};
    }

    const m = sql.match(
      /^SELECT (.+) FROM (\w+)(?: WHERE (.+?))?(?: ORDER BY (\w+) (ASC|DESC))?(?: LIMIT (\d+|\?))?(?: OFFSET (\d+|\?))?$/,
    );
    if (!m) throw new Error(`Unsupported SELECT in test fixture: ${sql}`);
    const [, colsSql, table, whereSql, orderCol, orderDir, limitSql, offsetSql] = m;
    const conds = parseConditions(whereSql, params, state);

    let rows = tables.get(table).filter((r) => matches(r, conds));

    if (orderCol) {
      rows = [...rows].sort((a, b) => {
        const av = a[orderCol];
        const bv = b[orderCol];
        if (av == null && bv == null) return 0;
        if (av == null) return orderDir === "DESC" ? 1 : -1;
        if (bv == null) return orderDir === "DESC" ? -1 : 1;
        const cmp = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
        return orderDir === "DESC" ? -cmp : cmp;
      });
    }

    const limit = limitSql === "?" ? Number(params[state.i++]) : limitSql ? Number(limitSql) : undefined;
    const offset = offsetSql === "?" ? Number(params[state.i++]) : offsetSql ? Number(offsetSql) : undefined;
    if (offset) rows = rows.slice(offset);
    if (limit !== undefined) rows = rows.slice(0, limit);

    const cols = colsSql === "*" ? null : colsSql.split(",").map((s) => s.trim());
    return rows.map((r) => (cols ? Object.fromEntries(cols.map((c) => [c, r[c]])) : { ...r }));
  }

  return {
    getAll: async (sql, params) => run(sql, params),
    getOptional: async (sql, params) => run(sql, params)[0] ?? null,
    getFirst: async (sql, params) => run(sql, params)[0] ?? null,
    execute: async (sql, params) => run(sql, params),
  };
}

function loadSupabaseRepository() {
  const now = Date.now();
  const seed = {
    family_members: [
      {
        user_id: "test-user",
        family_id: "family-1",
        role: "owner",
        display_name: "Test Parent",
        joined_at: new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: "partner-user",
        family_id: "family-1",
        role: "partner",
        display_name: "Partner Person",
        joined_at: new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    babies: [
      {
        id: "baby-1",
        family_id: "family-1",
        name: "Maya",
        birth_date: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        created_at: new Date(now - 60 * 60 * 1000).toISOString(),
      },
    ],
    baby_events: [],
    event_edits: [],
    reminders: [
      {
        id: "rem-feed",
        family_id: "family-1",
        kind: "feed",
        config: '{"label":"Feed reminder","schedule":"Every 2–3h"}',
        enabled: 1,
        created_at: new Date(now).toISOString(),
      },
      {
        id: "rem-quiet",
        family_id: "family-1",
        kind: "quietHours",
        config: '{"label":"Quiet hours","schedule":"10pm–6am"}',
        enabled: 0,
        created_at: new Date(now).toISOString(),
      },
    ],
    notification_preferences: [],
    parent_check_ins: [],
    parent_reflections: [],
    support_resources: [
      {
        id: "res-1",
        region: "US",
        title: "Postpartum Support",
        subtitle: "Free confidential line",
        phone: "1-800-555-0100",
        url: null,
        sort: 1,
      },
      {
        id: "res-2",
        region: "US",
        title: "Crisis Text Line",
        subtitle: "Text HOME",
        phone: null,
        url: "https://example.test/crisis",
        sort: 2,
      },
    ],
    invitation_tokens: [],
    audit_logs: [
      {
        id: "audit-1",
        family_id: "family-1",
        actor_id: "test-user",
        action: "fixture.setup",
        detail: "{}",
        created_at: new Date(now).toISOString(),
      },
    ],
    subscription_status: [],
  };

  const db = createFakePowerSyncDb(seed);
  const getSupabase = () => ({
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "test-user" } } } }),
    },
    functions: {
      invoke: async () => ({ error: null }),
    },
  });

  return loadTsModule(join(__dirname, "../data/supabaseRepository.ts"), {
    "../powersync/system": { db },
    "../lib/supabase": { getSupabase },
    "./repository": repoModule,
    "./mock": {},
  }).supabaseRepository;
}

// ---------------------------------------------------------------------------
// The contract suite — parameterized over the adapter under test
// ---------------------------------------------------------------------------
function runRepositoryContractTests(repo, label) {
  test(`${label}: getTimeline returns events sorted newest-first`, async () => {
    const events = await repo.getTimeline();
    assert.ok(Array.isArray(events));
    for (let i = 1; i < events.length; i++) {
      assert.ok(events[i - 1].at.getTime() >= events[i].at.getTime(), "events must be sorted newest-first");
    }
  });

  test(`${label}: getBabyStatus returns baby profile and derived state`, async () => {
    const status = await repo.getBabyStatus();
    assert.ok(typeof status.name === "string");
    assert.ok(typeof status.ageLabel === "string");
    assert.ok(typeof status.asleep === "boolean");
    if (status.asleep) {
      assert.ok(status.asleepSince instanceof Date);
    }
  });

  test(`${label}: getRecentActivity respects limit`, async () => {
    const events = await repo.getRecentActivity(2);
    assert.ok(events.length <= 2);
  });

  test(`${label}: createEvent returns an id and adds to timeline`, async () => {
    const before = await repo.getTimeline();
    const id = await repo.createEvent({ type: "feed", subtype: "Bottle" });
    assert.ok(typeof id === "string");
    const after = await repo.getTimeline();
    assert.ok(after.length > before.length);
    assert.ok(after.some((e) => e.id === id));
  });

  test(`${label}: startSleep creates an open-ended sleep event`, async () => {
    const id = await repo.startSleep();
    assert.ok(typeof id === "string");
    const events = await repo.getTimeline();
    const sleep = events.find((e) => e.id === id);
    assert.ok(sleep);
    assert.strictEqual(sleep.type, "sleep");
    assert.strictEqual(sleep.endAt, undefined);
  });

  test(`${label}: stopSleep sets endAt on a sleep event`, async () => {
    const id = await repo.startSleep();
    const endAt = new Date();
    await repo.stopSleep(id, endAt);
    const events = await repo.getTimeline();
    const sleep = events.find((e) => e.id === id);
    assert.ok(sleep);
    assert.ok(sleep.endAt instanceof Date);
  });

  test(`${label}: updateEvent applies a patch`, async () => {
    const id = await repo.createEvent({ type: "diaper", subtype: "Wet" });
    await repo.updateEvent(id, { subtype: "Dirty" });
    const events = await repo.getTimeline();
    const updated = events.find((e) => e.id === id);
    assert.ok(updated);
    assert.strictEqual(updated.subtype, "Dirty");
  });

  test(`${label}: softDeleteEvent removes event from timeline`, async () => {
    const id = await repo.createEvent({ type: "diaper", subtype: "Wet" });
    await repo.softDeleteEvent(id);
    const events = await repo.getTimeline();
    assert.ok(!events.some((e) => e.id === id));
  });

  test(`${label}: createCheckIn stores mood and reflection`, async () => {
    const id = await repo.createCheckIn({ mood: "good", reflection: "Feeling better today." });
    assert.ok(typeof id === "string");
  });

  test(`${label}: setReminder updates preference`, async () => {
    await repo.setReminder("feed", { label: "Feed", schedule: "Every 2h" }, true);
    const prefs = await repo.getReminderPreferences();
    const feed = prefs.find((p) => p.kind === "feed");
    assert.ok(feed);
    assert.strictEqual(feed.enabled, true);
    assert.strictEqual(feed.config.label, "Feed");
  });

  test(`${label}: generateInvite returns an active invite code`, async () => {
    const invite = await repo.generateInvite();
    assert.ok(invite.code.length > 0);
    assert.strictEqual(invite.revoked, false);
    assert.ok(invite.expiresAt > new Date());
  });

  test(`${label}: revokeInvite marks invite as revoked`, async () => {
    await repo.generateInvite();
    const revoked = await repo.revokeInvite();
    assert.strictEqual(revoked.revoked, true);
  });

  test(`${label}: exportMyData returns complete structured export`, async () => {
    const data = await repo.exportMyData();
    assert.ok(data.exportedAt instanceof Date);
    assert.ok(typeof data.baby.name === "string");
    assert.ok(Array.isArray(data.events));
    assert.ok(Array.isArray(data.checkIns));
    assert.ok(Array.isArray(data.reminderPreferences));
  });

  test(`${label}: saveBabyProfile updates the baby name`, async () => {
    await repo.saveBabyProfile({ name: "Test Baby", ageLabel: "0-3 mo" });
    const status = await repo.getBabyStatus();
    assert.strictEqual(status.name, "Test Baby");
  });

  test(`${label}: getReminderPreferences returns all reminders`, async () => {
    const prefs = await repo.getReminderPreferences();
    assert.ok(Array.isArray(prefs));
    const kinds = new Set(prefs.map((p) => p.kind));
    assert.ok(kinds.has("quietHours") || kinds.has("feed"));
    for (const p of prefs) {
      assert.ok(typeof p.kind === "string");
      assert.ok(typeof p.enabled === "boolean");
      assert.ok(typeof p.config.label === "string");
      assert.ok(typeof p.config.schedule === "string");
    }
  });

  test(`${label}: getSupportResources returns curated list`, async () => {
    const resources = await repo.getSupportResources();
    assert.ok(Array.isArray(resources));
    assert.ok(resources.length > 0);
    for (const r of resources) {
      assert.ok(typeof r.id === "string");
      assert.ok(typeof r.title === "string");
      assert.ok(typeof r.description === "string");
      assert.ok(typeof r.actionLabel === "string");
    }
  });

  test(`${label}: getAuditLog returns audit entries`, async () => {
    const log = await repo.getAuditLog();
    assert.ok(Array.isArray(log));
    for (const entry of log) {
      assert.ok(typeof entry.id === "string");
      assert.ok(typeof entry.action === "string");
      assert.ok(typeof entry.actor === "string");
      assert.ok(entry.at instanceof Date);
    }
  });

  test(`${label}: getInvite returns an invite object`, async () => {
    const invite = await repo.getInvite();
    assert.ok(typeof invite.code === "string");
    assert.ok(typeof invite.revoked === "boolean");
    assert.ok(invite.expiresAt instanceof Date);
  });

  test(`${label}: getFamilyMembers returns members with roles and self flag`, async () => {
    const members = await repo.getFamilyMembers();
    assert.ok(Array.isArray(members));
    assert.ok(members.length >= 1);
    const self = members.find((m) => m.isSelf);
    assert.ok(self, "exactly one member is the current user");
    assert.ok(self.role === "owner" || self.role === "partner");
    assert.ok(self.joinedAt instanceof Date);
    for (const m of members) {
      assert.ok(typeof m.displayName === "string");
      assert.ok(m.displayName.length > 0);
      assert.ok(typeof m.userId === "string");
    }
  });

  test(`${label}: deleteAccount does not throw`, async () => {
    await repo.deleteAccount();
    // Calling again should be idempotent
    await repo.deleteAccount();
  });
}

// Run the identical contract suite against every adapter.
runRepositoryContractTests(loadMockRepository(), "mockRepository");
runRepositoryContractTests(loadSupabaseRepository(), "supabaseRepository");

// ---------------------------------------------------------------------------
// Duplicate detection (standalone function from repository.ts)
// ---------------------------------------------------------------------------

const { detectDuplicates } = repoModule;

test("detectDuplicates flags same-type overlapping events from different caregivers", () => {
  const base = new Date("2026-06-01T12:00:00Z");
  const events = [
    { id: "a", type: "feed", subtype: "Bottle", by: "You", byInitial: "Y", at: base, sync: "synced" },
    {
      id: "b",
      type: "feed",
      subtype: "Bottle",
      by: "Sam",
      byInitial: "S",
      at: new Date(base.getTime() + 5 * 60_000),
      sync: "synced",
    },
  ];
  const result = detectDuplicates(events);
  const b = result.find((e) => e.id === "b");
  assert.strictEqual(b.duplicateOf, "a");
});

test("detectDuplicates does not flag same-caregiver events", () => {
  const base = new Date("2026-06-01T12:00:00Z");
  const events = [
    { id: "a", type: "feed", subtype: "Bottle", by: "You", byInitial: "Y", at: base, sync: "synced" },
    {
      id: "b",
      type: "feed",
      subtype: "Breast",
      by: "You",
      byInitial: "Y",
      at: new Date(base.getTime() + 2 * 60_000),
      sync: "synced",
    },
  ];
  const result = detectDuplicates(events);
  const b = result.find((e) => e.id === "b");
  assert.strictEqual(b.duplicateOf, undefined);
});

test("detectDuplicates does not flag events outside the 15-minute window", () => {
  const base = new Date("2026-06-01T12:00:00Z");
  const events = [
    { id: "a", type: "feed", subtype: "Bottle", by: "You", byInitial: "Y", at: base, sync: "synced" },
    {
      id: "b",
      type: "feed",
      subtype: "Breast",
      by: "Sam",
      byInitial: "S",
      at: new Date(base.getTime() + 20 * 60_000),
      sync: "synced",
    },
  ];
  const result = detectDuplicates(events);
  const b = result.find((e) => e.id === "b");
  assert.strictEqual(b.duplicateOf, undefined);
});

test("detectDuplicates does not flag different-type events", () => {
  const base = new Date("2026-06-01T12:00:00Z");
  const events = [
    { id: "a", type: "feed", subtype: "Bottle", by: "You", byInitial: "Y", at: base, sync: "synced" },
    {
      id: "b",
      type: "diaper",
      subtype: "Wet",
      by: "Sam",
      byInitial: "S",
      at: new Date(base.getTime() + 2 * 60_000),
      sync: "synced",
    },
  ];
  const result = detectDuplicates(events);
  const b = result.find((e) => e.id === "b");
  assert.strictEqual(b.duplicateOf, undefined);
});
