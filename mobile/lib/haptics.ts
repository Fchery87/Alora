import * as Haptics from "expo-haptics";

export type HapticFeedback = "none" | "selection" | "light" | "medium" | "success" | "warning";

export function playHaptic(feedback: HapticFeedback = "light") {
  if (feedback === "none") return;

  try {
    if (feedback === "selection") {
      void Haptics.selectionAsync().catch(() => undefined);
      return;
    }

    if (feedback === "success") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      return;
    }

    if (feedback === "warning") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
      return;
    }

    const style = feedback === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
    void Haptics.impactAsync(style).catch(() => undefined);
  } catch {
    // Haptics are best-effort and unavailable on some devices/simulators/web.
  }
}
