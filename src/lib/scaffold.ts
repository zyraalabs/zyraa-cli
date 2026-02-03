import { terminal } from "./terminal.js";
import { runCommand } from "./spawn.util.js";

export async function runScaffoldCommand(
  command: string,
  projectDir: string
): Promise<void> {
  terminal.highlight("Running scaffold command...");
  terminal.dim(`  ${command}`);
  terminal.newLine();

  await runCommand("sh", ["-c", command], { cwd: projectDir });

  terminal.newLine();
  terminal.success("Scaffold completed");
  terminal.newLine();
}
