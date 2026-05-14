import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useTheme } from "./ThemeContext.js";

const FRAMES = ["◐", "◓", "◑", "◒"];

interface Props {
  label: string;
  suffix?: string;
}

export function Spinner({ label, suffix }: Props) {
  const theme = useTheme();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 120);
    return () => clearInterval(id);
  }, []);

  return (
    <Box gap={1}>
      <Text color={theme.brand}>{FRAMES[frame]}</Text>
      <Text color={theme.brand}>{label}</Text>
      {suffix && <Text color={theme.info}>{suffix}</Text>}
    </Box>
  );
}
