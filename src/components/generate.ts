import { terminal } from "../lib/terminal.js";
import { startDevServer } from "../lib/projectSetup.js";
import { getAuthToken } from "../lib/auth.js";
import { handleUnexpectedError } from "../lib/errorHandler.js";
import { detectFramework } from "./generation/detectFramework.js";
import { generateCode } from "./generation/generateCode.js";
import { writeGeneratedFiles } from "./generation/writeFiles.js";
import { handleDependencies } from "./generation/dependencies.js";

export async function handleGenerateCommand(prompt: string): Promise<void> {
  getAuthToken();

  terminal.header("Zyraa Code Generation");
  terminal.newLine();
  terminal.label("Prompt", prompt);
  terminal.newLine();

  const targetDir = process.cwd();

  try {
    const { framework, wasScaffolded } = await detectFramework(
      prompt,
      targetDir
    );
    const { output, usage } = await generateCode(
      prompt,
      framework,
      wasScaffolded
    );

    writeGeneratedFiles(output, targetDir, wasScaffolded);

    terminal.separator();
    terminal.dim(`Tokens used: ${usage.inputTokens + usage.outputTokens}`);
    terminal.newLine();

    await handleDependencies(targetDir, wasScaffolded, output);

    terminal.separator();
    terminal.newLine();

    startDevServer(targetDir);
  } catch (error) {
    handleUnexpectedError(error as Error);
  }
}
