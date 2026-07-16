/**
 * Supabase + PowerSync adapter — SKELETON.
 * ------------------------------------------------------------------
 * This is the real implementation shape for the Expo app. It reads
 * from the on-device PowerSync SQLite (the local-first source of
 * truth), which syncs to Supabase Postgres per backend/sync-rules.yaml.
 *
 * It is intentionally not wired in the web prototype: it requires a
 * provisioned Supabase project + PowerSync instance and the env vars
 * listed in backend/README.md. Swap it into repository.ts once those
 * exist. Until then, screens use mockRepository.
 */
import type { AloraRepository, BabyStatus, CareEvent } from "./repository";

// In the Expo app these come from the env (see backend/README.md):
//   EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY / EXPO_PUBLIC_POWERSYNC_URL
// and `db` is the PowerSync-backed SQLite handle.

declare const db: {
  getAll<T>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T>(sql: string, params?: unknown[]): Promise<T>;
};

function rowToEvent(/* row: any */): CareEvent {
  throw new Error("supabaseRepository: not configured — see backend/README.md");
}

export const supabaseRepository: AloraRepository = {
  async getTimeline() {
    // const rows = await db.getAll(
    //   `select * from baby_events where deleted_at is null order by start_at desc`,
    // );
    // return rows.map(rowToEvent);
    void rowToEvent;
    throw new Error("supabaseRepository: not configured — see backend/README.md");
  },

  async getRecentActivity(_limit: number): Promise<CareEvent[]> {
    throw new Error("supabaseRepository: not configured — see backend/README.md");
  },

  async getBabyStatus(): Promise<BabyStatus> {
    // Reads the open sleep event + last feed/diaper from local SQLite,
    // all instant + offline-safe because PowerSync keeps it local-first.
    void db;
    throw new Error("supabaseRepository: not configured — see backend/README.md");
  },
};
