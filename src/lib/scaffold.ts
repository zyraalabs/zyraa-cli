import { runCommand } from "./spawn.util.js";

export async function runScaffoldCommand(
  command: string,
  projectDir: string,
): Promise<void> {
  await runCommand(command, [], { cwd: projectDir });
}
