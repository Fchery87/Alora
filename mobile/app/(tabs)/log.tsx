import { useState, type ComponentType } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText, Card, PressableScale, ScreenScroll } from "../../components/Themed";
import { FeedIcon, DiaperIcon, SleepIcon, ChevronRight, type IconProps } from "../../components/icons";
import type { EventType } from "../../data/repository";
import { createCareEvent } from "../../data/useData";

const TYPES: { id: EventType; label: string; Icon: ComponentType<IconProps>; colorKey: "feed" | "diaper" | "sleep" }[] = [
  { id: "feed", label: "Feed", Icon: FeedIcon, colorKey: "feed" },
  { id: "diaper", label: "Diaper", Icon: DiaperIcon, colorKey: "diaper" },
  { id: "sleep", label: "Sleep", Icon: SleepIcon, colorKey: "sleep" },
];
const SUBTYPES: Record<EventType, string[]> = {
  feed: ["Breast", "Bottle", "Pumping"],
  diaper: ["Wet", "Dirty", "Mixed"],
  sleep: ["Nap", "Night"],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function LogScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [type, setType] = useState<EventType>("feed");
  const [sub, setSub] = useState("Bottle");
  const [quantityMl, setQuantityMl] = useState(120);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [saving, setSaving] = useState(false);
  const [repeatSaving, setRepeatSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = TYPES.find((t) => t.id === type)!;
  const accent = theme.color[active.colorKey];
  const showsQuantity = type === "feed" && (sub === "Bottle" || sub === "Pumping");
  const showsDuration = type === "sleep" || (type === "feed" && sub === "Breast");

  function updateType(nextType: EventType) {
    setType(nextType);
    setSub(SUBTYPES[nextType][0]);
  }

  function buildEventInput() {
    const endAt = new Date();
    const at = type === "sleep" ? new Date(endAt.getTime() - durationMinutes * 60_000) : undefined;
    return {
      type,
      subtype: sub,
      at,
      endAt: type === "sleep" ? endAt : undefined,
      quantity: showsQuantity ? `${quantityMl} ml` : undefined,
      durationMinutes: showsDuration ? durationMinutes : undefined,
    };
  }

  async function saveEvent() {
    if (saving || repeatSaving) return;
    setSaving(true);
    setError(null);
    try {
      await createCareEvent(buildEventInput());
      router.push("/timeline");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this event.");
    } finally {
      setSaving(false);
    }
  }

  async function repeatLastFeed() {
    if (saving || repeatSaving) return;
    setRepeatSaving(true);
    setError(null);
    try {
      await createCareEvent({ type: "feed", subtype: "Bottle", quantity: "120 ml" });
      router.push("/timeline");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't repeat this event.");
    } finally {
      setRepeatSaving(false);
    }
  }

  return (
    <ScreenScroll>
      <View style={{ paddingTop: 8, paddingBottom: 18 }}>
        <AppText display variant="display" weight="medium">Log</AppText>
        <AppText variant="body" color="inkSoft" style={{ marginTop: 4 }}>One hand, a few taps.</AppText>
      </View>

      <View style={{ flexDirection: "row", gap: 6, padding: 6, borderRadius: theme.radius.lg, backgroundColor: theme.color.surfaceSunken, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.line }}>
        {TYPES.map((t) => {
          const on = t.id === type;
          return (
            <PressableScale
              key={t.id}
              scale={0.95}
              haptic="selection"
              onPress={() => updateType(t.id)}
              style={{ flex: 1, alignItems: "center", gap: 6, paddingVertical: 13, borderRadius: theme.radius.md, backgroundColor: on ? theme.color[t.colorKey] : "transparent" }}
            >
              <t.Icon size={22} color={on ? "#fff" : theme.color.inkSoft} strokeWidth={on ? 2 : 1.6} />
              <AppText variant="label" weight="semibold" style={{ color: on ? "#fff" : theme.color.inkSoft }}>{t.label}</AppText>
            </PressableScale>
          );
        })}
      </View>

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 13, marginTop: 16, padding: 14, borderStyle: "dashed", borderColor: theme.color.lineStrong }}>
        <View style={{ width: 38, height: 38, borderRadius: theme.radius.md, backgroundColor: theme.color.feedTint, alignItems: "center", justifyContent: "center" }}>
          <FeedIcon size={20} color={theme.color.feed} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="body" weight="semibold">Repeat last</AppText>
          <AppText variant="caption" color="inkSoft">Bottle · 120 ml · Sam, 2h ago</AppText>
        </View>
        <PressableScale disabled={saving || repeatSaving} onPress={repeatLastFeed} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.color.surface2, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.line, opacity: repeatSaving ? 0.65 : 1 }}>
          <AppText weight="bold" variant="label">{repeatSaving ? "Saving" : "Repeat"}</AppText>
        </PressableScale>
      </Card>

      <AppText variant="label" weight="semibold" color="inkFaint" style={{ letterSpacing: 0.6, marginTop: 24, marginBottom: 11, marginHorizontal: 2 }}>
        {type === "diaper" ? "TYPE" : type === "sleep" ? "KIND" : "METHOD"}
      </AppText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
        {SUBTYPES[type].map((s) => {
          const on = s === sub;
          return (
            <PressableScale
              key={s}
              scale={0.95}
              haptic="selection"
              onPress={() => setSub(s)}
              style={{ paddingHorizontal: 17, paddingVertical: 11, borderRadius: 999, backgroundColor: theme.color.surface, borderWidth: 1.5, borderColor: on ? accent : theme.color.line }}
            >
              <AppText variant="body" weight="semibold" style={{ color: on ? theme.color.ink : theme.color.inkSoft }}>{s}</AppText>
            </PressableScale>
          );
        })}
      </View>

      {(showsQuantity || showsDuration) && (
        <Card style={{ marginTop: 18, padding: 16 }}>
          <AppText variant="label" weight="bold" color="inkFaint" style={{ letterSpacing: 0.6, marginBottom: 12 }}>
            {showsQuantity ? "AMOUNT" : "DURATION"}
          </AppText>
          {showsQuantity ? (
            <Stepper
              value={quantityMl}
              unit="ml"
              step={10}
              min={30}
              max={240}
              onChange={(value) => setQuantityMl(clamp(value, 30, 240))}
              accent={accent}
            />
          ) : (
            <Stepper
              value={durationMinutes}
              unit="min"
              step={5}
              min={5}
              max={180}
              onChange={(value) => setDurationMinutes(clamp(value, 5, 180))}
              accent={accent}
            />
          )}
        </Card>
      )}

      {error && (
        <AppText variant="caption" color="danger" style={{ marginTop: 18, textAlign: "center" }}>{error}</AppText>
      )}
      <PressableScale
        scale={0.98}
        disabled={saving || repeatSaving}
        onPress={saveEvent}
        style={{ marginTop: error ? 12 : 28, padding: 17, borderRadius: theme.radius.lg, backgroundColor: saving ? theme.color.inkFaint : accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: saving || repeatSaving ? 0.75 : 1 }}
      >
        <AppText variant="heading" weight="bold" style={{ color: "#fff" }}>{saving ? "Saving..." : `Save ${sub.toLowerCase()}`}</AppText>
        <ChevronRight size={18} color="#fff" strokeWidth={2.4} />
      </PressableScale>
    </ScreenScroll>
  );
}

function Stepper({ value, unit, step, min, max, onChange, accent }: { value: number; unit: string; step: number; min: number; max: number; onChange: (value: number) => void; accent: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <PressableScale
        scale={0.95}
        disabled={value <= min}
        onPress={() => onChange(value - step)}
        style={{ width: 42, height: 42, borderRadius: 999, borderWidth: 1.5, borderColor: theme.color.line, alignItems: "center", justifyContent: "center", opacity: value <= min ? 0.4 : 1 }}
      >
        <AppText variant="heading" weight="bold">−</AppText>
      </PressableScale>
      <View style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: theme.radius.lg, backgroundColor: accent + "14", borderWidth: StyleSheet.hairlineWidth, borderColor: accent + "55" }}>
        <AppText display variant="title" weight="medium">{value} {unit}</AppText>
        <AppText variant="caption" color="inkSoft" style={{ marginTop: 2 }}>{value === min ? "Minimum" : value === max ? "Maximum" : `Tap + / − to adjust`}</AppText>
      </View>
      <PressableScale
        scale={0.95}
        disabled={value >= max}
        onPress={() => onChange(value + step)}
        style={{ width: 42, height: 42, borderRadius: 999, borderWidth: 1.5, borderColor: theme.color.line, alignItems: "center", justifyContent: "center", opacity: value >= max ? 0.4 : 1 }}
      >
        <AppText variant="heading" weight="bold">+</AppText>
      </PressableScale>
    </View>
  );
}
