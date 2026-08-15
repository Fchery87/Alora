export type RuntimeMode = "localFirst" | "live";

export type RuntimeFailureStage = "session" | "adapter" | "sync";

export type RuntimeState =
  | { kind: "demo" }
  | { kind: "restoringSession"; mode: RuntimeMode }
  | { kind: "signedOut" }
  | { kind: "starting"; mode: RuntimeMode; sessionId: string; generation: number }
  | { kind: "ready"; mode: RuntimeMode; sessionId: string; generation: number }
  | {
      kind: "failure";
      mode: RuntimeMode;
      sessionId: string;
      generation: number;
      stage: RuntimeFailureStage;
      message: string;
    };

export type RuntimeEvent =
  | { type: "sessionRestored"; sessionId: string | null }
  | { type: "authChanged"; sessionId: string | null }
  | { type: "adapterReady"; generation: number }
  | { type: "syncReady"; generation: number }
  | { type: "failed"; generation: number; stage: Exclude<RuntimeFailureStage, "session">; message: string }
  | { type: "sessionFailed"; message: string }
  | { type: "retry" };
