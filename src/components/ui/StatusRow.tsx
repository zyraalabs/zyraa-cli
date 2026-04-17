import { Box, Text } from "ink";

interface Props {
  label: string;
  timing?: number;
  dimLabel?: boolean;
}

export function StatusRow({ label, timing, dimLabel }: Props) {
  return (
    <Box gap={2}>
      <Text color="#059669">{"✓"}</Text>
      <Box flexGrow={1}>
        <Text color={dimLabel ? "#6B7280" : undefined}>{label}</Text>
      </Box>
      {timing !== undefined && (
        <Text color="#9CA3AF">{timing.toFixed(1)}{"s"}</Text>
      )}
    </Box>
  );
}
