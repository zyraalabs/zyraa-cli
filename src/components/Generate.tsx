import { Box, useApp, useInput } from "ink";
import { Header } from "./ui/Header.js";
import { Badge } from "./ui/Badge.js";
import { Spinner } from "./ui/Spinner.js";
import { StatusRow } from "./ui/StatusRow.js";
import { Divider } from "./ui/Divider.js";
import { GeneratingView } from "./generate/GeneratingView.js";
import { DoneView } from "./generate/DoneView.js";
import { ErrorView } from "./generate/ErrorView.js";
import { useGeneration } from "./generate/useGeneration.js";
import { IS_MOCK } from "../lib/mock.js";

export function Generate({ prompt, onDone }: { prompt: string; onDone?: () => void }) {
  const { exit } = useApp();
  const {
    stage, framework, reasoning, wasScaffolded,
    generatedFiles, activeFile, actionWord,
    usage, installWarning, error, timings,
  } = useGeneration(prompt);

  useInput(() => {
    if (stage === "done" || stage === "error") {
      if (onDone) onDone(); else exit();
    }
  }, { isActive: stage === "done" || stage === "error" });

  const pastDetecting = stage !== "detecting";
  const pastScaffolding = wasScaffolded && !["detecting", "scaffolding"].includes(stage);
  const pastGenerating = generatedFiles.length > 0 && ["installing", "done"].includes(stage);
  const pastInstalling = stage === "done";

  return (
    <Box flexDirection="column" paddingY={1}>
      <Header prompt={prompt} />

      <Box flexDirection="column" paddingX={1} gap={1}>
        {IS_MOCK && <Badge type="warn" label="Mock mode — no real API calls" />}

        {pastDetecting && (
          <StatusRow
            label={`${framework}${reasoning ? `  ·  ${reasoning}` : ""}`}
            timing={timings.detecting}
          />
        )}
        {pastScaffolding && (
          <StatusRow label="Project scaffolded" timing={timings.scaffolding} />
        )}
        {pastGenerating && (
          <StatusRow label={`${generatedFiles.length} files generated`} timing={timings.generating} />
        )}
        {pastInstalling && !installWarning && (
          <StatusRow label="Dependencies installed" timing={timings.installing} />
        )}

        {stage !== "done" && stage !== "error" && <Divider />}

        {stage === "detecting" && <Spinner label="Detecting framework..." />}
        {stage === "scaffolding" && <Spinner label="Scaffolding project..." />}
        {stage === "generating" && (
          <GeneratingView
            activeFile={activeFile}
            actionWord={actionWord}
            generatedFiles={generatedFiles}
          />
        )}
        {stage === "installing" && <Spinner label="Installing dependencies..." />}

        {stage === "done" && (
          <DoneView
            installWarning={installWarning}
            usage={usage}
            framework={framework}
            fileCount={generatedFiles.length}
            timings={timings}
          />
        )}

        {stage === "error" && error && <ErrorView error={error} />}
      </Box>
    </Box>
  );
}
