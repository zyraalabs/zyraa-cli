import { Box, Text } from "ink";
import { Divider } from "../ui/Divider.js";
import { Badge } from "../ui/Badge.js";
import type { Timings } from "./useGeneration.js";

interface Props {
  installWarning: string;
  usage: { inputTokens: number; outputTokens: number } | null;
  framework: string;
  fileCount: number;
  timings: Timings;
  mode?: "generate" | "reprompt";
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Box gap={2}>
      <Box minWidth={12}>
        <Text color="#6B7280">{label}</Text>
      </Box>
      <Text bold>{value}</Text>
    </Box>
  );
}

export function DoneView({ installWarning, usage, framework, fileCount, timings, mode = "generate" }: Props) {
  const tokens = usage ? (usage.inputTokens + usage.outputTokens).toLocaleString() : null;

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={2}>
        <Text color="#059669" bold>{"✓"}</Text>
        <Text bold>{"Build complete"}</Text>
        {timings.total !== undefined && (
          <Text color="#6B7280">{"  " + timings.total.toFixed(1) + "s total"}</Text>
        )}
      </Box>

      <Divider />

      {installWarning && <Badge type="warn" label={installWarning} />}

      <Box flexDirection="column" gap={0} paddingLeft={1}>
        <MetaRow label="Framework" value={framework} />
        <MetaRow label="Files" value={`${fileCount} ${mode === "reprompt" ? "updated" : "created"}`} />
        {tokens && <MetaRow label="Tokens" value={tokens} />}
      </Box>

      <Divider />

      <Box flexDirection="column" gap={1} paddingLeft={1}>
        <Text color="#6B7280">{"Run your app"}</Text>
        <Box gap={1}>
          <Text color="#7C3AED">{"$"}</Text>
          <Text bold>{"pnpm dev"}</Text>
        </Box>
      </Box>

      <Divider />

      <Box paddingLeft={1}>
        <Text color="#6B7280" dimColor>{"press any key to continue  ·  ctrl+c to exit"}</Text>
      </Box>
    </Box>
  );
}
