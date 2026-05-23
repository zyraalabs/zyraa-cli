import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseErrors, type BuildResult } from "./buildValidator.js";

function findNextConfig(cwd: string): string | null {
  for (const name of ["next.config.ts", "next.config.js", "next.config.mjs"]) {
    const p = join(cwd, name);
    if (existsSync(p)) return p;
  }
  return null;
}

function patchNextConfig(content: string): string {
  if (content.includes("output:")) return content;

  if (/(const\s+\w+[^=\n]*=\s*(?:<[^>]+>\s*)?\{)/.test(content)) {
    return content.replace(
      /(const\s+\w+[^=\n]*=\s*(?:<[^>]+>\s*)?\{)/,
      "$1\n  output: 'export' as const,",
    );
  }

  if (/export\s+default\s*\{/.test(content)) {
    return content.replace(
      /export\s+default\s*\{/,
      "export default {\n  output: 'export' as const,",
    );
  }

  return content;
}

function withStaticConfig<T>(cwd: string, fn: () => T): T {
  const configPath = findNextConfig(cwd);
  const original = configPath ? readFileSync(configPath, "utf8") : null;
  if (configPath && original) writeFileSync(configPath, patchNextConfig(original));
  try {
    return fn();
  } finally {
    if (configPath && original) writeFileSync(configPath, original);
  }
}

export async function buildStaticExport(cwd: string, force = false): Promise<void> {
  const outDir = join(cwd, "out");
  if (force && existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  if (!force && existsSync(outDir)) return;

  withStaticConfig(cwd, () => {
    try {
      execSync("pnpm build", { cwd, stdio: "pipe" });
    } catch (err) {
      const msg = (err as { stderr?: Buffer }).stderr?.toString() ?? "";
      const hint = msg.includes("API Routes") || msg.includes("api route")
        ? " Your app has API routes — remove them or move logic to a separate service."
        : msg.includes("getServerSideProps")
        ? " Remove getServerSideProps — static export does not support server-side rendering."
        : "";
      throw new Error(`Static export build failed.${hint}`);
    }
  });

  if (!existsSync(join(cwd, "out"))) {
    throw new Error("Static export did not produce an out/ directory. Your app may use server-side features incompatible with static export.");
  }
}

export async function runDeployBuild(cwd: string): Promise<BuildResult> {
  const outDir = join(cwd, "out");
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });

  return withStaticConfig(cwd, () => {
    try {
      execSync("pnpm build", { cwd, stdio: "pipe" });
      return { clean: true, errors: "", parsed: [] };
    } catch (err) {
      const e = err as { stderr?: Buffer; stdout?: Buffer };
      const combined = [e.stdout?.toString(), e.stderr?.toString()].filter(Boolean).join("\n").trim();
      return { clean: false, errors: combined, parsed: parseErrors(combined) };
    }
  });
}

export function zipOutDir(cwd: string): Buffer {
  const outDir = join(cwd, "out");
  if (!existsSync(outDir)) throw new Error("out/ directory not found after build");

  const tmp = join(tmpdir(), `zyraa-deploy-${Date.now()}.zip`);
  execSync(`cd "${outDir}" && zip -r "${tmp}" .`, { stdio: "pipe" });
  const buf = readFileSync(tmp);
  rmSync(tmp);
  return buf;
}
