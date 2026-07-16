import { useCallback, useEffect, useState } from "react";
import type { AloraRepository, BabyStatus, CareEvent } from "./repository";
import { mockRepository } from "./mockRepository";
// import { supabaseRepository } from "./supabaseRepository"; // ← swap in for the real app

/** The one place the data source is chosen. */
export const repository: AloraRepository = mockRepository;

export type AsyncState<T> =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "ready"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: Error };

/** Generic async reader with loading / ready / error + manual reload. */
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

export const useTimeline = () => useAsync<CareEvent[]>(() => repository.getTimeline());
export const useBabyStatus = () => useAsync<BabyStatus>(() => repository.getBabyStatus());
export const useRecentActivity = (limit = 3) =>
  useAsync<CareEvent[]>(() => repository.getRecentActivity(limit), [limit]);
