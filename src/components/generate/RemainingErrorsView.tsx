import { Box, Text } from "ink";
import { useTheme } from "../ui/ThemeContext.js";
import type { BuildError } from "../../lib/buildValidator.js";

interface Props {
  errors: BuildError[];
}

export function RemainingErrorsView({ errors }: Props) {
  const theme = useTheme();

  if (errors.length === 0) return null;

  return (
    <Box flexDirection="column" gap={0} marginTop={1}>
      <Text color={theme.warn} bold>{"  ⚠ Build errors remain — run pnpm build to fix manually"}</Text>
      {errors.map((e, i) => {
        const desc =
          e.description.length > 72
            ? e.description.slice(0, 69) + "…"
            : e.description;
        return (
          <Box key={i} gap={1} paddingLeft={2}>
            <Text color={theme.warn}>{"→"}</Text>
            <Box flexDirection="column">
              <Text color={theme.fg}>{desc}</Text>
              {e.location && <Text color={theme.fgMuted}>{e.location}</Text>}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
