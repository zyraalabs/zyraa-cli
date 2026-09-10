import { useState, useEffect, useRef } from "react";
import { existsSync } from "fs";
import { join } from "path";
import { detectFramework } from "../generation/detectFramework.js";
import { runScaffoldCommand } from "../../lib/scaffold.js";
import { installDependencies } from "../../lib/projectSetup.js";
import { runAgentSession, type AskUserRequest } from "../../agent/client.js";
import { refreshZyraaIndex, writeZyraaMeta } from "../../lib/fileReader.js";
import { zipSourceFiles } from "../../lib/deployer.js";
import { deployProject } from "../../api/endpoints/deploy.js";
import { writeEnvFile, type EnvVar } from "../../lib/envScanner.js";
import { launchDevServer } from "../../lib/devServer.js";
import type { AppError, GenerationResult, Timings } from "./useGeneration.js";

export type AgentStage =
  | "detecting"
  | "scaffolding"
  | "building"
  | "collecting-env"
  | "installing"
  | "launching"
  | "deploying"
  | "done"
  | "error";

export interface AgentStep {
  detail: string;
  ok: boolean | null;
}

const MAX_VISIBLE_STEPS = 200;

function resolveError(err: unknown): AppError {
  if (!(err instanceof Error)) return { message: "An unexpected error occurred" };
  if (err.message.includes("ECONNREFUSED")) {
    return { message: "Cannot connect to server", hint: "Start the backend: pnpm dev" };
  }
  if (err.message.toLowerCase().includes("not authenticated")) {
    return { message: "Not authenticated", hint: "Run: zyraa login" };
  }
  return { message: err.message };
}

export function useAgentGeneration(prompt: string, deploy = false) {
  const [stage, setStage] = useState<AgentStage>("detecting");
  const [framework, setFramework] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [summary, setSummary] = useState("");
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [agentNotice, setAgentNotice] = useState("");
  const [timings, setTimings] = useState<Timings>({});
  const [deployUrl, setDeployUrl] = useState("");
  const [deployError, setDeployError] = useState("");
  const [vercelProjectId, setVercelProjectId] = useState("");
  const [devServerUrl, setDevServerUrl] = useState("");
  const [pendingEnvVars, setPendingEnvVars] = useState<EnvVar[]>([]);

  const stageStart = useRef(Date.now());
  const sessionStart = useRef(Date.now());
  const envResolverRef = useRef<((values: Record<string, string>) => void) | null>(null);

  function recordTiming(key: keyof Timings) {
    const elapsed = (Date.now() - stageStart.current) / 1000;
    setTimings((prev) => ({ ...prev, [key]: elapsed }));
    stageStart.current = Date.now();
  }

  function resolveEnvVars(values: Record<string, string>) {
    envResolverRef.current?.(values);
    envResolverRef.current = null;
  }

  useEffect(() => {
    const run = async () => {
      try {
        const detection = await detectFramework(prompt);
        setFramework(detection.framework);
        setReasoning(detection.reasoning);
        recordTiming("detecting");

        const projectExists = existsSync(join(process.cwd(), "package.json"));
        let wasScaffolded = false;

        if (!projectExists && detection.needsScaffold && detection.scaffoldCommand) {
          setStage("scaffolding");
          stageStart.current = Date.now();
          try {
            await runScaffoldCommand(detection.scaffoldCommand, process.cwd());
            wasScaffolded = true;
          } catch {
            wasScaffolded = false;
          }
          recordTiming("scaffolding");
        }

        setStage("building");
        stageStart.current = Date.now();

        const outcome = await runAgentSession(
          prompt,
          detection.framework,
          wasScaffolded,
          process.cwd(),
          {
            onText: (text) => setSummary((prev) => (prev + text).slice(-2000)),
            onToolStart: (detail) =>
              setSteps((prev) => [...prev, { detail, ok: null }].slice(-MAX_VISIBLE_STEPS)),
            onToolEnd: (detail) =>
              setSteps((prev) => {
                const next = [...prev];
                for (let i = next.length - 1; i >= 0; i--) {
                  if (next[i].ok === null) {
                    next[i] = { detail: next[i].detail, ok: !detail.startsWith("failed") };
                    break;
                  }
                }
                return next;
              }),
            onAskUser: (request: AskUserRequest) => {
              const vars: EnvVar[] = request.fields.map((field) => ({
                key: field.name,
                hint: field.description ?? request.question,
                placeholder: `your_${field.name.toLowerCase()}_here`,
              }));
              setPendingEnvVars(vars);
              setStage("collecting-env");
              return new Promise<Record<string, string>>((resolve) => {
                envResolverRef.current = (values) => {
                  writeEnvFile(values, process.cwd());
                  setPendingEnvVars([]);
                  setStage("building");
                  resolve(values);
                };
              });
            },
          },
        );

        setUsage({ inputTokens: outcome.inputTokens, outputTokens: outcome.outputTokens });
        if (outcome.error) setAgentNotice(outcome.error);
        recordTiming("generating");

        refreshZyraaIndex(process.cwd());

        setStage("installing");
        stageStart.current = Date.now();
        await installDependencies(process.cwd()).catch(() => {});
        recordTiming("installing");

        const total = (Date.now() - sessionStart.current) / 1000;
        setTimings((prev) => ({ ...prev, total }));

        if (deploy) {
          setStage("deploying");
          stageStart.current = Date.now();
          try {
            const zip = zipSourceFiles(process.cwd());
            const { url, vercelProjectId: pid } = await deployProject(
              "",
              zip,
              undefined,
              detection.framework,
            );
            setDeployUrl(url);
            setVercelProjectId(pid);
            writeZyraaMeta(process.cwd(), "", detection.framework, pid);
            recordTiming("deploying");
          } catch (err) {
            setDeployError(err instanceof Error ? err.message : "Deployment failed");
          }
        } else {
          setStage("launching");
          stageStart.current = Date.now();
          const url = await launchDevServer(process.cwd());
          if (url) setDevServerUrl(url);
          recordTiming("launching");
        }

        setStage("done");
      } catch (err) {
        setError(resolveError(err));
        setStage("error");
      }
    };

    run();
  }, []);

  function buildResult(): GenerationResult {
    return {
      prompt,
      framework,
      reasoning,
      fileCount: steps.filter((s) => s.detail.startsWith("write file") || s.detail.startsWith("edit file")).length,
      timings,
      usage,
      installWarning: "",
      error: error ?? null,
      generationId: "",
      deployUrl,
      deployError,
      vercelProjectId,
    };
  }

  return {
    stage,
    framework,
    reasoning,
    steps,
    summary,
    usage,
    error,
    agentNotice,
    timings,
    deployUrl,
    deployError,
    vercelProjectId,
    devServerUrl,
    pendingEnvVars,
    resolveEnvVars,
    buildResult,
  };
}
