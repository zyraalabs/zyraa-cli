import ora from "ora";
import { terminal } from "../../lib/terminal.js";
import { installDependencies } from "../../lib/projectSetup.js";

export async function handleDependencies(
  targetDir: string,
  wasScaffolded: boolean
): Promise<void> {
  if (wasScaffolded) {
    terminal.newLine();
    terminal.highlight("Scaffolding already installed dependencies, skipping...");
    terminal.newLine();
    return;
  }

  terminal.newLine();
  const spinner = ora("Installing dependencies...").start();

  try {
    spinner.stop();
    terminal.highlight("Installing dependencies...");
    terminal.newLine();

    await installDependencies(targetDir);

    terminal.newLine();
    terminal.success("Dependencies installed");
    terminal.newLine();
  } catch (error) {
    const err = error as Error;
    terminal.newLine();
    terminal.warn("Failed to install dependencies");
    terminal.dim(err.message || "Run 'pnpm install' manually");
    terminal.newLine();
  }
}
