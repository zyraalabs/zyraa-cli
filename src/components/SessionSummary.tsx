import { Box, Text } from "ink";
import { useTheme } from "./ui/ThemeContext.js";

interface Session {
  prompt: string;
  framework: string;
  fileCount: number;
  isReprompt: boolean;
}

export function SessionSummaryRow({ session }: { session: Session }) {
  const theme    = useTheme();
  const truncated =
    session.prompt.length > 56
      ? session.prompt.slice(0, 53) + "…"
      : session.prompt;

  return (
    <Box paddingX={2} gap={2}>
      <Text color={theme.success}>{"✓"}</Text>
      <Text color={theme.fgMuted}>{truncated}</Text>
    </Box>
  );
}
