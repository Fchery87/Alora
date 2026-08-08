import { useEffect, useState, type ComponentType } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";
import { AppText, PressableScale } from "./Themed";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { HomeIcon, LogIcon, TimelineIcon, CheckInIcon, SettingsIcon, type IconProps } from "./icons";

const TABS: Record<string, { label: string; Icon: ComponentType<IconProps> }> = {
  index: { label: "Home", Icon: HomeIcon },
  log: { label: "Log", Icon: LogIcon },
  timeline: { label: "Timeline", Icon: TimelineIcon },
  checkin: { label: "Check-In", Icon: CheckInIcon },
  settings: { label: "Settings", Icon: SettingsIcon },
};

const PAD_H = 8;

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [barW, setBarW] = useState(0);

  const n = state.routes.length;
  const slot = barW > 0 ? (barW - PAD_H * 2) / n : 0;

  const x = useSharedValue(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (slot <= 0) return;
    if (reduced) {
      x.value = state.index * slot;
      return;
    }
    x.value = withSpring(state.index * slot, {
      damping: theme.motion.spring.damping,
      stiffness: theme.motion.spring.stiffness,
      mass: theme.motion.spring.mass,
    });
  }, [state.index, slot, x, theme, reduced]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const onLayout = (e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.bar,
        {
          height: theme.layout.bottomNavHeight,
          bottom: insets.bottom + theme.layout.bottomNavBottomInset,
          backgroundColor: theme.color.surface,
          borderColor: theme.color.line,
          borderRadius: theme.radius.pill,
          ...shadowFor(theme.shadow.floating),
        },
      ]}
    >
      {slot > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: PAD_H,
              top: 7,
              bottom: 7,
              width: slot,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.surface2,
            },
            pillStyle,
          ]}
        />
      )}
      {state.routes.map((route, i) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const active = state.index === i;
        const color = active ? theme.color.ink : theme.color.inkFaint;
        return (
          <PressableScale
            key={route.key}
            scale={0.9}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!active && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <meta.Icon size={22} color={color} strokeWidth={active ? 1.9 : 1.6} />
            <AppText
              variant="caption"
              weight={active ? "semibold" : "medium"}
              style={{ color, fontSize: 10, marginTop: 3 }}
            >
              {meta.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

function shadowFor({ y, blur, opacity }: { y: number; blur: number; opacity: number }) {
  return {
    shadowColor: "#000",
    shadowOpacity: opacity,
    shadowRadius: blur,
    shadowOffset: { width: 0, height: y },
    elevation: Math.max(1, Math.round(y / 2)),
  };
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: PAD_H,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
  },
});
