import { runCommand, runCommandDetached } from "./spawn.util.js";
import { IS_MOCK } from "./mock.js";

export async function installDependencies(projectDir: string): Promise<void> {
  if (IS_MOCK) return;
  await runCommand("pnpm", ["install"], { cwd: projectDir });
}

export function startDevServer(projectDir: string): void {
  if (IS_MOCK) return;
  runCommandDetached("pnpm", ["dev"], projectDir);
}
