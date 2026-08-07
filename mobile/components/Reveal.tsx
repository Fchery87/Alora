import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/**
 * Staggered entrance for a column of cards (Emil: short 30–80ms stagger).
 * Plays on mount — Expo Router remounts screens on tab switch, so it
 * replays each visit.
 */
export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: ViewStyle }) {
  return (
    <Animated.View style={style} entering={FadeInDown.duration(420).delay(40 + index * 50)}>
      {children}
    </Animated.View>
  );
}
