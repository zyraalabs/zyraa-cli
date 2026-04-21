import { useState, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { Generate } from "./Generate.js";
import { Reprompt } from "./Reprompt.js";
import { VERSION } from "../lib/constants.js";
import { hasZyraaIndex, readZyraaMeta } from "../lib/fileReader.js";
import type { GenerationResult } from "./generate/useGeneration.js";
import type { RepromptResult } from "./generate/useReprompt.js";

type AppState = "idle" | "generating" | "reprompting";

interface SessionEntry {
  prompt: string;
  framework: string;
  fileCount: number;
  isReprompt: boolean;
}

function Cursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);
  return <Text color="#7C3AED">{visible ? "▋" : " "}</Text>;
}

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [appState, setAppState] = useState<AppState>("idle");
  const [input, setInput] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sessions, setSessions] = useState<SessionEntry[]>([]);

  // Reprompt context — persists across sessions in same CLI run
  const [activeGenerationId, setActiveGenerationId] = useState(() => {
    const meta = readZyraaMeta(process.cwd());
    return meta?.generationId ?? "";
  });
  const [activeFramework, setActiveFramework] = useState(() => {
    const meta = readZyraaMeta(process.cwd());
    return meta?.framework ?? "nextjs";
  });

  const termWidth = stdout?.columns ?? 80;
  const maxVisible = termWidth - 12;
  const displayInput =
    input.length > maxVisible ? "…" + input.slice(-(maxVisible - 1)) : input;

  useInput((char, key) => {
    if (appState !== "idle") return;

    if (key.escape || (key.ctrl && char === "c")) {
      exit();
      return;
    }

    if (key.return) {
      const trimmed = input.trim();
      if (!trimmed) return;
      if (trimmed === "exit" || trimmed === "quit") { exit(); return; }
      setPrompt(trimmed);
      setInput("");
      // Check fresh at submit time — .zyraa/index.md may have been created this session
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
    setSessions((prev) => [
      ...prev,
      {
        prompt: result.prompt,
        framework: result.framework,
        fileCount: result.fileCount,
        isReprompt: false,
      },
    ]);
    setAppState("idle");
  }

  function handleRepromptDone(result: RepromptResult) {
    setSessions((prev) => [
      ...prev,
      {
        prompt: result.prompt,
        framework: result.framework,
        fileCount: result.filesChanged,
        isReprompt: true,
      },
    ]);
    setAppState("idle");
  }

  const inProject = hasZyraaIndex(process.cwd()) || activeGenerationId !== "";
  const hintText = sessions.length === 0
    ? inProject
      ? "describe your change  ·  enter to apply  ·  ctrl+c to exit"
      : "describe what you want to build  ·  enter to generate  ·  ctrl+c to exit"
    : "describe your next change  ·  enter to continue  ·  ctrl+c to exit";

  if (appState === "generating") {
    return (
      <Box flexDirection="column" paddingY={1}>
        {sessions.length > 0 && (
          <Box flexDirection="column">
            {sessions.map((s, i) => (
              <SessionSummaryRow key={i} session={s} />
            ))}
          </Box>
        )}
        <Generate prompt={prompt} onDone={handleGenerateDone} />
      </Box>
    );
  }

  if (appState === "reprompting") {
    return (
      <Box flexDirection="column" paddingY={1}>
        {sessions.length > 0 && (
          <Box flexDirection="column">
            {sessions.map((s, i) => (
              <SessionSummaryRow key={i} session={s} />
            ))}
          </Box>
        )}
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
      {sessions.length === 0 && (
        <Box
          borderStyle="round"
          borderColor="#7C3AED"
          paddingX={2}
          marginBottom={1}
          marginX={1}
        >
          <Box flexGrow={1}>
            <Text color="#7C3AED" bold>{"⬡  Zyraa"}</Text>
            <Text color="#6B7280">{"  ·  AI-powered full-stack builder"}</Text>
          </Box>
          <Text color="#6B7280">{`v${VERSION}`}</Text>
        </Box>
      )}

      {sessions.length > 0 && (
        <Box flexDirection="column">
          {sessions.map((s, i) => (
            <SessionSummaryRow key={i} session={s} />
          ))}
        </Box>
      )}

      <Box paddingX={1} flexDirection="column" gap={1}>
        <Box gap={2} borderStyle="round" borderColor="#374151" paddingX={2}>
          <Text color="#7C3AED" bold>{"❯"}</Text>
          <Text>{displayInput}<Cursor /></Text>
        </Box>
        <Box paddingX={1}>
          <Text color="#6B7280" dimColor>{hintText}</Text>
        </Box>
      </Box>
    </Box>
  );
}

function SessionSummaryRow({ session }: { session: SessionEntry }) {
  return (
    <Box paddingX={2} paddingY={0} gap={2}>
      <Text color="#059669">{"✓"}</Text>
      <Text color="#6B7280" dimColor>
        {session.isReprompt ? "updated" : "built"}{" "}
      </Text>
      <Text>{session.prompt.length > 60 ? session.prompt.slice(0, 57) + "…" : session.prompt}</Text>
      <Text color="#6B7280" dimColor>
        {"·"} {session.fileCount} file{session.fileCount !== 1 ? "s" : ""}
      </Text>
    </Box>
  );
}
