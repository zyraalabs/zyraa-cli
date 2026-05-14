import { useState } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { Divider } from "../ui/Divider.js";
import { InputBox } from "../ui/InputBox.js";
import { useTheme } from "../ui/ThemeContext.js";
import type { AppError } from "./useGeneration.js";

interface Props {
  error: AppError;
  onRetry: () => void;
}

export function ErrorView({ error, onRetry }: Props) {
  const { exit } = useApp();
  const theme     = useTheme();
  const [input, setInput] = useState("");

  useInput((char, key) => {
    if (key.ctrl && char === "c") { exit(); return; }
    if (key.return) { onRetry(); return; }
    if (key.backspace || key.delete) { setInput((p) => p.slice(0, -1)); return; }
    if (char && !key.ctrl && !key.meta) {
      setInput((p) => p + char.replace(/[\r\n]/g, " "));
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={2}>
        <Text color={theme.error} bold>{"✗"}</Text>
        <Text color={theme.error} bold>{"Generation failed"}</Text>
      </Box>

      {error.message && (
        <Box paddingLeft={4}>
          <Text color={theme.fgMuted}>{error.message}</Text>
        </Box>
      )}

      {error.hint && (
        <Box paddingLeft={4}>
          <Text color={theme.fgMuted}>{error.hint}</Text>
        </Box>
      )}

      <Divider />

      <InputBox value={input} focused />

      <Text color={theme.fgSubtle}>
        {"describe your next change  ·  enter to retry  ·  ctrl+c to exit"}
      </Text>
    </Box>
  );
}
