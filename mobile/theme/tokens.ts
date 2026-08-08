/**
 * Alora design tokens — "Alora AAA — Warm Editorial" (handoff v1.2.0)
 * ------------------------------------------------------------------
 * In the Expo app THIS is the source of truth (there is no CSS). It is
 * the direct descendant of `alora_design_handoff/design-tokens.json`.
 * Read tokens via useTheme(): theme.color.feed, theme.radius.lg, etc.
 *
 * Mapping note: existing semantic key names (bg/surface/ink/line/accent…)
 * are preserved so all call sites survive; values now match the Warm
 * Editorial palette. New keys: private/privateSoft, growth/growthSoft,
 * indigo/indigoSoft, dangerSoft, primaryPressed, overlay, onPrimary,
 * plus border / shadow / layout / typeStyle token groups.
 */

export const palette = {
  dawn: {
    bg: "#F6EFE6",
    bgGrad1: "#F6EFE6",
    bgGrad2: "#EEE1D2",
    surface: "#FEFBF7",
    surface2: "#F2E8DC",
    surfaceSunken: "#EEE1D2",
    ink: "#141113",
    inkSoft: "#6F6259",
    inkFaint: "#998B80",
    line: "#E6D7C6",
    lineStrong: "#D5C2AF",

    feed: "#D06C31",
    feedTint: "#F8E4D4",
    diaper: "#83A18C",
    diaperTint: "#E4EFE8",
    sleep: "#8F86C2",
    sleepTint: "#ECE9F8",

    accent: "#D06C31",
    accentPressed: "#B75A29",
    onAccent: "#FFFDFC",
    positive: "#5F927A",
    warning: "#C88A2B",
    danger: "#C54E38",
    dangerSoft: "#F8E4DF",
    private: "#6F9E86",
    privateSoft: "#E4F0E9",
    growth: "#6373A7",
    growthSoft: "#E7EAF4",
    indigo: "#2D3249",
    indigoSoft: "#E7E9F1",
    overlay: "#14111352",
  },
  night: {
    bg: "#0F0D0E",
    bgGrad1: "#0F0D0E",
    bgGrad2: "#090809",
    surface: "#181416",
    surface2: "#271F1B",
    surfaceSunken: "#090809",
    ink: "#FFF8F0",
    inkSoft: "#C3B5A8",
    inkFaint: "#897B71",
    line: "#382D29",
    lineStrong: "#4A3A33",

    feed: "#E89A61",
    feedTint: "#3B281F",
    diaper: "#86B29B",
    diaperTint: "#1E3029",
    sleep: "#A39ADC",
    sleepTint: "#29263B",

    accent: "#E89A61",
    accentPressed: "#CF7F46",
    onAccent: "#141113",
    positive: "#7FB099",
    warning: "#D3A44A",
    danger: "#E06A55",
    dangerSoft: "#3A211D",
    private: "#86B29B",
    privateSoft: "#1E3029",
    growth: "#858FB9",
    growthSoft: "#252A3A",
    indigo: "#858FB9",
    indigoSoft: "#252A3A",
    overlay: "#0000007A",
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ColorTokens = (typeof palette)[ColorScheme];

export const eventColorKey = {
  feed: "feed",
  diaper: "diaper",
  sleep: "sleep",
} as const;

/** Loaded font-family names (see RootLayout useFonts). */
export const fonts = {
  displayRegular: "PlayfairDisplay_400Regular",
  displayMedium: "PlayfairDisplay_500Medium",
  bodyRegular: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
} as const;

/** Typographic scale — Warm Editorial (design-tokens typography.styles). */
export const typeStyle = {
  hero: { size: 44, lineHeight: 50, tracking: -0.6 }, // displayXL — one dominant moment
  display: { size: 30, lineHeight: 36, tracking: -0.35 }, // h1
  title: { size: 24, lineHeight: 30, tracking: -0.2 }, // h2
  heading: { size: 20, lineHeight: 26, tracking: -0.1 }, // h3
  bodyL: { size: 17, lineHeight: 25, tracking: 0 },
  body: { size: 15, lineHeight: 22, tracking: 0 },
  label: { size: 13, lineHeight: 18, tracking: 0.1 },
  caption: { size: 12, lineHeight: 17, tracking: 0.1 },
  micro: { size: 11, lineHeight: 15, tracking: 0.2 },
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

export const border = {
  hairline: 1,
  emphasis: 1.5,
} as const;

/** RN shadow params per scheme — "hairline borders before heavy shadows". */
const shadowTokens = {
  dawn: {
    sm: { y: 2, blur: 8, opacity: 0.05 },
    md: { y: 6, blur: 20, opacity: 0.08 },
    floating: { y: 12, blur: 34, opacity: 0.12 },
  },
  night: {
    sm: { y: 2, blur: 8, opacity: 0.18 },
    md: { y: 8, blur: 24, opacity: 0.25 },
    floating: { y: 14, blur: 40, opacity: 0.34 },
  },
} as const;

export const layout = {
  screenHorizontalPadding: 20,
  screenTopPadding: 16,
  contentMaxWidth: 520,
  minTapTarget: 44,
  bottomNavHeight: 68,
  bottomNavBottomInset: 10,
} as const;

/**
 * Motion. Cubic-bezier control points [x1,y1,x2,y2] — use with
 * react-native-reanimated's Easing.bezier(...). Durations in ms.
 */
export const motion = {
  pressScale: 0.985,
  easeOut: [0.23, 1, 0.32, 1] as const,
  easeInOut: [0.77, 0, 0.175, 1] as const,
  easeDrawer: [0.32, 0.72, 0, 1] as const,
  duration: { fast: 140, standard: 220, slow: 360 },
  staggerMs: 45,
  spring: { damping: 19, stiffness: 190, mass: 0.9 },
  reduceMotion: true, // respect OS reduce-motion; use opacity-only transitions
} as const;

export type Theme = {
  scheme: ColorScheme;
  color: ColorTokens;
  fonts: typeof fonts;
  typeStyle: typeof typeStyle;
  spacing: typeof spacing;
  radius: typeof radius;
  border: typeof border;
  shadow: (typeof shadowTokens)[ColorScheme];
  layout: typeof layout;
  motion: typeof motion;
};

export function makeTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    color: palette[scheme],
    fonts,
    typeStyle,
    spacing,
    radius,
    border,
    shadow: shadowTokens[scheme],
    layout,
    motion,
  };
}

export const themes = {
  dawn: makeTheme("dawn"),
  night: makeTheme("night"),
} as const;
