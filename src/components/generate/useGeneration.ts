import { useState, useEffect, useRef } from "react";
import { existsSync } from "fs";
import { join } from "path";
import { detectFramework } from "../generation/detectFramework.js";
import { runScaffoldCommand } from "../../lib/scaffold.js";
import { streamGenerate } from "../../api/endpoints/generate.js";
import { parseGenerateResponse } from "../../lib/parser.js";
import { writeFiles } from "../../lib/fileWriter.js";
import { installDependencies } from "../../lib/projectSetup.js";
import { runBuild, type BuildError } from "../../lib/buildValidator.js";
import { callRepromptSelect } from "../../api/endpoints/repromptSelect.js";
import { streamReprompt } from "../../api/endpoints/reprompt.js";
import {
  readProjectIndex,
  readFiles,
  hasZyraaIndex,
  writeZyraaIndex,
  writeZyraaMeta,
  refreshZyraaIndex,
} from "../../lib/fileReader.js";
import { nextActionWord } from "../../lib/actionWords.js";

export type Stage =
  | "detecting"
  | "scaffolding"
  | "generating"
  | "installing"
  | "validating"
  | "fixing"
  | "done"
  | "error";

const MAX_FIX_ATTEMPTS = 3;

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

export interface GenerationResult {
  prompt: string;
  framework: string;
  reasoning: string;
  fileCount: number;
  timings: Timings;
  usage: { inputTokens: number; outputTokens: number } | null;
  installWarning: string;
  error: AppError | null;
  generationId: string;
}

function resolveError(err: unknown): AppError {
  if (!(err instanceof Error))
    return { message: "An unexpected error occurred" };
  if (err.message.includes("ECONNREFUSED"))
    return {
      message: "Cannot connect to server",
      hint: "Start the backend: pnpm dev",
    };
  if (
    err.message.includes("401") ||
    err.message.toLowerCase().includes("unauthorized")
  )
    return {
      message: err.message.includes("expired")
        ? "Session expired"
        : "Not authenticated",
      hint: "Run: zyraa login",
    };
  if (
    err.message.includes("403") ||
    err.message.toLowerCase().includes("build limit") ||
    err.message.toLowerCase().includes("limit reached")
  )
    return {
      message: "Build limit reached",
      hint: "Upgrade your plan at zyraa.live",
    };
  if (
    err.message.includes("429") ||
    err.message.toLowerCase().includes("rate limit")
  )
    return { message: "Too many requests — wait a moment and try again" };
  if (
    err.message.toLowerCase().includes("blocked") ||
    err.message.toLowerCase().includes("security")
  )
    return { message: err.message };
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
  const [usage, setUsage] = useState<{
    inputTokens: number;
    outputTokens: number;
  } | null>(null);
  const [installWarning, setInstallWarning] = useState("");
  const [fixAttempt, setFixAttempt] = useState(0);
  const [fixingErrors, setFixingErrors] = useState<BuildError[]>([]);
  const [fixedErrors, setFixedErrors] = useState<BuildError[]>([]);
  const [remainingErrors, setRemainingErrors] = useState<BuildError[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [timings, setTimings] = useState<Timings>({});
  const [generationId, setGenerationId] = useState("");

  const stageStart = useRef(Date.now());
  const sessionStart = useRef(Date.now());

  function recordTiming(key: keyof Timings) {
    const elapsed = (Date.now() - stageStart.current) / 1000;
    setTimings((prev) => ({ ...prev, [key]: elapsed }));
    stageStart.current = Date.now();
  }

  useEffect(() => {
    if (stage !== "generating") return;
    const id = setInterval(() => setActionWord(nextActionWord()), 3000);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    const run = async () => {
      try {
        const detection = await detectFramework(prompt);
        setFramework(detection.framework);
        setReasoning(detection.reasoning);
        recordTiming("detecting");

        const projectAlreadyExists = existsSync(
          join(process.cwd(), "package.json"),
        );
        if (
          !projectAlreadyExists &&
          detection.needsScaffold &&
          detection.scaffoldCommand
        ) {
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

        const {
          output,
          usage: u,
          generationId,
        } = await streamGenerate(
          {
            prompt,
            framework: detection.framework,
            wasScaffolded: detection.needsScaffold,
          },
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

        const parsedFiles = parseGenerateResponse(output).files;
        writeFiles(parsedFiles, process.cwd());
        setUsage(u);
        if (generationId) {
          setGenerationId(generationId);
          writeZyraaMeta(process.cwd(), generationId, detection.framework);
        }
        // Guarantee .zyraa/index.md exists for reprompt routing — LLM may skip it
        if (!hasZyraaIndex(process.cwd())) {
          writeZyraaIndex(
            process.cwd(),
            parsedFiles.map((f) => f.path),
          );
        }
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

        let fixAttempt = 0;
        const currentGenerationId = generationId;
        const currentFramework = detection.framework;

        while (fixAttempt < MAX_FIX_ATTEMPTS) {
          setStage("validating");
          const build = await runBuild(process.cwd());
          if (build.clean) break;

          fixAttempt++;
          setStage("fixing");
          setFixAttempt(fixAttempt);
          setFixingErrors(build.parsed);

          const { indexContent } = readProjectIndex(process.cwd());
          const errorPrompt = `Fix these build errors:\n\n${build.errors}`;
          const filePaths = await callRepromptSelect({
            generationId: currentGenerationId,
            prompt: errorPrompt,
            indexContent,
          });

          const files = readFiles(filePaths, process.cwd());
          if (!files.length) {
            setFixingErrors([]);
            break;
          }

          const { output } = await streamReprompt(
            {
              generationId: currentGenerationId,
              prompt: errorPrompt,
              files,
              framework: currentFramework,
            },
            () => {},
          );

          const fixed = parseGenerateResponse(output).files;
          writeFiles(fixed, process.cwd());
          refreshZyraaIndex(process.cwd());

          setFixedErrors((prev) => [...prev, ...build.parsed]);
          setFixingErrors([]);

          const needsInstall = fixed.some((f) => f.path === "package.json");
          if (needsInstall)
            await installDependencies(process.cwd()).catch(() => {});
        }

        if (fixAttempt >= MAX_FIX_ATTEMPTS) {
          setStage("validating");
          const finalBuild = await runBuild(process.cwd());
          if (!finalBuild.clean) setRemainingErrors(finalBuild.parsed);
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
    stage,
    framework,
    reasoning,
    wasScaffolded,
    generatedFiles,
    activeFile,
    actionWord,
    usage,
    installWarning,
    error,
    timings,
    generationId,
    fixAttempt,
    fixingErrors,
    fixedErrors,
    remainingErrors,
  };
}
