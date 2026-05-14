import { Box, Text } from "ink";
import { useTheme } from "./ThemeContext.js";

interface Props {
  label: string;
  timing?: number;
  dimLabel?: boolean;
}

export function StatusRow({ label, timing, dimLabel }: Props) {
  const theme = useTheme();
  return (
    <Box gap={2}>
      <Text color={theme.success}>{"✓"}</Text>
      <Box flexGrow={1}>
        <Text color={dimLabel ? theme.fgMuted : theme.fg}>{label}</Text>
      </Box>
      {timing !== undefined && (
        <Text color={theme.fgMuted}>{timing.toFixed(1)}{"s"}</Text>
      )}
    </Box>
  );
}
