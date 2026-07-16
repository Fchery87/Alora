/**
 * Live data adapter — reads from the on-device PowerSync SQLite (local-first
 * source of truth), which syncs to Supabase Postgres. Same interface as
 * mockRepository, so swapping it in (in useData.ts) needs no screen changes.
 *
 * INERT until you install the PowerSync deps + provision the backend.
 * Then in data/useData.ts:  export const repository = supabaseRepository;
 */
import { db } from "../powersync/system";
import { getSupabase } from "../lib/supabase";
import { durationLabel, type CareEvent, type EventType } from "./mock";
import type { AloraRepository, BabyStatus } from "./repository";

type EventRow = {
  id: string;
  event_type: string;
  sub_type: string | null;
  created_by: string | null;
  start_at: string | null;
  end_at: string | null;
  quantity: number | null;
  notes: string | null;
};

async function currentUserId(): Promise<string | undefined> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user.id;
}

async function memberNames(): Promise<Record<string, { name: string; initial: string }>> {
  const rows = await db.getAll<{ user_id: string; display_name: string | null }>(
    `SELECT user_id, display_name FROM family_members`,
  );
  const map: Record<string, { name: string; initial: string }> = {};
  for (const r of rows) {
    const name = r.display_name ?? "Caregiver";
    map[r.user_id] = { name, initial: name.charAt(0).toUpperCase() };
  }
  return map;
}

function detailFor(r: EventRow): string | undefined {
  const bits: string[] = [];
  if (r.quantity != null) bits.push(r.event_type === "feed" ? `${r.quantity} ml` : `${r.quantity} min`);
  if (r.notes) bits.push(r.notes);
  return bits.length ? bits.join(" · ") : undefined;
}

function toEvent(r: EventRow, me: string | undefined, names: Record<string, { name: string; initial: string }>): CareEvent {
  const mine = r.created_by != null && r.created_by === me;
  const member = r.created_by ? names[r.created_by] : undefined;
  // created_by === null means the author deleted their account → "former caregiver".
  const name = mine ? "You" : r.created_by == null ? "Former caregiver" : member?.name ?? "Caregiver";
  return {
    id: r.id,
    type: r.event_type as EventType,
    subtype: r.sub_type ?? "",
    by: name,
    byInitial: mine ? "Y" : name.charAt(0).toUpperCase(),
    at: new Date(r.start_at ?? Date.now()),
    endAt: r.end_at ? new Date(r.end_at) : undefined,
    detail: detailFor(r),
    // TODO: derive pending/edited from PowerSync's local upload queue (db.getCrudBatch()).
    sync: "synced",
  };
}

export const supabaseRepository: AloraRepository = {
  async getTimeline() {
    const [rows, me, names] = await Promise.all([
      db.getAll<EventRow>(`SELECT * FROM baby_events WHERE deleted_at IS NULL ORDER BY start_at DESC`),
      currentUserId(),
      memberNames(),
    ]);
    return rows.map((r) => toEvent(r, me, names));
  },

  async getRecentActivity(limit: number) {
    const [rows, me, names] = await Promise.all([
      db.getAll<EventRow>(`SELECT * FROM baby_events WHERE deleted_at IS NULL ORDER BY start_at DESC LIMIT ?`, [limit]),
      currentUserId(),
      memberNames(),
    ]);
    return rows.map((r) => toEvent(r, me, names));
  },

  async getBabyStatus(): Promise<BabyStatus> {
    const baby = await db.get<{ name: string; birth_date: string | null } | null>(
      `SELECT name, birth_date FROM babies ORDER BY created_at ASC LIMIT 1`,
    );
    const me = await currentUserId();
    const names = await memberNames();

    const openSleep = await db.getOptional<EventRow>(
      `SELECT * FROM baby_events WHERE event_type = 'sleep' AND end_at IS NULL AND deleted_at IS NULL ORDER BY start_at DESC LIMIT 1`,
    );
    const lastOf = (t: EventType) =>
      db.getOptional<EventRow>(
        `SELECT * FROM baby_events WHERE event_type = ? AND deleted_at IS NULL ORDER BY start_at DESC LIMIT 1`,
        [t],
      );
    const [lastFeed, lastDiaper] = await Promise.all([lastOf("feed"), lastOf("diaper")]);

    return {
      name: baby?.name ?? "Baby",
      ageLabel: baby?.birth_date ? ageLabel(baby.birth_date) : "",
      asleep: !!openSleep,
      asleepSince: openSleep?.start_at ? new Date(openSleep.start_at) : undefined,
      putDownBy: openSleep ? (openSleep.created_by === me ? "you" : names[openSleep.created_by ?? ""]?.name) : undefined,
      lastFeed: lastFeed ? toEvent(lastFeed, me, names) : undefined,
      lastDiaper: lastDiaper ? toEvent(lastDiaper, me, names) : undefined,
    };
  },
};

function ageLabel(birthIso: string): string {
  const months = Math.max(0, Math.floor((Date.now() - new Date(birthIso).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const days = Math.floor((Date.now() - new Date(birthIso).getTime()) / (1000 * 60 * 60 * 24)) % 30;
  return `${months} mo · ${days} days`;
}

// referenced to keep the import meaningful for future timer displays
void durationLabel;
