import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSegments } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { isBackendConfigured } from "../config/env";
import { getSupabase } from "./supabase";
import { setRepositoryMode } from "../data/useData";

/**
 * Auth states:
 *  - "demo"      backend not configured → run on mock data, no gate
 *  - "loading"   restoring the session (incl. offline cold start)
 *  - "signedOut" needs to authenticate
 *  - "signedIn"  has a valid session
 */
export type AuthStatus = "demo" | "loading" | "signedOut" | "signedIn";

type AuthValue = {
  status: AuthStatus;
  session: Session | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({ status: "demo", session: null, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(isBackendConfigured ? "loading" : "demo");

  useEffect(() => {
    if (!isBackendConfigured) return;
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      const newStatus: AuthStatus = data.session ? "signedIn" : "signedOut";
      setSession(data.session);
      setStatus(newStatus);
      void setRepositoryMode(newStatus);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      const newStatus: AuthStatus = next ? "signedIn" : "signedOut";
      setSession(next);
      setStatus(newStatus);
      void setRepositoryMode(newStatus);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isBackendConfigured) {
      // Stop PowerSync and clear local state before signing out
      try {
        const { stopSync } = await import("../powersync/system");
        await stopSync();
      } catch {
        // PowerSync deps may not be installed — that's fine
      }
      await getSupabase().auth.signOut();
    }
  };

  return <AuthContext.Provider value={{ status, session, signOut }}>{children}</AuthContext.Provider>;
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
    if (status === "signedOut" && !inAuthGroup) router.replace("/sign-in");
    else if (status === "signedIn" && inAuthGroup) router.replace("/");
  }, [status, segments, router]);
}
