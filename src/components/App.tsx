import { useState, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { Generate } from "./Generate.js";
import { SessionSummary } from "./SessionSummary.js";
import { VERSION } from "../lib/constants.js";
import type { GenerationResult } from "./generate/useGeneration.js";

type AppState = "idle" | "generating";

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
  const [sessions, setSessions] = useState<GenerationResult[]>([]);

  const termWidth = stdout?.columns ?? 80;
  // prefix "❯ " = 2 chars + paddingX 2*2 = 4 + border 2 = 6, plus outer paddingX 2
  const maxVisible = termWidth - 12;
  const displayInput = input.length > maxVisible
    ? "…" + input.slice(-(maxVisible - 1))
    : input;

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
      setAppState("generating");
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

  function handleDone(result: GenerationResult) {
    setSessions((prev) => [...prev, result]);
    setAppState("idle");
  }

  if (appState === "generating") {
    return (
      <Box flexDirection="column" paddingY={1}>
        {sessions.length > 0 && (
          <Box flexDirection="column">
            {sessions.map((s, i) => <SessionSummary key={i} result={s} />)}
          </Box>
        )}
        <Generate prompt={prompt} onDone={handleDone} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      {sessions.length === 0 && (
        <Box borderStyle="round" borderColor="#7C3AED" paddingX={2} marginBottom={1} marginX={1}>
          <Box flexGrow={1}>
            <Text color="#7C3AED" bold>{"⬡  Zyraa"}</Text>
            <Text color="#6B7280">{"  ·  AI-powered full-stack builder"}</Text>
          </Box>
          <Text color="#6B7280">{`v${VERSION}`}</Text>
        </Box>
      )}

      {sessions.length > 0 && (
        <Box flexDirection="column">
          {sessions.map((s, i) => <SessionSummary key={i} result={s} />)}
        </Box>
      )}

      <Box paddingX={1} flexDirection="column" gap={1}>
        <Box gap={2} borderStyle="round" borderColor="#374151" paddingX={2}>
          <Text color="#7C3AED" bold>{"❯"}</Text>
          <Text>{displayInput}<Cursor /></Text>
        </Box>
        <Box paddingX={1}>
          <Text color="#6B7280" dimColor>
            {sessions.length === 0
              ? "describe what you want to build  ·  enter to generate  ·  ctrl+c to exit"
              : "describe your next change  ·  enter to continue  ·  ctrl+c to exit"}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
