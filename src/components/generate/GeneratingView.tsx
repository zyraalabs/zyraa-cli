import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Spinner } from "../ui/Spinner.js";
import { useTheme } from "../ui/ThemeContext.js";

const MAX_VISIBLE_FILES = 6;

function ProgressBar() {
  const theme  = useTheme();
  const [pct, setPct] = useState(0);
  const barWidth = 36;

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setPct(Math.min(88, 100 * (1 - Math.exp(-elapsed / 1.8))));
    }, 80);
    return () => clearInterval(id);
  }, []);

  const filled = Math.round((pct / 100) * barWidth);
  const empty  = barWidth - filled;

  return (
    <Box paddingLeft={2}>
      <Text color={theme.brand}>{"─".repeat(filled)}</Text>
      <Text color={theme.fgSubtle}>{"─".repeat(empty)}</Text>
    </Box>
  );
}

function CompletedFile({ path }: { path: string }) {
  const theme = useTheme();
  return (
    <Box gap={1}>
      <Text color={theme.success} bold>{"✓"}</Text>
      <Text color={theme.fgSubtle}>{path}</Text>
    </Box>
  );
}

interface Props {
  activeFile: string;
  actionWord: string;
  generatedFiles: string[];
}

export function GeneratingView({ activeFile, actionWord, generatedFiles }: Props) {
  const theme   = useTheme();
  const visible  = generatedFiles.slice(-MAX_VISIBLE_FILES);
  const overflow = generatedFiles.length - MAX_VISIBLE_FILES;

  return (
    <Box flexDirection="column" gap={1}>
      <Spinner label={`${actionWord}...`} suffix={activeFile || undefined} />
      <ProgressBar />

      {generatedFiles.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {visible.map((f) => (
            <CompletedFile key={f} path={f} />
          ))}
          {overflow > 0 && (
            <Box paddingLeft={4}>
              <Text color={theme.fgSubtle}>{`… ${overflow} more files`}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
