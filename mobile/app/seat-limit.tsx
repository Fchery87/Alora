import { useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/ThemeProvider";
import { ModalScreen } from "../components/ModalScreen";
import { AppText, PressableScale } from "../components/Themed";
import { setSeatLimit, useFamilyMembers, useSeatLimit } from "../data/useData";

// Preset caps offered in the picker. null = no limit (the default).
const OPTIONS: (number | null)[] = [null, 2, 3, 4, 5, 6];

export default function SeatLimitScreen() {
  const theme = useTheme();
  const router = useRouter();
  const seatLimitState = useSeatLimit();
  const members = useFamilyMembers();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = seatLimitState.status === "ready" ? seatLimitState.data : undefined;
  const memberCount = members.status === "ready" ? members.data.length : 0;

  async function choose(option: number | null) {
    if (saving || option === current) return;
    setSaving(true);
    setError(null);
    try {
      await setSeatLimit(option);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the seat limit.");
      setSaving(false);
    }
  }

  return (
    <ModalScreen title="Caregiver seat limit">
      <AppText variant="body" color="inkSoft">
        Decide how many caregivers can join {members.status === "ready" ? "your family" : "the family"}. There’s no
        limit by default — parents can agree on a cap whenever they want one.
      </AppText>

      <View
        style={{
          marginTop: 16,
          backgroundColor: theme.color.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.color.line,
          borderRadius: theme.radius.lg,
          overflow: "hidden",
        }}
      >
        {OPTIONS.map((option, index) => {
          const selected = option === current;
          return (
            <View key={option === null ? "null" : String(option)}>
              {index > 0 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.color.line }} />}
              <PressableScale
                scale={0.99}
                disabled={saving}
                onPress={() => choose(option)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 15,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.color.surface2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SeatGlyph size={18} color={selected ? theme.color.accent : theme.color.inkFaint} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="medium">
                    {option === null ? "No limit" : `${option} caregivers`}
                  </AppText>
                  <AppText variant="caption" color="inkSoft">
                    {option === null
                      ? "Anyone with a valid invite can join"
                      : memberCount >= option
                        ? "Your family is at this cap already"
                        : `${memberCount} of ${option} seats used`}
                  </AppText>
                </View>
                {selected && (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      backgroundColor: theme.color.accent,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M5 13l4 4L19 7"
                        stroke="#fff"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                )}
              </PressableScale>
            </View>
          );
        })}
      </View>

      {error && (
        <AppText variant="caption" color="danger" style={{ marginTop: 12, textAlign: "center" }}>
          {error}
        </AppText>
      )}

      <AppText variant="caption" color="inkFaint" style={{ marginTop: 20, textAlign: "center", lineHeight: 17 }}>
        New invites can’t be redeemed once the family reaches the cap. Changes are recorded in your trust log, and any
        caregiver can change this anytime.
      </AppText>
    </ModalScreen>
  );
}

function SeatGlyph({ size = 18, color = "#000" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path
        d="M2.5 19c.6-2.6 3-4.5 6.5-4.5s5.9 1.9 6.5 4.5M16 5.5a3 3 0 0 1 0 5.6M17.5 14.7c2 .6 3.4 2.2 4 4.3"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}
