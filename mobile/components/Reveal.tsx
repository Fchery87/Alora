import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Staggered entrance for a column of cards (Emil: short 30–80ms stagger).
 * Plays on mount — Expo Router remounts screens on tab switch, so it
 * replays each visit. 360ms reveal, 45ms row stagger (Warm Editorial motion).
 * Falls back to a static View when the OS reduce-motion setting is on.
 */
export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: ViewStyle }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <View style={style}>{children}</View>;
  return (
    <Animated.View style={style} entering={FadeInDown.duration(360).delay(40 + index * 45)}>
      {children}
    </Animated.View>
  );
}
