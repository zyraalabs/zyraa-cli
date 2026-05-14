import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useTheme } from "./ThemeContext.js";

function Cursor() {
  const theme = useTheme();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  return <Text color={theme.brand}>{visible ? "▋" : " "}</Text>;
}

interface Props {
  value: string;
  focused?: boolean;
}

export function InputBox({ value, focused = true }: Props) {
  const theme = useTheme();
  return (
    <Box
      borderStyle="round"
      borderColor={focused ? theme.borderActive : theme.border}
      paddingX={2}
      paddingY={0}
      gap={1}
    >
      <Text color={theme.brand} bold>{"❯"}</Text>
      <Box gap={0}>
        <Text color={theme.fg} bold>{value}</Text>
        <Cursor />
      </Box>
    </Box>
  );
}
