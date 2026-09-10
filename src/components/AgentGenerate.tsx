import { useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { Spinner } from "./ui/Spinner.js";
import { Divider } from "./ui/Divider.js";
import { DoneView } from "./generate/DoneView.js";
import { ErrorView } from "./generate/ErrorView.js";
import { EnvCollector } from "./generate/EnvCollector.js";
import { useTheme } from "./ui/ThemeContext.js";
import { useAgentGeneration, type AgentStep } from "./generate/useAgentGeneration.js";
import type { ActionKind } from "../agent/client.js";
import type { GenerationResult } from "./generate/useGeneration.js";

const MAX_SHOWN = 8;

const VERB: Record<ActionKind, string> = {
  creating: "create",
  editing: "edit",
  reading: "read",
  exploring: "explore",
  running: "run",
  asking: "ask",
};

const ICON: Record<ActionKind, string> = {
  creating: "+",
  editing: "~",
  reading: "→",
  exploring: "⌕",
  running: "$",
  asking: "?",
};

function StepRow({ step }: { step: AgentStep }) {
  const theme = useTheme();
  const pending = step.ok === null;
  const failed = step.ok === false;

  const accent = failed
    ? theme.warn
    : step.kind === "creating"
      ? theme.success
      : step.kind === "editing"
        ? theme.brand
        : theme.fgSubtle;

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={accent} bold={!pending}>{ICON[step.kind]}</Text>
        <Text color={pending ? theme.fgMuted : accent}>{VERB[step.kind]}</Text>
        <Box flexGrow={1}>
          <Text color={pending ? theme.fgMuted : theme.fg} wrap="truncate-start">
            {step.target}
          </Text>
        </Box>
        {step.note !== "" && !failed && <Text color={theme.fgSubtle}>{step.note}</Text>}
        {failed && <Text color={theme.warn}>{"failed"}</Text>}
      </Box>
      {failed && step.detail !== "" && (
        <Box paddingLeft={4}>
          <Text color={theme.warn} wrap="truncate-end">{step.detail}</Text>
        </Box>
      )}
    </Box>
  );
}

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
    thinking,
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
            <StepRow key={i} step={step} />
          ))}
        </Box>
      )}

      {stage === "building" && (
        <Box flexDirection="column" paddingX={2} marginTop={1}>
          <Spinner label={thinking !== "" ? "thinking" : "working"} />
          {thinking !== "" && (
            <Box paddingLeft={2}>
              <Text color={theme.fgSubtle} wrap="truncate-end">{thinking}</Text>
            </Box>
          )}
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
            fileCount={
              new Set(
                steps
                  .filter((s) => s.ok === true && (s.kind === "creating" || s.kind === "editing"))
                  .map((s) => s.target),
              ).size
            }
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
