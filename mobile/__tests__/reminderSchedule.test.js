const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const source = readFileSync(join(__dirname, "../lib/reminderSchedule.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleExports = {};
new Function("exports", compiled)(moduleExports);
const { reminderSchedulePlan, reminderSchedulePlans } = moduleExports;

test("uses repeating triggers when quiet hours are off", () => {
  assert.deepEqual(reminderSchedulePlan("feed", false), { kind: "timeInterval", seconds: 10800, repeats: true });
  assert.deepEqual(reminderSchedulePlan("diaper", false), { kind: "timeInterval", seconds: 10800, repeats: true });
  assert.deepEqual(reminderSchedulePlan("bedtime", false), { kind: "daily", hour: 20, minute: 30 });
});

test("uses indefinite daily allowed-hour slots when quiet hours are on", () => {
  assert.deepEqual(reminderSchedulePlans("feed", true), [
    { kind: "daily", hour: 6, minute: 0 },
    { kind: "daily", hour: 9, minute: 0 },
    { kind: "daily", hour: 12, minute: 0 },
    { kind: "daily", hour: 15, minute: 0 },
    { kind: "daily", hour: 18, minute: 0 },
    { kind: "daily", hour: 21, minute: 0 },
  ]);
});

test("keeps bedtime as a daily reminder with quiet hours enabled", () => {
  assert.deepEqual(reminderSchedulePlan("bedtime", true), { kind: "daily", hour: 20, minute: 30 });
});
