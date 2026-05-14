import { Box, useApp, useInput } from "ink";
import { Header } from "./ui/Header.js";
import { Badge } from "./ui/Badge.js";
import { Spinner } from "./ui/Spinner.js";
import { StatusRow } from "./ui/StatusRow.js";
import { Divider } from "./ui/Divider.js";
import { GeneratingView } from "./generate/GeneratingView.js";
import { DoneView } from "./generate/DoneView.js";
import { ErrorView } from "./generate/ErrorView.js";
import { useGeneration, type GenerationResult } from "./generate/useGeneration.js";
import { IS_MOCK } from "../lib/mock.js";

interface Props {
  prompt: string;
  onDone?: (result: GenerationResult) => void;
}

export function Generate({ prompt, onDone }: Props) {
  const { exit } = useApp();

  const {
    stage, framework, reasoning, wasScaffolded,
    generatedFiles, activeFile, actionWord,
    usage, installWarning, error, timings, generationId,
  } = useGeneration(prompt);

  function buildResult(): GenerationResult {
    return {
      prompt, framework, reasoning,
      fileCount: generatedFiles.length,
      timings, usage, installWarning,
      error: error ?? null,
      generationId,
    };
  }

  useInput(() => {
    if (stage !== "done") return;
    if (onDone) onDone(buildResult()); else exit();
  }, { isActive: stage === "done" });

  function handleErrorRetry() {
    if (onDone) onDone(buildResult()); else exit();
  }

  const pastDetecting   = stage !== "detecting";
  const pastScaffolding = wasScaffolded && !["detecting", "scaffolding"].includes(stage);
  const pastGenerating  = generatedFiles.length > 0 && ["installing", "done"].includes(stage);
  const pastInstalling  = stage === "done";

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
        {pastInstalling && !installWarning && (
          <StatusRow label="dependencies installed" timing={timings.installing} dimLabel />
        )}

        {stage !== "done" && stage !== "error" && <Divider />}

        {stage === "detecting"   && <Spinner label="Detecting framework..." />}
        {stage === "scaffolding" && <Spinner label="Scaffolding project..." />}
        {stage === "generating"  && (
          <GeneratingView activeFile={activeFile} actionWord={actionWord} generatedFiles={generatedFiles} />
        )}
        {stage === "installing"  && <Spinner label="Installing dependencies..." />}
        {stage === "done"        && (
          <DoneView
            installWarning={installWarning}
            usage={usage}
            framework={framework}
            fileCount={generatedFiles.length}
            timings={timings}
          />
        )}
        {stage === "error" && error && (
          <ErrorView error={error} onRetry={handleErrorRetry} />
        )}
      </Box>
    </Box>
  );
}
