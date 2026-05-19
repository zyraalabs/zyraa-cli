import { Box, Text } from "ink";
import { Spinner } from "../ui/Spinner.js";
import { useTheme } from "../ui/ThemeContext.js";
import type { BuildError } from "../../lib/buildValidator.js";

interface Props {
  stage: "validating" | "fixing";
  fixAttempt: number;
  errors: BuildError[];
  fixedErrors: BuildError[];
}

function ErrorRow({ error, status }: { error: BuildError; status: "fixing" | "fixed" }) {
  const theme = useTheme();
  const icon = status === "fixed" ? "✓" : "→";
  const color = status === "fixed" ? theme.success : theme.brand;
  const desc =
    error.description.length > 72
      ? error.description.slice(0, 69) + "…"
      : error.description;

  return (
    <Box gap={1} paddingLeft={2}>
      <Text color={color} bold>{icon}</Text>
      <Box flexDirection="column">
        <Text color={status === "fixed" ? theme.fgSubtle : theme.fg}>{desc}</Text>
        {error.location && (
          <Text color={theme.fgMuted}>{error.location}</Text>
        )}
      </Box>
    </Box>
  );
}

export function BuildValidationView({ stage, fixAttempt, errors, fixedErrors }: Props) {
  const theme = useTheme();

  if (stage === "validating") {
    return <Spinner label="Validating build..." />;
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Spinner
        label={`Build issue caught — fixing automatically (attempt ${fixAttempt}/3)`}
      />

      {fixedErrors.length > 0 && (
        <Box flexDirection="column" gap={0} marginTop={1}>
          <Text color={theme.fgMuted} bold>{"  Fixed"}</Text>
          {fixedErrors.map((e, i) => (
            <ErrorRow key={i} error={e} status="fixed" />
          ))}
        </Box>
      )}

      {errors.length > 0 && (
        <Box flexDirection="column" gap={0} marginTop={fixedErrors.length > 0 ? 1 : 0}>
          <Text color={theme.fgMuted} bold>{"  Fixing"}</Text>
          {errors.map((e, i) => (
            <ErrorRow key={i} error={e} status="fixing" />
          ))}
        </Box>
      )}
    </Box>
  );
}
