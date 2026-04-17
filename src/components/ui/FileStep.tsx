import { Box, Text } from "ink";

export function FileStep({ path }: { path: string }) {
  const parts = path.split("/");
  const file = parts.pop()!;
  const dir = parts.length ? parts.join("/") + "/" : "";

  return (
    <Box gap={1}>
      <Text color="#4B5563">{"  +"}</Text>
      <Text>
        <Text color="#6B7280">{dir}</Text>
        <Text color="#0EA5E9">{file}</Text>
      </Text>
    </Box>
  );
}
