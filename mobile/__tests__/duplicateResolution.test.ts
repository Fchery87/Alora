import {
  applyDuplicateResolutions,
  duplicateResolutionKey,
  type DuplicateResolution,
} from "../data/duplicateResolution";

describe("duplicate resolution persistence", () => {
  test("normalizes a pair so either event order addresses the same decision", () => {
    expect(duplicateResolutionKey("event-b", "event-a")).toBe("event-a:event-b");
    expect(duplicateResolutionKey("event-a", "event-b")).toBe("event-a:event-b");
  });

  test("clears only persisted duplicate decisions and leaves new candidates visible", () => {
    const events = [
      { id: "event-a", duplicateOf: undefined },
      { id: "event-b", duplicateOf: "event-a" },
      { id: "event-c", duplicateOf: "event-a" },
    ];
    const resolutions: DuplicateResolution[] = [
      { eventId: "event-b", duplicateOf: "event-a", resolution: "keep_both" },
    ];

    expect(applyDuplicateResolutions(events, resolutions)).toEqual([
      { id: "event-a", duplicateOf: undefined },
      { id: "event-b", duplicateOf: undefined },
      { id: "event-c", duplicateOf: "event-a" },
    ]);
  });
});
