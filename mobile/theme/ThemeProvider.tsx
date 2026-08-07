import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { themes, type ColorScheme, type Theme } from "./tokens";

type ThemeContextValue = {
  theme: Theme;
  scheme: ColorScheme;
  toggleScheme: () => void;
  setScheme: (s: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, initial = "dawn" }: { children: ReactNode; initial?: ColorScheme }) {
  const [scheme, setScheme] = useState<ColorScheme>(initial);
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[scheme],
      scheme,
      setScheme,
      toggleScheme: () => setScheme((s) => (s === "dawn" ? "night" : "dawn")),
    }),
    [scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

export const useTheme = (): Theme => useThemeContext().theme;
