import { spawn, execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { IS_MOCK } from "./mock.js";
import { runCommandDetached } from "./spawn.util.js";

function runPnpmInstall(projectDir: string): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn("pnpm", ["install"], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    let output = "";
    const collect = (data: Buffer) => { output += data.toString(); };
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);

    child.on("close", (code) => resolve({ exitCode: code ?? 1, output }));
    child.on("error", (err) => resolve({ exitCode: 1, output: err.message }));
  });
}

function getLatestVersion(pkg: string): string | null {
  try {
    const result = execSync(`npm info ${pkg} version`, { timeout: 10000 }).toString().trim();
    return result || null;
  } catch {
    return null;
  }
}

function patchPackageJson(projectDir: string, fixes: Record<string, string>): void {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) return;

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

  for (const [name, version] of Object.entries(fixes)) {
    if (pkg.dependencies?.[name]) pkg.dependencies[name] = `^${version}`;
    if (pkg.devDependencies?.[name]) pkg.devDependencies[name] = `^${version}`;
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

// Parses lines like: ERR_PNPM_NO_MATCHING_VERSION  No matching version found for jsonwebtoken@^9.1.2
// Also handles: No matching version found for package@version
function parseVersionErrors(output: string): Record<string, string> {
  const fixes: Record<string, string> = {};
  const patterns = [
    /No matching version found for ([^@\s]+)@([^\s,]+)/gi,
    /ERR_PNPM_NO_MATCHING_VERSION.*?([^@\s]+)@([^\s,]+)/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(output)) !== null) {
      const pkg = match[1].trim();
      if (!fixes[pkg]) {
        const latest = getLatestVersion(pkg);
        if (latest) fixes[pkg] = latest;
      }
    }
  }

  return fixes;
}

export async function installDependencies(projectDir: string): Promise<void> {
  if (IS_MOCK) return;

  const first = await runPnpmInstall(projectDir);
  if (first.exitCode === 0) return;

  const fixes = parseVersionErrors(first.output);
  if (Object.keys(fixes).length === 0) {
    throw new Error(`pnpm install failed (exit ${first.exitCode})`);
  }

  patchPackageJson(projectDir, fixes);

  const retry = await runPnpmInstall(projectDir);
  if (retry.exitCode !== 0) {
    throw new Error(`pnpm install failed after auto-fix (exit ${retry.exitCode})`);
  }
}

export function startDevServer(projectDir: string): void {
  if (IS_MOCK) return;
  runCommandDetached("pnpm", ["dev"], projectDir);
}
