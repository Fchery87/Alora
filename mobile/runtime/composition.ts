import type { RuntimeEvent, RuntimeMode, RuntimeState } from "./types";

export type RuntimeConfiguration = { backendConfigured: false } | { backendConfigured: true; syncConfigured: boolean };

export function initialRuntimeState(configuration: RuntimeConfiguration): RuntimeState {
  if (!configuration.backendConfigured) return { kind: "demo" };
  return {
    kind: "restoringSession",
    mode: configuration.syncConfigured ? "live" : "localFirst",
  };
}

function startState(mode: RuntimeMode, sessionId: string, generation: number): RuntimeState {
  return { kind: "starting", mode, sessionId, generation };
}

function sessionTransition(state: RuntimeState, sessionId: string | null): RuntimeState {
  if (sessionId === null) return { kind: "signedOut" };
  const mode =
    state.kind === "restoringSession" || state.kind === "starting" || state.kind === "ready" || state.kind === "failure"
      ? state.mode
      : "localFirst";
  const generation =
    state.kind === "starting" || state.kind === "ready" || state.kind === "failure" ? state.generation + 1 : 1;
  return startState(mode, sessionId, generation);
}

export function transitionRuntime(state: RuntimeState, event: RuntimeEvent): RuntimeState {
  switch (event.type) {
    case "sessionRestored":
    case "authChanged":
      if (state.kind === "demo") return state;
      return sessionTransition(state, event.sessionId);
    case "adapterReady":
      if (state.kind !== "starting" || event.generation !== state.generation) return state;
      return state;
    case "syncReady":
      if (state.kind !== "starting" || event.generation !== state.generation) return state;
      return { kind: "ready", mode: state.mode, sessionId: state.sessionId, generation: state.generation };
    case "failed":
      if (state.kind !== "starting" || event.generation !== state.generation) return state;
      return {
        kind: "failure",
        mode: state.mode,
        sessionId: state.sessionId,
        generation: state.generation,
        stage: event.stage,
        message: event.message,
      };
    case "sessionFailed":
      if (state.kind !== "restoringSession") return state;
      return {
        kind: "failure",
        mode: state.mode,
        sessionId: "unknown",
        generation: 0,
        stage: "session",
        message: event.message,
      };
    case "retry":
      if (state.kind !== "failure") return state;
      return startState(state.mode, state.sessionId, state.generation + 1);
  }
}
