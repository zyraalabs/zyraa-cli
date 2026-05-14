import { Box, Text } from "ink";
import { VERSION } from "../../lib/constants.js";
import { useTheme } from "./ThemeContext.js";

export function Header({ prompt }: { prompt: string }) {
  const theme = useTheme();
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box borderStyle="round" borderColor={theme.borderActive} paddingX={2}>
        <Box flexGrow={1}>
          <Text color={theme.brandLight} bold>{"Z  Zyraa"}</Text>
          <Text color={theme.fgMuted}>{"  ·  AI-powered full-stack builder"}</Text>
        </Box>
        <Text color={theme.fgSubtle}>{`v${VERSION}`}</Text>
      </Box>
      <Box marginTop={1} paddingX={2} gap={2}>
        <Text color={theme.brand} bold>{"❯"}</Text>
        <Text color={theme.fg} bold>{prompt}</Text>
      </Box>
    </Box>
  );
}
