import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AloraRepository,
  AuditLogEntry,
  FamilyMember,
  BabyProfile,
  BabyStatus,
  CareEvent,
  DataExport,
  EventPatch,
  InviteCode,
  NewCareEvent,
  NewCheckIn,
  ReminderConfig,
  ReminderKind,
  ReminderPreference,
  SupportResource,
} from "./repository";
import { mockRepository } from "./mockRepository";
import { resolveMode, type AppMode } from "../config/mode";
import type { AuthStatus } from "../lib/useAuth";

let currentRepository: AloraRepository = mockRepository;
let currentMode: AppMode = "demo";

/** Lazily load the supabaseRepository — only succeeds when PowerSync deps are installed. */
async function loadSupabaseRepository(): Promise<AloraRepository | null> {
  try {
    // Dynamic import avoids static resolution when PowerSync deps are missing
    const mod = await (import("./supabaseRepository") as Promise<{ supabaseRepository: AloraRepository }>);
    return mod.supabaseRepository;
  } catch {
    console.warn("[useData] PowerSync adapter not available — staying in demo mode.");
    return null;
  }
}

/**
 * Switch the active repository at runtime when auth state changes.
 * Called from the auth provider effect so all hooks pick up the change.
 */
export async function setRepositoryMode(authStatus: AuthStatus): Promise<void> {
  const mode = resolveMode(authStatus);
  if (mode === currentMode) return;
  currentMode = mode;
  if (mode === "live" || mode === "localFirst") {
    const live = await loadSupabaseRepository();
    if (live) {
      currentRepository = live;
      return;
    }
    // Fall back to mock if PowerSync deps aren't installed
    console.warn(
      "[useData] Falling back to mock repository — set EXPO_PUBLIC_POWERSYNC_URL and install PowerSync deps for live mode.",
    );
  }
  currentRepository = mockRepository;
}

/** The active repository — consumed by all hooks and call sites. */
export const repository: AloraRepository = new Proxy({} as AloraRepository, {
  get(_target, prop: keyof AloraRepository) {
    const method = currentRepository[prop];
    if (typeof method !== "function") return method;
    return (...args: unknown[]) => (method as (...a: unknown[]) => unknown).apply(currentRepository, args);
  },
});

export type AsyncState<T> =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "ready"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: Error };

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => {
    setState({ status: "loading" });
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => !cancelled && setState({ status: "ready", data }))
      .catch((error: Error) => !cancelled && setState({ status: "error", error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  return { ...state, reload };
}

export const useTimeline = (limit = 100) => useAsync<CareEvent[]>(() => repository.getTimeline(0, limit), [limit]);

/**
 * Paged timeline for the Timeline screen: fetches one page at a time and
 * accumulates results, so months of history never load in a single mount.
 * `reload()` resets to page one (e.g. on focus or after resolving a dup).
 */
export function usePagedTimeline(pageSize = 30) {
  const [items, setItems] = useState<CareEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nonce, setNonce] = useState(0);
  const offsetRef = useRef(0);

  const reload = useCallback(() => {
    offsetRef.current = 0;
    setItems([]);
    setHasMore(true);
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    repository
      .getTimeline(0, pageSize)
      .then((page) => {
        if (cancelled) return;
        offsetRef.current = page.length;
        setItems(page);
        setHasMore(page.length === pageSize);
        setStatus("ready");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setStatus("error");
        setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce, pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await repository.getTimeline(offsetRef.current, pageSize);
      offsetRef.current += page.length;
      setItems((prev) => [...prev, ...page]);
      setHasMore(page.length === pageSize);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, pageSize]);

  return { items, status, error, hasMore, loadingMore, reload, loadMore };
}
export const useBabyStatus = () => useAsync<BabyStatus>(() => repository.getBabyStatus());
export const useRecentActivity = (limit = 3) =>
  useAsync<CareEvent[]>(() => repository.getRecentActivity(limit), [limit]);
export const useReminderPreferences = () => useAsync<ReminderPreference[]>(() => repository.getReminderPreferences());
export const useInvite = () => useAsync<InviteCode>(() => repository.getInvite());
export const useSupportResources = () => useAsync<SupportResource[]>(() => repository.getSupportResources());
export const useAuditLog = () => useAsync<AuditLogEntry[]>(() => repository.getAuditLog());
export const useFamilyMembers = () => useAsync<FamilyMember[]>(() => repository.getFamilyMembers());
export const saveBabyProfile = (profile: BabyProfile): Promise<void> => repository.saveBabyProfile(profile);
export const createCareEvent = (input: NewCareEvent) => repository.createEvent(input);
export const startSleep = (at?: Date): Promise<string> => repository.startSleep(at);
export const stopSleep = (id: string, endAt?: Date): Promise<void> => repository.stopSleep(id, endAt);
export const updateCareEvent = (id: string, patch: EventPatch) => repository.updateEvent(id, patch);
export const softDeleteCareEvent = (id: string) => repository.softDeleteEvent(id);
export const createCheckIn = (input: NewCheckIn) => repository.createCheckIn(input);
export const setReminder = (kind: ReminderKind, config: ReminderConfig, enabled: boolean) =>
  repository.setReminder(kind, config, enabled);
export const revokeInvite = (): Promise<InviteCode> => repository.revokeInvite();
export const generateInvite = (): Promise<InviteCode> => repository.generateInvite();
export const deleteAccount = (): Promise<void> => repository.deleteAccount();
export const exportMyData = (): Promise<DataExport> => repository.exportMyData();
