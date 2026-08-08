import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  ScrollView,
  type StyleProp,
  Text,
  type TextProps,
  View,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Backdrop } from "./Backdrop";
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { playHaptic, type HapticFeedback } from "../lib/haptics";
import { useTheme } from "../theme/ThemeProvider";
import type { ColorTokens } from "../theme/tokens";

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);
const PRESS_EASE = Easing.bezier(0.23, 1, 0.32, 1);

/** Standard scrollable screen: safe-area top, generous bottom for the tab bar. */
export function ScreenScroll({ children }: { children?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <Backdrop />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.layout.screenHorizontalPadding,
            paddingTop: 8,
            paddingBottom: 140,
          }}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Centered state container (loading/empty/error). */
export function CenterState({ children }: { children?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <Backdrop />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, paddingBottom: 80 }}
        >
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

type Variant = "hero" | "display" | "title" | "heading" | "body" | "label" | "caption";
type FontWeight = "regular" | "medium" | "semibold" | "bold";

function familyFor(theme: ReturnType<typeof useTheme>, display: boolean, weight: FontWeight) {
  if (display) return weight === "regular" ? theme.fonts.displayRegular : theme.fonts.displayMedium;
  switch (weight) {
    case "bold":
      return theme.fonts.bodyBold;
    case "semibold":
      return theme.fonts.bodySemiBold;
    case "medium":
      return theme.fonts.bodyMedium;
    default:
      return theme.fonts.bodyRegular;
  }
}

export function AppText({
  variant = "body",
  display = false,
  weight = "regular",
  color = "ink",
  style,
  children,
  ...rest
}: TextProps & {
  variant?: Variant;
  display?: boolean;
  weight?: FontWeight;
  color?: keyof ColorTokens;
}) {
  const theme = useTheme();
  const t = theme.typeStyle[variant];
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: familyFor(theme, display, weight),
          fontSize: t.size,
          lineHeight: t.lineHeight,
          color: theme.color[color],
          letterSpacing: t.tracking,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({ style, children, ...rest }: ViewProps & { children?: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.color.surface,
          borderColor: theme.color.line,
          borderWidth: theme.border.hairline,
          borderRadius: theme.radius.lg,
          ...shadowFor(theme.shadow.sm),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Pressable that scales down on press with an interruptible reanimated spring. */
export function PressableScale({
  style,
  children,
  scale = 0.985,
  onPressIn,
  onPressOut,
  haptic = "light",
  disabled,
  ...rest
}: Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  scale?: number;
  haptic?: HapticFeedback;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const s = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const isInteractive = Boolean(onPressIn || rest.onPress || rest.onLongPress);
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled && isInteractive) playHaptic(haptic);
        s.value = withTiming(scale, { duration: theme.motion.duration.fast, easing: PRESS_EASE });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withTiming(1, { duration: theme.motion.duration.fast, easing: PRESS_EASE });
        onPressOut?.(e);
      }}
      style={[style, animated]}
    >
      {children as ReactNode}
    </AnimatedPressable>
  );
}

/** Shimmering placeholder for loading states. */
export function Skeleton({ style }: { style?: ViewStyle }) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[{ backgroundColor: theme.color.surface2, borderRadius: theme.radius.sm, opacity: pulse }, style]}
    />
  );
}

function shadowFor({ y, blur, opacity }: { y: number; blur: number; opacity: number }) {
  return {
    shadowColor: "#141113",
    shadowOpacity: opacity,
    shadowRadius: blur,
    shadowOffset: { width: 0, height: y },
    elevation: Math.max(1, Math.round(y / 2)),
  };
}
