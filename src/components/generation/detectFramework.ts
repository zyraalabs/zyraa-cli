import ora from "ora";
import { terminal } from "../../lib/terminal.js";
import { detectFrameworkApi } from "../../api/endpoints/detectFramework.js";
import { runScaffoldCommand } from "../../lib/scaffold.js";

export interface FrameworkResult {
  framework: string;
  wasScaffolded: boolean;
}

export async function detectFramework(
  prompt: string,
  targetDir: string
): Promise<FrameworkResult> {
  const spinner = ora("Detecting framework...").start();
  const result = await detectFrameworkApi.detect({ prompt });

  if (result.code === "error" || !result.data.success) {
    spinner.warn("Framework detection failed, defaulting to Next.js");
    terminal.newLine();
    return { framework: "nextjs", wasScaffolded: false };
  }

  const { framework, reasoning, needsScaffold, scaffoldCommand } =
    result.data.data;

  spinner.succeed(`Framework detected: ${framework} - ${reasoning}`);
  terminal.newLine();

  if (!needsScaffold) {
    terminal.highlight(
      `No scaffolding needed for ${framework} - generating all files`
    );
    terminal.newLine();
    return { framework, wasScaffolded: false };
  }

  try {
    await runScaffoldCommand(scaffoldCommand, targetDir);
    return { framework, wasScaffolded: true };
  } catch (error) {
    const err = error as Error;
    terminal.error("Scaffold command failed");
    terminal.dim(err.message);
    terminal.newLine();
    terminal.warn("Continuing with file generation (will generate all files)");
    terminal.newLine();
    return { framework, wasScaffolded: false };
  }
}
