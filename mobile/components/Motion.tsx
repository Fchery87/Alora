import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Ambient breathing orb for the Home hero — a soft ring that swells and
 * fades behind the status icon. Continuous → ease-in-out (Emil).
 */
export function BreathingOrb({
  coreColor,
  ringColor,
  durationMs = 2300,
  children,
}: {
  coreColor: string;
  ringColor: string;
  durationMs?: number;
  children?: ReactNode;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [p, durationMs]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0, 1], [1, 1.34]) }],
    opacity: interpolate(p.value, [0, 1], [0.18, 0.05]),
  }));

  return (
    <View style={{ width: 60, height: 60, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[{ position: "absolute", width: 50, height: 50, borderRadius: 999, backgroundColor: ringColor }, ring]}
      />
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 999,
          backgroundColor: coreColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Small pulsing "live" dot — a ring that expands and fades, looping. */
export function LiveDot({ color, size = 7 }: { color: string; size?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false);
  }, [p]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0, 1], [1, 2.8]) }],
    opacity: interpolate(p.value, [0, 0.7, 1], [0.5, 0, 0]),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[{ position: "absolute", width: size, height: size, borderRadius: 999, backgroundColor: color }, ring]}
      />
      <View style={{ width: size, height: size, borderRadius: 999, backgroundColor: color }} />
    </View>
  );
}
