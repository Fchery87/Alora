/**
 * Data access boundary (shared with the prototype).
 * Screens call an AloraRepository, never a data source directly. The app
 * uses mockRepository today; swap in a Supabase + PowerSync adapter later
 * (see ../../backend) with zero screen changes.
 */
import type { CareEvent, EventType } from "./mock";
export type { CareEvent, EventType };

export interface NewCareEvent {
  type: EventType;
  subtype: string;
  at?: Date;
  endAt?: Date;
  quantity?: string;
  durationMinutes?: number;
  notes?: string;
}

export interface EventPatch {
  subtype?: string;
  at?: Date;
  endAt?: Date;
  detail?: string;
  duplicateOf?: string | null;
}

export type CheckInMood = "low" | "tired" | "okay" | "good" | "great";

export interface NewCheckIn {
  mood: CheckInMood;
  reflection?: string;
  at?: Date;
}

export type ReminderKind = "feed" | "diaper" | "bedtime" | "quietHours";

export interface ReminderConfig {
  label: string;
  schedule: string;
}

export interface ReminderPreference {
  kind: ReminderKind;
  enabled: boolean;
  config: ReminderConfig;
}

export interface CheckInRecord extends NewCheckIn {
  id: string;
  at: Date;
}

export interface BabyProfile {
  name: string;
  ageLabel: string;
}

export interface DataExport {
  exportedAt: Date;
  baby: BabyProfile;
  events: CareEvent[];
  checkIns: CheckInRecord[];
  reminderPreferences: ReminderPreference[];
}

export interface InviteCode {
  code: string;
  link: string;
  expiresAt: Date;
  revoked: boolean;
}

export interface SupportResource {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  at: Date;
  detail: string;
}

export interface FamilyMember {
  userId: string;
  displayName: string;
  role: "owner" | "partner";
  isSelf: boolean;
  joinedAt: Date;
}

export interface BabyStatus {
  name: string;
  ageLabel: string;
  asleep: boolean;
  activeSleepId?: string;
  asleepSince?: Date;
  putDownBy?: string;
  lastFeed?: CareEvent;
  lastDiaper?: CareEvent;
}

export interface AloraRepository {
  getTimeline(offset?: number, limit?: number): Promise<CareEvent[]>;
  getBabyStatus(): Promise<BabyStatus>;
  getRecentActivity(limit: number): Promise<CareEvent[]>;
  getReminderPreferences(): Promise<ReminderPreference[]>;
  getInvite(): Promise<InviteCode>;
  getSupportResources(): Promise<SupportResource[]>;
  getAuditLog(): Promise<AuditLogEntry[]>;
  getFamilyMembers(): Promise<FamilyMember[]>;
  saveBabyProfile(profile: BabyProfile): Promise<void>;
  createEvent(input: NewCareEvent): Promise<string>;
  startSleep(at?: Date): Promise<string>;
  stopSleep(id: string, endAt?: Date): Promise<void>;
  updateEvent(id: string, patch: EventPatch): Promise<void>;
  softDeleteEvent(id: string): Promise<void>;
  createCheckIn(input: NewCheckIn): Promise<string>;
  setReminder(kind: ReminderKind, config: ReminderConfig, enabled: boolean): Promise<void>;
  revokeInvite(): Promise<InviteCode>;
  generateInvite(): Promise<InviteCode>;
  deleteAccount(): Promise<void>;
  exportMyData(): Promise<DataExport>;
}

export type Scenario = "ok" | "empty" | "error" | "loading";

/**
 * In the prototype this read a ?data= URL param. On native there's no URL,
 * so it defaults to "ok". A dev menu could flip this to demo states.
 */
export function currentScenario(): Scenario {
  return "ok";
}

/**
 * Detect overlapping same-type events from different caregivers within a
 * 15-minute window. Called after fetching events so the timeline can surface
 * a "possible duplicate" chip with merge/dismiss options.
 */
export function detectDuplicates(events: CareEvent[]): CareEvent[] {
  const DUPLICATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const result = [...events];

  for (let i = 0; i < result.length; i++) {
    if (result[i].duplicateOf) continue; // already flagged
    for (let j = i + 1; j < result.length; j++) {
      if (result[j].duplicateOf) continue;
      if (result[i].type !== result[j].type) continue;
      if (result[i].by === result[j].by) continue; // same caregiver — not a conflict

      const timeA = result[i].at.getTime();
      const timeB = result[j].at.getTime();
      if (Math.abs(timeA - timeB) > DUPLICATE_WINDOW_MS) continue;

      // Flag the later one as a possible duplicate of the earlier
      if (timeA <= timeB) {
        result[j] = { ...result[j], duplicateOf: result[i].id };
      } else {
        result[i] = { ...result[i], duplicateOf: result[j].id };
      }
    }
  }

  return result;
}
