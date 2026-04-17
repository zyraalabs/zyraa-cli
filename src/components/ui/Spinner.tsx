import { useState, useEffect } from "react";
import { Box, Text } from "ink";

const FRAMES = ["◐", "◓", "◑", "◒"];

interface Props {
  label: string;
  suffix?: string;
}

export function Spinner({ label, suffix }: Props) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 120);
    return () => clearInterval(id);
  }, []);

  return (
    <Box gap={1}>
      <Text color="#7C3AED">{FRAMES[frame]}</Text>
      <Text color="#7C3AED">{label}</Text>
      {suffix && <Text color="#0EA5E9">{suffix}</Text>}
    </Box>
  );
}
