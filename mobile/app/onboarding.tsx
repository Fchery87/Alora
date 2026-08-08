import { useEffect, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import Animated, {
  Easing,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";
import { AppText, Card, PressableScale } from "../components/Themed";
import { PrimaryButton } from "../components/buttons";
import { Backdrop } from "../components/Backdrop";
import { ChevronRight } from "../components/icons";
import { usePrefersReducedMotion } from "../components/usePrefersReducedMotion";
import { saveBabyProfile } from "../data/useData";

const TOTAL = 4;
const AGE_OPTIONS = ["0–3 mo", "3–6 mo", "6–9 mo"];

export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [babyName, setBabyName] = useState("");
  const [babyAge, setBabyAge] = useState("0–3 mo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finishOnboarding() {
    setSaving(true);
    setError(null);
    try {
      await saveBabyProfile({ name: babyName, ageLabel: babyAge });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your baby's profile.");
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (saving) return;
    if (step < TOTAL - 1) {
      setStep(step + 1);
      return;
    }
    await finishOnboarding();
  }

  const back = () => {
    if (saving) return;
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <Backdrop />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 22,
          paddingTop: 14,
          paddingBottom: 6,
        }}
      >
        <PressableScale
          disabled={saving}
          scale={0.9}
          onPress={back}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.color.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.color.line,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 6l-6 6 6 6"
              stroke={theme.color.ink}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </PressableScale>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View
              key={i}
              style={{
                height: 6,
                width: i === step ? 22 : 6,
                borderRadius: 999,
                backgroundColor: i === step ? theme.color.accent : theme.color.lineStrong,
              }}
            />
          ))}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View
        key={step}
        entering={reduced ? undefined : SlideInRight.duration(360).easing(Easing.bezier(0.23, 1, 0.32, 1))}
        style={{ flex: 1, paddingHorizontal: 26 }}
      >
        {step === 0 && <Welcome />}
        {step === 1 && <Privacy />}
        {step === 2 && (
          <BabySetup
            name={babyName}
            age={babyAge}
            onNameChange={setBabyName}
            onAgeChange={setBabyAge}
            disabled={saving}
          />
        )}
        {step === 3 && <InviteStep />}
      </Animated.View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        {error && (
          <AppText variant="caption" color="danger" style={{ marginBottom: 10, textAlign: "center" }}>
            {error}
          </AppText>
        )}
        <PrimaryButton
          disabled={saving}
          loading={saving}
          label={step === 0 ? "Get started" : step === TOTAL - 1 ? "Enter Alora" : "Continue"}
          onPress={next}
          style={{ flexDirection: "row", gap: 8 }}
        >
          <AppText variant="heading" weight="semibold" style={{ color: theme.color.onAccent }}>
            {saving ? "Saving…" : step === 0 ? "Get started" : step === TOTAL - 1 ? "Enter Alora" : "Continue"}
          </AppText>
          <ChevronRight size={18} color={theme.color.onAccent} strokeWidth={2.4} />
        </PrimaryButton>
        {step === TOTAL - 1 && (
          <PressableScale
            disabled={saving}
            scale={0.98}
            onPress={finishOnboarding}
            style={{ paddingVertical: 14, alignItems: "center", marginTop: 4, opacity: saving ? 0.7 : 1 }}
          >
            <AppText variant="body" weight="semibold" color="inkSoft">
              I’ll invite my co-caregiver later
            </AppText>
          </PressableScale>
        )}
      </View>
    </SafeAreaView>
  );
}

/** Warm Editorial sun mark — brand moment (alora-sun-mark.svg). */
function SunMark({ size = 120 }: { size?: number }) {
  const theme = useTheme();
  const c = theme.color.accent;
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Circle cx="48" cy="48" r="17" stroke={c} strokeWidth={3} />
      <Circle cx="48" cy="48" r="10" stroke={c} strokeWidth={2} opacity={0.65} />
      <g stroke={c} strokeWidth={3} strokeLinecap="round">
        <Path d="M48 7v13M48 76v13M7 48h13M76 48h13M19 19l9 9M68 68l9 9M77 19l-9 9M28 68l-9 9" />
      </g>
      <Path d="M33 54c7 8 23 8 30 0" stroke={c} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
    </Svg>
  );
}

function Welcome() {
  const theme = useTheme();
  const p = useSharedValue(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return;
    p.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [p, reduced]);
  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0, 1], [1, 1.1]) }],
    opacity: interpolate(p.value, [0, 1], [0.5, 0.2]),
  }));
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 150, height: 150, alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            style={[
              {
                position: "absolute",
                width: 132,
                height: 132,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: theme.color.accent,
              },
              ring,
            ]}
          />
          <SunMark size={120} />
        </View>
      </View>
      <AppText display variant="hero" weight="medium" style={{ fontSize: 48, lineHeight: 52 }}>
        Alora
      </AppText>
      <AppText variant="heading" color="inkSoft" style={{ marginTop: 12, lineHeight: 24, marginBottom: 10 }}>
        A calm, shared home for the first months — fast logging, easy handoffs, and a quiet moment for you.
      </AppText>
    </View>
  );
}

function Privacy() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <AppText display variant="display" weight="medium" style={{ lineHeight: 36 }}>
        What’s shared,{"\n"}and what’s yours.
      </AppText>
      <AppText variant="heading" color="inkSoft" style={{ marginTop: 12, marginBottom: 22 }}>
        Two clear boundaries. No surprises.
      </AppText>
      <TrustCard
        tint={theme.color.feedTint}
        fg={theme.color.feed}
        title="Shared with your family"
        body="Feeds, diapers, sleep, and the timeline — so both caregivers always see the same picture."
        icon="users"
      />
      <View style={{ height: 12 }} />
      <TrustCard
        tint={theme.color.diaperTint}
        fg={theme.color.diaper}
        title="Private to you"
        body="Your daily check-ins and reflections never leave your account — your partner can't see them."
        icon="lock"
      />
    </View>
  );
}

function BabySetup({
  name,
  age,
  onNameChange,
  onAgeChange,
  disabled,
}: {
  name: string;
  age: string;
  onNameChange: (name: string) => void;
  onAgeChange: (age: string) => void;
  disabled: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <AppText display variant="display" weight="medium" style={{ lineHeight: 36 }}>
        Tell us about{"\n"}your baby.
      </AppText>
      <AppText variant="heading" color="inkSoft" style={{ marginTop: 12, marginBottom: 24 }}>
        Just enough to start logging. The rest can wait.
      </AppText>
      <AppText variant="label" weight="semibold" color="inkFaint" style={{ letterSpacing: 0.6, marginBottom: 10 }}>
        NAME
      </AppText>
      <TextInput
        value={name}
        onChangeText={onNameChange}
        editable={!disabled}
        placeholder="Baby's name"
        placeholderTextColor={theme.color.inkFaint}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 18,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.color.surface,
          borderWidth: 1.5,
          borderColor: theme.color.line,
          fontFamily: theme.fonts.bodyRegular,
          fontSize: 20,
          color: theme.color.ink,
          opacity: disabled ? 0.7 : 1,
        }}
      />
      <AppText
        variant="label"
        weight="semibold"
        color="inkFaint"
        style={{ letterSpacing: 0.6, marginTop: 24, marginBottom: 11 }}
      >
        AGE
      </AppText>
      <View style={{ flexDirection: "row", gap: 9 }}>
        {AGE_OPTIONS.map((option) => {
          const on = age === option;
          return (
            <PressableScale
              key={option}
              disabled={disabled}
              scale={0.95}
              onPress={() => onAgeChange(option)}
              style={{
                paddingHorizontal: 17,
                paddingVertical: 11,
                borderRadius: 999,
                backgroundColor: theme.color.surface,
                borderWidth: 1.5,
                borderColor: on ? theme.color.accent : theme.color.line,
                opacity: disabled ? 0.7 : 1,
              }}
            >
              <AppText variant="body" weight="semibold" style={{ color: on ? theme.color.ink : theme.color.inkSoft }}>
                {option}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

function InviteStep() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              backgroundColor: theme.color.feed,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText weight="bold" style={{ color: theme.color.onAccent, fontSize: 24 }}>
              A
            </AppText>
          </View>
          <View style={{ width: 28, height: 2, backgroundColor: theme.color.lineStrong }} />
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              backgroundColor: theme.color.sleep,
              opacity: 0.5,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText weight="bold" style={{ color: theme.color.onAccent, fontSize: 24 }}>
              +
            </AppText>
          </View>
        </View>
      </View>
      <AppText display variant="display" weight="medium" style={{ lineHeight: 36 }}>
        Care is easier{"\n"}together.
      </AppText>
      <AppText variant="heading" color="inkSoft" style={{ marginTop: 12, lineHeight: 24 }}>
        Invite one more caregiver. They’ll see the same baby record and you’ll always know who did what.
      </AppText>
    </View>
  );
}

function TrustCard({
  tint,
  fg,
  title,
  body,
  icon,
}: {
  tint: string;
  fg: string;
  title: string;
  body: string;
  icon: "users" | "lock";
}) {
  const theme = useTheme();
  return (
    <Card style={{ flexDirection: "row", gap: 14, padding: 18 }}>
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: theme.radius.md,
          backgroundColor: tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon === "users" ? (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="9" cy="8" r="3" stroke={fg} strokeWidth={1.7} />
            <Path
              d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-2.3-4.5"
              stroke={fg}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Rect
              x="5"
              y="11"
              width="14"
              height="9"
              rx="2"
              stroke={fg}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M8 11V8a4 4 0 0 1 8 0v3"
              stroke={fg}
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="heading" weight="semibold">
          {title}
        </AppText>
        <AppText variant="caption" color="inkSoft" style={{ marginTop: 3, lineHeight: 17 }}>
          {body}
        </AppText>
      </View>
    </Card>
  );
}
