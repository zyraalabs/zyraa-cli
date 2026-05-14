import { execSync } from "child_process";

export type ColorScheme = "dark" | "light";

export interface Theme {
  scheme: ColorScheme;
  brand: string;
  brandLight: string;
  brandDark: string;
  success: string;
  error: string;
  warn: string;
  info: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  border: string;
  borderActive: string;
}

const dark: Theme = {
  scheme: "dark",
  brand: "#D97218",
  brandLight: "#F0922A",
  brandDark: "#C45D14",
  success: "#34B85F",
  error: "#EF4444",
  warn: "#F59E0B",
  info: "#38BDF8",
  fg: "#C8C4BF",
  fgMuted: "#7A7672",
  fgSubtle: "#4E4B48",
  border: "#2C2C38",
  borderActive: "#D97218",
};

const light: Theme = {
  scheme: "light",
  brand: "#C45D14",
  brandLight: "#D97218",
  brandDark: "#A34D10",
  success: "#16A34A",
  error: "#DC2626",
  warn: "#D97706",
  info: "#0369A1",
  fg: "#2C2825",
  fgMuted: "#6B6760",
  fgSubtle: "#9B9390",
  border: "#BDB5AC",
  borderActive: "#C45D14",
};

export const themes = { dark, light } as const;

function detectOS(): ColorScheme {
  try {
    if (process.platform === "darwin") {
      const out = execSync("defaults read -g AppleInterfaceStyle", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
      return out === "Dark" ? "dark" : "light";
    }
    if (process.platform === "linux") {
      const out = execSync(
        "gsettings get org.gnome.desktop.interface color-scheme",
        {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "ignore"],
        },
      ).trim();
      return out.includes("dark") ? "dark" : "light";
    }
  } catch {}
  return "dark";
}

export function detectTheme(): ColorScheme {
  const env = process.env.ZYRAA_THEME;
  if (env === "light") return "light";
  if (env === "dark") return "dark";

  const colorfgbg = process.env.COLORFGBG;
  if (colorfgbg) {
    const bg = parseInt(colorfgbg.split(";").pop() ?? "0", 10);
    if (!isNaN(bg)) return bg >= 7 ? "light" : "dark";
  }

  return detectOS();
}
