import { events, baby } from "./mock";
import { clearStoredSleepTimer, getStoredSleepTimer, saveStoredSleepTimer } from "./localSleepTimerStore";
import { getStoredReminderPreferences, saveStoredReminderPreference } from "./localReminderPreferenceStore";
import { getStoredCareEvents, saveStoredCareEvent } from "./localCareEventStore";
import {
  type AloraRepository,
  type AuditLogEntry,
  type BabyProfile,
  type BabyStatus,
  type CareEvent,
  type CheckInRecord,
  type DataExport,
  type EventPatch,
  type InviteCode,
  type NewCareEvent,
  type NewCheckIn,
  type ReminderConfig,
  type ReminderKind,
  type ReminderPreference,
  type Scenario,
  type SupportResource,
  currentScenario,
} from "./repository";

const LATENCY = 650;
let nextEventId = events.length + 1;
let nextCheckInId = 1;
let nextInviteId = 1;
let babyProfileStore: BabyProfile = { name: baby.name, ageLabel: baby.ageLabel };
let eventStore: CareEvent[] = sortNewest(events);
let careEventsHydrated = false;
const deletedEventIds = new Set<string>();
const checkInStore: CheckInRecord[] = [];
let reminderStore: ReminderPreference[] = [
  { kind: "quietHours", enabled: true, config: { label: "Quiet hours", schedule: "10:00 PM — 6:00 AM" } },
  { kind: "feed", enabled: true, config: { label: "Feed reminder", schedule: "If no feed logged in 3h" } },
  { kind: "diaper", enabled: false, config: { label: "Diaper check", schedule: "Every 3 hours" } },
  { kind: "bedtime", enabled: true, config: { label: "Bedtime routine", schedule: "Daily at 8:30 PM" } },
];
let inviteStore = makeInvite("A7-K9P");
let accountDeletedAt: Date | null = null;
const supportResources: SupportResource[] = [
  { id: "postpartum-support", title: "Postpartum Support International", description: "Warmline and local support for mood, anxiety, and overwhelm.", actionLabel: "Find support" },
  { id: "safe-sleep", title: "AAP safe sleep basics", description: "A quick refresher on safe sleep setup for naps and nights.", actionLabel: "Read guide" },
  { id: "urgent-help", title: "If you feel unsafe", description: "If you might hurt yourself or someone else, call emergency services now.", actionLabel: "Get urgent help" },
];
const auditLog: AuditLogEntry[] = [
  { id: "audit-1", action: "Invite code generated", actor: "You", at: new Date(Date.now() - 22 * 60_000), detail: "A single-use caregiver invite was created." },
  { id: "audit-2", action: "Export prepared", actor: "You", at: new Date(Date.now() - 2 * 60 * 60_000), detail: "Personal data export was shared from this device." },
  { id: "audit-3", action: "Caregiver role confirmed", actor: "Sam", at: new Date(Date.now() - 26 * 60 * 60_000), detail: "Sam remains a caregiver on Maya's family record." },
];

function sortNewest(items: CareEvent[]): CareEvent[] {
  return [...items].sort((a, b) => b.at.getTime() - a.at.getTime());
}

function activeEvents(): CareEvent[] {
  return eventStore.filter((event) => !deletedEventIds.has(event.id));
}

function lastByType(t: CareEvent["type"]): CareEvent | undefined {
  return activeEvents().filter((e) => e.type === t).sort((a, b) => b.at.getTime() - a.at.getTime())[0];
}

function activeSleep(): CareEvent | undefined {
  return activeEvents()
    .filter((event) => event.type === "sleep" && !event.endAt)
    .sort((a, b) => b.at.getTime() - a.at.getTime())[0];
}

function reserveLocalEventId(id: string) {
  const match = /^local-(\d+)$/.exec(id);
  if (!match) return;
  nextEventId = Math.max(nextEventId, Number(match[1]) + 1);
}

async function hydrateCareEvents() {
  if (careEventsHydrated) return;
  const storedEvents = await getStoredCareEvents();
  if (storedEvents.length) {
    const nextEvents = new Map(eventStore.map((event) => [event.id, event]));
    storedEvents.forEach(({ deletedAt, ...event }) => {
      reserveLocalEventId(event.id);
      nextEvents.set(event.id, event);
      if (deletedAt) deletedEventIds.add(event.id);
    });
    eventStore = sortNewest([...nextEvents.values()]);
  }
  careEventsHydrated = true;
}

async function hydrateActiveSleep() {
  await hydrateCareEvents();
  const stored = await getStoredSleepTimer();
  if (!stored || deletedEventIds.has(stored.id)) return;
  reserveLocalEventId(stored.id);
  const storedEvent = eventStore.find((event) => event.id === stored.id);
  const event: CareEvent = {
    ...storedEvent,
    id: stored.id,
    type: "sleep",
    subtype: storedEvent?.subtype ?? "Nap",
    by: storedEvent?.by ?? "You",
    byInitial: storedEvent?.byInitial ?? "Y",
    at: stored.startAt,
    endAt: undefined,
    detail: storedEvent?.detail ?? "Started from Home",
    sync: storedEvent?.sync ?? "pending",
  };
  eventStore = sortNewest([
    event,
    ...eventStore.filter((item) => item.id !== stored.id && !(item.type === "sleep" && !item.endAt)),
  ]);
}

function sleepDurationDetail(start: Date, end: Date): string {
  const mins = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000));
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function buildDetail(input: NewCareEvent): string | undefined {
  const parts = [input.quantity, input.durationMinutes ? `${input.durationMinutes} min` : undefined, input.notes]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(" · ") : undefined;
}

function updateReminder(kind: ReminderKind, config: ReminderConfig, enabled: boolean) {
  reminderStore = reminderStore.map((reminder) =>
    reminder.kind === kind ? { kind, config, enabled } : reminder,
  );
}

async function hydrateReminderPreferences() {
  const stored = await getStoredReminderPreferences();
  if (!stored.length) return;
  reminderStore = reminderStore.map((reminder) => stored.find((item) => item.kind === reminder.kind) ?? reminder);
}

function cloneReminder(reminder: ReminderPreference): ReminderPreference {
  return { ...reminder, config: { ...reminder.config } };
}

function makeInvite(code: string): InviteCode {
  return {
    code,
    link: `https://alora.app/invite/${code}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    revoked: false,
  };
}

function cloneInvite(invite: InviteCode): InviteCode {
  return { ...invite, expiresAt: new Date(invite.expiresAt) };
}

function nextInviteCode(): string {
  const codes = ["M4-Q2X", "L8-P6C", "N3-R7T", "B9-W5D"];
  const code = codes[(nextInviteId - 1) % codes.length];
  nextInviteId += 1;
  return code;
}

function cloneEvent(event: CareEvent): CareEvent {
  return { ...event };
}

function cloneCheckIn(checkIn: CheckInRecord): CheckInRecord {
  return { ...checkIn };
}

function applyEventPatch(event: CareEvent, patch: EventPatch): CareEvent {
  const next: CareEvent = { ...event };
  if (patch.subtype !== undefined) next.subtype = patch.subtype;
  if (patch.at !== undefined) next.at = patch.at;
  if (patch.endAt !== undefined) next.endAt = patch.endAt;
  if (patch.detail !== undefined) next.detail = patch.detail;
  if (patch.duplicateOf !== undefined) {
    if (patch.duplicateOf === null) delete next.duplicateOf;
    else next.duplicateOf = patch.duplicateOf;
  }
  next.sync = "edited";
  return next;
}

function delay<T>(value: T, scenario: Scenario): Promise<T> {
  return new Promise((resolve, reject) => {
    if (scenario === "loading") return;
    setTimeout(() => {
      if (scenario === "error") reject(new Error("Couldn't reach the family sync service."));
      else resolve(value);
    }, LATENCY);
  });
}

export const mockRepository: AloraRepository = {
  async getTimeline() {
    const s = currentScenario();
    await hydrateActiveSleep();
    return delay<CareEvent[]>(s === "empty" ? [] : sortNewest(activeEvents()), s);
  },
  async getRecentActivity(limit: number) {
    const s = currentScenario();
    await hydrateActiveSleep();
    return delay<CareEvent[]>(s === "empty" ? [] : sortNewest(activeEvents()).slice(0, limit), s);
  },
  async getBabyStatus() {
    const s = currentScenario();
    await hydrateActiveSleep();
    const openSleep = activeSleep();
    const status: BabyStatus =
      s === "empty"
        ? { name: babyProfileStore.name, ageLabel: babyProfileStore.ageLabel, asleep: false }
        : {
            name: babyProfileStore.name,
            ageLabel: babyProfileStore.ageLabel,
            asleep: Boolean(openSleep),
            activeSleepId: openSleep?.id,
            asleepSince: openSleep?.at,
            putDownBy: openSleep?.by,
            lastFeed: lastByType("feed"),
            lastDiaper: lastByType("diaper"),
          };
    return delay<BabyStatus>(status, s);
  },
  async getReminderPreferences() {
    const s = currentScenario();
    await hydrateReminderPreferences();
    return delay<ReminderPreference[]>(reminderStore.map(cloneReminder), s);
  },
  async getInvite() {
    const s = currentScenario();
    return delay<InviteCode>(cloneInvite(inviteStore), s);
  },
  async getSupportResources() {
    const s = currentScenario();
    return delay<SupportResource[]>(supportResources.map((resource) => ({ ...resource })), s);
  },
  async getAuditLog() {
    const s = currentScenario();
    return delay<AuditLogEntry[]>(auditLog.map((entry) => ({ ...entry, at: new Date(entry.at) })), s);
  },
  async saveBabyProfile(profile: BabyProfile) {
    const s = currentScenario();
    const nextProfile = {
      name: profile.name.trim() || baby.name,
      ageLabel: profile.ageLabel,
    };
    await delay<void>(undefined, s);
    babyProfileStore = nextProfile;
  },
  async createEvent(input: NewCareEvent) {
    const s = currentScenario();
    await delay<void>(undefined, s);
    await hydrateCareEvents();
    const id = `local-${nextEventId++}`;
    const event: CareEvent = {
      id,
      type: input.type,
      subtype: input.subtype,
      by: "You",
      byInitial: "Y",
      at: input.at ?? new Date(),
      endAt: input.endAt,
      detail: buildDetail(input),
      sync: "pending",
    };
    eventStore = sortNewest([event, ...eventStore]);
    await saveStoredCareEvent(event);
    return id;
  },
  async startSleep(at?: Date) {
    const s = currentScenario();
    await delay<void>(undefined, s);
    await hydrateCareEvents();
    const id = `local-${nextEventId++}`;
    const startedAt = at ?? new Date();
    const event: CareEvent = {
      id,
      type: "sleep",
      subtype: "Nap",
      by: "You",
      byInitial: "Y",
      at: startedAt,
      detail: "Started from Home",
      sync: "pending",
    };
    eventStore = sortNewest([event, ...eventStore]);
    await saveStoredCareEvent(event);
    await saveStoredSleepTimer({ id, startAt: startedAt });
    return id;
  },
  async stopSleep(id: string, endAt?: Date) {
    const s = currentScenario();
    await delay<void>(undefined, s);
    await hydrateActiveSleep();
    const stoppedAt = endAt ?? new Date();
    let stoppedEvent: CareEvent | null = null;
    eventStore = sortNewest(eventStore.map((event) => {
      if (event.id !== id) return event;
      stoppedEvent = {
        ...event,
        endAt: stoppedAt,
        detail: sleepDurationDetail(event.at, stoppedAt),
        sync: "edited",
      };
      return stoppedEvent;
    }));
    if (!stoppedEvent) throw new Error("Couldn't find that sleep timer.");
    await saveStoredCareEvent(stoppedEvent);
    await clearStoredSleepTimer();
  },
  async updateEvent(id: string, patch: EventPatch) {
    const s = currentScenario();
    await delay<void>(undefined, s);
    await hydrateCareEvents();
    let updatedEvent: CareEvent | null = null;
    eventStore = sortNewest(eventStore.map((event) => {
      if (event.id !== id) return event;
      updatedEvent = applyEventPatch(event, patch);
      return updatedEvent;
    }));
    if (!updatedEvent) throw new Error("Couldn't find that event.");
    await saveStoredCareEvent(updatedEvent);
  },
  async softDeleteEvent(id: string) {
    const s = currentScenario();
    await delay<void>(undefined, s);
    await hydrateCareEvents();
    const event = eventStore.find((item) => item.id === id);
    if (!event) throw new Error("Couldn't find that event.");
    deletedEventIds.add(id);
    await saveStoredCareEvent(event, new Date());
  },
  async createCheckIn(input: NewCheckIn) {
    const s = currentScenario();
    await delay<void>(undefined, s);
    const id = `checkin-${nextCheckInId++}`;
    checkInStore.unshift({ ...input, id, at: input.at ?? new Date() });
    return id;
  },
  async setReminder(kind: ReminderKind, config: ReminderConfig, enabled: boolean) {
    const s = currentScenario();
    await delay<void>(undefined, s);
    const reminder = { kind, config, enabled };
    updateReminder(kind, config, enabled);
    await saveStoredReminderPreference(reminder);
  },
  async revokeInvite() {
    const s = currentScenario();
    await delay<void>(undefined, s);
    inviteStore = { ...inviteStore, revoked: true };
    return cloneInvite(inviteStore);
  },
  async generateInvite() {
    const s = currentScenario();
    await delay<void>(undefined, s);
    inviteStore = makeInvite(nextInviteCode());
    return cloneInvite(inviteStore);
  },
  async deleteAccount() {
    const s = currentScenario();
    await delay<void>(undefined, s);
    if (accountDeletedAt) return;
    accountDeletedAt = new Date();
  },
  async exportMyData() {
    const s = currentScenario();
    await hydrateActiveSleep();
    await hydrateReminderPreferences();
    return delay<DataExport>(
      {
        exportedAt: new Date(),
        baby: { ...babyProfileStore },
        events: sortNewest(activeEvents()).map(cloneEvent),
        checkIns: checkInStore.map(cloneCheckIn),
        reminderPreferences: reminderStore.map(cloneReminder),
      },
      s,
    );
  },
};
