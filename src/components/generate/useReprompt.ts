import { useState, useEffect, useRef } from "react";
import { readProjectIndex, readFiles, refreshZyraaIndex } from "../../lib/fileReader.js";
import { callRepromptSelect } from "../../api/endpoints/repromptSelect.js";
import { streamReprompt } from "../../api/endpoints/reprompt.js";
import { parseGenerateResponse } from "../../lib/parser.js";
import { writeFiles } from "../../lib/fileWriter.js";
import { installDependencies } from "../../lib/projectSetup.js";
import { runBuild, type BuildError } from "../../lib/buildValidator.js";
import { nextActionWord } from "../../lib/actionWords.js";
import { buildStaticExport, runDeployBuild, zipOutDir } from "../../lib/deployer.js";
import { deployProject } from "../../api/endpoints/deploy.js";
import type { AppError, Timings } from "./useGeneration.js";

const MAX_FIX_ATTEMPTS = 3;

export type RepromptStage =
  | "analyzing"
  | "reading"
  | "reprompting"
  | "installing"
  | "validating"
  | "fixing"
  | "deploying"
  | "done"
  | "error";

export interface RepromptResult {
  prompt: string;
  framework: string;
  filesChanged: number;
  timings: Timings;
  usage: { inputTokens: number; outputTokens: number } | null;
  installWarning: string;
  error: AppError | null;
  deployUrl: string;
  deployError: string;
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
    err.message.toLowerCase().includes("limit")
  )
    return {
      message: "Build limit reached",
      hint: "Upgrade your plan at zyraa.live",
    };
  if (err.message.includes("429"))
    return { message: "Rate limit exceeded — try again shortly" };
  return { message: err.message };
}

export function useReprompt(
  prompt: string,
  generationId: string,
  framework: string,
  deploy = false,
  netlifyId = "",
) {
  const [stage, setStage] = useState<RepromptStage>("analyzing");
  const [changedFiles, setChangedFiles] = useState<string[]>([]);
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
  const [selectedCount, setSelectedCount] = useState(0);
  const [deployUrl, setDeployUrl] = useState("");
  const [deployError, setDeployError] = useState("");

  const stageStart = useRef(Date.now());
  const sessionStart = useRef(Date.now());

  function recordTiming(key: keyof Timings) {
    const elapsed = (Date.now() - stageStart.current) / 1000;
    setTimings((prev) => ({ ...prev, [key]: elapsed }));
    stageStart.current = Date.now();
  }

  useEffect(() => {
    if (stage !== "reprompting") return;
    const id = setInterval(() => setActionWord(nextActionWord()), 3000);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    const run = async () => {
      try {
        // Pass 1: select relevant files via Haiku
        const { indexContent } = readProjectIndex(process.cwd());
        const filePaths = await callRepromptSelect({
          generationId,
          prompt,
          indexContent,
        });
        setSelectedCount(filePaths.length);
        recordTiming("detecting");

        // Read selected file contents from disk
        setStage("reading");
        stageStart.current = Date.now();
        const files = readFiles(filePaths, process.cwd());
        recordTiming("scaffolding");

        // Pass 2: stream targeted changes
        setStage("reprompting");
        stageStart.current = Date.now();

        let buf = "";
        let cur = "";

        const { output, usage: u } = await streamReprompt(
          { generationId, prompt, files, framework },
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
              setChangedFiles((prev) => [...prev, cur]);
              setActiveFile("");
              cur = "";
              buf = buf.slice(closeIdx + 7);
            }
          },
        );

        const parsedFiles = parseGenerateResponse(output).files;
        writeFiles(parsedFiles, process.cwd());
        setUsage(u);
        recordTiming("generating");

        // Only install if package.json was among the changed files
        const needsInstall = parsedFiles.some((f) => f.path === "package.json");
        if (needsInstall) {
          setStage("installing");
          stageStart.current = Date.now();
          try {
            await installDependencies(process.cwd());
            recordTiming("installing");
          } catch {
            setInstallWarning(
              "Dependencies failed — run pnpm install manually",
            );
            recordTiming("installing");
          }
        }

        let fixAttemptCount = 0;

        while (fixAttemptCount < MAX_FIX_ATTEMPTS) {
          setStage("validating");
          const build = deploy
            ? await runDeployBuild(process.cwd())
            : await runBuild(process.cwd());
          if (build.clean) break;

          fixAttemptCount++;
          setStage("fixing");
          setFixAttempt(fixAttemptCount);
          setFixingErrors(build.parsed);

          const { indexContent } = readProjectIndex(process.cwd());
          const errorPrompt = `Fix these build errors:\n\n${build.errors}`;
          const filePaths = await callRepromptSelect({
            generationId,
            prompt: errorPrompt,
            indexContent,
          });

          const fixFiles = readFiles(filePaths, process.cwd());
          if (!fixFiles.length) {
            setFixingErrors([]);
            break;
          }

          const { output: fixOutput } = await streamReprompt(
            { generationId, prompt: errorPrompt, files: fixFiles, framework },
            () => {},
          );

          const fixed = parseGenerateResponse(fixOutput).files;
          writeFiles(fixed, process.cwd());
          refreshZyraaIndex(process.cwd());

          setFixedErrors((prev) => [...prev, ...build.parsed]);
          setFixingErrors([]);

          const needsInstall = fixed.some((f) => f.path === "package.json");
          if (needsInstall) await installDependencies(process.cwd()).catch(() => {});
        }

        if (fixAttemptCount >= MAX_FIX_ATTEMPTS) {
          setStage("validating");
          const finalBuild = deploy
            ? await runDeployBuild(process.cwd())
            : await runBuild(process.cwd());
          if (!finalBuild.clean) setRemainingErrors(finalBuild.parsed);
        }

        const total = (Date.now() - sessionStart.current) / 1000;
        setTimings((prev) => ({ ...prev, total }));

        if (deploy) {
          setStage("deploying");
          stageStart.current = Date.now();
          try {
            await buildStaticExport(process.cwd(), true);
            const zip = zipOutDir(process.cwd());
            const { url } = await deployProject(generationId, zip, netlifyId || undefined);
            setDeployUrl(url);
            recordTiming("deploying");
          } catch (err) {
            setDeployError(err instanceof Error ? err.message : "Deployment failed");
          }
        }

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
    changedFiles,
    activeFile,
    actionWord,
    usage,
    installWarning,
    fixAttempt,
    fixingErrors,
    fixedErrors,
    remainingErrors,
    error,
    timings,
    selectedCount,
    deployUrl,
    deployError,
  };
}
