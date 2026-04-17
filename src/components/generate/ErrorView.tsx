import { Box, Text } from "ink";
import { Divider } from "../ui/Divider.js";
import type { AppError } from "./useGeneration.js";

export function ErrorView({ error }: { error: AppError }) {
  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={2}>
        <Text color="#DC2626" bold>{"✗"}</Text>
        <Text bold>{"Build failed"}</Text>
      </Box>

      <Divider />

      <Box flexDirection="column" gap={1} paddingLeft={1}>
        <Text color="#DC2626">{error.message}</Text>
        {error.hint && (
          <Box gap={1}>
            <Text color="#6B7280">{"hint"}</Text>
            <Text color="#6B7280">{"·"}</Text>
            <Text>{error.hint}</Text>
          </Box>
        )}
      </Box>

      <Divider />

      <Box paddingLeft={1}>
        <Text color="#6B7280" dimColor>{"press any key to continue  ·  ctrl+c to exit"}</Text>
      </Box>
    </Box>
  );
}
