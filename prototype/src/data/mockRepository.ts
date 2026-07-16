import {
  events,
  baby,
  lastByType,
} from "./mock";
import {
  type AloraRepository,
  type BabyStatus,
  type CareEvent,
  type Scenario,
  currentScenario,
} from "./repository";

const LATENCY = 650; // ms — simulate a first network/sync read

function delay<T>(value: T, scenario: Scenario): Promise<T> {
  return new Promise((resolve, reject) => {
    if (scenario === "loading") return; // never resolves — shows the loading state
    setTimeout(() => {
      if (scenario === "error") reject(new Error("Couldn't reach the family sync service."));
      else resolve(value);
    }, LATENCY);
  });
}

export const mockRepository: AloraRepository = {
  async getTimeline() {
    const s = currentScenario();
    return delay<CareEvent[]>(s === "empty" ? [] : events, s);
  },

  async getRecentActivity(limit: number) {
    const s = currentScenario();
    return delay<CareEvent[]>(s === "empty" ? [] : events.slice(0, limit), s);
  },

  async getBabyStatus() {
    const s = currentScenario();
    const status: BabyStatus =
      s === "empty"
        ? { name: baby.name, ageLabel: baby.ageLabel, asleep: false }
        : {
            name: baby.name,
            ageLabel: baby.ageLabel,
            asleep: true,
            asleepSince: baby.asleepSince,
            putDownBy: "Sam",
            lastFeed: lastByType("feed"),
            lastDiaper: lastByType("diaper"),
          };
    return delay<BabyStatus>(status, s);
  },
};
