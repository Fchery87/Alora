/**
 * Alora design tokens — "Quiet Dawn"
 * ------------------------------------------------------------------
 * This is the React Native transfer artifact. It mirrors tokens.css
 * 1:1 so the real Expo app consumes the same design language. Drop
 * this file into the RN app, wrap the tree in <ThemeProvider>, and
 * read `theme.color.feed`, `theme.motion.easeOut`, etc.
 *
 * On web (this prototype) the source of truth is tokens.css; this
 * file is kept in lockstep with it by hand. In RN, this file is the
 * source of truth and there is no CSS.
 */

export const palette = {
  dawn: {
    bg: "#faf4ec",
    bgGrad1: "#fcf7f0",
    bgGrad2: "#f3e9da",
    surface: "#fffdfa",
    surface2: "#f4ebde",
    surfaceSunken: "#efe4d4",
    ink: "#2a2420",
    inkSoft: "#6f6256",
    inkFaint: "#a3978a",
    line: "#e9ddcd",
    lineStrong: "#ddcdb8",

    feed: "#d9824a",
    feedTint: "#f8e7d8",
    diaper: "#5f9a82",
    diaperTint: "#e0eee7",
    sleep: "#6172a6",
    sleepTint: "#e2e5f1",

    accent: "#c96a40",
    positive: "#5f9a82",
    warning: "#c79a3e",
    danger: "#bf5640",
  },
  night: {
    bg: "#14110d",
    bgGrad1: "#181410",
    bgGrad2: "#100d0a",
    surface: "#1e1812",
    surface2: "#281f17",
    surfaceSunken: "#15110c",
    ink: "#f1e8db",
    inkSoft: "#b6aa9a",
    inkFaint: "#7c7062",
    line: "#322a20",
    lineStrong: "#43392c",

    feed: "#e2a06b",
    feedTint: "#2f2316",
    diaper: "#82b89e",
    diaperTint: "#16241d",
    sleep: "#96a3cd",
    sleepTint: "#1a1d2c",

    accent: "#e2a06b",
    positive: "#82b89e",
    warning: "#d9b765",
    danger: "#d97a63",
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ColorTokens = (typeof palette)[ColorScheme];

/** Event-type → color token key, so logging UI stays consistent. */
export const eventColorKey = {
  feed: "feed",
  diaper: "diaper",
  sleep: "sleep",
} as const;

export const fontFamily = {
  // In RN, load these via expo-font (Fraunces + Hanken Grotesk).
  display: "Fraunces",
  body: "HankenGrotesk",
} as const;

/** Type scale in px (RN uses unitless numbers). */
export const fontSize = {
  hero: 56,
  display: 30,
  title: 22,
  heading: 17,
  body: 15,
  label: 13,
  caption: 11.5,
} as const;

/** 4px base spacing scale. */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

/**
 * Motion. CSS cubic-beziers expressed as [x1,y1,x2,y2] control points
 * (use with react-native-reanimated's Easing.bezier(...)). Durations in ms.
 */
export const motion = {
  easeOut: [0.23, 1, 0.32, 1],
  easeInOut: [0.77, 0, 0.175, 1],
  easeDrawer: [0.32, 0.72, 0, 1],
  duration: {
    press: 140,
    pop: 200,
    screen: 320,
  },
  /** Apple-style spring for layout/indicator motion. */
  spring: { duration: 500, bounce: 0.2 },
} as const;

export type Theme = {
  scheme: ColorScheme;
  color: ColorTokens;
  font: typeof fontFamily;
  fontSize: typeof fontSize;
  spacing: typeof spacing;
  radius: typeof radius;
  motion: typeof motion;
};

export function makeTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    color: palette[scheme],
    font: fontFamily,
    fontSize,
    spacing,
    radius,
    motion,
  };
}

export const themes = {
  dawn: makeTheme("dawn"),
  night: makeTheme("night"),
} as const;
