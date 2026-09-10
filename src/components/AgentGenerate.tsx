import { useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { Spinner } from "./ui/Spinner.js";
import { Divider } from "./ui/Divider.js";
import { DoneView } from "./generate/DoneView.js";
import { ErrorView } from "./generate/ErrorView.js";
import { EnvCollector } from "./generate/EnvCollector.js";
import { useTheme } from "./ui/ThemeContext.js";
import { useAgentGeneration } from "./generate/useAgentGeneration.js";
import type { GenerationResult } from "./generate/useGeneration.js";

const MAX_SHOWN = 8;

interface Props {
  prompt: string;
  onDone?: (result: GenerationResult) => void;
  deploy?: boolean;
}

export function AgentGenerate({ prompt, onDone, deploy = false }: Props) {
  const { exit } = useApp();
  const theme = useTheme();

  const {
    stage,
    framework,
    reasoning,
    steps,
    summary,
    usage,
    error,
    agentNotice,
    timings,
    deployUrl,
    deployError,
    devServerUrl,
    pendingEnvVars,
    resolveEnvVars,
    buildResult,
  } = useAgentGeneration(prompt, deploy);

  useEffect(() => {
    if (stage !== "done" && stage !== "error") return;
    if (onDone) onDone(buildResult());
    else setTimeout(() => exit(), 100);
  }, [stage]);

  if (stage === "error" && error) {
    return <ErrorView error={error} onRetry={() => (onDone ? onDone(buildResult()) : exit())} />;
  }

  if (stage === "collecting-env") {
    return <EnvCollector envVars={pendingEnvVars} onDone={resolveEnvVars} />;
  }

  const visible = steps.slice(-MAX_SHOWN);

  return (
    <Box flexDirection="column" paddingY={1}>
      {framework !== "" && (
        <Box paddingX={2} marginBottom={1}>
          <Text color={theme.brand} bold>{framework}</Text>
          {reasoning !== "" && <Text color={theme.fgSubtle}>{"  ·  "}{reasoning}</Text>}
        </Box>
      )}

      {stage === "scaffolding" && (
        <Box paddingX={2}>
          <Spinner label="setting up the project" />
        </Box>
      )}

      {visible.length > 0 && (
        <Box flexDirection="column" paddingX={2}>
          {visible.map((step, i) => (
            <Box key={i} gap={2}>
              <Text color={step.ok === null ? theme.fgSubtle : step.ok ? theme.success : theme.warn}>
                {step.ok === null ? "·" : step.ok ? "✓" : "✗"}
              </Text>
              <Text color={step.ok === null ? theme.fgMuted : theme.fgSubtle}>{step.detail}</Text>
            </Box>
          ))}
        </Box>
      )}

      {stage === "building" && (
        <Box paddingX={2} marginTop={1}>
          <Spinner label="working" />
        </Box>
      )}

      {stage === "installing" && (
        <Box paddingX={2} marginTop={1}>
          <Spinner label="installing dependencies" />
        </Box>
      )}

      {(stage === "launching" || stage === "deploying") && (
        <Box paddingX={2} marginTop={1}>
          <Spinner label={stage === "deploying" ? "deploying" : "starting the dev server"} />
        </Box>
      )}

      {agentNotice !== "" && (
        <Box paddingX={2} marginTop={1} gap={2}>
          <Text color={theme.warn} bold>{"!"}</Text>
          <Text color={theme.warn}>{agentNotice}</Text>
        </Box>
      )}

      {stage === "done" && (
        <Box flexDirection="column" marginTop={1}>
          {summary.trim() !== "" && (
            <Box paddingX={2} marginBottom={1}>
              <Text color={theme.fg}>{summary.trim()}</Text>
            </Box>
          )}
          <Box paddingX={2}>
            <Divider />
          </Box>
          <DoneView
            framework={framework}
            fileCount={steps.filter((s) => s.ok === true).length}
            usage={usage}
            timings={timings}
            installWarning=""
            deployUrl={deployUrl}
            deployError={deployError}
            devServerUrl={devServerUrl}
          />
        </Box>
      )}

      {stage !== "done" && stage !== "error" && (
        <Box paddingX={2} marginTop={1}>
          <Text color={theme.fgSubtle}>{"ctrl+c to stop"}</Text>
        </Box>
      )}
    </Box>
  );
}
