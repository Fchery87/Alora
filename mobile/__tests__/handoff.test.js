// Shift-handoff briefing computation (lib/handoff.ts).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

function loadTsModule(filePath, mockRequire = {}) {
  const source = readFileSync(filePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleExports = {};
  new Function("exports", "require", compiled)(moduleExports, (name) => {
    if (mockRequire[name]) return mockRequire[name];
    throw new Error(`Unexpected module: ${name}`);
  });
  return moduleExports;
}

const { buildHandoffBrief } = loadTsModule(join(__dirname, "../lib/handoff.ts"));

const now = new Date("2026-08-07T12:00:00Z");
const ev = (id, type, atMinutesAgo, extra = {}) => ({
  id,
  type,
  subtype: "Bottle",
  by: "You",
  byInitial: "Y",
  at: new Date(now.getTime() - atMinutesAgo * 60_000),
  sync: "synced",
  ...extra,
});

test("with no marker, the window falls back to the last 24 hours", () => {
  const brief = buildHandoffBrief([ev("old", "feed", 60 * 25), ev("recent", "feed", 60 * 2)], null, now);
  assert.equal(brief.eventsSince, 1);
  assert.equal(brief.lastFeed?.id, "recent");
});

test("marker filters to events logged after the handoff", () => {
  const marker = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const brief = buildHandoffBrief(
    [
      ev("before", "feed", 60 * 5 * 60), // 5h ago — before marker
      ev("after-feed", "feed", 60 * 2),
      ev("after-diaper", "diaper", 60 * 1),
    ],
    marker,
    now,
  );
  assert.equal(brief.eventsSince, 2);
  assert.equal(brief.lastFeed?.id, "after-feed");
  assert.equal(brief.lastDiaper?.id, "after-diaper");
  assert.ok(brief.marker instanceof Date);
});

test("an open sleep event surfaces in the briefing", () => {
  const marker = new Date(now.getTime() - 60 * 60 * 1000);
  const brief = buildHandoffBrief([ev("nap", "sleep", 45, { endAt: undefined })], marker, now);
  assert.equal(brief.openSleep?.id, "nap");
});

test("a closed sleep event does not surface as open sleep", () => {
  const marker = new Date(now.getTime() - 60 * 60 * 1000);
  const brief = buildHandoffBrief(
    [ev("nap", "sleep", 60 * 4, { endAt: new Date(now.getTime() - 60 * 3 * 60 * 1000) })],
    marker,
    now,
  );
  assert.equal(brief.openSleep, undefined);
});

test("empty timeline yields an empty briefing without crashing", () => {
  const brief = buildHandoffBrief([], null, now);
  assert.equal(brief.eventsSince, 0);
  assert.equal(brief.lastFeed, undefined);
  assert.equal(brief.lastDiaper, undefined);
});
