/**
 * PowerSync local SQLite schema — mirrors the synced Postgres tables
 * (see ../../supabase/migrations/). PowerSync adds an implicit `id` text PK
 * to every table. Timestamps are stored as ISO text.
 */
import { column, Schema, Table } from "@powersync/react-native";

const baby_events = new Table(
  {
    family_id: column.text,
    baby_id: column.text,
    created_by: column.text,
    event_type: column.text,
    sub_type: column.text,
    start_at: column.text,
    end_at: column.text,
    quantity: column.real,
    notes: column.text,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
  },
  { indexes: { by_family: ["family_id", "start_at"] } },
);

const families = new Table({
  name: column.text,
  created_by: column.text,
  seat_limit: column.integer,
  created_at: column.text,
});
const family_members = new Table({
  family_id: column.text,
  user_id: column.text,
  role: column.text,
  display_name: column.text,
  joined_at: column.text,
});
const babies = new Table({
  family_id: column.text,
  name: column.text,
  birth_date: column.text,
  created_at: column.text,
});
const event_edits = new Table({
  event_id: column.text,
  family_id: column.text,
  edited_by: column.text,
  prior_values: column.text,
  edited_at: column.text,
});
const reminders = new Table({
  family_id: column.text,
  kind: column.text,
  config: column.text,
  enabled: column.integer,
  created_at: column.text,
});
const audit_logs = new Table({
  family_id: column.text,
  actor_id: column.text,
  action: column.text,
  detail: column.text,
  created_at: column.text,
});
const subscription_status = new Table({
  family_id: column.text,
  tier: column.text,
  updated_at: column.text,
});
const invitation_tokens = new Table({
  family_id: column.text,
  created_by: column.text,
  code: column.text,
  role: column.text,
  expires_at: column.text,
  used_at: column.text,
  used_by: column.text,
  revoked_at: column.text,
  created_at: column.text,
});
const notification_preferences = new Table({
  user_id: column.text,
  quiet_start: column.text,
  quiet_end: column.text,
  prefs: column.text,
  updated_at: column.text,
});
const parent_check_ins = new Table({ user_id: column.text, mood: column.text, created_at: column.text });
const parent_reflections = new Table({
  check_in_id: column.text,
  user_id: column.text,
  body: column.text,
  created_at: column.text,
});
const support_resources = new Table({
  region: column.text,
  title: column.text,
  subtitle: column.text,
  phone: column.text,
  url: column.text,
  sort: column.integer,
});

export const AppSchema = new Schema({
  baby_events,
  families,
  family_members,
  babies,
  event_edits,
  reminders,
  audit_logs,
  subscription_status,
  invitation_tokens,
  notification_preferences,
  parent_check_ins,
  parent_reflections,
  support_resources,
});

export type Database = (typeof AppSchema)["types"];
