import { useSyncExternalStore } from "react";
import { getSyncProjection, subscribeSyncProjection } from "./system";

export function useSyncProjection() {
  return useSyncExternalStore(subscribeSyncProjection, getSyncProjection, getSyncProjection);
}
