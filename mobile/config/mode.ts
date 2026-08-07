/**
 * Single mode resolver — the one place that decides demo / local-first / live.
 * No screen, hook, or sync routine reads raw environment booleans directly.
 */
import { isBackendConfigured, isSyncConfigured } from "./env";
import type { AuthStatus } from "../lib/useAuth";

export type AppMode = "demo" | "localFirst" | "live";

/**
 * Resolve the runtime mode from environment configuration and auth/session
 * state. Every consumer that needs to know the mode calls this rather than
 * reading env booleans or auth state separately.
 */
export function resolveMode(authStatus: AuthStatus): AppMode {
  // Demo mode: backend not configured, or explicitly in demo mode
  if (!isBackendConfigured || authStatus === "demo") return "demo";

  // Auth is still loading — defer decision
  if (authStatus === "loading") return "demo";

  // Signed out: use demo (no data to sync)
  if (authStatus === "signedOut") return "demo";

  // Signed in + backend configured: choose local-first or live
  if (isSyncConfigured) return "live";
  return "localFirst";
}

/**
 * True when PowerSync should be active: live or local-first mode with a valid
 * authenticated session.
 */
export function shouldStartSync(mode: AppMode, authStatus: AuthStatus): boolean {
  return (mode === "live" || mode === "localFirst") && authStatus === "signedIn";
}
