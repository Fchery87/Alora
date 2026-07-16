import { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText, Card, PressableScale, ScreenScroll } from "../../components/Themed";
import { CheckInIcon, ChevronRight } from "../../components/icons";
import { createCheckIn } from "../../data/useData";
import type { CheckInMood } from "../../data/repository";

const MOODS: { face: string; label: string; mood: CheckInMood }[] = [
  { face: "😞", label: "Low", mood: "low" },
  { face: "😕", label: "Tired", mood: "tired" },
  { face: "😐", label: "Okay", mood: "okay" },
  { face: "🙂", label: "Good", mood: "good" },
  { face: "😊", label: "Great", mood: "great" },
];

export default function CheckInScreen() {
  const theme = useTheme();
  const [mood, setMood] = useState<number | null>(null);
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveCheckIn() {
    if (mood === null || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await createCheckIn({ mood: MOODS[mood].mood, reflection: reflection.trim() || undefined });
      setMood(null);
      setReflection("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save check-in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenScroll>
      <View style={{ paddingTop: 8, paddingBottom: 18 }}>
        <AppText display variant="display" weight="medium">Check-In</AppText>
        <AppText variant="body" color="inkSoft" style={{ marginTop: 4 }}>A quiet moment, just for you.</AppText>
      </View>

      <Card style={{ padding: 22, borderRadius: theme.radius.xl, backgroundColor: theme.color.diaperTint }}>
        <View style={{ flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.color.diaper + "22", marginBottom: 16 }}>
          <Lock color={theme.color.diaper} />
          <AppText variant="caption" weight="semibold" style={{ color: theme.color.diaper }}>Private · only you can see this</AppText>
        </View>

        <AppText display variant="title" weight="medium" style={{ lineHeight: 30 }}>How are you doing today?</AppText>
        <AppText variant="body" color="inkSoft" style={{ marginTop: 8 }}>No streaks, no scores. Just a check-in.</AppText>

        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 24 }}>
          {MOODS.map((m, i) => {
            const on = mood === i;
            return (
              <PressableScale key={m.label} scale={0.93} haptic="selection" onPress={() => { setMood(i); setSaved(false); }}
                style={{ flex: 1, alignItems: "center", gap: 8, paddingVertical: 14, borderRadius: theme.radius.lg, backgroundColor: on ? theme.color.surface : "transparent", borderWidth: 1.5, borderColor: on ? theme.color.diaper : "transparent" }}>
                <AppText style={{ fontSize: 26 }}>{m.face}</AppText>
                <AppText weight="semibold" style={{ fontSize: 10.5, color: on ? theme.color.ink : theme.color.inkSoft }}>{m.label}</AppText>
              </PressableScale>
            );
          })}
        </View>

        <TextInput
          placeholder="Anything on your mind? (optional)"
          placeholderTextColor={theme.color.inkFaint}
          multiline
          value={reflection}
          onChangeText={(text) => { setReflection(text); setSaved(false); }}
          style={{ marginTop: 20, minHeight: 84, padding: 15, borderRadius: theme.radius.lg, backgroundColor: theme.color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.line, fontFamily: theme.fonts.bodyRegular, fontSize: 15, color: theme.color.ink, textAlignVertical: "top" }}
        />

        {saved && <AppText variant="caption" style={{ marginTop: 12, textAlign: "center", color: theme.color.diaper }}>Saved privately on this device.</AppText>}
        {error && <AppText variant="caption" color="danger" style={{ marginTop: 12, textAlign: "center" }}>{error}</AppText>}

        <PressableScale scale={0.98} onPress={saveCheckIn} disabled={mood === null || saving} style={{ marginTop: 18, padding: 16, borderRadius: theme.radius.lg, backgroundColor: theme.color.diaper, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: mood === null || saving ? 0.5 : 1 }}>
          <AppText variant="heading" weight="bold" style={{ color: "#fff" }}>{saving ? "Saving..." : mood === null ? "Pick a mood to continue" : "Save check-in"}</AppText>
          {mood !== null && <ChevronRight size={18} color="#fff" strokeWidth={2.4} />}
        </PressableScale>
      </Card>

      {/* Always-available support — non-triggered, non-clinical */}
      <Card style={{ marginTop: 26, padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <CheckInIcon size={22} color={theme.color.diaper} />
          <AppText variant="heading" weight="semibold">Support, whenever you need it</AppText>
        </View>
        <AppText variant="caption" color="inkSoft" style={{ marginTop: 9, lineHeight: 17 }}>
          Early parenthood is a lot. If you'd like to talk to someone, these free, confidential lines are always here — no diagnosis, no judgment.
        </AppText>
        <Resource title="988 Suicide & Crisis Lifeline" detail="Call or text, 24/7 · US" badge="988" />
        <Resource title="Postpartum Support International" detail="Helpline 1-800-944-4773" badge="PSI" />
      </Card>

      <AppText variant="caption" color="inkFaint" style={{ marginTop: 18, textAlign: "center", lineHeight: 17 }}>
        Alora is not a medical or crisis service and does not provide diagnosis or treatment. If you're in immediate danger, call your local emergency number.
      </AppText>
    </ScreenScroll>
  );
}

function Resource({ title, detail, badge }: { title: string; detail: string; badge: string }) {
  const theme = useTheme();
  return (
    <PressableScale scale={0.98} haptic="none" style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14, padding: 13, borderRadius: theme.radius.md, backgroundColor: theme.color.surface2, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.line }}>
      <AppText display weight="bold" style={{ color: theme.color.diaper, fontSize: badge.length > 3 ? 13 : 18, width: 40 }}>{badge}</AppText>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold">{title}</AppText>
        <AppText variant="caption" color="inkSoft">{detail}</AppText>
      </View>
      <ChevronRight size={18} color={theme.color.inkFaint} strokeWidth={2} />
    </PressableScale>
  );
}

function Lock({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="9" rx="2" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
