import { createContext, useContext, useState, useEffect } from "react";
import { themes, detectTheme, type Theme, type ColorScheme } from "./theme.js";

const DARK_BG  = "\x1b[48;2;10;10;12m";  // #0A0A0C
const RESET_BG = "\x1b[49m";
const CLEAR    = "\x1b[2J\x1b[H";

function applyBackground(scheme: ColorScheme) {
  if (scheme === "dark") {
    process.stdout.write(DARK_BG + CLEAR);
  } else {
    process.stdout.write(RESET_BG + CLEAR);
  }
}

interface ThemeContextValue {
  theme: Theme;
  scheme: ColorScheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.dark,
  scheme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState<ColorScheme>(detectTheme);

  useEffect(() => {
    applyBackground(scheme);
    return () => { process.stdout.write(RESET_BG); };
  }, [scheme]);

  function toggleTheme() {
    setScheme((s) => (s === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider
      value={{ theme: themes[scheme], scheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

export function useThemeToggle(): {
  scheme: ColorScheme;
  toggleTheme: () => void;
} {
  const { scheme, toggleTheme } = useContext(ThemeContext);
  return { scheme, toggleTheme };
}
