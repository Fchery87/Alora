import { useMemo, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";
import { ModalScreen } from "../components/ModalScreen";
import { AppText, CenterState, PressableScale, Skeleton } from "../components/Themed";
import { FeedIcon } from "../components/icons";
import { clockLabel } from "../data/mock";
import type { CareEvent } from "../data/repository";
import { softDeleteCareEvent, updateCareEvent, useTimeline } from "../data/useData";

type Pick = "primary" | "duplicate";
type Result = null | "merged" | "kept";
type MergeOption = { key: Pick; event: CareEvent; badge: string };

export default function MergeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; duplicateOf?: string }>();
  const timeline = useTimeline();
  const [pick, setPick] = useState<Pick>("primary");
  const [result, setResult] = useState<Result>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo<MergeOption[] | null>(() => {
    if (timeline.status !== "ready" || !params.id || !params.duplicateOf) return null;
    const duplicate = timeline.data.find((event) => event.id === params.id);
    const primary = timeline.data.find((event) => event.id === params.duplicateOf);
    if (!duplicate || !primary || duplicate.duplicateOf !== primary.id) return null;
    return [
      { key: "primary", event: primary, badge: "Original" },
      { key: "duplicate", event: duplicate, badge: duplicate.sync === "edited" ? "Edited" : "Duplicate" },
    ];
  }, [params.duplicateOf, params.id, timeline.status, timeline.data]);

  async function mergeIntoOne() {
    if (saving || !options) return;
    setSaving(true);
    setError(null);
    try {
      const kept = options.find((option) => option.key === pick) ?? options[0];
      const removed = options.find((option) => option.key !== kept.key) ?? options[1];
      if (kept.event.duplicateOf) await updateCareEvent(kept.event.id, { duplicateOf: null });
      await softDeleteCareEvent(removed.event.id);
      setResult("merged");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't merge these entries.");
    } finally {
      setSaving(false);
    }
  }

  async function keepBoth() {
    if (saving || !options) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        options.map((option) =>
          option.event.duplicateOf ? updateCareEvent(option.event.id, { duplicateOf: null }) : Promise.resolve(),
        ),
      );
      setResult("kept");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't keep both entries.");
    } finally {
      setSaving(false);
    }
  }

  if (result) return <DoneState result={result} onClose={() => router.back()} />;

  if (timeline.status === "loading") {
    return (
      <ModalScreen title="Possible duplicate" scroll={false}>
        <Skeleton style={{ height: 92, borderRadius: theme.radius.lg }} />
        <View style={{ height: 12 }} />
        <Skeleton style={{ height: 88, borderRadius: theme.radius.lg }} />
        <View style={{ height: 12 }} />
        <Skeleton style={{ height: 88, borderRadius: theme.radius.lg }} />
      </ModalScreen>
    );
  }

  if (timeline.status === "error" || !options) {
    return (
      <ModalScreen title="Possible duplicate" scroll={false}>
        <CenterState>
          <AppText display variant="title" weight="medium">
            Duplicate not found
          </AppText>
          <AppText variant="body" color="inkSoft" style={{ textAlign: "center", marginTop: 8 }}>
            This pair may already have been resolved on the timeline.
          </AppText>
          <PressableScale
            onPress={() => router.back()}
            style={{
              marginTop: 22,
              backgroundColor: theme.color.accent,
              paddingVertical: 13,
              paddingHorizontal: 22,
              borderRadius: 999,
            }}
          >
            <AppText weight="bold" style={{ color: theme.color.onAccent }}>
              Back to timeline
            </AppText>
          </PressableScale>
        </CenterState>
      </ModalScreen>
    );
  }

  const duplicateTime = clockLabel(options.find((option) => option.event.duplicateOf)?.event.at ?? options[0].event.at);

  return (
    <ModalScreen title="Possible duplicate" scroll={false}>
      <View
        style={{
          flexDirection: "row",
          gap: 13,
          padding: 15,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.color.feedTint,
          borderWidth: theme.border.hairline,
          borderColor: theme.color.feed,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FeedIcon size={20} color={theme.color.feed} />
        </View>
        <AppText variant="body" color="inkSoft" style={{ flex: 1, lineHeight: 20 }}>
          Two caregivers logged a similar {options[0].event.subtype.toLowerCase()} around {duplicateTime}. Keep both, or
          merge into a single entry?
        </AppText>
      </View>

      <AppText
        variant="label"
        weight="bold"
        color="inkFaint"
        style={{ letterSpacing: 0.6, marginTop: 22, marginBottom: 11, marginHorizontal: 2 }}
      >
        IF MERGING, KEEP
      </AppText>
      {options.map((option) => {
        const on = pick === option.key;
        const color = option.event.by === "You" ? theme.color.feed : theme.color.sleep;
        return (
          <PressableScale
            key={option.key}
            disabled={saving}
            scale={0.99}
            haptic="selection"
            onPress={() => setPick(option.key)}
            style={{
              flexDirection: "row",
              gap: 13,
              padding: 15,
              borderRadius: theme.radius.lg,
              marginBottom: 11,
              backgroundColor: on ? theme.color.feedTint : theme.color.surface,
              borderWidth: theme.border.emphasis,
              borderColor: on ? theme.color.feed : theme.color.line,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                borderWidth: theme.border.emphasis,
                borderColor: on ? theme.color.feed : theme.color.lineStrong,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}
            >
              {on && <View style={{ width: 11, height: 11, borderRadius: 999, backgroundColor: theme.color.feed }} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    backgroundColor: color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText weight="bold" style={{ color: theme.color.onAccent, fontSize: 10 }}>
                    {option.event.byInitial}
                  </AppText>
                </View>
                <AppText variant="heading" weight="semibold">
                  {option.event.by}
                </AppText>
                <View style={{ flex: 1 }} />
                <AppText variant="caption" color="inkFaint">
                  {clockLabel(option.event.at)}
                </AppText>
              </View>
              <AppText variant="body" color="inkSoft" style={{ marginTop: 5 }}>
                {option.event.subtype}
                {option.event.detail ? ` · ${option.event.detail}` : ""}
              </AppText>
              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: 9,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: color + "22",
                }}
              >
                <AppText weight="bold" style={{ color, fontSize: 10, letterSpacing: 0.3 }}>
                  {option.badge.toUpperCase()}
                </AppText>
              </View>
            </View>
          </PressableScale>
        );
      })}

      <View style={{ flex: 1 }} />
      {error && (
        <AppText variant="caption" color="danger" style={{ marginBottom: 10, textAlign: "center" }}>
          {error}
        </AppText>
      )}

      <PressableScale
        disabled={saving}
        scale={0.98}
        onPress={mergeIntoOne}
        style={{
          paddingVertical: 17,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.color.feed,
          alignItems: "center",
          opacity: saving ? 0.7 : 1,
        }}
      >
        <AppText variant="heading" weight="bold" style={{ color: theme.color.onAccent }}>
          {saving ? "Saving..." : "Merge into one entry"}
        </AppText>
      </PressableScale>
      <PressableScale
        disabled={saving}
        scale={0.98}
        onPress={keepBoth}
        style={{ paddingVertical: 14, alignItems: "center", marginBottom: 6, opacity: saving ? 0.7 : 1 }}
      >
        <AppText variant="body" weight="semibold" color="inkSoft">
          Keep both — they’re different feeds
        </AppText>
      </PressableScale>
    </ModalScreen>
  );
}

function DoneState({ result, onClose }: { result: "merged" | "kept"; onClose: () => void }) {
  const theme = useTheme();
  const scale = useSharedValue(0.6);
  scale.value = withSpring(1, { duration: 500, dampingRatio: 0.6 });
  const badge = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: scale.value }));
  const color = result === "merged" ? theme.color.feed : theme.color.positive;
  return (
    <ModalScreen title="Possible duplicate" scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={[
            {
              width: 64,
              height: 64,
              borderRadius: 999,
              backgroundColor: color,
              alignItems: "center",
              justifyContent: "center",
            },
            badge,
          ]}
        >
          <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke={theme.color.onAccent}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
        <AppText display variant="title" weight="medium" style={{ marginTop: 20 }}>
          {result === "merged" ? "Merged into one" : "Kept both"}
        </AppText>
        <AppText variant="body" color="inkSoft" style={{ marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
          {result === "merged"
            ? "The selected entry was kept and the duplicate removed. The timeline now shows one bottle."
            : "Both entries stay on the timeline. The duplicate flag is cleared."}
        </AppText>
        <PressableScale
          onPress={onClose}
          style={{
            marginTop: 26,
            paddingVertical: 15,
            paddingHorizontal: 40,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.ink,
          }}
        >
          <AppText weight="bold" style={{ color: theme.color.surface }}>
            Done
          </AppText>
        </PressableScale>
      </View>
    </ModalScreen>
  );
}
