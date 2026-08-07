// Growth percentile math — WHO Child Growth Standards (LMS method).
// Exercises lib/growth/percentile.ts against the embedded WHO_LMS table.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

// Transpile + load the TS growth modules (same pattern as repository.test.js).
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

const wholmsModule = loadTsModule(join(__dirname, "../lib/growth/wholms.ts"));
const { lmsAt, percentile, valueAtPercentile, zScore, normalCdf } = loadTsModule(
  join(__dirname, "../lib/growth/percentile.ts"),
  { "./wholms": wholmsModule },
);

test("lmsAt returns the WHO birth median at 0 months", () => {
  assert.ok(Math.abs(lmsAt("weight", "boy", 0).M - 3.3464) < 1e-6);
  assert.ok(Math.abs(lmsAt("weight", "girl", 0).M - 3.2322) < 1e-6);
  assert.ok(Math.abs(lmsAt("length", "boy", 0).M - 49.8842) < 1e-6);
  assert.ok(Math.abs(lmsAt("head", "girl", 0).M - 33.8787) < 1e-6);
});

test("lmsAt clamps to 0–24 months and interpolates between rows", () => {
  const at24 = lmsAt("weight", "boy", 99);
  assert.equal(at24.M, lmsAt("weight", "boy", 24).M);
  const mid = lmsAt("weight", "boy", 1.5);
  const lo = lmsAt("weight", "boy", 1);
  const hi = lmsAt("weight", "boy", 2);
  assert.ok(mid.M > lo.M && mid.M < hi.M, "interpolated median sits between month rows");
});

test("a value exactly at the median is the 50th percentile", () => {
  for (const measure of ["weight", "length", "head"]) {
    for (const sex of ["boy", "girl"]) {
      for (const age of [0, 6, 12, 24]) {
        const { M } = lmsAt(measure, sex, age);
        const p = percentile(measure, sex, age, M);
        assert.ok(Math.abs(p - 50) < 0.5, `${measure} ${sex} ${age}m median → ~50th (got ${p})`);
      }
    }
  }
});

test("percentile is monotonic in the measurement", () => {
  const low = percentile("weight", "boy", 6, 6.5);
  const mid = percentile("weight", "boy", 6, 7.934);
  const high = percentile("weight", "boy", 6, 9.5);
  assert.ok(low < mid && mid < high, `expected ${low} < ${mid} < ${high}`);
});

test("valueAtPercentile round-trips through percentile", () => {
  for (const p of [3, 10, 50, 90, 97]) {
    const v = valueAtPercentile("length", "girl", 12, p);
    const back = percentile("length", "girl", 12, v);
    assert.ok(Math.abs(back - p) < 0.5, `P${p} round-trip → ${back}`);
  }
});

test("P50 from valueAtPercentile matches the reference median", () => {
  // 12-month-old boy weight median (WHO): 9.6479 kg.
  const v = valueAtPercentile("weight", "boy", 12, 50);
  assert.ok(Math.abs(v - 9.6479) < 1e-3, `got ${v}`);
  // 24-month-old boy weight median (WHO): 12.1515 kg.
  const v24 = valueAtPercentile("weight", "boy", 24, 50);
  assert.ok(Math.abs(v24 - 12.1515) < 1e-3, `got ${v24}`);
});

test("table anchors: known WHO medians sit at the 50th percentile", () => {
  // The CDC page's "9-month-old" worked example is internally inconsistent
  // (its M=9.4765 is ~15-month data); anchor on the table's own published
  // medians instead. The well-known 9-month boy median is ~8.9 kg.
  const p = percentile("weight", "boy", 9, 8.9014);
  assert.ok(Math.abs(p - 50) < 0.5, `9mo median → ~50th (got ${p})`);
  const pLen = percentile("length", "girl", 12, 74.0167);
  assert.ok(Math.abs(pLen - 50) < 0.5, `12mo girl length median → ~50th (got ${pLen})`);
});

test("z-scores and percentiles are consistent with the normal CDF", () => {
  const z = zScore("weight", "girl", 3, 6.2);
  assert.ok(Math.abs(normalCdf(z) - percentile("weight", "girl", 3, 6.2) / 100) < 1e-6);
});

test("normalCdf matches known z→percentile pairs", () => {
  assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-9);
  assert.ok(Math.abs(normalCdf(1.645) - 0.95) < 1e-3);
  assert.ok(Math.abs(normalCdf(-1.881) - 0.03) < 1e-3);
});

test("implausible inputs yield NaN instead of crashing", () => {
  assert.ok(Number.isNaN(percentile("weight", "boy", 6, -1)));
  assert.ok(Number.isNaN(zScore("weight", "boy", 6, 0)));
});
