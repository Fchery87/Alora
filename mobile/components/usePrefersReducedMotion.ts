import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * True when the OS "reduce motion" accessibility setting is enabled.
 * Motion components (Reveal, BreathingOrb, tab indicator, done-state
 * springs) check this and fall back to static rendering.
 *
 * Starts as `false` (assume motion) and flips once the async
 * AccessibilityInfo call resolves — entrance animations run on mount,
 * so a reduced-motion user sees one non-animated frame at worst, and
 * prefers-reduce users never get looping animations.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      if (mounted) setReduced(enabled);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
