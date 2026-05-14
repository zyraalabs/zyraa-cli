import { Text } from "ink";
import { useTheme } from "./ThemeContext.js";

export function Divider() {
  const theme = useTheme();
  const width = Math.max(Math.min((process.stdout.columns ?? 80) - 6, 72), 10);
  return <Text color={theme.fgSubtle}>{"─".repeat(width)}</Text>;
}
