import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";
import { ModalScreen } from "../components/ModalScreen";
import { AppText, PressableScale } from "../components/Themed";
import { deleteAccount } from "../data/useData";

const OUT = Easing.bezier(0.23, 1, 0.32, 1);

export default function DeleteAccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [holding, setHolding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progress = useSharedValue(0);

  async function completeDelete() {
    if (deleting || done) return;
    setHolding(false);
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this account.");
      progress.value = withTiming(0, { duration: 200, easing: OUT });
    } finally {
      setDeleting(false);
    }
  }

  // Hold-to-delete: deliberate 2s fill on press, snappy 200ms snap-back on release.
  const start = () => {
    if (deleting) return;
    setHolding(true);
    progress.value = withTiming(1, { duration: 2000, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(completeDelete)();
    });
  };
  const cancel = () => {
    if (deleting) return;
    setHolding(false);
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 200, easing: OUT });
  };

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  if (done) return <DoneState onClose={() => router.back()} />;

  return (
    <ModalScreen title="Delete account" scroll={false}>
      <AppText display variant="title" weight="medium" style={{ marginTop: 4 }}>Before you go.</AppText>
      <AppText variant="body" color="inkSoft" style={{ marginTop: 6, marginBottom: 20 }}>
        You're the owner of Maya's family. Here's exactly what happens:
      </AppText>

      <Consequence color={theme.color.sleep} text="Sam becomes the owner." rest=" They keep full access to Maya's record so care isn't interrupted." icon="swap" />
      <Consequence color={theme.color.positive} text="Maya's shared history stays" rest=" with the family. Your name on past entries becomes “former caregiver.”" icon="check" />
      <Consequence color={theme.color.danger} text="Your check-ins and personal info are erased" rest=" permanently. This can't be undone." icon="trash" />

      <View style={{ flex: 1 }} />
      {error && <AppText variant="caption" color="danger" style={{ marginBottom: 10, textAlign: "center" }}>{error}</AppText>}

      <PressableScale
        disabled={deleting}
        scale={0.99}
        haptic="warning"
        onPressIn={start}
        onPressOut={cancel}
        style={{ overflow: "hidden", borderRadius: theme.radius.lg, borderWidth: 1.5, borderColor: theme.color.danger, marginBottom: 8, opacity: deleting ? 0.75 : 1 }}
      >
        <Animated.View style={[{ position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", backgroundColor: theme.color.danger, transformOrigin: "left" }, fillStyle]} />
        <View style={{ paddingVertical: 18, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 }}>
          <Trash color={holding || deleting ? "#fff" : theme.color.danger} />
          <AppText variant="heading" weight="bold" style={{ color: holding || deleting ? "#fff" : theme.color.danger }}>
            {deleting ? "Deleting…" : holding ? "Keep holding…" : "Hold to delete"}
          </AppText>
        </View>
      </PressableScale>
      <PressableScale disabled={deleting} scale={0.98} onPress={() => router.back()} style={{ paddingVertical: 14, alignItems: "center", marginBottom: 6, opacity: deleting ? 0.7 : 1 }}>
        <AppText variant="body" weight="semibold" color="inkSoft">Keep my account</AppText>
      </PressableScale>
    </ModalScreen>
  );
}

function DoneState({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const scale = useSharedValue(0.6);
  scale.value = withSpring(1, { duration: 500, dampingRatio: 0.6 });
  const badge = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: scale.value }));
  return (
    <ModalScreen title="Delete account" scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[{ width: 64, height: 64, borderRadius: 999, backgroundColor: theme.color.inkSoft, alignItems: "center", justifyContent: "center" }, badge]}>
          <Check color="#fff" size={30} />
        </Animated.View>
        <AppText display variant="title" weight="medium" style={{ marginTop: 20 }}>Account deleted.</AppText>
        <AppText variant="body" color="inkSoft" style={{ marginTop: 8, textAlign: "center", paddingHorizontal: 20 }}>
          Ownership of Maya's family has passed to Sam. Take care of yourself.
        </AppText>
        <PressableScale onPress={onClose} style={{ marginTop: 26, paddingVertical: 15, paddingHorizontal: 40, borderRadius: theme.radius.lg, backgroundColor: theme.color.ink }}>
          <AppText weight="bold" style={{ color: "#fff" }}>Done</AppText>
        </PressableScale>
      </View>
    </ModalScreen>
  );
}

function Consequence({ color, text, rest, icon }: { color: string; text: string; rest: string; icon: "swap" | "check" | "trash" }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 13, padding: 15, borderRadius: theme.radius.lg, backgroundColor: theme.color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.line, marginBottom: 10 }}>
      <View style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
        {icon === "swap" ? <Swap /> : icon === "check" ? <Check color="#fff" size={15} /> : <Trash color="#fff" size={15} />}
      </View>
      <AppText variant="body" style={{ flex: 1, lineHeight: 21 }}>
        <AppText variant="body" weight="bold">{text}</AppText>
        <AppText variant="body" color="inkSoft">{rest}</AppText>
      </AppText>
    </View>
  );
}

function Trash({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function Check({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function Swap() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h13l-3-3M20 16H7l3 3" stroke="#fff" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
