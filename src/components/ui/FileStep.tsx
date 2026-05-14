import { Box, Text } from "ink";
import { useTheme } from "./ThemeContext.js";

export function FileStep({ path }: { path: string }) {
  const theme = useTheme();
  const parts = path.split("/");
  const file  = parts.pop()!;
  const dir   = parts.length ? parts.join("/") + "/" : "";

  return (
    <Box gap={1}>
      <Text color={theme.fgSubtle}>{"  +"}</Text>
      <Text>
        <Text color={theme.fgMuted}>{dir}</Text>
        <Text color={theme.info}>{file}</Text>
      </Text>
    </Box>
  );
}
