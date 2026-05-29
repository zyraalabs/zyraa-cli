import { execSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { BuildResult } from "./buildValidator.js";

const SOURCE_EXCLUDES = [
  "node_modules",
  ".next",
  ".git",
  "out",
  ".env.local",
  ".zyraa",
].map((p) => `--exclude "${p}/*" --exclude "${p}"`).join(" ");

export function zipSourceFiles(cwd: string): Buffer {
  const tmp = join(tmpdir(), `zyraa-src-${Date.now()}.zip`);
  execSync(`cd "${cwd}" && zip -r "${tmp}" . ${SOURCE_EXCLUDES} --exclude ".env.local"`, {
    stdio: "pipe",
  });
  const buf = readFileSync(tmp);
  rmSync(tmp, { force: true });
  return buf;
}

export async function runDeployBuild(cwd: string): Promise<BuildResult> {
  const { runBuild } = await import("./buildValidator.js");
  return runBuild(cwd);
}

export async function buildStaticExport(): Promise<void> {
  throw new Error("Static export is no longer supported. Use Vercel deployment.");
}

export function zipOutDir(): Buffer {
  throw new Error("Static out/ deployment is no longer supported. Use Vercel deployment.");
}
