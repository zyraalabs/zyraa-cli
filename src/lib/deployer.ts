import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function findNextConfig(cwd: string): string | null {
  for (const name of ["next.config.ts", "next.config.js", "next.config.mjs"]) {
    const p = join(cwd, name);
    if (existsSync(p)) return p;
  }
  return null;
}

function patchNextConfig(content: string): string {
  if (content.includes("output:")) return content;
  return content.replace(
    /(const\s+\w+[^=]*=\s*(?:<[^>]+>\s*)?\{)/,
    "$1\n  output: 'export' as const,",
  );
}

export async function buildStaticExport(cwd: string): Promise<void> {
  if (existsSync(join(cwd, "out"))) return;

  const configPath = findNextConfig(cwd);
  const original = configPath ? readFileSync(configPath, "utf8") : null;

  if (configPath && original) {
    writeFileSync(configPath, patchNextConfig(original));
  }

  try {
    execSync("pnpm build", { cwd, stdio: "pipe" });
  } catch (err) {
    const msg = (err as { stderr?: Buffer }).stderr?.toString() ?? "";
    const hint = msg.includes("API Routes")
      ? " Apps with API routes cannot be statically exported."
      : "";
    throw new Error(`Static export build failed.${hint}`);
  } finally {
    if (configPath && original) writeFileSync(configPath, original);
  }
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
