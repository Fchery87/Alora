import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { AppText, PressableScale } from "./Themed";
import type { ReactNode } from "react";

/**
 * Shared action primitives — Warm Editorial (design.md §10.5–10.7).
 * Heights 54–58, radius 16–18, weight 600, press scale via PressableScale.
 */

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  color = "accent",
  style,
  children,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Contextual color: accent (default), private (Check-In sage), indigo (Invite lavender). */
  color?: "accent" | "private" | "indigo" | "danger";
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const bg = theme.color[color === "accent" ? "accent" : color];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          minHeight: 54,
          borderRadius: theme.radius.lg,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
          paddingHorizontal: 24,
          opacity: disabled || loading ? 0.55 : 1,
        },
        style,
      ]}
    >
      {children ??
        (loading ? (
          <AppText variant="heading" weight="semibold" style={{ color: theme.color.onAccent }}>
            Saving…
          </AppText>
        ) : (
          <AppText variant="heading" weight="semibold" style={{ color: theme.color.onAccent }}>
            {label}
          </AppText>
        ))}
    </PressableScale>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          minHeight: 54,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.color.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.color.lineStrong,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
          paddingHorizontal: 24,
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      <AppText variant="heading" weight="medium" color="ink">
        {label}
      </AppText>
    </PressableScale>
  );
}

export function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      style={[
        {
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          borderRadius: theme.radius.md,
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: selected ? theme.color.ink : theme.color.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: selected ? theme.color.ink : theme.color.line,
        },
        style,
      ]}
    >
      {icon}
      <AppText
        variant="label"
        weight={selected ? "semibold" : "medium"}
        style={{ color: selected ? theme.color.surface : theme.color.ink }}
      >
        {label}
      </AppText>
    </PressableScale>
  );
}
