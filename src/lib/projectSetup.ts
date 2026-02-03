import { terminal } from "./terminal.js";
import { runCommand, runCommandDetached } from "./spawn.util.js";

export async function installDependencies(projectDir: string): Promise<void> {
  await runCommand("pnpm", ["install"], { cwd: projectDir });
}

export function startDevServer(projectDir: string): void {
  terminal.highlight("Starting dev server...");
  terminal.newLine();

  runCommandDetached("pnpm", ["dev"], projectDir);
}
