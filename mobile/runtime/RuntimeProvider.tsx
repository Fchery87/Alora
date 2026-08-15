import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { isBackendConfigured, isSyncConfigured } from "../config/env";
import { resetActiveRepository, setActiveRepository } from "../data/useData";
import { useAuth } from "../lib/useAuth";
import { captureError } from "../lib/crashReporting";
import { initialRuntimeState } from "./composition";
import type { RuntimeMode, RuntimeState } from "./types";

type RuntimeValue = {
  state: RuntimeState;
  retry: () => void;
};

const RuntimeContext = createContext<RuntimeValue | null>(null);

function configuredMode(): RuntimeMode {
  return isSyncConfigured ? "live" : "localFirst";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Startup failed. Please try again.";
}

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const { status, session, error: authError, retry: retryAuth } = useAuth();
  const initialState = useMemo(
    () => initialRuntimeState({ backendConfigured: isBackendConfigured, syncConfigured: isSyncConfigured }),
    [],
  );
  const [state, setState] = useState<RuntimeState>(initialState);
  const [retryCount, setRetryCount] = useState(0);
  const generationRef = useRef(0);
  const lifecycleRef = useRef<Promise<void>>(Promise.resolve());
  const syncStartedRef = useRef(false);

  const stopSyncIfRunning = useCallback(async () => {
    if (!syncStartedRef.current) return;
    try {
      const { stopSync } = await import("../powersync/system");
      await stopSync();
    } finally {
      syncStartedRef.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sessionId = session?.user.id ?? null;

    lifecycleRef.current = lifecycleRef.current
      .then(async () => {
        await stopSyncIfRunning();
        resetActiveRepository();

        if (cancelled) return;
        if (status === "demo") {
          setState({ kind: "demo" });
          return;
        }
        if (status === "loading") {
          setState(initialState);
          return;
        }
        if (status === "error") {
          setState({
            kind: "failure",
            mode: configuredMode(),
            sessionId: "unknown",
            generation: generationRef.current,
            stage: "session",
            message: authError?.message ?? "Session restoration failed.",
          });
          return;
        }
        if (status === "signedOut" || !sessionId) {
          setState({ kind: "signedOut" });
          return;
        }

        const generation = ++generationRef.current;
        const mode = configuredMode();
        setState({ kind: "starting", mode, sessionId, generation });

        try {
          const [{ supabaseRepository }, sync] = await Promise.all([
            import("../data/supabaseRepository"),
            import("../powersync/system"),
          ]);
          if (cancelled) return;
          setActiveRepository(supabaseRepository);
          syncStartedRef.current = true;
          await sync.startSync();
          if (cancelled) return;
          setState({ kind: "ready", mode, sessionId, generation });
        } catch (error) {
          if (cancelled) return;
          captureError(error instanceof Error ? error : new Error(errorMessage(error)), {
            stage: "runtime-startup",
          });
          setState({
            kind: "failure",
            mode,
            sessionId,
            generation,
            stage: "adapter",
            message: errorMessage(error),
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            kind: "failure",
            mode: configuredMode(),
            sessionId: sessionId ?? "unknown",
            generation: generationRef.current,
            stage: "sync",
            message: errorMessage(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authError, initialState, retryCount, session, status, stopSyncIfRunning]);

  const retry = useCallback(() => {
    if (state.kind === "failure" && state.stage === "session") {
      retryAuth();
      return;
    }
    setRetryCount((count) => count + 1);
  }, [retryAuth, state]);
  const value = useMemo(() => ({ state, retry }), [retry, state]);
  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

export function useRuntime(): RuntimeValue {
  const context = useContext(RuntimeContext);
  if (!context) throw new Error("useRuntime must be used within <RuntimeProvider>");
  return context;
}

export function RuntimeGate({ children }: { children: ReactNode }) {
  const { state, retry } = useRuntime();
  const { signOut } = useAuth();

  if (state.kind === "demo" || state.kind === "signedOut" || state.kind === "ready") return <>{children}</>;
  if (state.kind === "failure") {
    return (
      <RuntimeFailure stage={state.stage} message={state.message} onRetry={retry} onSignOut={() => void signOut()} />
    );
  }
  return <RuntimeLoading />;
}

function RuntimeLoading() {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Starting Alora">
      <Text style={styles.brand}>Alora</Text>
      <Text style={styles.heading}>Getting things ready…</Text>
      <Text style={styles.body}>Restoring your secure session and local data.</Text>
    </View>
  );
}

function RuntimeFailure({
  stage,
  message,
  onRetry,
  onSignOut,
}: {
  stage: string;
  message: string;
  onRetry: () => void;
  onSignOut: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Alora</Text>
      <Text style={styles.heading}>Alora couldn’t start</Text>
      <Text style={styles.body}>Your account is safe. Check your connection and try again.</Text>
      <Text style={styles.stage}>Startup stage: {stage}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry startup"
          onPress={onRetry}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={onSignOut}
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>Sign out</Text>
        </Pressable>
      </View>
      {__DEV__ && <Text style={styles.debug}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    backgroundColor: "#FAF8F5",
  },
  brand: { color: "#141113", fontSize: 44, fontWeight: "500", marginBottom: 12 },
  heading: { color: "#141113", fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  body: { color: "#5F5759", textAlign: "center", marginBottom: 16 },
  stage: { color: "#8A8081", fontSize: 12, marginBottom: 20 },
  actions: { flexDirection: "row", gap: 12 },
  primary: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, backgroundColor: "#6A5AE0" },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondary: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, backgroundColor: "#E9E3E0" },
  secondaryText: { color: "#141113", fontSize: 16, fontWeight: "700" },
  debug: { color: "#8A8081", fontSize: 11, marginTop: 22, textAlign: "center" },
});
