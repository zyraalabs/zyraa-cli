import { useState } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { Generate } from "./Generate.js";
import { Reprompt } from "./Reprompt.js";
import { SessionSummaryRow } from "./SessionSummary.js";
import { InputBox } from "./ui/InputBox.js";
import { Divider } from "./ui/Divider.js";
import { useTheme, useThemeToggle } from "./ui/ThemeContext.js";
import { VERSION } from "../lib/constants.js";
import { hasZyraaIndex, readZyraaMeta } from "../lib/fileReader.js";
import { gitCommit, gitRevert } from "../lib/gitOps.js";
import type { GenerationResult } from "./generate/useGeneration.js";
import type { RepromptResult } from "./generate/useReprompt.js";

type AppState = "idle" | "generating" | "reprompting" | "confirm-revert";

interface SessionEntry {
  prompt: string;
  framework: string;
  fileCount: number;
  isReprompt: boolean;
}

const THEME_ICON: Record<"dark" | "light", string> = {
  dark:  "◑",
  light: "○",
};

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const theme = useTheme();
  const { scheme, toggleTheme } = useThemeToggle();

  const [appState, setAppState] = useState<AppState>("idle");
  const [input, setInput]       = useState("");
  const [prompt, setPrompt]     = useState("");
  const [sessions, setSessions] = useState<SessionEntry[]>([]);

  const [activeGenerationId, setActiveGenerationId] = useState(() => {
    const meta = readZyraaMeta(process.cwd());
    return meta?.generationId ?? "";
  });
  const [activeFramework, setActiveFramework] = useState(() => {
    const meta = readZyraaMeta(process.cwd());
    return meta?.framework ?? "nextjs";
  });

  const termWidth    = stdout?.columns ?? 80;
  const maxVisible   = termWidth - 12;
  const displayInput =
    input.length > maxVisible ? "…" + input.slice(-(maxVisible - 1)) : input;

  useInput((char, _key) => {
    if (appState !== "confirm-revert") return;
    if (char === "y") {
      gitRevert(process.cwd());
      setSessions((prev) => prev.slice(0, -1));
    }
    setAppState("idle");
  }, { isActive: appState === "confirm-revert" });

  useInput((char, key) => {
    if (appState !== "idle") return;

    if (key.escape || (key.ctrl && char === "c")) { exit(); return; }

    if (key.ctrl && char === "t") { toggleTheme(); return; }

    if (key.ctrl && char === "z") {
      if (sessions.length > 0) setAppState("confirm-revert");
      return;
    }

    if (key.return) {
      const trimmed = input.trim();
      if (!trimmed) return;
      if (trimmed === "exit" || trimmed === "quit") { exit(); return; }
      setPrompt(trimmed);
      setInput("");
      const canReprompt = hasZyraaIndex(process.cwd()) || Boolean(activeGenerationId);
      setAppState(canReprompt ? "reprompting" : "generating");
      return;
    }

    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    if (char && !key.ctrl && !key.meta) {
      setInput((prev) => prev + char.replace(/[\r\n]/g, " "));
    }
  });

  function handleGenerateDone(result: GenerationResult) {
    if (result.generationId) setActiveGenerationId(result.generationId);
    setActiveFramework(result.framework);
    gitCommit(result.prompt, process.cwd());
    setSessions((prev) => [
      ...prev,
      { prompt: result.prompt, framework: result.framework, fileCount: result.fileCount, isReprompt: false },
    ]);
    setAppState("idle");
  }

  function handleRepromptDone(result: RepromptResult) {
    gitCommit(result.prompt, process.cwd());
    setSessions((prev) => [
      ...prev,
      { prompt: result.prompt, framework: result.framework, fileCount: result.filesChanged, isReprompt: true },
    ]);
    setAppState("idle");
  }

  const inProject = hasZyraaIndex(process.cwd()) || activeGenerationId !== "";
  const hintText =
    sessions.length === 0
      ? inProject
        ? "describe your change  ·  enter to apply  ·  ^T theme  ·  ctrl+c to exit"
        : "describe what you want to build  ·  enter to generate  ·  ^T theme  ·  ctrl+c to exit"
      : "describe your next change  ·  enter to continue  ·  ^Z undo  ·  ^T theme  ·  ctrl+c to exit";

  const sessionHistory = sessions.length > 0 && (
    <Box flexDirection="column" marginBottom={1}>
      {sessions.map((s, i) => (
        <SessionSummaryRow key={i} session={s} />
      ))}
      <Box paddingX={2}>
        <Divider />
      </Box>
    </Box>
  );

  if (appState === "confirm-revert") {
    const last = sessions[sessions.length - 1];
    const preview = last.prompt.length > 52 ? last.prompt.slice(0, 49) + "…" : last.prompt;
    return (
      <Box flexDirection="column" paddingY={1}>
        {sessionHistory}
        <Box flexDirection="column" paddingX={2} gap={1}>
          <Box gap={2}>
            <Text color={theme.warn} bold>{"⚠"}</Text>
            <Text color={theme.fg} bold>{"Revert to previous build?"}</Text>
          </Box>
          <Box paddingLeft={4}>
            <Text color={theme.fgMuted}>{"undo: \""}{preview}{"\""}</Text>
          </Box>
          <Box paddingLeft={4}>
            <Text color={theme.fgSubtle}>{"press y to confirm  ·  any other key to cancel"}</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (appState === "generating") {
    return (
      <Box flexDirection="column" paddingY={1}>
        {sessionHistory}
        <Generate prompt={prompt} onDone={handleGenerateDone} />
      </Box>
    );
  }

  if (appState === "reprompting") {
    return (
      <Box flexDirection="column" paddingY={1}>
        {sessionHistory}
        <Reprompt
          prompt={prompt}
          generationId={activeGenerationId}
          framework={activeFramework}
          onDone={handleRepromptDone}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      {sessions.length === 0 ? (
        <Box
          borderStyle="round"
          borderColor={theme.borderActive}
          paddingX={2}
          marginBottom={1}
          marginX={1}
        >
          <Box flexGrow={1}>
            <Text color={theme.brandLight} bold>{"Z  Zyraa"}</Text>
            <Text color={theme.fgMuted}>{"  ·  AI-powered full-stack builder"}</Text>
          </Box>
          <Text color={theme.fgSubtle}>{THEME_ICON[scheme]}</Text>
          <Text color={theme.fgSubtle}>{"  "}</Text>
          <Text color={theme.fgSubtle}>{`v${VERSION}`}</Text>
        </Box>
      ) : (
        sessionHistory
      )}

      <Box paddingX={1} flexDirection="column" gap={1}>
        <InputBox value={displayInput} focused />
        <Box paddingX={1}>
          <Text color={theme.fgSubtle}>{hintText}</Text>
        </Box>
      </Box>
    </Box>
  );
}
