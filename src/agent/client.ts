import WebSocket from "ws";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import {
  editFileTool,
  listDirTool,
  readFileTool,
  runCommandTool,
  writeFileTool,
  type ExecutorResult,
} from "./executors.js";

const CONFIG_FILE = join(homedir(), ".zyra", "config");

export interface AskUserRequest {
  question: string;
  kind: "choice" | "secret";
  options: { label: string; description?: string }[];
  fields: { name: string; description?: string }[];
}

export type ActionKind =
  | "creating"
  | "editing"
  | "reading"
  | "exploring"
  | "running"
  | "asking";

export interface AgentAction {
  kind: ActionKind;
  target: string;
  detail: string;
  note: string;
}

export interface AgentEvents {
  onText: (text: string) => void;
  onThinking: (delta: string) => void;
  onToolStart: (action: AgentAction) => void;
  onToolEnd: (action: AgentAction, ok: boolean) => void;
  onAskUser: (request: AskUserRequest) => Promise<Record<string, string>>;
}

export interface AgentOutcome {
  inputTokens: number;
  outputTokens: number;
  error: string;
}

function backendWsUrl(): string {
  const base = process.env.CLI_BACKEND_URL || "https://cli-api.zyraa.live";
  return `${base.replace(/^http/, "ws")}/api/agent`;
}

function readToken(): string {
  if (!existsSync(CONFIG_FILE)) return "";
  try {
    return readFileSync(CONFIG_FILE, "utf-8").trim();
  } catch {
    return "";
  }
}

export function runAgentSession(
  prompt: string,
  framework: string,
  wasScaffolded: boolean,
  cwd: string,
  events: AgentEvents,
): Promise<AgentOutcome> {
  return new Promise((resolveOutcome, rejectOutcome) => {
    const token = readToken();
    if (!token) {
      rejectOutcome(new Error("Not authenticated. Run: zyraa login"));
      return;
    }

    const ws = new WebSocket(backendWsUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const outcome: AgentOutcome = { inputTokens: 0, outputTokens: 0, error: "" };
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolveOutcome(outcome);
    };

    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "start", prompt, framework, wasScaffolded }));
    });

    ws.on("message", (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "progress") {
        const detail = typeof msg.detail === "string" ? msg.detail : "";
        if (msg.event === "text") {
          events.onText(detail);
          return;
        }
        if (msg.event === "thinking") {
          events.onThinking(detail);
          return;
        }
        const action: AgentAction = {
          kind: (typeof msg.kind === "string" ? msg.kind : "running") as AgentAction["kind"],
          target: typeof msg.target === "string" ? msg.target : "",
          detail,
          note: typeof msg.note === "string" ? msg.note : "",
        };
        if (msg.event === "tool_start") events.onToolStart(action);
        else if (msg.event === "tool_end") events.onToolEnd(action, msg.ok !== false);
        return;
      }

      if (msg.type === "tool_call") {
        void handleToolCall(msg, cwd, events).then((result) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "tool_result",
                id: msg.id,
                ok: result.ok,
                result: result.result,
              }),
            );
          }
        });
        return;
      }

      if (msg.type === "done") {
        outcome.inputTokens = Number(msg.inputTokens ?? 0);
        outcome.outputTokens = Number(msg.outputTokens ?? 0);
        return;
      }

      if (msg.type === "error") {
        outcome.error = typeof msg.message === "string" ? msg.message : "Build failed";
      }
    });

    ws.on("close", finish);

    ws.on("error", (error) => {
      if (settled) return;
      settled = true;
      rejectOutcome(error);
    });
  });
}

async function handleToolCall(
  msg: Record<string, unknown>,
  cwd: string,
  events: AgentEvents,
): Promise<ExecutorResult> {
  const input = (msg.input ?? {}) as Record<string, unknown>;

  switch (msg.tool) {
    case "read_file":
      return readFileTool(cwd, input);
    case "write_file":
      return writeFileTool(cwd, input);
    case "edit_file":
      return editFileTool(cwd, input);
    case "list_dir":
      return listDirTool(cwd, input);
    case "run_command":
      return runCommandTool(cwd, input);
    case "ask_user": {
      const kind = input.kind === "secret" ? "secret" : "choice";
      const options = Array.isArray(input.options)
        ? (input.options as AskUserRequest["options"])
        : [];
      const fields = Array.isArray(input.fields)
        ? (input.fields as AskUserRequest["fields"])
        : [];

      if (kind === "secret" && !fields.length) {
        return { ok: false, result: "ask_user with kind \"secret\" needs at least one field." };
      }
      if (kind === "choice" && options.length < 2) {
        return { ok: false, result: "ask_user with kind \"choice\" needs at least two options." };
      }

      const answers = await events.onAskUser({
        question: typeof input.question === "string" ? input.question : "Input needed",
        kind,
        options,
        fields,
      });
      return { ok: true, result: JSON.stringify(answers) };
    }
    default:
      return { ok: false, result: `Unknown tool: ${String(msg.tool)}` };
  }
}
