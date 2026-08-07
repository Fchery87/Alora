// @ts-nocheck — this file is excluded from tsconfig until PowerSync deps are
// installed. When those deps arrive, remove this directive and the exclude entry.
/**
 * Live data adapter — reads from the on-device PowerSync SQLite (local-first
 * source of truth), which syncs to Supabase Postgres. Same interface as
 * mockRepository, so swapping it in (in useData.ts) needs no screen changes.
 *
 * INERT until you install the PowerSync deps + provision the backend.
 * Then in data/useData.ts the mode resolver switches to this adapter.
 *
 * All 19 AloraRepository methods implemented. Write methods use PowerSync
 * local db.execute() which auto-queues the upload to Supabase Postgres.
 */
import { db } from "../powersync/system";
import { getSupabase } from "../lib/supabase";
import type { CareEvent, EventType } from "./mock";
import { detectDuplicates } from "./repository";
import type {
  AloraRepository,
  AuditLogEntry,
  BabyProfile,
  BabyStatus,
  CheckInRecord,
  DataExport,
  EventPatch,
  FamilyMember,
  InviteCode,
  NewCareEvent,
  NewCheckIn,
  ReminderConfig,
  ReminderKind,
  ReminderPreference,
  SupportResource,
} from "./repository";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function generateId(): string {
  // crypto.randomUUID() is available in Hermes (React Native) and Node 19+
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: pseudo-random hex string
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function currentUserId(): Promise<string | undefined> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user.id;
}

async function requireUserId(): Promise<string> {
  const uid = await currentUserId();
  if (!uid) throw new Error("Not authenticated.");
  return uid;
}

async function myFamilyId(): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const row = await db.getOptional<{ family_id: string }>(
    `SELECT family_id FROM family_members WHERE user_id = ? LIMIT 1`,
    [uid],
  );
  return row?.family_id ?? null;
}

async function requireFamilyId(): Promise<string> {
  const fid = await myFamilyId();
  if (!fid) throw new Error("No family found. Complete onboarding first.");
  return fid;
}

async function myBabyId(): Promise<string | null> {
  const fid = await myFamilyId();
  if (!fid) return null;
  const row = await db.getOptional<{ id: string }>(
    `SELECT id FROM babies WHERE family_id = ? ORDER BY created_at ASC LIMIT 1`,
    [fid],
  );
  return row?.id ?? null;
}

async function requireBabyId(): Promise<string> {
  const bid = await myBabyId();
  if (!bid) throw new Error("No baby profile found. Complete onboarding first.");
  return bid;
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

function toEvent(
  r: EventRow,
  me: string | undefined,
  names: Record<string, { name: string; initial: string }>,
): CareEvent {
  const mine = r.created_by != null && r.created_by === me;
  const member = r.created_by ? names[r.created_by] : undefined;
  const name = mine ? "You" : r.created_by == null ? "Former caregiver" : (member?.name ?? "Caregiver");
  return {
    id: r.id,
    type: r.event_type as EventType,
    subtype: r.sub_type ?? "",
    by: name,
    byInitial: mine ? "Y" : name.charAt(0).toUpperCase(),
    at: new Date(r.start_at ?? Date.now()),
    endAt: r.end_at ? new Date(r.end_at) : undefined,
    detail: detailFor(r),
    sync: "synced",
  };
}

function ageLabel(birthIso: string): string {
  const months = Math.max(0, Math.floor((Date.now() - new Date(birthIso).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  const days = Math.floor((Date.now() - new Date(birthIso).getTime()) / (1000 * 60 * 60 * 24)) % 30;
  return `${months} mo · ${days} days`;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const supabaseRepository: AloraRepository = {
  // ── Reads ──────────────────────────────────────────────────────────────

  async getTimeline(offset = 0, limit?: number) {
    const query =
      limit !== undefined
        ? `SELECT * FROM baby_events WHERE deleted_at IS NULL ORDER BY start_at DESC LIMIT ? OFFSET ?`
        : `SELECT * FROM baby_events WHERE deleted_at IS NULL ORDER BY start_at DESC`;
    const params = limit !== undefined ? [limit, offset] : [];
    const [rows, me, names] = await Promise.all([db.getAll<EventRow>(query, params), currentUserId(), memberNames()]);
    return detectDuplicates(rows.map((r: EventRow) => toEvent(r, me, names)));
  },

  async getRecentActivity(limit: number) {
    const [rows, me, names] = await Promise.all([
      db.getAll<EventRow>(`SELECT * FROM baby_events WHERE deleted_at IS NULL ORDER BY start_at DESC LIMIT ?`, [limit]),
      currentUserId(),
      memberNames(),
    ]);
    return detectDuplicates(rows.map((r: EventRow) => toEvent(r, me, names)));
  },

  async getBabyStatus(): Promise<BabyStatus> {
    const baby = await db.getOptional<{ name: string; birth_date: string | null }>(
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
      putDownBy: openSleep
        ? openSleep.created_by === me
          ? "you"
          : names[openSleep.created_by ?? ""]?.name
        : undefined,
      lastFeed: lastFeed ? toEvent(lastFeed, me, names) : undefined,
      lastDiaper: lastDiaper ? toEvent(lastDiaper, me, names) : undefined,
    };
  },

  async getReminderPreferences(): Promise<ReminderPreference[]> {
    const fid = await myFamilyId();
    if (!fid) return [];
    const rows = await db.getAll<{ kind: string; config: string; enabled: number }>(
      `SELECT kind, config, enabled FROM reminders WHERE family_id = ?`,
      [fid],
    );
    return rows.map((r) => ({
      kind: r.kind as ReminderKind,
      enabled: r.enabled === 1,
      config: JSON.parse(r.config || "{}") as ReminderConfig,
    }));
  },

  async getInvite(): Promise<InviteCode> {
    const fid = await requireFamilyId();
    const row = await db.getOptional<{
      code: string;
      expires_at: string;
      revoked_at: string | null;
      used_at: string | null;
    }>(
      `SELECT code, expires_at, revoked_at, used_at FROM invitation_tokens WHERE family_id = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1`,
      [fid],
    );
    if (!row) {
      return { code: "", link: "", expiresAt: new Date(0), revoked: true };
    }
    return {
      code: row.code,
      link: `https://alora.app/invite/${row.code}`,
      expiresAt: new Date(row.expires_at),
      revoked: false,
    };
  },

  async getSupportResources(): Promise<SupportResource[]> {
    const rows = await db.getAll<{
      id: string;
      title: string;
      subtitle: string | null;
      phone: string | null;
      url: string | null;
    }>(`SELECT id, title, subtitle, phone, url FROM support_resources ORDER BY sort ASC`);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.subtitle ?? "",
      actionLabel: r.phone ? `Call ${r.phone}` : r.url ? "Learn more" : "View",
    }));
  },

  async getAuditLog(): Promise<AuditLogEntry[]> {
    const fid = await myFamilyId();
    if (!fid) return [];
    const rows = await db.getAll<{
      id: string;
      action: string;
      actor_id: string | null;
      detail: string;
      created_at: string;
    }>(
      `SELECT id, action, actor_id, detail, created_at FROM audit_logs WHERE family_id = ? ORDER BY created_at DESC LIMIT 50`,
      [fid],
    );
    const names = await memberNames();
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      actor: r.actor_id ? (names[r.actor_id]?.name ?? "Former caregiver") : "System",
      at: new Date(r.created_at),
      detail: r.detail ? JSON.parse(r.detail) : {},
    }));
  },

  async getFamilyMembers(): Promise<FamilyMember[]> {
    const me = await currentUserId();
    const rows = await db.getAll<{
      user_id: string;
      display_name: string | null;
      role: string;
      joined_at: string;
    }>(`SELECT user_id, display_name, role, joined_at FROM family_members ORDER BY joined_at ASC`);
    return rows.map((r) => ({
      userId: r.user_id,
      displayName: r.display_name ?? "Caregiver",
      role: r.role === "owner" ? "owner" : r.role === "limited" ? "limited" : "partner",
      isSelf: r.user_id === me,
      joinedAt: new Date(r.joined_at),
    }));
  },

  async getSeatLimit(): Promise<number | null> {
    const fid = await requireFamilyId();
    const row = await db.getOptional<{ seat_limit: number | null }>(`SELECT seat_limit FROM families WHERE id = ?`, [
      fid,
    ]);
    return row?.seat_limit ?? null;
  },

  async setSeatLimit(limit: number | null): Promise<void> {
    if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
      throw new Error("Seat limit must be a whole number of at least 1, or no limit.");
    }
    const fid = await requireFamilyId();
    // Local-first write: PowerSync uploads it; the server RLS (non-limited
    // members only) and the audit trigger (audit_logs.seat_limit.changed)
    // enforce + record it there.
    await db.execute(`UPDATE families SET seat_limit = ? WHERE id = ?`, [limit, fid]);
  },

  async saveBabyProfile(profile: BabyProfile): Promise<void> {
    const fid = await requireFamilyId();
    const existing = await db.getOptional<{ id: string }>(
      `SELECT id FROM babies WHERE family_id = ? ORDER BY created_at ASC LIMIT 1`,
      [fid],
    );
    if (existing) {
      await db.execute(`UPDATE babies SET name = ? WHERE id = ?`, [profile.name, existing.id]);
    } else {
      await db.execute(`INSERT INTO babies (id, family_id, name, created_at) VALUES (?, ?, ?, ?)`, [
        generateId(),
        fid,
        profile.name,
        new Date().toISOString(),
      ]);
    }
  },

  // ── Writes ─────────────────────────────────────────────────────────────

  async createEvent(input: NewCareEvent): Promise<string> {
    const [uid, fid, bid] = await Promise.all([requireUserId(), requireFamilyId(), requireBabyId()]);
    const id = generateId();
    const now = new Date().toISOString();
    await db.execute(
      `INSERT INTO baby_events (id, family_id, baby_id, created_by, event_type, sub_type, start_at, end_at, quantity, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        fid,
        bid,
        uid,
        input.type,
        input.subtype,
        (input.at ?? new Date()).toISOString(),
        input.endAt?.toISOString() ?? null,
        input.quantity ? parseFloat(input.quantity) : null,
        input.notes ?? null,
        now,
        now,
      ],
    );
    return id;
  },

  async startSleep(at?: Date): Promise<string> {
    const [uid, fid, bid] = await Promise.all([requireUserId(), requireFamilyId(), requireBabyId()]);
    const id = generateId();
    const now = new Date().toISOString();
    const startAt = (at ?? new Date()).toISOString();
    await db.execute(
      `INSERT INTO baby_events (id, family_id, baby_id, created_by, event_type, sub_type, start_at, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'sleep', 'Nap', ?, 'Started from Home', ?, ?)`,
      [id, fid, bid, uid, startAt, now, now],
    );
    return id;
  },

  async stopSleep(id: string, endAt?: Date): Promise<void> {
    const uid = await requireUserId();
    const event = await db.getOptional<EventRow>(
      `SELECT * FROM baby_events WHERE id = ? AND event_type = 'sleep' AND deleted_at IS NULL`,
      [id],
    );
    if (!event) throw new Error("Couldn't find that sleep timer.");
    const stoppedAt = (endAt ?? new Date()).toISOString();
    const startAt = event.start_at ? new Date(event.start_at) : new Date();
    const mins = Math.max(1, Math.round((new Date(stoppedAt).getTime() - startAt.getTime()) / 60_000));
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    const detail = hours ? `${hours}h ${remainder}m` : `${remainder}m`;
    const now = new Date().toISOString();
    await db.execute(`UPDATE baby_events SET end_at = ?, detail = ?, updated_at = ? WHERE id = ?`, [
      stoppedAt,
      detail,
      now,
      id,
    ]);
    // Record prior state in event_edits for audit trail
    await db.execute(
      `INSERT INTO event_edits (id, event_id, family_id, edited_by, prior_values, edited_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        id,
        event.family_id ?? (await requireFamilyId()),
        uid,
        JSON.stringify({ end_at: event.end_at, detail: event.detail ?? null }),
        now,
      ],
    );
  },

  async updateEvent(id: string, patch: EventPatch): Promise<void> {
    const uid = await requireUserId();
    const event = await db.getOptional<EventRow>(`SELECT * FROM baby_events WHERE id = ? AND deleted_at IS NULL`, [id]);
    if (!event) throw new Error("Couldn't find that event.");

    // Record prior values before mutating
    const priorValues: Record<string, unknown> = {};
    if (patch.subtype !== undefined) priorValues.sub_type = event.sub_type;
    if (patch.at !== undefined) priorValues.start_at = event.start_at;
    if (patch.endAt !== undefined) priorValues.end_at = event.end_at;
    if (patch.detail !== undefined) priorValues.notes = event.notes;

    const now = new Date().toISOString();
    const updates: string[] = ["updated_at = ?"];
    // `updated_at` is the FIRST SET clause, so its value must be the first param.
    const params: unknown[] = [now];

    if (patch.subtype !== undefined) {
      updates.push("sub_type = ?");
      params.push(patch.subtype);
    }
    if (patch.at !== undefined) {
      updates.push("start_at = ?");
      params.push(patch.at.toISOString());
    }
    if (patch.endAt !== undefined) {
      updates.push("end_at = ?");
      params.push(patch.endAt.toISOString());
    }
    if (patch.detail !== undefined) {
      updates.push("notes = ?");
      params.push(patch.detail);
    }

    params.push(id);
    await db.execute(`UPDATE baby_events SET ${updates.join(", ")} WHERE id = ?`, params);

    // Record edit history
    await db.execute(
      `INSERT INTO event_edits (id, event_id, family_id, edited_by, prior_values, edited_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [generateId(), id, event.family_id ?? (await requireFamilyId()), uid, JSON.stringify(priorValues), now],
    );
  },

  async softDeleteEvent(id: string): Promise<void> {
    const event = await db.getOptional<EventRow>(`SELECT * FROM baby_events WHERE id = ? AND deleted_at IS NULL`, [id]);
    if (!event) throw new Error("Couldn't find that event.");
    const now = new Date().toISOString();
    await db.execute(`UPDATE baby_events SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
  },

  async createCheckIn(input: NewCheckIn): Promise<string> {
    const uid = await requireUserId();
    const id = generateId();
    await db.execute(`INSERT INTO parent_check_ins (id, user_id, mood, created_at) VALUES (?, ?, ?, ?)`, [
      id,
      uid,
      input.mood,
      (input.at ?? new Date()).toISOString(),
    ]);
    if (input.reflection) {
      await db.execute(
        `INSERT INTO parent_reflections (id, check_in_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)`,
        [generateId(), id, uid, input.reflection, new Date().toISOString()],
      );
    }
    return id;
  },

  async setReminder(kind: ReminderKind, config: ReminderConfig, enabled: boolean): Promise<void> {
    const fid = await requireFamilyId();
    const existing = await db.getOptional<{ id: string }>(`SELECT id FROM reminders WHERE family_id = ? AND kind = ?`, [
      fid,
      kind,
    ]);
    if (existing) {
      await db.execute(`UPDATE reminders SET config = ?, enabled = ? WHERE id = ?`, [
        JSON.stringify(config),
        enabled ? 1 : 0,
        existing.id,
      ]);
    } else {
      await db.execute(
        `INSERT INTO reminders (id, family_id, kind, config, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [generateId(), fid, kind, JSON.stringify(config), enabled ? 1 : 0, new Date().toISOString()],
      );
    }
  },

  async revokeInvite(): Promise<InviteCode> {
    const fid = await requireFamilyId();
    const uid = await requireUserId();
    const row = await db.getOptional<{ id: string; code: string }>(
      `SELECT id, code FROM invitation_tokens WHERE family_id = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1`,
      [fid],
    );
    if (!row) throw new Error("No active invite to revoke.");
    await db.execute(`UPDATE invitation_tokens SET revoked_at = ? WHERE id = ?`, [new Date().toISOString(), row.id]);
    // Audit
    await db.execute(
      `INSERT INTO audit_logs (id, family_id, actor_id, action, detail, created_at)
       VALUES (?, ?, ?, 'invite.revoked', ?, ?)`,
      [generateId(), fid, uid, JSON.stringify({ code: row.code }), new Date().toISOString()],
    );
    return { code: row.code, link: "", expiresAt: new Date(0), revoked: true };
  },

  async generateInvite(role: "partner" | "limited" = "partner"): Promise<InviteCode> {
    const fid = await requireFamilyId();
    const uid = await requireUserId();

    // Generate a human-shareable code from crypto-random bytes
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for readability
    const bytes = new Uint8Array(4);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = (Math.random() * 256) | 0;
    }
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i % bytes.length] % chars.length];
    }
    // Insert dash for readability: "A7K-9PM"
    code = code.slice(0, 3) + "-" + code.slice(3);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await db.execute(
      `INSERT INTO invitation_tokens (id, family_id, created_by, code, role, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), fid, uid, code, role, expiresAt, new Date().toISOString()],
    );
    // Audit
    await db.execute(
      `INSERT INTO audit_logs (id, family_id, actor_id, action, detail, created_at)
       VALUES (?, ?, ?, 'invite.generated', ?, ?)`,
      [generateId(), fid, uid, JSON.stringify({ code, role }), new Date().toISOString()],
    );
    return { code, link: `https://alora.app/invite/${code}`, expiresAt: new Date(expiresAt), revoked: false };
  },

  async deleteAccount(): Promise<void> {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Not authenticated.");

    // Call the delete-account Edge Function (server-side orchestration)
    const { error } = await supabase.functions.invoke("delete-account", {
      method: "POST",
      body: {},
    });
    if (error) throw error;
  },

  async exportMyData(): Promise<DataExport> {
    const [uid, fid] = await Promise.all([requireUserId(), myFamilyId()]);
    const exportedAt = new Date();

    // Baby profile
    const baby = await db.getOptional<{ name: string; birth_date: string | null }>(
      `SELECT name, birth_date FROM babies WHERE family_id = ? ORDER BY created_at ASC LIMIT 1`,
      [fid],
    );

    // All family events (not deleted)
    const eventRows = await db.getAll<EventRow>(
      `SELECT * FROM baby_events WHERE family_id = ? AND deleted_at IS NULL ORDER BY start_at DESC`,
      [fid],
    );
    const me = await currentUserId();
    const names = await memberNames();
    const events = eventRows.map((r) => toEvent(r, me, names));

    // Own check-ins only (never co-caregiver's)
    const checkInRows = await db.getAll<{ id: string; mood: string; created_at: string }>(
      `SELECT id, mood, created_at FROM parent_check_ins WHERE user_id = ? ORDER BY created_at DESC`,
      [uid],
    );
    const checkIns: CheckInRecord[] = [];
    for (const ci of checkInRows) {
      const reflections = await db.getAll<{ body: string }>(
        `SELECT body FROM parent_reflections WHERE check_in_id = ?`,
        [ci.id],
      );
      checkIns.push({
        id: ci.id,
        mood: ci.mood as CheckInRecord["mood"],
        reflection: reflections.map((r) => r.body).join("\n") || undefined,
        at: new Date(ci.created_at),
      });
    }

    // Reminder preferences
    let reminderPreferences: ReminderPreference[] = [];
    if (fid) {
      const remRows = await db.getAll<{ kind: string; config: string; enabled: number }>(
        `SELECT kind, config, enabled FROM reminders WHERE family_id = ?`,
        [fid],
      );
      reminderPreferences = remRows.map((r) => ({
        kind: r.kind as ReminderKind,
        enabled: r.enabled === 1,
        config: JSON.parse(r.config || "{}") as ReminderConfig,
      }));
    }

    return {
      exportedAt,
      baby: { name: baby?.name ?? "", ageLabel: baby?.birth_date ? ageLabel(baby.birth_date) : "" },
      events,
      checkIns,
      reminderPreferences,
    };
  },
};
