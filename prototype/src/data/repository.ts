/**
 * Data access boundary.
 * ------------------------------------------------------------------
 * Screens never touch a data source directly — they call an
 * `AloraRepository`. Today the prototype uses `mockRepository`; the
 * real Expo app swaps in `supabaseRepository` (Supabase + PowerSync
 * local SQLite) without touching any screen. Same interface, same
 * async shape, real loading/empty/error states throughout.
 */
import type { CareEvent, EventType } from "./mock";
export type { CareEvent, EventType };

export interface BabyStatus {
  name: string;
  ageLabel: string;
  asleep: boolean;
  asleepSince?: Date;
  putDownBy?: string;
  lastFeed?: CareEvent;
  lastDiaper?: CareEvent;
}

export interface AloraRepository {
  /** Full chronological family timeline (newest first). */
  getTimeline(): Promise<CareEvent[]>;
  /** Derived "current state" for the Home handoff dashboard. */
  getBabyStatus(): Promise<BabyStatus>;
  /** Recent activity for the Home panel. */
  getRecentActivity(limit: number): Promise<CareEvent[]>;
}

/**
 * Scenario switch so the prototype can demo real async states
 * deterministically (and so screenshots are reproducible):
 *   ?data=ok | empty | error | loading
 */
export type Scenario = "ok" | "empty" | "error" | "loading";

export function currentScenario(): Scenario {
  if (typeof window === "undefined") return "ok";
  const v = new URLSearchParams(window.location.search).get("data");
  return v === "empty" || v === "error" || v === "loading" ? v : "ok";
}
