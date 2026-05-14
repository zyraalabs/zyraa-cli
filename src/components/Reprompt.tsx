import { Box, useApp, useInput } from "ink";
import { Header } from "./ui/Header.js";
import { Spinner } from "./ui/Spinner.js";
import { StatusRow } from "./ui/StatusRow.js";
import { Divider } from "./ui/Divider.js";
import { GeneratingView } from "./generate/GeneratingView.js";
import { DoneView } from "./generate/DoneView.js";
import { ErrorView } from "./generate/ErrorView.js";
import { useReprompt, type RepromptResult } from "./generate/useReprompt.js";

interface Props {
  prompt: string;
  generationId: string;
  framework: string;
  onDone?: (result: RepromptResult) => void;
}

export function Reprompt({ prompt, generationId, framework, onDone }: Props) {
  const { exit } = useApp();

  const {
    stage, changedFiles, activeFile, actionWord,
    usage, installWarning, error, timings, selectedCount,
  } = useReprompt(prompt, generationId, framework);

  function buildResult(): RepromptResult {
    return {
      prompt, framework,
      filesChanged: changedFiles.length,
      timings, usage, installWarning,
      error: error ?? null,
    };
  }

  useInput(() => {
    if (stage !== "done") return;
    if (onDone) onDone(buildResult()); else exit();
  }, { isActive: stage === "done" });

  function handleErrorRetry() {
    if (onDone) onDone(buildResult()); else exit();
  }

  const pastAnalyzing   = stage !== "analyzing";
  const pastReading     = !["analyzing", "reading"].includes(stage);
  const pastReprompting = changedFiles.length > 0 && ["installing", "done"].includes(stage);
  const pastInstalling  = stage === "done";

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
        {pastInstalling && !installWarning && (
          <StatusRow label="dependencies installed" timing={timings.installing} dimLabel />
        )}

        {stage !== "done" && stage !== "error" && <Divider />}

        {stage === "analyzing"   && <Spinner label="Analyzing project..." />}
        {stage === "reading"     && <Spinner label="Loading files..." />}
        {stage === "reprompting" && (
          <GeneratingView activeFile={activeFile} actionWord={actionWord} generatedFiles={changedFiles} />
        )}
        {stage === "installing"  && <Spinner label="Installing dependencies..." />}
        {stage === "done"        && (
          <DoneView
            installWarning={installWarning}
            usage={usage}
            framework={framework}
            fileCount={changedFiles.length}
            timings={timings}
            mode="reprompt"
          />
        )}
        {stage === "error" && error && (
          <ErrorView error={error} onRetry={handleErrorRetry} />
        )}
      </Box>
    </Box>
  );
}
