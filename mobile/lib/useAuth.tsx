import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSegments } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { isBackendConfigured } from "../config/env";
import { getSupabase } from "./supabase";
import { getPendingInviteCode } from "./pendingInvite";

/**
 * Auth states:
 *  - "demo"      backend not configured → run on mock data, no gate
 *  - "loading"   restoring the session (incl. offline cold start)
 *  - "signedOut" needs to authenticate
 *  - "signedIn"  has a valid session
 */
export type AuthStatus = "demo" | "loading" | "signedOut" | "signedIn" | "error";

type AuthValue = {
  status: AuthStatus;
  session: Session | null;
  error: Error | null;
  retry: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  status: "demo",
  session: null,
  error: null,
  retry: () => undefined,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const [status, setStatus] = useState<AuthStatus>(isBackendConfigured ? "loading" : "demo");

  useEffect(() => {
    if (!isBackendConfigured) return;
    const supabase = getSupabase();

    setStatus("loading");
    setError(null);
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const newStatus: AuthStatus = data.session ? "signedIn" : "signedOut";
        setSession(data.session);
        setStatus(newStatus);
      })
      .catch((cause: unknown) => {
        setSession(null);
        setError(cause instanceof Error ? cause : new Error("Session restoration failed."));
        setStatus("error");
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      const newStatus: AuthStatus = next ? "signedIn" : "signedOut";
      setSession(next);
      setStatus(newStatus);
    });
    return () => sub.subscription.unsubscribe();
  }, [restoreAttempt]);

  const signOut = async () => {
    if (isBackendConfigured) {
      // Stop PowerSync and clear local state before signing out
      await getSupabase().auth.signOut();
    }
  };

  const retry = () => setRestoreAttempt((attempt) => attempt + 1);
  return <AuthContext.Provider value={{ status, session, error, retry, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/**
 * Canonical Expo Router auth gate. In demo mode it does nothing, so the app
 * opens straight to the tabs on mock data (today's behavior).
 */
export function useProtectedRoute() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "demo" || status === "loading") return;
    const inAuthGroup = segments[0] === "(auth)";
    const pendingInvite = getPendingInviteCode();
    if (status === "signedOut" && !inAuthGroup) router.replace("/sign-in");
    else if (status === "signedIn" && pendingInvite && (inAuthGroup || segments[0] !== "invite")) {
      router.replace(`/invite/${pendingInvite}` as never);
    } else if (status === "signedIn" && inAuthGroup) router.replace("/");
  }, [status, segments, router]);
}
