/**
 * Contract tests for the tables that PowerSync downloads from Postgres.
 *
 * This loads the schema declaration with a tiny in-process stand-in for the
 * native PowerSync module, so the test remains runnable on a plain Node CI
 * runner as well as on an Expo development machine.
 */
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

function loadSchema() {
  const source = readFileSync(join(__dirname, "../powersync/schema.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleExports = {};
  const powerSyncMock = {
    column: { text: "text", real: "real", integer: "integer" },
    Table: class Table {
      constructor(fields, options) {
        this.fields = fields;
        this.options = options;
      }
    },
    Schema: class Schema {
      constructor(tables) {
        this.tables = tables;
      }
    },
  };
  new Function("exports", "require", compiled)(moduleExports, (name) => {
    if (name === "@powersync/react-native") return powerSyncMock;
    throw new Error(`Unexpected module: ${name}`);
  });
  return moduleExports.AppSchema;
}

test("PowerSync schema covers every family and global sync-rule table", () => {
  const schema = loadSchema();
  assert.deepEqual(Object.keys(schema.tables).sort(), [
    "audit_logs",
    "babies",
    "baby_events",
    "event_edits",
    "families",
    "family_members",
    "invitation_tokens",
    "notification_preferences",
    "parent_check_ins",
    "parent_reflections",
    "reminders",
    "subscription_status",
    "support_resources",
  ]);
});

test("PowerSync schema preserves backend columns used by live repository queries", () => {
  const schema = loadSchema();
  assert.equal(schema.tables.families.fields.seat_limit, "integer");
  assert.equal(schema.tables.baby_events.fields.notes, "text");
  assert.equal(schema.tables.baby_events.fields.detail, undefined);
  assert.equal(schema.tables.audit_logs.fields.detail, "text");
  assert.equal(schema.tables.subscription_status.fields.family_id, "text");
  assert.equal(schema.tables.subscription_status.fields.tier, "text");
  assert.equal(schema.tables.subscription_status.fields.updated_at, "text");
  assert.equal(schema.tables.invitation_tokens.fields.code, "text");
  assert.equal(schema.tables.invitation_tokens.fields.role, "text");
  assert.equal(schema.tables.invitation_tokens.fields.expires_at, "text");
});

test("sync rules keep trust data out of limited caregiver buckets", () => {
  const rules = readFileSync(join(__dirname, "../../backend/sync-rules.yaml"), "utf8");
  const familyBucket = rules.slice(rules.indexOf("  family:"), rules.indexOf("  trust:"));
  const trustBucket = rules.slice(rules.indexOf("  trust:"), rules.indexOf("  owner_trust:"));
  const ownerBucket = rules.slice(
    rules.indexOf("  owner_trust:"),
    rules.indexOf("  # -----------------------------------------------------------------------\n  # Private bucket"),
  );

  assert.doesNotMatch(familyBucket, /audit_logs|invitation_tokens/);
  assert.match(trustBucket, /role != 'limited'/);
  assert.match(trustBucket, /audit_logs/);
  assert.match(ownerBucket, /role = 'owner'/);
  assert.match(ownerBucket, /invitation_tokens/);
});
