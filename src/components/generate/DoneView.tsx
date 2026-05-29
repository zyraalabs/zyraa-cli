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
  deployUrl?: string;
  deployError?: string;
  devServerUrl?: string;
}

export function DoneView({ installWarning, timings, deployUrl, deployError, devServerUrl }: Props) {
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

      {deployUrl ? (
        <Box gap={2}>
          <Text color={theme.success} bold>{"✓"}</Text>
          <Box flexDirection="column">
            <Text bold color={theme.fg}>{"Deployed live"}</Text>
            <Text color={theme.brand}>{deployUrl}</Text>
          </Box>
        </Box>
      ) : deployError ? (
        <Badge type="warn" label={`Deploy: ${deployError}`} />
      ) : null}

      <Divider />

      {!deployUrl && (
        <>
          <Box flexDirection="column" gap={1} paddingLeft={1}>
            {devServerUrl ? (
              <Box gap={2}>
                <Text color={theme.success} bold>{"✓"}</Text>
                <Box flexDirection="column">
                  <Text bold color={theme.fg}>{"Running locally"}</Text>
                  <Text color={theme.brand}>{devServerUrl}</Text>
                </Box>
              </Box>
            ) : (
              <>
                <Text color={theme.fgMuted}>{"Run your app"}</Text>
                <Box gap={1}>
                  <Text color={theme.brand} bold>{"$"}</Text>
                  <Text bold color={theme.fg}>{"pnpm dev"}</Text>
                </Box>
              </>
            )}
          </Box>
          <Divider />
        </>
      )}

      <Text color={theme.fgSubtle}>{"press any key to continue  ·  ctrl+c to exit"}</Text>
    </Box>
  );
}
