import { Text } from "ink";
import { useTheme } from "./ThemeContext.js";

type BadgeType = "success" | "error" | "warn";

const icons: Record<BadgeType, string> = {
  success: "✓",
  error:   "✗",
  warn:    "⚠",
};

export function Badge({ type, label }: { type: BadgeType; label: string }) {
  const theme = useTheme();
  const color = { success: theme.success, error: theme.error, warn: theme.warn }[type];
  return (
    <Text>
      <Text bold color={color}>{icons[type]}{" "}</Text>
      <Text color={color}>{label}</Text>
    </Text>
  );
}
