import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useTheme } from "../ui/ThemeContext.js";
import type { AskUserRequest } from "../../agent/client.js";

interface Props {
  request: AskUserRequest;
  width: number;
  onAnswer: (label: string) => void;
}

export function QuestionPrompt({ request, width, onAnswer }: Props) {
  const theme = useTheme();
  const [cursor, setCursor] = useState(0);
  const options = request.options;

  useInput((char, key) => {
    if (key.upArrow) {
      setCursor((c) => (c === 0 ? options.length - 1 : c - 1));
      return;
    }
    if (key.downArrow) {
      setCursor((c) => (c + 1) % options.length);
      return;
    }
    if (key.return) {
      onAnswer(options[cursor].label);
      return;
    }
    const digit = Number(char);
    if (Number.isInteger(digit) && digit >= 1 && digit <= options.length) {
      onAnswer(options[digit - 1].label);
    }
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box width={width} gap={1}>
        <Text color={theme.brand} bold>{"?"}</Text>
        <Text color={theme.fg} bold>{request.question}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {options.map((option, i) => {
          const active = i === cursor;
          return (
            <Box key={i} flexDirection="column">
              <Box gap={1}>
                <Text color={active ? theme.brand : theme.fgSubtle}>
                  {active ? "❯" : " "}
                </Text>
                <Text color={active ? theme.brand : theme.fgMuted}>{`${i + 1}.`}</Text>
                <Text color={active ? theme.fg : theme.fgMuted} bold={active}>
                  {option.label}
                </Text>
              </Box>
              {active && option.description && (
                <Box paddingLeft={5} width={width}>
                  <Text color={theme.fgSubtle}>{option.description}</Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.fgSubtle}>
          {"↑↓ to move  ·  enter to choose  ·  or press 1-"}
          {options.length}
        </Text>
      </Box>
    </Box>
  );
}
