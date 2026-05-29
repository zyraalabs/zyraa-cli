import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../ui/ThemeContext.js";
import { Divider } from "../ui/Divider.js";
import type { EnvVar } from "../../lib/envScanner.js";

interface Props {
  envVars: EnvVar[];
  onDone: (values: Record<string, string>) => void;
}

function BlinkingCursor() {
  const theme = useTheme();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  return <Text color={theme.brand}>{visible ? "▋" : " "}</Text>;
}

export function EnvCollector({ envVars, onDone }: Props) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [inputText, setInputText] = useState("");
  const [skipMode, setSkipMode] = useState(false);

  const current = envVars[currentIndex];
  const confirmedCount = Object.keys(values).length;

  function advance(updated: Record<string, string>) {
    if (currentIndex + 1 >= envVars.length) {
      onDone(updated);
    } else {
      setCurrentIndex((i) => i + 1);
      setInputText("");
      setSkipMode(false);
    }
  }

  function handleConfirm() {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const updated = { ...values, [current.key]: trimmed };
    setValues(updated);
    advance(updated);
  }

  function handleSkip() {
    setInputText("");
    setSkipMode(false);
    advance(values);
  }

  function handleSkipAll() {
    onDone(values);
  }

  useInput((char, key) => {
    if (key.ctrl && char === "s") {
      handleSkipAll();
      return;
    }

    if (key.upArrow) {
      setSkipMode(false);
      return;
    }
    if (key.downArrow) {
      setSkipMode(true);
      return;
    }

    if (key.return) {
      if (skipMode) { handleSkip(); return; }
      handleConfirm();
      return;
    }

    if (!skipMode) {
      if (key.backspace || key.delete) {
        setInputText((prev) => prev.slice(0, -1));
        return;
      }
      if (char && !key.ctrl && !key.meta && !key.escape) {
        setInputText((prev) => prev + char);
      }
    }
  });

  return (
    <Box flexDirection="column" gap={1}>

      {/* Step dots + category + counter */}
      <Box paddingX={2} gap={2} alignItems="center">
        <Box gap={1}>
          {envVars.map((_, i) => (
            <Text
              key={i}
              color={
                i < currentIndex
                  ? theme.success
                  : i === currentIndex
                  ? theme.warn
                  : theme.fgSubtle
              }
            >
              {i < currentIndex ? "✓" : i === currentIndex ? "●" : "○"}
            </Text>
          ))}
        </Box>
        <Text color={theme.fgSubtle}>{"·"}</Text>
        <Text color={theme.warn} bold>{"env"}</Text>
        <Text color={theme.fgSubtle}>{"·"}</Text>
        <Text color={theme.fgSubtle}>{currentIndex + 1}{" of "}{envVars.length}</Text>
        {confirmedCount > 0 && (
          <>
            <Text color={theme.fgSubtle}>{"·"}</Text>
            <Text color={theme.success}>{"✓"}</Text>
            <Text color={theme.fgMuted}>{confirmedCount}{" saved"}</Text>
          </>
        )}
      </Box>

      {/* Key name + hint */}
      <Box paddingX={3} flexDirection="column" gap={0} marginTop={1}>
        <Text color={theme.fg} bold>{current.key}</Text>
        {current.hint && (
          <Text color={theme.fgMuted}>{current.hint}</Text>
        )}
      </Box>

      {/* Input row */}
      <Box paddingX={2} flexDirection="column" gap={1} marginTop={1}>

        {/* Text input row */}
        <Box gap={2}>
          <Text color={!skipMode ? theme.brand : theme.fgSubtle}>
            {!skipMode ? "❯" : " "}
          </Text>
          <Box
            borderStyle="round"
            borderColor={!skipMode ? theme.borderActive : theme.border}
            paddingX={2}
            flexGrow={1}
          >
            <Box gap={0}>
              <Text color={theme.fg}>{inputText}</Text>
              {!skipMode && <BlinkingCursor />}
            </Box>
          </Box>
        </Box>

        {/* Dotted separator */}
        <Box paddingLeft={4}>
          <Text color={theme.fgSubtle}>{"╌".repeat(36)}</Text>
        </Box>

        {/* Skip row */}
        <Box gap={2}>
          <Text color={skipMode ? theme.warn : theme.fgSubtle}>
            {skipMode ? "❯" : " "}
          </Text>
          <Text color={skipMode ? theme.fgMuted : theme.fgSubtle}>
            {"Skip for now — add to .env.local later"}
          </Text>
        </Box>

      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Divider />
      </Box>
      <Box paddingX={2}>
        <Text color={theme.fgSubtle}>
          {"↑↓ switch  ·  enter confirm  ·  ^S skip all remaining"}
        </Text>
      </Box>

    </Box>
  );
}
