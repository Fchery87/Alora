import { initialRuntimeState, transitionRuntime } from "../../runtime/composition";

describe("runtime composition state", () => {
  it("starts unconfigured apps in intentional demo mode", () => {
    expect(initialRuntimeState({ backendConfigured: false })).toEqual({ kind: "demo" });
  });

  it("starts configured apps in session restoration, never demo", () => {
    expect(initialRuntimeState({ backendConfigured: true, syncConfigured: true })).toEqual({
      kind: "restoringSession",
      mode: "live",
    });
  });

  it("requires adapter and sync readiness before exposing live data", () => {
    const restoring = initialRuntimeState({ backendConfigured: true, syncConfigured: true });
    const starting = transitionRuntime(restoring, { type: "sessionRestored", sessionId: "user-1" });
    expect(starting).toMatchObject({ kind: "starting", generation: 1 });

    const adapterReady = transitionRuntime(starting, { type: "adapterReady", generation: 1 });
    expect(adapterReady).toMatchObject({ kind: "starting", generation: 1 });
    expect(transitionRuntime(adapterReady, { type: "syncReady", generation: 1 })).toMatchObject({
      kind: "ready",
      sessionId: "user-1",
    });
  });

  it("ignores stale async completions after an account switch", () => {
    const initial = initialRuntimeState({ backendConfigured: true, syncConfigured: true });
    const first = transitionRuntime(initial, { type: "sessionRestored", sessionId: "user-1" });
    const second = transitionRuntime(first, { type: "authChanged", sessionId: "user-2" });

    expect(second).toMatchObject({ kind: "starting", sessionId: "user-2", generation: 2 });
    expect(transitionRuntime(second, { type: "syncReady", generation: 1 })).toEqual(second);
    expect(transitionRuntime(second, { type: "syncReady", generation: 2 })).toMatchObject({ kind: "ready" });
  });

  it("turns startup failures into retryable state", () => {
    const initial = initialRuntimeState({ backendConfigured: true, syncConfigured: false });
    const starting = transitionRuntime(initial, { type: "sessionRestored", sessionId: "user-1" });
    const failed = transitionRuntime(starting, {
      type: "failed",
      generation: 1,
      stage: "adapter",
      message: "adapter unavailable",
    });

    expect(failed).toMatchObject({ kind: "failure", stage: "adapter" });
    expect(transitionRuntime(failed, { type: "retry" })).toMatchObject({ kind: "starting", generation: 2 });
  });
});
