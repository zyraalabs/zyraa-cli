import { Box, Text } from "ink";
import { VERSION } from "../../lib/constants.js";

export function Header({ prompt }: { prompt: string }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box borderStyle="round" borderColor="#7C3AED" paddingX={2}>
        <Box flexGrow={1}>
          <Text color="#7C3AED" bold>{"⬡  Zyraa"}</Text>
          <Text color="#6B7280">{"  ·  AI-powered full-stack builder"}</Text>
        </Box>
        <Text color="#6B7280">{`v${VERSION}`}</Text>
      </Box>
      <Box marginTop={1} paddingX={1} gap={2}>
        <Text color="#7C3AED" bold>{"❯"}</Text>
        <Text bold>{prompt}</Text>
      </Box>
    </Box>
  );
}
