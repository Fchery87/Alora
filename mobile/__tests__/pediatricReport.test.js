// Pediatrician-visit PDF report builder — pure HTML from a DataExport.
const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { buildPediatricReportHTML } = require("../lib/pediatricReport");

const base = new Date("2026-08-01T12:00:00Z");
const fixture = {
  exportedAt: new Date("2026-08-07T09:00:00Z"),
  baby: { name: "Maya", ageLabel: "4 mo · 12 days" },
  events: [
    {
      id: "f1",
      type: "feed",
      subtype: "Bottle",
      by: "You",
      byInitial: "Y",
      at: new Date(base.getTime() - 3_600_000),
      detail: "120 ml",
      sync: "synced",
    },
    {
      id: "d1",
      type: "diaper",
      subtype: "Wet",
      by: "Sam",
      byInitial: "S",
      at: new Date(base.getTime() - 2_600_000),
      detail: undefined,
      sync: "synced",
    },
    {
      id: "s1",
      type: "sleep",
      subtype: "Nap",
      by: "You",
      byInitial: "Y",
      at: new Date(base.getTime() - 24 * 3_600_000),
      endAt: new Date(base.getTime() - 22 * 3_600_000),
      detail: "2h 0m",
      sync: "synced",
    },
    {
      id: "g1",
      type: "growth",
      subtype: "Weight",
      by: "You",
      byInitial: "Y",
      at: new Date(base.getTime() - 7 * 86_400_000),
      detail: "6.1 kg",
      quantity: "6.1",
      sync: "synced",
    },
    {
      id: "g2",
      type: "growth",
      subtype: "Length",
      by: "You",
      byInitial: "Y",
      at: new Date(base.getTime() - 7 * 86_400_000),
      detail: "60.5 cm",
      quantity: "60.5",
      sync: "synced",
    },
  ],
  checkIns: [
    {
      id: "c1",
      mood: "tired",
      reflection: "Slept badly, very anxious tonight.",
      at: new Date(base.getTime() - 3_600_000),
    },
  ],
  reminderPreferences: [],
};

test("report includes baby summary and care stats", () => {
  const html = buildPediatricReportHTML(fixture);
  assert.ok(html.includes("Maya"));
  assert.ok(html.includes("1</b>") && html.includes("feeds logged"));
  assert.ok(html.includes("diapers logged"));
});

test("report includes the latest growth measurements", () => {
  const html = buildPediatricReportHTML(fixture);
  assert.ok(html.includes("6.1 kg"));
  assert.ok(html.includes("60.5 cm"));
});

test("report includes recent events with attribution", () => {
  const html = buildPediatricReportHTML(fixture);
  assert.ok(html.includes("Bottle"));
  assert.ok(html.includes("Sam"));
});

test("report NEVER contains private check-ins or reflections", () => {
  const html = buildPediatricReportHTML(fixture);
  assert.ok(!html.includes("tired"));
  assert.ok(!html.includes("anxious"));
  assert.ok(!html.includes("Slept badly"));
  assert.ok(!html.includes("reflection"));
});

test("report escapes HTML in free-text fields", () => {
  const evil = {
    ...fixture,
    baby: { name: "<img src=x onerror=alert(1)>", ageLabel: "0 mo" },
    events: [
      {
        id: "x",
        type: "feed",
        subtype: "Bottle",
        by: "<b>You</b>",
        byInitial: "Y",
        at: base,
        detail: "<script>alert(1)</script>",
        sync: "synced",
      },
    ],
  };
  const html = buildPediatricReportHTML(evil);
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"));
});

test("report renders without growth data", () => {
  const noGrowth = { ...fixture, events: fixture.events.filter((e) => e.type !== "growth") };
  const html = buildPediatricReportHTML(noGrowth);
  assert.ok(html.includes("No growth measurements logged yet."));
});
