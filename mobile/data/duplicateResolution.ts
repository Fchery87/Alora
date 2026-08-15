export type DuplicateResolutionKind = "keep_both" | "merged";

export type DuplicateResolution = {
  eventId: string;
  duplicateOf: string;
  resolution: DuplicateResolutionKind;
};

export type DuplicateCandidate = { id: string; duplicateOf?: string };

export function duplicateResolutionKey(eventId: string, duplicateOf: string): string {
  return [eventId, duplicateOf].sort().join(":");
}

export function applyDuplicateResolutions<T extends DuplicateCandidate>(
  events: T[],
  resolutions: DuplicateResolution[],
): T[] {
  const resolved = new Set(resolutions.map((item) => duplicateResolutionKey(item.eventId, item.duplicateOf)));
  return events.map((event) => {
    if (!event.duplicateOf || !resolved.has(duplicateResolutionKey(event.id, event.duplicateOf))) return event;
    return { ...event, duplicateOf: undefined };
  });
}
