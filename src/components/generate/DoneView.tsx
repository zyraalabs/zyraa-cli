import { Box, Text } from "ink";
import { Divider } from "../ui/Divider.js";
import { Badge } from "../ui/Badge.js";
import { useTheme } from "../ui/ThemeContext.js";
import type { Timings } from "./useGeneration.js";

interface Props {
  installWarning: string;
  usage: { inputTokens: number; outputTokens: number } | null;
  framework: string;
  fileCount: number;
  timings: Timings;
  mode?: "generate" | "reprompt";
}

export function DoneView({ installWarning, timings }: Props) {
  const theme = useTheme();

  return (
    <Box flexDirection="column" gap={1}>
      <Divider />

      {installWarning ? <Badge type="warn" label={installWarning} /> : null}

      <Box gap={2}>
        <Text color={theme.success} bold>{"✓"}</Text>
        <Text bold color={theme.fg}>{"Build complete"}</Text>
        {timings.total !== undefined && (
          <Text color={theme.fgMuted}>{"  ·  " + timings.total.toFixed(1) + "s total"}</Text>
        )}
      </Box>

      <Divider />

      <Box flexDirection="column" gap={1} paddingLeft={1}>
        <Text color={theme.fgMuted}>{"Run your app"}</Text>
        <Box gap={1}>
          <Text color={theme.brand} bold>{"$"}</Text>
          <Text bold color={theme.fg}>{"pnpm dev"}</Text>
        </Box>
      </Box>

      <Divider />

      <Text color={theme.fgSubtle}>{"press any key to continue  ·  ctrl+c to exit"}</Text>
    </Box>
  );
}
