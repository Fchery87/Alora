import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/ThemeProvider";

/** Soft "dawn sky" background gradient for screens (mirrors the prototype's
 *  radial bg as a diagonal — RN gradients are linear). */
export function Backdrop() {
  const theme = useTheme();
  return (
    <LinearGradient
      colors={[theme.color.bgGrad1, theme.color.bg, theme.color.bgGrad2]}
      locations={[0, 0.5, 1]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
