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

  useInput(() => {
    if (stage === "done" || stage === "error") {
      const result: RepromptResult = {
        prompt,
        framework,
        filesChanged: changedFiles.length,
        timings,
        usage,
        installWarning,
        error: error ?? null,
      };
      if (onDone) onDone(result); else exit();
    }
  }, { isActive: stage === "done" || stage === "error" });

  const pastAnalyzing = stage !== "analyzing";
  const pastReading = !["analyzing", "reading"].includes(stage);
  const pastReprompting = changedFiles.length > 0 && ["installing", "done"].includes(stage);
  const pastInstalling = stage === "done";

  return (
    <Box flexDirection="column" paddingY={1}>
      <Header prompt={prompt} />

      <Box flexDirection="column" paddingX={1} gap={1}>
        {pastAnalyzing && (
          <StatusRow
            label={`${selectedCount} file${selectedCount !== 1 ? "s" : ""} selected`}
            timing={timings.detecting}
          />
        )}
        {pastReading && (
          <StatusRow label="Files loaded" timing={timings.scaffolding} />
        )}
        {pastReprompting && (
          <StatusRow label={`${changedFiles.length} files updated`} timing={timings.generating} />
        )}
        {pastInstalling && !installWarning && (
          <StatusRow label="Dependencies installed" timing={timings.installing} />
        )}

        {stage !== "done" && stage !== "error" && <Divider />}

        {stage === "analyzing" && <Spinner label="Analyzing project..." />}
        {stage === "reading" && <Spinner label="Loading files..." />}
        {stage === "reprompting" && (
          <GeneratingView
            activeFile={activeFile}
            actionWord={actionWord}
            generatedFiles={changedFiles}
          />
        )}
        {stage === "installing" && <Spinner label="Installing dependencies..." />}

        {stage === "done" && (
          <DoneView
            installWarning={installWarning}
            usage={usage}
            framework={framework}
            fileCount={changedFiles.length}
            timings={timings}
            mode="reprompt"
          />
        )}

        {stage === "error" && error && <ErrorView error={error} />}
      </Box>
    </Box>
  );
}
