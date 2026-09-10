import { spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { dirname, relative, resolve } from "path";

const MAX_OUTPUT_CHARS = 30_000;
const MAX_FILE_CHARS = 200_000;
const COMMAND_TIMEOUT_MS = 170_000;

export interface ExecutorResult {
  ok: boolean;
  result: string;
}

function safePath(cwd: string, candidate: unknown): string | null {
  if (typeof candidate !== "string" || !candidate.trim()) return null;
  const root = resolve(cwd);
  const full = resolve(root, candidate);
  const rel = relative(root, full);
  if (rel.startsWith("..") || resolve(root, rel) !== full) return null;
  return full;
}

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n\n[truncated — ${text.length - limit} more characters]`;
}

export function readFileTool(cwd: string, input: Record<string, unknown>): ExecutorResult {
  const full = safePath(cwd, input.path);
  if (!full) return { ok: false, result: "Invalid path: must stay inside the project." };
  if (!existsSync(full)) return { ok: false, result: `File not found: ${String(input.path)}` };
  if (statSync(full).isDirectory()) {
    return { ok: false, result: `${String(input.path)} is a directory — use list_dir.` };
  }
  try {
    return { ok: true, result: truncate(readFileSync(full, "utf-8"), MAX_FILE_CHARS) };
  } catch (error) {
    return { ok: false, result: error instanceof Error ? error.message : "Read failed" };
  }
}

export function writeFileTool(cwd: string, input: Record<string, unknown>): ExecutorResult {
  const full = safePath(cwd, input.path);
  if (!full) return { ok: false, result: "Invalid path: must stay inside the project." };
  if (typeof input.content !== "string") {
    return { ok: false, result: "content must be a string." };
  }
  try {
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, input.content, "utf-8");
    return { ok: true, result: `Wrote ${String(input.path)}` };
  } catch (error) {
    return { ok: false, result: error instanceof Error ? error.message : "Write failed" };
  }
}

export function editFileTool(cwd: string, input: Record<string, unknown>): ExecutorResult {
  const full = safePath(cwd, input.path);
  if (!full) return { ok: false, result: "Invalid path: must stay inside the project." };
  if (typeof input.old_string !== "string" || typeof input.new_string !== "string") {
    return { ok: false, result: "old_string and new_string must both be strings." };
  }
  if (!existsSync(full)) return { ok: false, result: `File not found: ${String(input.path)}` };

  try {
    const current = readFileSync(full, "utf-8");
    const occurrences = current.split(input.old_string).length - 1;
    if (occurrences === 0) {
      return {
        ok: false,
        result: `old_string not found in ${String(input.path)}. Read the file again and copy the exact text, including whitespace.`,
      };
    }
    if (occurrences > 1) {
      return {
        ok: false,
        result: `old_string appears ${occurrences} times in ${String(input.path)}. Include more surrounding context so it matches exactly once.`,
      };
    }
    writeFileSync(full, current.replace(input.old_string, input.new_string), "utf-8");
    return { ok: true, result: `Edited ${String(input.path)}` };
  } catch (error) {
    return { ok: false, result: error instanceof Error ? error.message : "Edit failed" };
  }
}

const IGNORED = new Set(["node_modules", ".next", ".git", "dist", "build", ".turbo"]);

export function listDirTool(cwd: string, input: Record<string, unknown>): ExecutorResult {
  const full = safePath(cwd, input.path ?? ".");
  if (!full) return { ok: false, result: "Invalid path: must stay inside the project." };
  if (!existsSync(full)) return { ok: false, result: `Directory not found: ${String(input.path)}` };
  if (!statSync(full).isDirectory()) {
    return { ok: false, result: `${String(input.path)} is a file — use read_file.` };
  }
  try {
    const entries = readdirSync(full, { withFileTypes: true })
      .filter((entry) => !IGNORED.has(entry.name))
      .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
      .sort();
    return { ok: true, result: entries.length ? entries.join("\n") : "(empty)" };
  } catch (error) {
    return { ok: false, result: error instanceof Error ? error.message : "List failed" };
  }
}

export function runCommandTool(
  cwd: string,
  input: Record<string, unknown>,
): Promise<ExecutorResult> {
  const argv = Array.isArray(input.argv) ? input.argv.filter((a): a is string => typeof a === "string") : [];
  if (!argv.length) return Promise.resolve({ ok: false, result: "No command given." });

  return new Promise((resolveResult) => {
    const child = spawn(argv[0], argv.slice(1), {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
    });

    const chunks: string[] = [];
    const collect = (data: Buffer) => chunks.push(data.toString());
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);

    const timer = setTimeout(() => child.kill("SIGKILL"), COMMAND_TIMEOUT_MS);

    child.on("close", (code) => {
      clearTimeout(timer);
      const output = truncate(chunks.join("").trim(), MAX_OUTPUT_CHARS);
      resolveResult({
        ok: code === 0,
        result: output || (code === 0 ? "(no output)" : `exited with code ${code}`),
      });
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolveResult({ ok: false, result: `Failed to run: ${error.message}` });
    });
  });
}
