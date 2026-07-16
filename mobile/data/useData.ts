import { useCallback, useEffect, useState } from "react";
import type {
  AloraRepository,
  AuditLogEntry,
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
// import { supabaseRepository } from "./supabaseRepository"; // ← swap in for live data

/** The one place the data source is chosen. */
export const repository: AloraRepository = mockRepository;

export type AsyncState<T> =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "ready"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: Error };

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> & { reload: () => void } {
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

export const useTimeline = () => useAsync<CareEvent[]>(() => repository.getTimeline());
export const useBabyStatus = () => useAsync<BabyStatus>(() => repository.getBabyStatus());
export const useRecentActivity = (limit = 3) =>
  useAsync<CareEvent[]>(() => repository.getRecentActivity(limit), [limit]);
export const useReminderPreferences = () =>
  useAsync<ReminderPreference[]>(() => repository.getReminderPreferences());
export const useInvite = () => useAsync<InviteCode>(() => repository.getInvite());
export const useSupportResources = () => useAsync<SupportResource[]>(() => repository.getSupportResources());
export const useAuditLog = () => useAsync<AuditLogEntry[]>(() => repository.getAuditLog());
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
