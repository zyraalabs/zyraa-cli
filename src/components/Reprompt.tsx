import { Box, useApp, useInput } from "ink";
import { Header } from "./ui/Header.js";
import { Spinner } from "./ui/Spinner.js";
import { StatusRow } from "./ui/StatusRow.js";
import { Divider } from "./ui/Divider.js";
import { GeneratingView } from "./generate/GeneratingView.js";
import { BuildValidationView } from "./generate/BuildValidationView.js";
import { RemainingErrorsView } from "./generate/RemainingErrorsView.js";
import { DoneView } from "./generate/DoneView.js";
import { ErrorView } from "./generate/ErrorView.js";
import { EnvCollector } from "./generate/EnvCollector.js";
import { useReprompt, type RepromptResult } from "./generate/useReprompt.js";

interface Props {
  prompt: string;
  generationId: string;
  framework: string;
  deploy?: boolean;
  netlifyId?: string;
  onDone?: (result: RepromptResult) => void;
}

export function Reprompt({ prompt, generationId, framework, deploy = false, netlifyId = "", onDone }: Props) {
  const { exit } = useApp();

  const {
    stage, changedFiles, activeFile, actionWord,
    usage, installWarning, error, timings, selectedCount,
    fixAttempt, fixingErrors, fixedErrors, remainingErrors,
    deployUrl, deployError,
    pendingEnvVars, resolveEnvVars,
  } = useReprompt(prompt, generationId, framework, deploy, netlifyId);

  function buildResult(): RepromptResult {
    return {
      prompt, framework,
      filesChanged: changedFiles.length,
      timings, usage, installWarning,
      error: error ?? null,
      deployUrl,
      deployError,
    };
  }

  useInput(() => {
    if (stage !== "done") return;
    if (onDone) onDone(buildResult()); else exit();
  }, { isActive: stage === "done" });

  function handleErrorRetry() {
    if (onDone) onDone(buildResult()); else exit();
  }

  const doneStages = ["validating", "fixing", "done"];
  const pastAnalyzing      = stage !== "analyzing";
  const pastReading        = !["analyzing", "reading"].includes(stage);
  const pastReprompting    = changedFiles.length > 0 && ["collecting-env", "installing", ...doneStages].includes(stage);
  const pastCollectingEnv  = Boolean(timings.collectingEnv);
  const pastInstalling     = doneStages.includes(stage);
  const pastValidating     = stage === "done";

  return (
    <Box flexDirection="column" paddingY={1}>
      <Header prompt={prompt} />

      <Box flexDirection="column" paddingX={1} gap={1}>
        {pastAnalyzing && (
          <StatusRow
            label={`${selectedCount} file${selectedCount !== 1 ? "s" : ""} selected`}
            timing={timings.detecting}
            dimLabel
          />
        )}
        {pastReading && (
          <StatusRow label="files loaded" timing={timings.scaffolding} dimLabel />
        )}
        {pastReprompting && (
          <StatusRow label={`${changedFiles.length} files updated`} timing={timings.generating} dimLabel />
        )}
        {pastCollectingEnv && (
          <StatusRow label="environment configured" timing={timings.collectingEnv} dimLabel />
        )}
        {pastInstalling && !installWarning && (
          <StatusRow label="dependencies installed" timing={timings.installing} dimLabel />
        )}
        {pastValidating && fixAttempt > 0 && (
          <StatusRow label={`auto-fixed ${fixAttempt} build error${fixAttempt > 1 ? "s" : ""}`} dimLabel />
        )}
        {stage === "done" && remainingErrors.length > 0 && (
          <RemainingErrorsView errors={remainingErrors} />
        )}

        {stage !== "done" && stage !== "error" && <Divider />}

        {stage === "analyzing"   && <Spinner label="Analyzing project..." />}
        {stage === "reading"     && <Spinner label="Loading files..." />}
        {stage === "reprompting" && (
          <GeneratingView activeFile={activeFile} actionWord={actionWord} generatedFiles={changedFiles} />
        )}
        {stage === "collecting-env" && pendingEnvVars.length > 0 && (
          <EnvCollector envVars={pendingEnvVars} onDone={resolveEnvVars} />
        )}
        {stage === "installing"  && <Spinner label="Installing dependencies..." />}
        {stage === "deploying"   && <Spinner label="Redeploying to Netlify..." />}
        {(stage === "validating" || stage === "fixing") && (
          <BuildValidationView
            stage={stage}
            fixAttempt={fixAttempt}
            errors={fixingErrors}
            fixedErrors={fixedErrors}
          />
        )}
        {stage === "done" && (
          <DoneView
            installWarning={installWarning}
            usage={usage}
            framework={framework}
            fileCount={changedFiles.length}
            timings={timings}
            mode="reprompt"
            deployUrl={deployUrl}
            deployError={deployError}
          />
        )}
        {stage === "error" && error && (
          <ErrorView error={error} onRetry={handleErrorRetry} />
        )}
      </Box>
    </Box>
  );
}
