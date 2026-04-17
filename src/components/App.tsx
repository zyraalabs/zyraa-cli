import { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { Generate } from "./Generate.js";
import { VERSION } from "../lib/constants.js";

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
  const [appState, setAppState] = useState<AppState>("idle");
  const [input, setInput] = useState("");
  const [prompt, setPrompt] = useState("");

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
      setInput((prev) => prev + char);
    }
  });

  if (appState === "generating") {
    return <Generate prompt={prompt} onDone={() => setAppState("idle")} />;
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box borderStyle="round" borderColor="#7C3AED" paddingX={2} marginBottom={1}>
        <Box flexGrow={1}>
          <Text color="#7C3AED" bold>{"⬡  Zyraa"}</Text>
          <Text color="#6B7280">{"  ·  AI-powered full-stack builder"}</Text>
        </Box>
        <Text color="#6B7280">{`v${VERSION}`}</Text>
      </Box>

      <Box paddingX={1} flexDirection="column" gap={1}>
        <Box gap={2} borderStyle="round" borderColor="#374151" paddingX={2}>
          <Text color="#7C3AED" bold>{"❯"}</Text>
          <Text>{input}<Cursor /></Text>
        </Box>
        <Box paddingX={1}>
          <Text color="#6B7280" dimColor>{"describe what you want to build  ·  enter to generate  ·  ctrl+c to exit"}</Text>
        </Box>
      </Box>
    </Box>
  );
}
