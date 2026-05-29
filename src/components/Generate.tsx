import { Box, useApp, useInput } from "ink";
import { Header } from "./ui/Header.js";
import { Badge } from "./ui/Badge.js";
import { Spinner } from "./ui/Spinner.js";
import { StatusRow } from "./ui/StatusRow.js";
import { Divider } from "./ui/Divider.js";
import { GeneratingView } from "./generate/GeneratingView.js";
import { BuildValidationView } from "./generate/BuildValidationView.js";
import { RemainingErrorsView } from "./generate/RemainingErrorsView.js";
import { DoneView } from "./generate/DoneView.js";
import { ErrorView } from "./generate/ErrorView.js";
import { EnvCollector } from "./generate/EnvCollector.js";
import { useGeneration, type GenerationResult, type Stage } from "./generate/useGeneration.js";
import { IS_MOCK } from "../lib/mock.js";

interface Props {
  prompt: string;
  onDone?: (result: GenerationResult) => void;
  deploy?: boolean;
}

export function Generate({ prompt, onDone, deploy = false }: Props) {
  const { exit } = useApp();

  const {
    stage, framework, reasoning, wasScaffolded,
    generatedFiles, activeFile, actionWord,
    usage, installWarning, error, timings, generationId,
    fixAttempt, fixingErrors, fixedErrors, remainingErrors,
    deployUrl, deployError, netlifyId,
    pendingEnvVars, resolveEnvVars,
    devServerUrl,
  } = useGeneration(prompt, deploy);

  function buildResult(): GenerationResult {
    return {
      prompt, framework, reasoning,
      fileCount: generatedFiles.length,
      timings, usage, installWarning,
      error: error ?? null,
      generationId,
      deployUrl,
      deployError,
      netlifyId,
    };
  }

  useInput(() => {
    if (stage !== "done") return;
    if (onDone) onDone(buildResult()); else exit();
  }, { isActive: stage === "done" });

  function handleErrorRetry() {
    if (onDone) onDone(buildResult()); else exit();
  }

  const activeStages: Stage[] = ["detecting", "scaffolding", "generating", "collecting-env", "installing", "validating", "fixing", "launching", "deploying", "done", "error"];
  const stageIndex = (s: Stage) => activeStages.indexOf(s);
  const past = (s: Stage) => stageIndex(stage) > stageIndex(s);

  const pastDetecting      = stage !== "detecting";
  const pastScaffolding    = wasScaffolded && past("scaffolding");
  const pastGenerating     = generatedFiles.length > 0 && past("generating");
  const pastCollectingEnv  = past("collecting-env");
  const pastInstalling     = past("installing");
  const pastValidating     = past("validating") || stage === "done";
  const pastLaunching      = Boolean(devServerUrl);

  return (
    <Box flexDirection="column" paddingY={1}>
      <Header prompt={prompt} />

      <Box flexDirection="column" paddingX={1} gap={1}>
        {IS_MOCK && <Badge type="warn" label="Mock mode — no real API calls" />}

        {pastDetecting && (
          <StatusRow
            label={`${framework}${reasoning ? `  ·  ${reasoning}` : ""}`}
            timing={timings.detecting}
            dimLabel
          />
        )}
        {pastScaffolding && (
          <StatusRow label="scaffolded" timing={timings.scaffolding} dimLabel />
        )}
        {pastGenerating && (
          <StatusRow label={`${generatedFiles.length} files generated`} timing={timings.generating} dimLabel />
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
        {pastLaunching && (
          <StatusRow label={`dev server running  ·  ${devServerUrl}`} timing={timings.launching} dimLabel />
        )}
        {(stage === "done") && remainingErrors.length > 0 && (
          <RemainingErrorsView errors={remainingErrors} />
        )}

        {stage !== "done" && stage !== "error" && <Divider />}

        {stage === "detecting"   && <Spinner label="Detecting framework..." />}
        {stage === "scaffolding" && <Spinner label="Scaffolding project..." />}
        {stage === "deploying"   && <Spinner label="Deploying to Netlify..." />}
        {stage === "generating"  && (
          <GeneratingView activeFile={activeFile} actionWord={actionWord} generatedFiles={generatedFiles} />
        )}
        {stage === "collecting-env" && pendingEnvVars.length > 0 && (
          <EnvCollector envVars={pendingEnvVars} onDone={resolveEnvVars} />
        )}
        {stage === "installing"  && <Spinner label="Installing dependencies..." />}
        {stage === "launching"   && <Spinner label="Starting dev server..." />}
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
            fileCount={generatedFiles.length}
            timings={timings}
            deployUrl={deployUrl}
            deployError={deployError}
            devServerUrl={devServerUrl}
          />
        )}
        {stage === "error" && error && (
          <ErrorView error={error} onRetry={handleErrorRetry} />
        )}
      </Box>
    </Box>
  );
}
