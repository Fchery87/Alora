export type EventType = "feed" | "diaper" | "sleep";
export type SyncState = "synced" | "pending" | "edited";

export interface CareEvent {
  id: string;
  type: EventType;
  subtype: string;
  by: string; // caregiver name
  byInitial: string;
  at: Date;
  endAt?: Date;
  detail?: string;
  sync: SyncState;
  duplicateOf?: string;
}

const now = new Date();
const min = (m: number) => new Date(now.getTime() - m * 60_000);

export const baby = {
  name: "Maya",
  ageLabel: "4 mo · 12 days",
  // current sleep started 72 min ago and is ongoing
  asleepSince: min(72),
};

export const caregivers = {
  me: { name: "You", initial: "Y", color: "var(--feed)" },
  partner: { name: "Sam", initial: "S", color: "var(--sleep)" },
};

export const events: CareEvent[] = [
  {
    id: "e1",
    type: "sleep",
    subtype: "Nap",
    by: "Sam",
    byInitial: "S",
    at: min(72),
    detail: "Put down drowsy",
    sync: "pending",
  },
  {
    id: "e2",
    type: "diaper",
    subtype: "Wet",
    by: "You",
    byInitial: "Y",
    at: min(96),
    sync: "synced",
  },
  {
    id: "e3",
    type: "feed",
    subtype: "Bottle",
    by: "Sam",
    byInitial: "S",
    at: min(150),
    endAt: min(132),
    detail: "120 ml · 18 min",
    sync: "synced",
  },
  {
    id: "e4",
    type: "feed",
    subtype: "Bottle",
    by: "You",
    byInitial: "Y",
    at: min(152),
    detail: "120 ml",
    sync: "edited",
    duplicateOf: "e3",
  },
  {
    id: "e5",
    type: "diaper",
    subtype: "Dirty",
    by: "You",
    byInitial: "Y",
    at: min(205),
    detail: "Mixed",
    sync: "synced",
  },
  {
    id: "e6",
    type: "sleep",
    subtype: "Night",
    by: "Sam",
    byInitial: "S",
    at: min(540),
    endAt: min(255),
    detail: "4h 45m",
    sync: "synced",
  },
  {
    id: "e7",
    type: "feed",
    subtype: "Breast",
    by: "You",
    byInitial: "Y",
    at: min(585),
    detail: "L · 14 min",
    sync: "synced",
  },
];

export const lastByType = (t: EventType) =>
  events.filter((e) => e.type === t).sort((a, b) => b.at.getTime() - a.at.getTime())[0];

export function sinceLabel(d: Date): string {
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m ago` : `${h}h ago`;
}

export function durationLabel(from: Date): string {
  const mins = Math.round((Date.now() - from.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function clockLabel(d: Date): string {
  return d
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
}
