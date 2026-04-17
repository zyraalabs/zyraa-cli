import { useState, useEffect, useRef } from "react";
import { detectFramework } from "../generation/detectFramework.js";
import { runScaffoldCommand } from "../../lib/scaffold.js";
import { streamGenerate } from "../../api/endpoints/generate.js";
import { parseGenerateResponse } from "../../lib/parser.js";
import { writeFiles } from "../../lib/fileWriter.js";
import { installDependencies } from "../../lib/projectSetup.js";
import { nextActionWord } from "../../lib/actionWords.js";

export type Stage = "detecting" | "scaffolding" | "generating" | "installing" | "done" | "error";

export interface AppError {
  message: string;
  hint?: string;
}

export interface Timings {
  detecting?: number;
  scaffolding?: number;
  generating?: number;
  installing?: number;
  total?: number;
}

function resolveError(err: unknown): AppError {
  if (!(err instanceof Error)) return { message: "An unexpected error occurred" };
  if (err.message.includes("ECONNREFUSED"))
    return { message: "Cannot connect to server", hint: "Start the backend: pnpm dev" };
  if (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized"))
    return { message: "Not authenticated", hint: "Run: zyraa login" };
  if (err.message.includes("429"))
    return { message: "Rate limit exceeded — try again shortly" };
  return { message: err.message };
}

export function useGeneration(prompt: string) {
  const [stage, setStage] = useState<Stage>("detecting");
  const [framework, setFramework] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [wasScaffolded, setWasScaffolded] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [actionWord, setActionWord] = useState(nextActionWord());
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null);
  const [installWarning, setInstallWarning] = useState("");
  const [error, setError] = useState<AppError | null>(null);
  const [timings, setTimings] = useState<Timings>({});

  const stageStart = useRef(Date.now());
  const sessionStart = useRef(Date.now());

  function recordTiming(key: keyof Timings) {
    const elapsed = (Date.now() - stageStart.current) / 1000;
    setTimings((prev) => ({ ...prev, [key]: elapsed }));
    stageStart.current = Date.now();
  }

  useEffect(() => {
    if (stage !== "generating") return;
    const id = setInterval(() => setActionWord(nextActionWord()), 1600);
    return () => clearInterval(id);
  }, [stage]);


  useEffect(() => {
    const run = async () => {
      try {
        const detection = await detectFramework(prompt);
        setFramework(detection.framework);
        setReasoning(detection.reasoning);
        recordTiming("detecting");

        if (detection.needsScaffold && detection.scaffoldCommand) {
          setStage("scaffolding");
          stageStart.current = Date.now();
          try {
            await runScaffoldCommand(detection.scaffoldCommand, process.cwd());
            setWasScaffolded(true);
          } catch {
            setWasScaffolded(false);
          }
          recordTiming("scaffolding");
        }

        setStage("generating");
        stageStart.current = Date.now();

        let buf = "";
        let cur = "";

        const { output, usage: u } = await streamGenerate(
          { prompt, framework: detection.framework, wasScaffolded: detection.needsScaffold },
          (chunk) => {
            buf += chunk;
            while (true) {
              if (!cur) {
                const m = buf.match(/<file path="([^"]+)">/);
                if (!m) break;
                cur = m[1];
                setActiveFile(cur);
              }
              const closeIdx = buf.indexOf("</file>");
              if (closeIdx === -1) break;
              setGeneratedFiles((prev) => [...prev, cur]);
              setActiveFile("");
              cur = "";
              buf = buf.slice(closeIdx + 7);
            }
          },
        );

        writeFiles(parseGenerateResponse(output).files, process.cwd());
        setUsage(u);
        recordTiming("generating");

        setStage("installing");
        stageStart.current = Date.now();
        try {
          await installDependencies(process.cwd());
          recordTiming("installing");
        } catch {
          setInstallWarning("Dependencies failed — run pnpm install manually");
          recordTiming("installing");
        }

        const total = (Date.now() - sessionStart.current) / 1000;
        setTimings((prev) => ({ ...prev, total }));
        setStage("done");
      } catch (err) {
        setError(resolveError(err));
        setStage("error");
      }
    };

    run();
  }, []);

  return {
    stage, framework, reasoning, wasScaffolded,
    generatedFiles, activeFile, actionWord,
    usage, installWarning, error, timings,
  };
}
