import ora from "ora";
import { terminal } from "../../lib/terminal.js";
import { generateApi } from "../../api/endpoints/generate.js";
import { handleGenerationError } from "../../lib/errorHandler.js";

export interface GenerationResult {
  output: string;
  usage: { inputTokens: number; outputTokens: number };
}

export async function generateCode(
  prompt: string,
  framework: string,
  wasScaffolded: boolean
): Promise<GenerationResult> {
  const spinner = ora("Generating code...").start();
  const result = await generateApi.generate({ prompt, framework, wasScaffolded });

  if (result.code === "error") {
    spinner.fail("Generation failed");
    handleGenerationError(result.error);
  }

  if (!result.data.success) {
    spinner.fail("Generation failed");
    terminal.newLine();
    terminal.error(result.data.error || "Unknown error from server");
    terminal.newLine();
    process.exit(1);
  }

  spinner.succeed("Code generated successfully");
  terminal.newLine();

  return result.data.data;
}
