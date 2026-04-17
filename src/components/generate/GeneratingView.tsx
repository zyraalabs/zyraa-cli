import { Box, Text } from "ink";
import { Spinner } from "../ui/Spinner.js";
import { FileStep } from "../ui/FileStep.js";

interface Props {
  activeFile: string;
  actionWord: string;
  generatedFiles: string[];
}

export function GeneratingView({ activeFile, actionWord, generatedFiles }: Props) {
  return (
    <Box flexDirection="column" gap={1}>
      <Spinner label={`${actionWord}...`} suffix={activeFile || undefined} />
      {generatedFiles.length > 0 && (
        <Box flexDirection="column" paddingLeft={1}>
          {generatedFiles.slice(-6).map((f) => (
            <FileStep key={f} path={f} />
          ))}
          {generatedFiles.length > 6 && (
            <Box paddingLeft={4}>
              <Text color="#6B7280">{`+${generatedFiles.length - 6} more`}</Text>
            </Box>
          )}
          <Box marginTop={1} paddingLeft={4} gap={1}>
            <Text color="#6B7280">{generatedFiles.length} file{generatedFiles.length === 1 ? "" : "s"}</Text>
            <Text color="#4B5563">{"·"}</Text>
            <Text color="#4B5563">{"generating..."}</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
