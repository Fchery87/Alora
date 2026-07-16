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
  getTimeline(): Promise<CareEvent[]>;
  getBabyStatus(): Promise<BabyStatus>;
  getRecentActivity(limit: number): Promise<CareEvent[]>;
  getReminderPreferences(): Promise<ReminderPreference[]>;
  getInvite(): Promise<InviteCode>;
  getSupportResources(): Promise<SupportResource[]>;
  getAuditLog(): Promise<AuditLogEntry[]>;
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
