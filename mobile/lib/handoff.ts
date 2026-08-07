/**
 * Shift-handoff briefing — "what the next caregiver needs to know".
 *
 * Pure computation over the timeline + the handoff marker (see
 * data/localHandoffStore.ts). With no marker, the window falls back to the
 * last 24 hours so the card is always meaningful.
 */
import type { CareEvent } from "../data/repository";

export interface HandoffBrief {
  /** When the current shift started; null = no marker yet. */
  marker: Date | null;
  /** Care events logged since the marker (24h fallback). */
  eventsSince: number;
  lastFeed?: CareEvent;
  lastDiaper?: CareEvent;
  /** In-progress sleep event, if any. */
  openSleep?: CareEvent;
}

const FALLBACK_WINDOW_MS = 24 * 60 * 60 * 1000;

function latest(events: CareEvent[], type: CareEvent["type"]): CareEvent | undefined {
  return events.filter((e) => e.type === type).sort((a, b) => b.at.getTime() - a.at.getTime())[0];
}

export function buildHandoffBrief(events: CareEvent[], marker: Date | null, now: Date): HandoffBrief {
  const boundary = marker ?? new Date(now.getTime() - FALLBACK_WINDOW_MS);
  const sinceHandoff = events.filter((e) => e.at.getTime() >= boundary.getTime() - 60_000);

  return {
    marker,
    eventsSince: sinceHandoff.length,
    lastFeed: latest(sinceHandoff, "feed"),
    lastDiaper: latest(sinceHandoff, "diaper"),
    openSleep: sinceHandoff.find((e) => e.type === "sleep" && !e.endAt),
  };
}
