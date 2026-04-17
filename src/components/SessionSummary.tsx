import { Box, Text } from "ink";
import { Divider } from "./ui/Divider.js";
import type { GenerationResult } from "./generate/useGeneration.js";

export function SessionSummary({ result }: { result: GenerationResult }) {
  const { prompt, framework, reasoning, fileCount, timings, usage, installWarning, error } = result;
  const tokens = usage ? (usage.inputTokens + usage.outputTokens).toLocaleString() : null;

  return (
    <Box flexDirection="column" gap={1} paddingX={1}>
      <Box gap={2}>
        <Text color="#7C3AED" bold>{"❯"}</Text>
        <Text bold>{prompt}</Text>
      </Box>

      {error ? (
        <Box gap={2}>
          <Text color="#DC2626">{"✗"}</Text>
          <Text color="#DC2626">{error.message}</Text>
        </Box>
      ) : (
        <Box flexDirection="column" gap={0}>
          {framework && (
            <Box gap={2}>
              <Text color="#059669">{"✓"}</Text>
              <Box flexGrow={1}>
                <Text color="#6B7280">{framework}{reasoning ? `  ·  ${reasoning}` : ""}</Text>
              </Box>
              {timings.detecting !== undefined && (
                <Text color="#9CA3AF">{timings.detecting.toFixed(1)}{"s"}</Text>
              )}
            </Box>
          )}
          {fileCount > 0 && (
            <Box gap={2}>
              <Text color="#059669">{"✓"}</Text>
              <Box flexGrow={1}>
                <Text color="#6B7280">{fileCount} files generated</Text>
              </Box>
              {timings.generating !== undefined && (
                <Text color="#9CA3AF">{timings.generating.toFixed(1)}{"s"}</Text>
              )}
            </Box>
          )}
          {!installWarning && (
            <Box gap={2}>
              <Text color="#059669">{"✓"}</Text>
              <Box flexGrow={1}>
                <Text color="#6B7280">{"Dependencies installed"}</Text>
              </Box>
              {timings.installing !== undefined && (
                <Text color="#9CA3AF">{timings.installing.toFixed(1)}{"s"}</Text>
              )}
            </Box>
          )}
          <Box gap={2}>
            <Text color="#059669">{"✓"}</Text>
            <Text color="#6B7280" bold>
              {"Build complete"}
              {timings.total !== undefined ? `  ·  ${timings.total.toFixed(1)}s` : ""}
              {tokens ? `  ·  ${tokens} tokens` : ""}
            </Text>
          </Box>
        </Box>
      )}

      <Divider />
    </Box>
  );
}
