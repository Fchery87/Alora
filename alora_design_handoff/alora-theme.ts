/**
 * Alora AAA — Warm Editorial theme tokens
 * Reference: assets/reference/alora-aaa-design-board-16x9.png
 *
 * Intended to replace/merge with mobile/theme/tokens.ts.
 * Do not bundle font files. Load Playfair Display + Inter through your existing
 * @expo-google-fonts setup.
 */

export const brand = {
  warmSand: "#F2E7D9",
  ivory: "#FEFBF7",
  amber: "#D06C31",
  sage: "#83A18C",
  lavender: "#8F86C2",
  indigo: "#2D3249",
  charcoal: "#141113",
} as const;

export const light = {
  background: "#F6EFE6",
  backgroundDeep: "#EEE1D2",
  surface: "#FEFBF7",
  surfaceRaised: "#FFFDFC",
  surfaceMuted: "#F2E8DC",
  textPrimary: "#141113",
  textSecondary: "#6F6259",
  textTertiary: "#998B80",
  border: "#E6D7C6",
  borderStrong: "#D5C2AF",
  shadow: "#5D4633",
  primary: "#D06C31",
  primaryPressed: "#B75A29",
  primarySoft: "#F8E4D4",
  private: "#6F9E86",
  privateSoft: "#E4F0E9",
  sleep: "#8F86C2",
  sleepSoft: "#ECE9F8",
  indigo: "#2D3249",
  indigoSoft: "#E7E9F1",
  danger: "#C54E38",
  dangerSoft: "#F8E4DF",
  success: "#5F927A",
  warning: "#C88A2B",
} as const;

export const dark = {
  background: "#0F0D0E",
  backgroundDeep: "#090809",
  surface: "#181416",
  surfaceRaised: "#211B19",
  surfaceMuted: "#271F1B",
  textPrimary: "#FFF8F0",
  textSecondary: "#C3B5A8",
  textTertiary: "#897B71",
  border: "#382D29",
  borderStrong: "#4A3A33",
  shadow: "#000000",
  primary: "#E89A61",
  primaryPressed: "#CF7F46",
  primarySoft: "#3B281F",
  private: "#86B29B",
  privateSoft: "#1E3029",
  sleep: "#A39ADC",
  sleepSoft: "#29263B",
  indigo: "#858FB9",
  indigoSoft: "#252A3A",
  danger: "#E06A55",
  dangerSoft: "#3A211D",
  success: "#7FB099",
  warning: "#D3A44A",
} as const;

export const eventColors = {
  feed: { base: "#D06C31", soft: "#F8E4D4" },
  diaper: { base: "#83A18C", soft: "#E4EFE8" },
  sleep: { base: "#8F86C2", soft: "#ECE9F8" },
  growth: { base: "#6373A7", soft: "#E7EAF4" },
  checkin: { base: "#6F9E86", soft: "#E4F0E9" },
  warning: { base: "#C88A2B", soft: "#FAEED5" },
  danger: { base: "#C54E38", soft: "#F8E4DF" },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
} as const;

export const type = {
  displayFamily: "PlayfairDisplay_500Medium",
  displayRegular: "PlayfairDisplay_400Regular",
  uiFamily: "Inter_400Regular",
  uiMedium: "Inter_500Medium",
  uiSemibold: "Inter_600SemiBold",
  uiBold: "Inter_700Bold",
  displayXL: { fontSize: 44, lineHeight: 50, letterSpacing: -0.6 },
  displayL: { fontSize: 36, lineHeight: 42, letterSpacing: -0.45 },
  h1: { fontSize: 30, lineHeight: 36, letterSpacing: -0.35 },
  h2: { fontSize: 24, lineHeight: 30, letterSpacing: -0.2 },
  h3: { fontSize: 20, lineHeight: 26, letterSpacing: -0.1 },
  bodyL: { fontSize: 17, lineHeight: 25 },
  body: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  caption: { fontSize: 12, lineHeight: 17, letterSpacing: 0.1 },
  micro: { fontSize: 11, lineHeight: 15, letterSpacing: 0.2 },
} as const;

export const layout = {
  screenHorizontalPadding: 20,
  screenTopPadding: 16,
  cardGap: 12,
  sectionGap: 28,
  minTapTarget: 44,
  bottomNavHeight: 68,
  bottomNavBottomInset: 10,
} as const;

export const motion = {
  pressScale: 0.985,
  fastMs: 140,
  standardMs: 220,
  slowMs: 360,
  staggerMs: 45,
  spring: { damping: 19, stiffness: 190, mass: 0.9 },
} as const;
